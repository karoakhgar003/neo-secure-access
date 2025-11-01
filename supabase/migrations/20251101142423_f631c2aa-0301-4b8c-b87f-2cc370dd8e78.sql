-- Add TOTP and seat management to product credentials
ALTER TABLE product_credentials 
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 1;

-- Create account seats table to track individual user seats
CREATE TABLE IF NOT EXISTS account_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES product_credentials(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'first_code_issued', 'second_chance_issued', 'success', 'locked')),
  attempt_count INTEGER DEFAULT 0 CHECK (attempt_count >= 0 AND attempt_count <= 2),
  last_code_issued_at TIMESTAMP WITH TIME ZONE,
  locked_at TIMESTAMP WITH TIME ZONE,
  lock_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(credential_id, order_item_id)
);

-- Create TOTP issuance log for audit trail
CREATE TABLE IF NOT EXISTS totp_issuance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID NOT NULL REFERENCES account_seats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attempt_number INTEGER NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  outcome TEXT CHECK (outcome IN ('pending', 'success', 'failure')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE account_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_issuance_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_seats
CREATE POLICY "Users can view their own seats"
  ON account_seats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own seats"
  ON account_seats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all seats"
  ON account_seats FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all seats"
  ON account_seats FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for totp_issuance_log
CREATE POLICY "Users can view their own logs"
  ON totp_issuance_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON totp_issuance_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON totp_issuance_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_account_seats_updated_at
  BEFORE UPDATE ON account_seats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_totp_issuance_log_updated_at
  BEFORE UPDATE ON totp_issuance_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update credential assignment trigger to create seats
CREATE OR REPLACE FUNCTION assign_credentials_to_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_credential_id UUID;
  v_username TEXT;
  v_password TEXT;
  v_additional_info JSONB;
  v_product_requires_credentials BOOLEAN;
  v_max_seats INTEGER;
  v_current_seats INTEGER;
  v_user_id UUID;
BEGIN
  -- Get user_id from order
  SELECT user_id INTO v_user_id FROM orders WHERE id = NEW.order_id;
  
  -- Check if product needs instant delivery
  SELECT EXISTS(
    SELECT 1 FROM product_credentials 
    WHERE product_id = NEW.product_id AND is_assigned = false
  ) INTO v_product_requires_credentials;
  
  IF v_product_requires_credentials THEN
    -- Get an available credential with seat availability
    SELECT pc.id, pc.username, pc.password, pc.additional_info, pc.max_seats
    INTO v_credential_id, v_username, v_password, v_additional_info, v_max_seats
    FROM product_credentials pc
    WHERE pc.product_id = NEW.product_id AND pc.is_assigned = false
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_credential_id IS NOT NULL THEN
      -- Check current seat count
      SELECT COUNT(*) INTO v_current_seats
      FROM account_seats
      WHERE credential_id = v_credential_id;
      
      -- If seats available, create a seat for this user
      IF v_current_seats < v_max_seats THEN
        INSERT INTO account_seats (credential_id, order_item_id, user_id)
        VALUES (v_credential_id, NEW.id, v_user_id);
        
        -- Update order item with credentials (without totp_secret)
        UPDATE order_items
        SET credentials = jsonb_build_object(
              'username', v_username,
              'password', v_password,
              'additional_info', v_additional_info,
              'requires_totp', CASE WHEN (SELECT totp_secret FROM product_credentials WHERE id = v_credential_id) IS NOT NULL THEN true ELSE false END
            )
        WHERE id = NEW.id;
        
        -- Mark as assigned if all seats are taken
        IF v_current_seats + 1 >= v_max_seats THEN
          UPDATE product_credentials
          SET is_assigned = true,
              assigned_at = now()
          WHERE id = v_credential_id;
        END IF;
        
        -- Update order status to completed
        UPDATE orders
        SET status = 'completed'
        WHERE id = NEW.order_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;