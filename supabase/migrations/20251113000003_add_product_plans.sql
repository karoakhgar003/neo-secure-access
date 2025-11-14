-- Add product plans/pricing tiers feature
-- Allows products to have multiple pricing options (Basic, Premium, Enterprise, etc.)

-- Create product_plans table
CREATE TABLE IF NOT EXISTS public.product_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Basic", "Premium", "Enterprise"
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_months INTEGER DEFAULT 1, -- How many months this plan is valid
  features JSONB DEFAULT '[]'::jsonb, -- Array of features for this plan
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0, -- For ordering plans in UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_product_plans_product_id ON public.product_plans(product_id);
CREATE INDEX idx_product_plans_available ON public.product_plans(product_id, is_available);

-- Enable RLS
ALTER TABLE public.product_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view available plans
CREATE POLICY "Plans are viewable by everyone"
ON public.product_plans
FOR SELECT
USING (true);

-- Admins can manage plans
CREATE POLICY "Admins can insert plans"
ON public.product_plans
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plans"
ON public.product_plans
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plans"
ON public.product_plans
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add plan_id to order_items to track which plan was selected
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.product_plans(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_order_items_plan_id ON public.order_items(plan_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_plans_updated_at
BEFORE UPDATE ON public.product_plans
FOR EACH ROW
EXECUTE FUNCTION update_product_plans_updated_at();
