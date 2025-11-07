-- Fix the assign_credentials_to_order_item function to prevent duplicate seat creation
CREATE OR REPLACE FUNCTION public.assign_credentials_to_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_credential_id UUID;
  v_username TEXT;
  v_password TEXT;
  v_additional_info JSONB;
  v_product_requires_credentials BOOLEAN;
  v_max_seats INTEGER;
  v_current_seats INTEGER;
  v_user_id UUID;
  v_seat_exists BOOLEAN;
BEGIN
  -- Check if a seat already exists for this order_item (prevent duplicates)
  SELECT EXISTS(
    SELECT 1 FROM account_seats WHERE order_item_id = NEW.id
  ) INTO v_seat_exists;
  
  IF v_seat_exists THEN
    RETURN NEW;
  END IF;

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
      
      -- If seats available, create a seat for this user (use ON CONFLICT for safety)
      IF v_current_seats < v_max_seats THEN
        INSERT INTO account_seats (credential_id, order_item_id, user_id)
        VALUES (v_credential_id, NEW.id, v_user_id)
        ON CONFLICT (credential_id, order_item_id) DO NOTHING;
        
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
$function$;