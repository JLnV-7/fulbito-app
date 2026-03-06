-- ============================================
-- USER FOLLOWS - Sistema de Seguidores
-- ============================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_follows_select" ON user_follows;
CREATE POLICY "user_follows_select" ON user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_follows_insert" ON user_follows;
CREATE POLICY "user_follows_insert" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "user_follows_delete" ON user_follows;
CREATE POLICY "user_follows_delete" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
