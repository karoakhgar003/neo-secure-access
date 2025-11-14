-- Add plan_id to product_credentials table
ALTER TABLE product_credentials ADD COLUMN plan_id UUID REFERENCES product_plans(id) ON DELETE CASCADE;

-- Update the credential assignment functions to consider plan_id

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS trg_assign_new_credential_to_pending_orders ON public.product_credentials;
DROP FUNCTION IF EXISTS try_assign_new_credential_to_pending_orders();
DROP FUNCTION IF EXISTS assign_credentials_to_pending_orders(uuid);

-- Updated function to assign credentials to pending orders (considering plan_id)
CREATE OR REPLACE FUNCTION assign_credentials_to_pending_orders(p_product_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_order_item RECORD;
  v_credential RECORD;
  v_seat_id UUID;
BEGIN
  -- Loop through pending order items
  FOR v_order_item IN
    SELECT oi.id AS order_item_id, oi.product_id, oi.plan_id, oi.order_id, o.user_id
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.status = 'pending'
      AND (p_product_id IS NULL OR oi.product_id = p_product_id)
      AND o.status = 'completed'
    ORDER BY oi.created_at ASC
  LOOP
    -- Find an available credential for this product AND plan
    SELECT pc.id, pc.username, pc.password, pc.additional_info, pc.totp_secret, pc.max_seats
    INTO v_credential
    FROM product_credentials pc
    WHERE pc.product_id = v_order_item.product_id
      -- Match plan_id (or both NULL for backwards compatibility)
      AND (
        (pc.plan_id = v_order_item.plan_id) 
        OR (pc.plan_id IS NULL AND v_order_item.plan_id IS NULL)
      )
      AND (
        SELECT COUNT(*) 
        FROM account_seats 
        WHERE credential_id = pc.id
      ) < pc.max_seats
    ORDER BY pc.created_at ASC
    LIMIT 1;

    -- If credential found, create seat and assign
    IF FOUND THEN
      -- Insert account seat
      INSERT INTO account_seats (user_id, order_item_id, credential_id, status)
      VALUES (v_order_item.user_id, v_order_item.order_item_id, v_credential.id, 'active')
      RETURNING id INTO v_seat_id;

      -- Update order item
      UPDATE order_items
      SET status = 'completed',
          credential_data = jsonb_build_object(
            'username', v_credential.username,
            'password', v_credential.password,
            'additional_info', COALESCE(v_credential.additional_info, '{}'::jsonb),
            'requires_totp', CASE WHEN v_credential.totp_secret IS NOT NULL THEN true ELSE false END
          )
      WHERE id = v_order_item.order_item_id;

      -- Mark credential as assigned
      UPDATE product_credentials
      SET is_assigned = true, assigned_at = now()
      WHERE id = v_credential.id;

      RAISE NOTICE 'Assigned credential % to order item % (plan: %)', v_credential.id, v_order_item.order_item_id, v_order_item.plan_id;
    ELSE
      RAISE NOTICE 'No available credential for product % with plan %', v_order_item.product_id, v_order_item.plan_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function triggered when new credential is added/updated
CREATE OR REPLACE FUNCTION try_assign_new_credential_to_pending_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if credential is not yet fully assigned
  IF (SELECT COUNT(*) FROM account_seats WHERE credential_id = NEW.id) < NEW.max_seats THEN
    PERFORM assign_credentials_to_pending_orders(NEW.product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trg_assign_new_credential_to_pending_orders
  AFTER INSERT OR UPDATE ON public.product_credentials
  FOR EACH ROW
  EXECUTE FUNCTION try_assign_new_credential_to_pending_orders();
