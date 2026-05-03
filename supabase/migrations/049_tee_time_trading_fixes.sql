-- supabase/migrations/049_tee_time_trading_fixes.sql
-- Patch fixes for tee time trading migration (048):
-- 1. Replace unconditional UNIQUE(booking_id) with partial unique index (allows re-listing after cancel)
-- 2. Fix listing_id FK on tee_time_transfers: CASCADE → RESTRICT (protect immutable audit log)
-- 3. Harden claim_listing RPC: revoke execute from public/anon
-- 4. Add updated_at auto-trigger on tee_time_listings (consistent with rest of schema)
--
-- NOTE: set_updated_at() is NOT created here — this codebase uses public.handle_updated_at()
-- defined in 002_core.sql. That function is reused below.

-- 1. Replace UNIQUE constraint with partial unique index
ALTER TABLE public.tee_time_listings DROP CONSTRAINT IF EXISTS tee_time_listings_booking_id_key;
CREATE UNIQUE INDEX tee_time_listings_booking_active_unique
  ON public.tee_time_listings (booking_id)
  WHERE status = 'active';

-- 2. Fix listing_id FK: drop CASCADE, re-add as RESTRICT to protect audit log
ALTER TABLE public.tee_time_transfers
  DROP CONSTRAINT IF EXISTS tee_time_transfers_listing_id_fkey;
ALTER TABLE public.tee_time_transfers
  ADD CONSTRAINT tee_time_transfers_listing_id_fkey
    FOREIGN KEY (listing_id)
    REFERENCES public.tee_time_listings(id)
    ON DELETE RESTRICT;

-- 3. Revoke execute from public/anon (defense-in-depth; matches project pattern from migration 010)
REVOKE EXECUTE ON FUNCTION public.claim_listing(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_listing(UUID, UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.claim_listing(UUID, UUID) TO authenticated;

-- 4. updated_at auto-trigger on tee_time_listings
--    Reuses public.handle_updated_at() defined in 002_core.sql (established project pattern)
CREATE TRIGGER set_tee_time_listings_updated_at
  BEFORE UPDATE ON public.tee_time_listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
