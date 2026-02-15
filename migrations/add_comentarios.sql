-- Migration: Add comentarios table for live comments
-- Compatible with Supabase

CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL,
  user_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comentarios_partido_created 
  ON comentarios(partido_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comentarios_user 
  ON comentarios(user_id);

-- Row Level Security (RLS)
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read comments
CREATE POLICY "Anyone can read comments"
  ON comentarios FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
  ON comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comentarios FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comentarios FOR UPDATE
  USING (auth.uid() = user_id);
