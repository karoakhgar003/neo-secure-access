-- Function to manually assign credentials to pending order items
-- This is useful when credentials are added after orders are placed
CREATE OR REPLACE FUNCTION public.assign_credentials_to_pending_orders(p_product_id UUID DEFAULT NULL)
RETURNS TABLE(order_item_id UUID, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_item RECORD;
  v_credential_id UUID;
  v_username TEXT;
  v_password TEXT;
  v_additional_info JSONB;
  v_max_seats INTEGER;
  v_current_seats INTEGER;
  v_user_id UUID;
  v_totp_secret TEXT;
  v_seat_id UUID;
BEGIN
  -- Loop through pending order items without credentials
  FOR v_order_item IN
    SELECT oi.id, oi.product_id, oi.order_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.credentials IS NULL
      AND o.status = 'pending'
      AND (p_product_id IS NULL OR oi.product_id = p_product_id)
  LOOP
    BEGIN
      -- Get user_id from order
      SELECT user_id INTO v_user_id FROM orders WHERE id = v_order_item.order_id;
      
      -- Check if there's already a seat for this order item
      IF EXISTS(SELECT 1 FROM account_seats WHERE order_item_id = v_order_item.id) THEN
        order_item_id := v_order_item.id;
        success := FALSE;
        message := 'Seat already exists for this order item';
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Try to find an available credential
      SELECT pc.id, pc.username, pc.password, pc.additional_info, pc.max_seats, pc.totp_secret
      INTO v_credential_id, v_username, v_password, v_additional_info, v_max_seats, v_totp_secret
      FROM product_credentials pc
      WHERE pc.product_id = v_order_item.product_id AND pc.is_assigned = false
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
      
      IF v_credential_id IS NULL THEN
        order_item_id := v_order_item.id;
        success := FALSE;
        message := 'No available credentials for this product';
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Check current seat count
      SELECT COUNT(*) INTO v_current_seats
      FROM account_seats
      WHERE credential_id = v_credential_id;
      
      -- If seats available, create a seat for this user
      IF v_current_seats < v_max_seats THEN
        INSERT INTO account_seats (credential_id, order_item_id, user_id, status)
        VALUES (v_credential_id, v_order_item.id, v_user_id, CASE WHEN v_totp_secret IS NOT NULL THEN 'unclaimed' ELSE 'success' END)
        ON CONFLICT (credential_id, order_item_id) DO NOTHING
        RETURNING id INTO v_seat_id;
        
        -- Update order item with credentials
        UPDATE order_items
        SET credentials = jsonb_build_object(
              'username', v_username,
              'password', v_password,
              'additional_info', v_additional_info,
              'requires_totp', CASE WHEN v_totp_secret IS NOT NULL THEN true ELSE false END
            )
        WHERE id = v_order_item.id;
        
        -- Log success for non-TOTP credentials
        IF v_totp_secret IS NULL AND v_seat_id IS NOT NULL THEN
          INSERT INTO totp_issuance_log (seat_id, user_id, attempt_number, outcome)
          VALUES (v_seat_id, v_user_id, 1, 'success');
        END IF;
        
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
        WHERE id = v_order_item.order_id;
        
        order_item_id := v_order_item.id;
        success := TRUE;
        message := 'Credentials assigned successfully';
        RETURN NEXT;
      ELSE
        order_item_id := v_order_item.id;
        success := FALSE;
        message := 'No available seats for this credential';
        RETURN NEXT;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      order_item_id := v_order_item.id;
      success := FALSE;
      message := 'Error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$function$;

-- Grant execute permission to authenticated users (admins can call this)
GRANT EXECUTE ON FUNCTION public.assign_credentials_to_pending_orders(UUID) TO authenticated;

-- Create a trigger on product_credentials insert/update to auto-assign to pending orders
CREATE OR REPLACE FUNCTION public.try_assign_new_credential_to_pending_orders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When a new credential is added or an assigned credential becomes unassigned
  IF (TG_OP = 'INSERT' AND NEW.is_assigned = false) OR 
     (TG_OP = 'UPDATE' AND OLD.is_assigned = true AND NEW.is_assigned = false) THEN
    -- Try to assign this credential to pending orders
    PERFORM assign_credentials_to_pending_orders(NEW.product_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_assign_new_credential_to_pending_orders ON public.product_credentials;
CREATE TRIGGER trg_assign_new_credential_to_pending_orders
  AFTER INSERT OR UPDATE ON public.product_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.try_assign_new_credential_to_pending_orders();
