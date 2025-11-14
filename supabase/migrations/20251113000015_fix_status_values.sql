-- Fix status value in assign_credentials_to_pending_orders function
-- Change from 'active' to proper status based on TOTP requirement

DROP FUNCTION IF EXISTS public.assign_credentials_to_pending_orders(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.assign_credentials_to_pending_orders(p_product_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_order_item RECORD;
  v_credential RECORD;
  v_seat_id UUID;
  v_order_id UUID;
  v_all_completed BOOLEAN;
BEGIN
  RAISE NOTICE 'assign_credentials_to_pending_orders START - product_id: %', p_product_id;
  
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
    RAISE NOTICE 'Processing order_item: % | product: % | plan_id: %', 
      v_order_item.order_item_id, v_order_item.product_id, v_order_item.plan_id;
    
    -- Find credential with EXACT plan match using IS NOT DISTINCT FROM
    SELECT pc.id, pc.username, pc.password, pc.additional_info, pc.totp_secret, pc.max_seats, pc.plan_id
    INTO v_credential
    FROM product_credentials pc
    WHERE pc.product_id = v_order_item.product_id
      AND pc.plan_id IS NOT DISTINCT FROM v_order_item.plan_id
      AND (
        SELECT COUNT(*) 
        FROM account_seats 
        WHERE credential_id = pc.id
      ) < pc.max_seats
    ORDER BY pc.created_at ASC
    LIMIT 1;

    IF FOUND THEN
      RAISE NOTICE 'MATCH FOUND: credential_id=% | cred_plan_id=% | order_plan_id=%', 
        v_credential.id, v_credential.plan_id, v_order_item.plan_id;
      
      -- Check if seat already exists for this order_item
      IF EXISTS (SELECT 1 FROM account_seats WHERE order_item_id = v_order_item.order_item_id) THEN
        RAISE NOTICE 'Seat already exists for order_item %, skipping', v_order_item.order_item_id;
        CONTINUE;
      END IF;
      
      -- Use 'unclaimed' for TOTP credentials, 'success' for regular credentials
      INSERT INTO account_seats (user_id, order_item_id, credential_id, status)
      VALUES (
        v_order_item.user_id, 
        v_order_item.order_item_id, 
        v_credential.id, 
        CASE WHEN v_credential.totp_secret IS NOT NULL THEN 'unclaimed' ELSE 'success' END
      )
      RETURNING id INTO v_seat_id;

      UPDATE order_items
      SET status = 'completed',
          credential_data = jsonb_build_object(
            'username', v_credential.username,
            'password', v_credential.password,
            'additional_info', COALESCE(v_credential.additional_info, '{}'::jsonb),
            'requires_totp', CASE WHEN v_credential.totp_secret IS NOT NULL THEN true ELSE false END
          )
      WHERE id = v_order_item.order_item_id;

      UPDATE product_credentials
      SET is_assigned = true, assigned_at = now()
      WHERE id = v_credential.id;

      RAISE NOTICE 'ASSIGNED: seat_id=%', v_seat_id;
      
      v_order_id := v_order_item.order_id;
      SELECT NOT EXISTS (
        SELECT 1 FROM order_items 
        WHERE order_id = v_order_id 
        AND (status = 'pending' OR status IS NULL)
      ) INTO v_all_completed;
      
      IF v_all_completed THEN
        UPDATE orders SET status = 'completed' WHERE id = v_order_id;
        RAISE NOTICE 'Order % completed', v_order_id;
      END IF;
    ELSE
      RAISE NOTICE 'NO MATCH: No credential found with plan_id=% for product=%', 
        v_order_item.plan_id, v_order_item.product_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'assign_credentials_to_pending_orders END';
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger wrapper function
DROP FUNCTION IF EXISTS public.try_assign_new_credential_to_pending_orders() CASCADE;

CREATE OR REPLACE FUNCTION public.try_assign_new_credential_to_pending_orders()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM account_seats WHERE credential_id = NEW.id) < NEW.max_seats THEN
    PERFORM public.assign_credentials_to_pending_orders(NEW.product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trg_assign_new_credential_to_pending_orders ON public.product_credentials;

CREATE TRIGGER trg_assign_new_credential_to_pending_orders
  AFTER INSERT OR UPDATE ON public.product_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.try_assign_new_credential_to_pending_orders();
