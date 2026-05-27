-- 046_leagues_guest_members.sql
-- Allow guest (no TeeAhead account) members in leagues

-- Make user_id nullable so guests don't need an auth account
ALTER TABLE public.league_members ALTER COLUMN user_id DROP NOT NULL;

-- Store the guest's display name
ALTER TABLE public.league_members ADD COLUMN guest_name TEXT;

-- Exactly one of user_id or guest_name must be set
ALTER TABLE public.league_members ADD CONSTRAINT league_members_user_or_guest
  CHECK (num_nonnulls(user_id, guest_name) = 1);

-- Rebuild standings view to handle guest names via COALESCE
CREATE OR REPLACE VIEW public.league_standings AS
SELECT
  lm.id              AS league_member_id,
  lm.league_id,
  lm.user_id,
  COALESCE(p.full_name, lm.guest_name) AS full_name,
  lm.handicap,
  COUNT(ls.id)                         AS rounds_played,
  MIN(ls.net_score)                    AS best_net,
  ROUND(AVG(ls.net_score)::NUMERIC, 1) AS avg_net_score,
  SUM(ls.gross_score)                  AS total_gross
FROM  public.league_members lm
LEFT JOIN  public.profiles p          ON p.id = lm.user_id
LEFT JOIN public.league_sessions sess ON sess.league_id = lm.league_id
LEFT JOIN public.league_scores  ls    ON ls.session_id = sess.id
                                      AND ls.league_member_id = lm.id
WHERE lm.status = 'active'
GROUP BY lm.id, lm.league_id, lm.user_id, p.full_name, lm.guest_name, lm.handicap;
