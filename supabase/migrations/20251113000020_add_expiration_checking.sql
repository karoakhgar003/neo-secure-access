-- Function to check and handle expired orders
-- Marks account seats as 'expired' when their order_item expires_at date has passed

-- First, add 'expired' status to account_seats if not already there
DO $$ 
BEGIN
  -- Check if 'expired' is already in the constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'account_seats_status_check' 
    AND conbin::text LIKE '%expired%'
  ) THEN
    -- Drop and recreate the constraint with 'expired' included
    ALTER TABLE public.account_seats 
    DROP CONSTRAINT IF EXISTS account_seats_status_check;
    
    ALTER TABLE public.account_seats 
    ADD CONSTRAINT account_seats_status_check 
    CHECK (status IN ('unclaimed', 'first_code_issued', 'second_chance_issued', 'success', 'locked', 'expired'));
    
    RAISE NOTICE 'Added expired status to account_seats check constraint';
  END IF;
END $$;

-- Create the expiration checking function
CREATE OR REPLACE FUNCTION public.check_and_expire_orders()
RETURNS TABLE(
  expired_order_items INTEGER,
  expired_seats INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_items INTEGER := 0;
  v_expired_seats INTEGER := 0;
  v_order_item RECORD;
BEGIN
  -- Find all order_items that have expired
  FOR v_order_item IN
    SELECT 
      id,
      expires_at
    FROM public.order_items
    WHERE 
      expires_at IS NOT NULL
      AND expires_at < NOW()
      AND status != 'expired' -- Don't process already expired items
  LOOP
    -- Update all associated account_seats to 'expired' status
    UPDATE public.account_seats
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE 
      order_item_id = v_order_item.id
      AND status NOT IN ('expired', 'locked'); -- Don't change locked seats
    
    GET DIAGNOSTICS v_expired_seats = ROW_COUNT;
    
    -- Update order_item status to expired
    UPDATE public.order_items
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE id = v_order_item.id;
    
    v_expired_items := v_expired_items + 1;
    
    RAISE LOG 'Expired order_item % (expires_at: %), updated % seats', 
      v_order_item.id, v_order_item.expires_at, v_expired_seats;
  END LOOP;

  RETURN QUERY SELECT v_expired_items, v_expired_seats;
END;
$$;

COMMENT ON FUNCTION public.check_and_expire_orders IS 'Checks for expired order items and marks their account seats as expired. Returns count of expired items and seats. Should be called periodically (e.g., daily cron job).';

-- Add 'expired' status to order_items if needed
DO $$ 
BEGIN
  -- Check if we need to update the order_items status constraint
  -- For now we'll just use the existing status field
  -- If you want a separate constraint, add it here
  RAISE NOTICE 'Expiration system ready. Call check_and_expire_orders() periodically to enforce expirations.';
END $$;
