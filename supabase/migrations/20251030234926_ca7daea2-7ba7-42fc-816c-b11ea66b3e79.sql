-- Add admin_notes field to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text;