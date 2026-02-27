-- ============================================
-- MATCH LOGS - Sistema Letterboxd para Fútbol
-- ============================================

-- Tabla principal: match_logs (el "log" central)
CREATE TABLE IF NOT EXISTS match_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partido_id TEXT,  -- nullable, vinculado a partido de API si existe
  match_type TEXT NOT NULL CHECK (match_type IN ('tv', 'stadium', 'friend', 'other')),
  equipo_local TEXT NOT NULL,
  equipo_visitante TEXT NOT NULL,
  logo_local TEXT,
  logo_visitante TEXT,
  liga TEXT,
  fecha_partido TIMESTAMPTZ NOT NULL,
  goles_local INTEGER,
  goles_visitante INTEGER,
  rating_partido NUMERIC(2,1) CHECK (rating_partido >= 0.5 AND rating_partido <= 5),
  rating_arbitro NUMERIC(2,1) CHECK (rating_arbitro >= 0.5 AND rating_arbitro <= 5),
  rating_atmosfera NUMERIC(2,1) CHECK (rating_atmosfera >= 0.5 AND rating_atmosfera <= 5),
  review_title TEXT,
  review_text TEXT,
  is_spoiler BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ratings individuales de jugadores dentro de un log
CREATE TABLE IF NOT EXISTS match_log_player_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_log_id UUID REFERENCES match_logs(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  player_team TEXT NOT NULL CHECK (player_team IN ('local', 'visitante')),
  rating NUMERIC(2,1) CHECK (rating >= 0.5 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Likes en match logs
CREATE TABLE IF NOT EXISTS match_log_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_log_id UUID REFERENCES match_logs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_log_id, user_id)
);

-- Tags de match logs
CREATE TABLE IF NOT EXISTS match_log_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_log_id UUID REFERENCES match_logs(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Follows (seguir usuarios)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_match_logs_user ON match_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_match_logs_created ON match_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_logs_partido ON match_logs(partido_id);
CREATE INDEX IF NOT EXISTS idx_match_logs_liga ON match_logs(liga);
CREATE INDEX IF NOT EXISTS idx_match_logs_private ON match_logs(is_private);
CREATE INDEX IF NOT EXISTS idx_match_log_player_ratings_log ON match_log_player_ratings(match_log_id);
CREATE INDEX IF NOT EXISTS idx_match_log_likes_log ON match_log_likes(match_log_id);
CREATE INDEX IF NOT EXISTS idx_match_log_likes_user ON match_log_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_match_log_tags_log ON match_log_tags(match_log_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE match_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_log_player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_log_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_log_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- match_logs: ver públicos o propios
CREATE POLICY "match_logs_select" ON match_logs
  FOR SELECT USING (is_private = false OR user_id = auth.uid());

CREATE POLICY "match_logs_insert" ON match_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "match_logs_update" ON match_logs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "match_logs_delete" ON match_logs
  FOR DELETE USING (user_id = auth.uid());

-- match_log_player_ratings: acceso via match_log ownership
CREATE POLICY "player_ratings_select" ON match_log_player_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM match_logs
      WHERE match_logs.id = match_log_player_ratings.match_log_id
      AND (match_logs.is_private = false OR match_logs.user_id = auth.uid())
    )
  );

CREATE POLICY "player_ratings_insert" ON match_log_player_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM match_logs
      WHERE match_logs.id = match_log_player_ratings.match_log_id
      AND match_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "player_ratings_delete" ON match_log_player_ratings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM match_logs
      WHERE match_logs.id = match_log_player_ratings.match_log_id
      AND match_logs.user_id = auth.uid()
    )
  );

-- match_log_likes
CREATE POLICY "likes_select" ON match_log_likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON match_log_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete" ON match_log_likes
  FOR DELETE USING (user_id = auth.uid());

-- match_log_tags
CREATE POLICY "tags_select" ON match_log_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM match_logs
      WHERE match_logs.id = match_log_tags.match_log_id
      AND (match_logs.is_private = false OR match_logs.user_id = auth.uid())
    )
  );

CREATE POLICY "tags_insert" ON match_log_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM match_logs
      WHERE match_logs.id = match_log_tags.match_log_id
      AND match_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "tags_delete" ON match_log_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM match_logs
      WHERE match_logs.id = match_log_tags.match_log_id
      AND match_logs.user_id = auth.uid()
    )
  );

-- user_follows
CREATE POLICY "follows_select" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert" ON user_follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete" ON user_follows
  FOR DELETE USING (follower_id = auth.uid());
