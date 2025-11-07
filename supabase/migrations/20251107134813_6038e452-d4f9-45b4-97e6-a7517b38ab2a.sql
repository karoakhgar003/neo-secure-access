-- Ensure relationships for nested selects and create trigger + backfill seats
DO $$
BEGIN
  -- FK: account_seats.user_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_seats_user_id_fkey'
  ) THEN
    ALTER TABLE public.account_seats
      ADD CONSTRAINT account_seats_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;

  -- FK: account_seats.order_item_id -> order_items.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_seats_order_item_id_fkey'
  ) THEN
    ALTER TABLE public.account_seats
      ADD CONSTRAINT account_seats_order_item_id_fkey
      FOREIGN KEY (order_item_id)
      REFERENCES public.order_items(id)
      ON DELETE CASCADE;
  END IF;

  -- FK: account_seats.credential_id -> product_credentials.id (optional but consistent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_seats_credential_id_fkey'
  ) THEN
    ALTER TABLE public.account_seats
      ADD CONSTRAINT account_seats_credential_id_fkey
      FOREIGN KEY (credential_id)
      REFERENCES public.product_credentials(id)
      ON DELETE CASCADE;
  END IF;

  -- FK: order_items.order_id -> orders.id (needed for nested order join)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES public.orders(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger to auto-assign credentials on new order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_assign_credentials_to_order_item'
  ) THEN
    CREATE TRIGGER trg_assign_credentials_to_order_item
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_credentials_to_order_item();
  END IF;
END $$;

-- Backfill: assign credentials/seats for existing order_items without credentials
DO $$
DECLARE
  r RECORD;
  v_credential_id UUID;
  v_username TEXT;
  v_password TEXT;
  v_additional_info JSONB;
  v_max_seats INTEGER;
  v_current_seats INTEGER;
  v_user_id UUID;
  v_requires_totp BOOLEAN;
BEGIN
  FOR r IN
    SELECT oi.*
    FROM public.order_items oi
    LEFT JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.credentials IS NULL
  LOOP
    -- Get user_id
    SELECT user_id INTO v_user_id FROM public.orders WHERE id = r.order_id;

    -- Find an available credential for the product
    SELECT pc.id, pc.username, pc.password, pc.additional_info, pc.max_seats,
           (pc.totp_secret IS NOT NULL) AS requires_totp
      INTO v_credential_id, v_username, v_password, v_additional_info, v_max_seats, v_requires_totp
      FROM public.product_credentials pc
     WHERE pc.product_id = r.product_id AND pc.is_assigned = false
     LIMIT 1
     FOR UPDATE SKIP LOCKED;

    IF v_credential_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_current_seats FROM public.account_seats WHERE credential_id = v_credential_id;

      IF COALESCE(v_current_seats, 0) < COALESCE(v_max_seats, 1) THEN
        INSERT INTO public.account_seats (credential_id, order_item_id, user_id)
        VALUES (v_credential_id, r.id, v_user_id);

        UPDATE public.order_items
           SET credentials = jsonb_build_object(
             'username', v_username,
             'password', v_password,
             'additional_info', v_additional_info,
             'requires_totp', v_requires_totp
           )
         WHERE id = r.id;

        IF COALESCE(v_current_seats, 0) + 1 >= COALESCE(v_max_seats, 1) THEN
          UPDATE public.product_credentials
             SET is_assigned = true,
                 assigned_at = now()
           WHERE id = v_credential_id;
        END IF;

        UPDATE public.orders SET status = 'completed' WHERE id = r.order_id;
      END IF;
    END IF;

    -- reset vars
    v_credential_id := NULL;
    v_username := NULL;
    v_password := NULL;
    v_additional_info := NULL;
    v_max_seats := NULL;
    v_current_seats := NULL;
    v_user_id := NULL;
    v_requires_totp := NULL;
  END LOOP;
END $$;