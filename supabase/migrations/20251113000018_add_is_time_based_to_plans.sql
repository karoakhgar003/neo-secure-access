-- Add is_time_based flag to product_plans
-- This allows marking products/plans as permanent (no expiration)

ALTER TABLE public.product_plans 
ADD COLUMN IF NOT EXISTS is_time_based BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.product_plans.is_time_based IS 'If true, product has time limit (duration_months). If false, product is permanent (no expiration).';
