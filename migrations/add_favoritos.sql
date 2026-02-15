-- Migration: Add favoritos table
-- Compatible with Supabase

CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipo_nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, equipo_nombre)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favoritos_user 
  ON favoritos(user_id);

-- RLS
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own favorites"
  ON favoritos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favoritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favoritos FOR DELETE
  USING (auth.uid() = user_id);
