-- supabase/migrations/028_admin_audit_log.sql

CREATE TABLE public.admin_audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz DEFAULT now(),
  admin_id     uuid        REFERENCES auth.users(id),
  admin_email  text        NOT NULL,
  event_type   text        NOT NULL,
  target_type  text        NOT NULL,
  target_id    text,
  target_label text,
  details      jsonb       DEFAULT '{}'
);

CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_event_type_idx ON public.admin_audit_log (event_type);
CREATE INDEX admin_audit_log_admin_id_idx   ON public.admin_audit_log (admin_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit log entries
CREATE POLICY "Admin read audit_log"
  ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Only service_role can insert (all writes go through the server)
CREATE POLICY "Service role insert audit_log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
