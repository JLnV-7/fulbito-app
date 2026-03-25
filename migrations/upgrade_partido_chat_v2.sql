-- ============================================
-- CHAT V2 UPGRADE - Respuestas y Reacciones
-- ============================================

-- 1. Agregar soporte para respuestas
ALTER TABLE partido_comments
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES partido_comments(id) ON DELETE SET NULL;

-- 2. Crear tabla de reacciones para comentarios
CREATE TABLE IF NOT EXISTS partido_comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES partido_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'fuego', 'termo', 'roja', 'clasp', 'risa')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- 3. RLS para reacciones
ALTER TABLE partido_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON partido_comment_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON partido_comment_reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
CREATE POLICY "reactions_delete" ON partido_comment_reactions FOR DELETE USING (user_id = auth.uid());

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON partido_comment_reactions(comment_id);

-- 5. Habilitar Realtime para reacciones
ALTER PUBLICATION supabase_realtime ADD TABLE partido_comment_reactions;
