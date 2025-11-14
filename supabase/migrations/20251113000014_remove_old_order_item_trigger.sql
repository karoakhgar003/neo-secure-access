-- Drop the old order_items trigger that doesn't respect plan_id
-- This trigger was assigning credentials immediately on INSERT without checking plan_id

DROP TRIGGER IF EXISTS trg_assign_credentials_to_order_item ON public.order_items;
DROP TRIGGER IF EXISTS assign_credentials_on_order_item_insert ON public.order_items;
DROP FUNCTION IF EXISTS public.assign_credentials_to_order_item() CASCADE;

-- The new workflow uses:
-- 1. Manual RPC call from Checkout.tsx after order creation
-- 2. Trigger on product_credentials INSERT/UPDATE for auto-assignment when credentials are added
-- Both use assign_credentials_to_pending_orders() which respects plan_id matching
