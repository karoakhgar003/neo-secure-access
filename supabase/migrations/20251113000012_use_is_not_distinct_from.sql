-- Fix to handle both NULL and specific plan IDs correctly
DROP FUNCTION IF EXISTS assign_credentials_to_pending_orders(uuid);

CREATE OR REPLACE FUNCTION assign_credentials_to_pending_orders(p_product_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_order_item RECORD;
  v_credential RECORD;
  v_seat_id UUID;
  v_order_id UUID;
  v_all_completed BOOLEAN;
BEGIN
  RAISE NOTICE 'Starting credential assignment function';
  
  -- Loop through order items that need credentials
  FOR v_order_item IN
    SELECT oi.id AS order_item_id, oi.product_id, oi.plan_id, oi.order_id, o.user_id, oi.status
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE (oi.status = 'pending' OR oi.status IS NULL)
      AND (p_product_id IS NULL OR oi.product_id = p_product_id)
      AND o.status = 'pending'
    ORDER BY oi.created_at ASC
  LOOP
    RAISE NOTICE 'Processing order item % for product % with plan %', 
      v_order_item.order_item_id, v_order_item.product_id, v_order_item.plan_id;
    
    -- Find an available credential for this product AND plan
    -- STRICT MATCHING: plan_id must match EXACTLY
    SELECT pc.id, pc.username, pc.password, pc.additional_info, pc.totp_secret, pc.max_seats, pc.plan_id
    INTO v_credential
    FROM product_credentials pc
    WHERE pc.product_id = v_order_item.product_id
      -- Use IS NOT DISTINCT FROM for proper NULL handling
      -- This matches: NULL = NULL as TRUE, and specific UUIDs must be identical
      AND pc.plan_id IS NOT DISTINCT FROM v_order_item.plan_id
      AND (
        SELECT COUNT(*) 
        FROM account_seats 
        WHERE credential_id = pc.id
      ) < pc.max_seats
    ORDER BY pc.created_at ASC
    LIMIT 1;

    -- If credential found, create seat and assign
    IF FOUND THEN
      RAISE NOTICE 'Found matching credential % (plan: %) for order item % (plan: %)', 
        v_credential.id, v_credential.plan_id, v_order_item.order_item_id, v_order_item.plan_id;
      
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

      RAISE NOTICE 'Successfully assigned credential % to order item %', v_credential.id, v_order_item.order_item_id;
      
      -- Check if all order items for this order are now completed
      v_order_id := v_order_item.order_id;
      SELECT NOT EXISTS (
        SELECT 1 FROM order_items 
        WHERE order_id = v_order_id 
        AND (status = 'pending' OR status IS NULL)
      ) INTO v_all_completed;
      
      -- If all items completed, mark order as completed
      IF v_all_completed THEN
        UPDATE orders
        SET status = 'completed'
        WHERE id = v_order_id;
        
        RAISE NOTICE 'Order % marked as completed', v_order_id;
      END IF;
    ELSE
      RAISE NOTICE 'NO MATCH: No credential with exact plan_id=%s for product=%s - order remains pending', 
        v_order_item.plan_id, v_order_item.product_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Credential assignment function completed';
END;
$$ LANGUAGE plpgsql;
