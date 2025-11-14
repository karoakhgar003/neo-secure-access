-- Manually fix orders with NULL product_id (deleted products)
-- Set a generic name for orders where product was deleted before caching

-- Update order_items that have NULL product_id and NULL product_name
UPDATE public.order_items
SET 
  product_name = 'محصول حذف شده',
  plan_name = COALESCE(plan_name, 'پلن استاندارد')
WHERE 
  product_id IS NULL 
  AND product_name IS NULL;

-- Log results
DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.order_items
  WHERE product_id IS NULL AND product_name IS NOT NULL;
  
  RAISE NOTICE 'Fixed % order items with deleted products', v_count;
END $$;
