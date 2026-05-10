-- Add cart selection fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cart_selected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cart_fee_cents integer NOT NULL DEFAULT 0;
