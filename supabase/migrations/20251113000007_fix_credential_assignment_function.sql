-- Add status column to order_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'status'
  ) THEN
    ALTER TABLE order_items ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add credential_data column to order_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'credential_data'
  ) THEN
    ALTER TABLE order_items ADD COLUMN credential_data JSONB;
  END IF;
END $$;

-- Drop and recreate the credential assignment function with proper column references
DROP FUNCTION IF EXISTS assign_credentials_to_pending_orders(uuid);

CREATE OR REPLACE FUNCTION assign_credentials_to_pending_orders(p_product_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_order_item RECORD;
  v_credential RECORD;
  v_seat_id UUID;
BEGIN
  -- Loop through order items that need credentials
  FOR v_order_item IN
    SELECT oi.id AS order_item_id, oi.product_id, oi.plan_id, oi.order_id, o.user_id, oi.status
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE (oi.status = 'pending' OR oi.status IS NULL)
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
        OR (pc.plan_id IS NULL AND v_order_item.plan_id IS NOT NULL)  -- Allow null plan_id credentials for any plan
      )
      AND (
        SELECT COUNT(*) 
        FROM account_seats 
        WHERE credential_id = pc.id
      ) < pc.max_seats
    ORDER BY 
      -- Prioritize exact plan match over null plan_id
      CASE WHEN pc.plan_id = v_order_item.plan_id THEN 0 ELSE 1 END,
      pc.created_at ASC
    LIMIT 1;

    -- If credential found, create seat and assign
    IF FOUND THEN
      -- Insert account seat
      INSERT INTO account_seats (user_id, order_item_id, credential_id, status)
      VALUES (v_order_item.user_id, v_order_item.order_item_id, v_credential.id, 'active')
      RETURNING id INTO v_seat_id;

      -- Update order item with credentials
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

-- Update all existing order items to have 'completed' status if they have credentials
UPDATE order_items 
SET status = 'completed' 
WHERE credentials IS NOT NULL OR credential_data IS NOT NULL;

-- Update remaining order items to 'pending'
UPDATE order_items 
SET status = 'pending' 
WHERE status IS NULL;
