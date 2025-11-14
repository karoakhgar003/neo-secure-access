-- Auto-calculate and set expires_at when order_item is created
-- Only if the plan is time-based (is_time_based = true)

CREATE OR REPLACE FUNCTION public.set_order_item_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan RECORD;
BEGIN
  -- If plan_id is set, get the plan info
  IF NEW.plan_id IS NOT NULL THEN
    SELECT 
      is_time_based, 
      duration_months
    INTO v_plan
    FROM public.product_plans
    WHERE id = NEW.plan_id;
    
    -- If plan is time-based and expires_at not already set, calculate it
    IF v_plan.is_time_based AND NEW.expires_at IS NULL THEN
      NEW.expires_at := NOW() + (v_plan.duration_months || ' months')::INTERVAL;
      RAISE LOG 'Set expires_at to % for order_item % (plan: %, duration: % months)', 
        NEW.expires_at, NEW.id, NEW.plan_id, v_plan.duration_months;
    ELSIF NOT v_plan.is_time_based THEN
      -- Permanent plan - ensure expires_at is NULL
      NEW.expires_at := NULL;
      RAISE LOG 'Plan is permanent, set expires_at to NULL for order_item %', NEW.id;
    END IF;
  ELSE
    -- No plan specified - check product directly (fallback, though all should have plans now)
    -- For now, default to 1 month if no plan
    IF NEW.expires_at IS NULL THEN
      NEW.expires_at := NOW() + INTERVAL '1 month';
      RAISE LOG 'No plan specified, defaulting to 1 month expiration for order_item %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_set_order_item_expiration ON public.order_items;

CREATE TRIGGER trg_set_order_item_expiration
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_item_expiration();

COMMENT ON FUNCTION public.set_order_item_expiration IS 'Automatically calculates and sets expires_at based on plan duration when order item is created. Skips if plan is permanent (is_time_based=false).';
