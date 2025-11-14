-- Add plan_id to cart_items table
ALTER TABLE cart_items ADD COLUMN plan_id UUID REFERENCES product_plans(id) ON DELETE CASCADE;

-- Make the unique constraint include plan_id (allow same product with different plans)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_product_plan_unique UNIQUE(user_id, product_id, plan_id);

-- Make product price nullable (since plans will have their own prices)
ALTER TABLE products ALTER COLUMN price DROP NOT NULL;

-- Add validation function to ensure products have at least one available plan
CREATE OR REPLACE FUNCTION check_product_has_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if product has no price (relying on plans)
  IF NEW.price IS NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM product_plans 
      WHERE product_id = NEW.id 
      AND is_available = true
    ) THEN
      RAISE EXCEPTION 'محصول باید حداقل یک پلن فعال داشته باشد';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate plan existence when updating product
CREATE TRIGGER validate_product_has_plan
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_has_plan();
