-- 041_leagues.sql
-- Golf League Management: leagues, members, sessions, scores + RLS

-- ─── TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE public.leagues (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  format        TEXT        NOT NULL DEFAULT 'stroke_play'
                            CHECK (format IN ('stroke_play', 'stableford')),
  season_start  DATE        NOT NULL,
  season_end    DATE        NOT NULL,
  max_players   INTEGER     NOT NULL DEFAULT 20,
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'active', 'completed')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.league_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id   UUID        NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handicap    INTEGER     NOT NULL DEFAULT 0 CHECK (handicap >= 0 AND handicap <= 54),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'withdrawn')),
  UNIQUE (league_id, user_id)
);

CREATE TABLE public.league_sessions (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id      UUID    NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  session_date   DATE    NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, session_number)
);

CREATE TABLE public.league_scores (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID    NOT NULL REFERENCES public.league_sessions(id) ON DELETE CASCADE,
  league_member_id  UUID    NOT NULL REFERENCES public.league_members(id) ON DELETE CASCADE,
  gross_score       INTEGER NOT NULL CHECK (gross_score > 0 AND gross_score < 200),
  handicap_strokes  INTEGER NOT NULL DEFAULT 0 CHECK (handicap_strokes >= 0),
  net_score         INTEGER GENERATED ALWAYS AS (gross_score - handicap_strokes) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, league_member_id)
);

-- ─── STANDINGS VIEW ─────────────────────────────────────────────────────────

CREATE VIEW public.league_standings AS
SELECT
  lm.id              AS league_member_id,
  lm.league_id,
  lm.user_id,
  p.full_name,
  lm.handicap,
  COUNT(ls.id)                         AS rounds_played,
  MIN(ls.net_score)                    AS best_net,
  ROUND(AVG(ls.net_score)::NUMERIC, 1) AS avg_net_score,
  SUM(ls.gross_score)                  AS total_gross
FROM  public.league_members lm
JOIN  public.profiles p        ON p.id = lm.user_id
LEFT JOIN public.league_sessions sess ON sess.league_id = lm.league_id
LEFT JOIN public.league_scores  ls   ON ls.session_id = sess.id
                                     AND ls.league_member_id = lm.id
WHERE lm.status = 'active'
GROUP BY lm.id, lm.league_id, lm.user_id, p.full_name, lm.handicap;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.leagues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_scores  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a course admin or crm user for a given course_id?
CREATE OR REPLACE FUNCTION public.is_course_staff(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_admins
    WHERE user_id = auth.uid() AND course_id = p_course_id
    UNION ALL
    SELECT 1 FROM public.crm_course_users
    WHERE user_id = auth.uid() AND course_id = p_course_id
  );
$$;

-- leagues: staff CRUD; any authenticated user read (to browse leagues at their course)
CREATE POLICY "course staff manage leagues"
  ON public.leagues FOR ALL
  USING (public.is_course_staff(course_id))
  WITH CHECK (public.is_course_staff(course_id));

CREATE POLICY "members read active leagues"
  ON public.leagues FOR SELECT
  USING (status IN ('active', 'completed'));

-- league_members: staff full access; member can insert/update own row; member reads own rows
CREATE POLICY "course staff manage league_members"
  ON public.league_members FOR ALL
  USING (
    public.is_course_staff(
      (SELECT course_id FROM public.leagues WHERE id = league_id LIMIT 1)
    )
  )
  WITH CHECK (
    public.is_course_staff(
      (SELECT course_id FROM public.leagues WHERE id = league_id LIMIT 1)
    )
  );

CREATE POLICY "member joins/leaves league"
  ON public.league_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "member updates own league_member row"
  ON public.league_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "member reads all active league_members"
  ON public.league_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members self
      WHERE self.league_id = league_members.league_id
        AND self.user_id = auth.uid()
        AND self.status = 'active'
    )
    OR public.is_course_staff(
      (SELECT course_id FROM public.leagues WHERE id = league_id LIMIT 1)
    )
  );

-- league_sessions: staff CRUD; enrolled members read
CREATE POLICY "course staff manage league_sessions"
  ON public.league_sessions FOR ALL
  USING (
    public.is_course_staff(
      (SELECT course_id FROM public.leagues WHERE id = league_id LIMIT 1)
    )
  )
  WITH CHECK (
    public.is_course_staff(
      (SELECT course_id FROM public.leagues WHERE id = league_id LIMIT 1)
    )
  );

CREATE POLICY "enrolled members read sessions"
  ON public.league_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE league_id = league_sessions.league_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- league_scores: staff CRUD; member reads own scores
CREATE POLICY "course staff manage league_scores"
  ON public.league_scores FOR ALL
  USING (
    public.is_course_staff(
      (SELECT l.course_id FROM public.league_sessions sess
       JOIN public.leagues l ON l.id = sess.league_id
       WHERE sess.id = session_id LIMIT 1)
    )
  )
  WITH CHECK (
    public.is_course_staff(
      (SELECT l.course_id FROM public.league_sessions sess
       JOIN public.leagues l ON l.id = sess.league_id
       WHERE sess.id = session_id LIMIT 1)
    )
  );

CREATE POLICY "member reads own scores"
  ON public.league_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members
      WHERE id = league_member_id AND user_id = auth.uid()
    )
  );
