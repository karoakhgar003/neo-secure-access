-- Fix CASCADE DELETE issue: Preserve order history when products are deleted
-- Currently, deleting a product CASCADE deletes all order_items, which destroys order history
-- Solution: Change ON DELETE CASCADE to ON DELETE SET NULL for order_items.product_id

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Step 2: Make product_id nullable (since it can be NULL after product deletion)
ALTER TABLE public.order_items
ALTER COLUMN product_id DROP NOT NULL;

-- Step 3: Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON DELETE SET NULL;

-- Step 4: Do the same for plan_id (preserve order history even if plan is deleted)
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_plan_id_fkey;

ALTER TABLE public.order_items
ALTER COLUMN plan_id DROP NOT NULL;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES public.product_plans(id)
ON DELETE SET NULL;

COMMENT ON CONSTRAINT order_items_product_id_fkey ON public.order_items IS 
'SET NULL on product deletion to preserve order history. Product info should be cached in order metadata.';

COMMENT ON CONSTRAINT order_items_plan_id_fkey ON public.order_items IS 
'SET NULL on plan deletion to preserve order history. Plan info should be cached in order metadata.';

-- Add columns to cache product/plan info for historical records
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS plan_name TEXT;

COMMENT ON COLUMN public.order_items.product_name IS 'Cached product name for order history (in case product is deleted)';
COMMENT ON COLUMN public.order_items.plan_name IS 'Cached plan name for order history (in case plan is deleted)';

-- Create trigger to cache product/plan names when order_item is created
CREATE OR REPLACE FUNCTION public.cache_order_item_product_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cache product name
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO NEW.product_name
    FROM public.products
    WHERE id = NEW.product_id;
  END IF;

  -- Cache plan name
  IF NEW.plan_id IS NOT NULL THEN
    SELECT name INTO NEW.plan_name
    FROM public.product_plans
    WHERE id = NEW.plan_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cache_order_item_product_info ON public.order_items;

CREATE TRIGGER trg_cache_order_item_product_info
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.cache_order_item_product_info();

-- Update existing order_items to cache their product/plan names
-- First get product names
UPDATE public.order_items oi
SET product_name = p.name
FROM public.products p
WHERE oi.product_id = p.id
  AND oi.product_name IS NULL;

-- Then get plan names
UPDATE public.order_items oi
SET plan_name = pp.name
FROM public.product_plans pp
WHERE oi.plan_id = pp.id
  AND oi.plan_name IS NULL;

-- Log success
DO $$ 
BEGIN
  RAISE NOTICE 'Order history preservation enabled. Products/plans can now be deleted without losing order records.';
END $$;
