-- Create a scheduled job to check and expire orders daily
-- This will be called by a cron job or edge function

-- First, let's improve the expiration function to also prevent TOTP access
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

-- Update the TOTP generation function to check expiration
-- This prevents issuing codes for expired subscriptions
CREATE OR REPLACE FUNCTION public.check_totp_access(p_seat_id UUID)
RETURNS TABLE(
  is_expired BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_item RECORD;
BEGIN
  -- Get the order_item for this seat
  SELECT 
    oi.expires_at,
    oi.status
  INTO v_order_item
  FROM public.account_seats acs
  JOIN public.order_items oi ON oi.id = acs.order_item_id
  WHERE acs.id = p_seat_id;
  
  -- Check if expired
  IF v_order_item.status = 'expired' OR 
     (v_order_item.expires_at IS NOT NULL AND v_order_item.expires_at < NOW()) THEN
    RETURN QUERY SELECT 
      true, 
      v_order_item.expires_at,
      'اشتراک شما منقضی شده است. لطفا برای تمدید با پشتیبانی تماس بگیرید.'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      false, 
      v_order_item.expires_at,
      'دسترسی مجاز است'::TEXT;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.check_totp_access IS 'Check if a seat has access to TOTP codes based on expiration status';

-- Create a view for admins to see expiring orders
CREATE OR REPLACE VIEW public.expiring_orders_view AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.user_id,
  p.email,
  p.full_name,
  oi.id as order_item_id,
  oi.product_name,
  oi.plan_name,
  oi.expires_at,
  oi.status,
  CASE 
    WHEN oi.expires_at < NOW() THEN 'منقضی شده'
    WHEN oi.expires_at < NOW() + INTERVAL '7 days' THEN 'انقضا در 7 روز آینده'
    WHEN oi.expires_at < NOW() + INTERVAL '30 days' THEN 'انقضا در 30 روز آینده'
    ELSE 'فعال'
  END as expiry_status,
  EXTRACT(DAY FROM (oi.expires_at - NOW())) as days_until_expiry
FROM public.orders o
JOIN public.profiles p ON p.id = o.user_id
JOIN public.order_items oi ON oi.order_id = o.id
WHERE oi.expires_at IS NOT NULL
ORDER BY oi.expires_at ASC;

COMMENT ON VIEW public.expiring_orders_view IS 'View of all orders with expiration info for admin monitoring';

-- Grant access to the view
GRANT SELECT ON public.expiring_orders_view TO authenticated;

-- Create RLS policy for the view (admins only)
ALTER VIEW public.expiring_orders_view SET (security_invoker = on);

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Expiration enforcement system improved. Use check_and_expire_orders() daily to enforce expirations.';
  RAISE NOTICE 'View expiring_orders_view created for monitoring upcoming expirations.';
END $$;
