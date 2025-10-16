CREATE OR REPLACE FUNCTION get_posts_with_user_votes(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  created_at TIMESTAMPTZ,
  title TEXT,
  content TEXT,
  user_id UUID,
  user_name TEXT,
  user_avatar_char TEXT,
  vote_count INT,
  comment_count INT,
  user_vote INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.created_at,
    p.title,
    p.content,
    p.user_id,
    p.user_name,
    p.user_avatar_char,
    p.vote_count,
    p.comment_count,
    COALESCE(pv.vote_type, 0) AS user_vote
  FROM
    posts p
  LEFT JOIN
    post_votes pv ON p.id = pv.post_id AND pv.user_id = p_user_id
  ORDER BY
    p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
