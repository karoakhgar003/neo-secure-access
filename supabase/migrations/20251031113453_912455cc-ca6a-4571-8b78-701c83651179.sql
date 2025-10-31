-- Create table for storing available product credentials
CREATE TABLE IF NOT EXISTS public.product_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  additional_info JSONB DEFAULT '{}'::jsonb,
  is_assigned BOOLEAN DEFAULT false,
  assigned_to_order_item_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.product_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage credentials
CREATE POLICY "Admins can view all credentials"
  ON public.product_credentials
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert credentials"
  ON public.product_credentials
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update credentials"
  ON public.product_credentials
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete credentials"
  ON public.product_credentials
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to auto-assign credentials when order item is created
CREATE OR REPLACE FUNCTION public.assign_credentials_to_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credential_id UUID;
  v_username TEXT;
  v_password TEXT;
  v_additional_info JSONB;
  v_product_requires_credentials BOOLEAN;
BEGIN
  -- Check if product needs instant delivery (we'll use a flag or just check if credentials exist)
  SELECT EXISTS(
    SELECT 1 FROM product_credentials 
    WHERE product_id = NEW.product_id AND is_assigned = false
  ) INTO v_product_requires_credentials;
  
  IF v_product_requires_credentials THEN
    -- Get an available credential
    SELECT id, username, password, additional_info
    INTO v_credential_id, v_username, v_password, v_additional_info
    FROM product_credentials
    WHERE product_id = NEW.product_id AND is_assigned = false
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_credential_id IS NOT NULL THEN
      -- Mark credential as assigned
      UPDATE product_credentials
      SET is_assigned = true,
          assigned_to_order_item_id = NEW.id,
          assigned_at = now()
      WHERE id = v_credential_id;
      
      -- Update order item with credentials
      UPDATE order_items
      SET credentials = jsonb_build_object(
            'username', v_username,
            'password', v_password,
            'additional_info', v_additional_info
          )
      WHERE id = NEW.id;
      
      -- Update order status to completed
      UPDATE orders
      SET status = 'completed'
      WHERE id = NEW.order_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS assign_credentials_on_order_item_insert ON public.order_items;
CREATE TRIGGER assign_credentials_on_order_item_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_credentials_to_order_item();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_product_credentials_product_assigned 
  ON public.product_credentials(product_id, is_assigned);