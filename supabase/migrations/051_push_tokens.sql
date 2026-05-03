-- 049_push_tokens.sql
-- Push token storage for web and mobile notifications

-- ─── TABLE ──────────────────────────────────────────────────────────────────

CREATE TABLE public.push_tokens (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token     TEXT        NOT NULL,
  platform  TEXT        NOT NULL DEFAULT 'web'
                        CHECK (platform IN ('web', 'expo', 'ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can INSERT their own tokens
CREATE POLICY "users insert own push tokens"
  ON public.push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can SELECT their own tokens
CREATE POLICY "users select own push tokens"
  ON public.push_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Users can UPDATE their own tokens (for refreshing)
CREATE POLICY "users update own push tokens"
  ON public.push_tokens FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can DELETE their own tokens
CREATE POLICY "users delete own push tokens"
  ON public.push_tokens FOR DELETE
  USING (user_id = auth.uid());

-- Service role (admin) can SELECT all for sending notifications
-- (Service role bypasses RLS by default, so no policy needed)
