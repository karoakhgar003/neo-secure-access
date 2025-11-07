-- Add missing foreign key relationships required for nested selects in seats modal
DO $$
BEGIN
  -- account_seats.user_id -> profiles.id (enables account_seats -> profiles nested select)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_seats_user_id_fkey'
  ) THEN
    ALTER TABLE public.account_seats
      ADD CONSTRAINT account_seats_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  -- account_seats.order_item_id -> order_items.id (enables account_seats -> order_items nested select)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_seats_order_item_id_fkey'
  ) THEN
    ALTER TABLE public.account_seats
      ADD CONSTRAINT account_seats_order_item_id_fkey
      FOREIGN KEY (order_item_id)
      REFERENCES public.order_items(id)
      ON DELETE CASCADE;
  END IF;

  -- Ensure order_items.order_id -> orders.id (needed for order_items -> orders join in nested select)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
END
$$;