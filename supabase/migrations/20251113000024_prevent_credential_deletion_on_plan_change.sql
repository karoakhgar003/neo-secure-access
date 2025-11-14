-- Prevent credentials from being deleted when plans are deleted
-- Change CASCADE to SET NULL for better data preservation

-- Fix product_credentials.plan_id constraint
ALTER TABLE public.product_credentials
DROP CONSTRAINT IF EXISTS product_credentials_plan_id_fkey;

ALTER TABLE public.product_credentials
ADD CONSTRAINT product_credentials_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES public.product_plans(id)
ON DELETE SET NULL;  -- Don't delete credentials, just unlink from plan

COMMENT ON CONSTRAINT product_credentials_plan_id_fkey ON public.product_credentials IS 
'SET NULL on plan deletion to preserve credentials. Credentials become plan-agnostic (available for all plans of the product).';

-- Fix cart_items.plan_id constraint  
ALTER TABLE public.cart_items
DROP CONSTRAINT IF EXISTS cart_items_plan_id_fkey;

ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES public.product_plans(id)
ON DELETE SET NULL;  -- Don't delete cart items, just clear plan reference

COMMENT ON CONSTRAINT cart_items_plan_id_fkey ON public.cart_items IS 
'SET NULL on plan deletion to preserve cart items.';

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Credentials and cart items now preserved when plans are modified/deleted.';
  RAISE NOTICE 'Credentials with NULL plan_id are available for all plans of that product.';
END $$;
