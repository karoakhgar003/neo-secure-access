-- Fix relationship so nested selects work in AdminProductCredentials seats modal
-- Ensure account_seats.user_id references public.profiles(id) instead of auth.users
DO $$
BEGIN
  -- Drop existing FK if it points to auth.users (or exists at all)
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'account_seats'
      AND c.conname = 'account_seats_user_id_fkey'
  ) THEN
    ALTER TABLE public.account_seats
      DROP CONSTRAINT account_seats_user_id_fkey;
  END IF;

  -- Create the correct FK to public.profiles(id)
  ALTER TABLE public.account_seats
    ADD CONSTRAINT account_seats_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;
