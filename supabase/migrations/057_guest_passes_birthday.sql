-- profiles: add birthday
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday date;

-- bookings: add discount tracking columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guest_pass_id uuid;

-- guest_passes table
CREATE TABLE IF NOT EXISTS public.guest_passes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  redeemed_at timestamptz,
  booking_id  uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own guest passes"
  ON public.guest_passes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role manage guest passes"
  ON public.guest_passes FOR ALL
  USING (true);

-- Update handle_new_user to capture birthday from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, birthday)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    CASE
      WHEN new.raw_user_meta_data->>'birthday' IS NOT NULL
      THEN (new.raw_user_meta_data->>'birthday')::date
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = excluded.full_name,
        email = excluded.email,
        birthday = COALESCE(excluded.birthday, public.profiles.birthday);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
