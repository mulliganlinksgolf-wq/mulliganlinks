CREATE OR REPLACE FUNCTION vote_kb_article(p_article_id uuid, p_vote text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF p_vote = 'yes' THEN
    UPDATE kb_articles SET helpful_yes = helpful_yes + 1
    WHERE id = p_article_id AND is_published = true;
  ELSIF p_vote = 'no' THEN
    UPDATE kb_articles SET helpful_no = helpful_no + 1
    WHERE id = p_article_id AND is_published = true;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.vote_kb_article(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_kb_article(uuid, text) TO authenticated;
