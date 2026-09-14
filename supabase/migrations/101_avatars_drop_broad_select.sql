-- Migration 101: Drop broad SELECT policy on avatars bucket
--
-- The avatars bucket is public, so image URLs work for everyone via the
-- /storage/v1/object/public/avatars/... path without any SELECT policy
-- on storage.objects. The `avatars_select` policy was only enabling
-- list operations (enumerating every filename in the bucket), which lets
-- a client correlate user IDs across the system.
--
-- Verified the app only calls supabase.storage.from('avatars').getPublicUrl()
-- (src/app/app/partners/actions.ts) — never .list(). Dropping the policy
-- has no functional impact.

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
