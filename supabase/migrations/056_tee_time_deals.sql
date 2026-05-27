ALTER TABLE public.tee_times
  ADD COLUMN IF NOT EXISTS special_price numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS special_label text DEFAULT NULL;
