-- supabase/migrations/029_member_admin_notes.sql

CREATE TABLE public.member_admin_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  member_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id    uuid        NOT NULL REFERENCES auth.users(id),
  admin_email text        NOT NULL,
  body        text        NOT NULL
);

CREATE INDEX member_admin_notes_member_id_idx ON public.member_admin_notes (member_id);

ALTER TABLE public.member_admin_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can read and write notes (members cannot see their own admin notes)
CREATE POLICY "Admin all member_admin_notes"
  ON public.member_admin_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Service role all member_admin_notes"
  ON public.member_admin_notes FOR ALL
  USING (auth.role() = 'service_role');
