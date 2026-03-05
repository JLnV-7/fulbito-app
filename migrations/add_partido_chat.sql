-- ============================================
-- LIVE MATCH CHAT - Creacion de comentarios por partido
-- ============================================

CREATE TABLE IF NOT EXISTS partido_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partido_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_partido_comments_partido ON partido_comments(partido_id);
CREATE INDEX IF NOT EXISTS idx_partido_comments_user ON partido_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_partido_comments_created ON partido_comments(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE partido_comments ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer los comentarios (el chat del partido es público)
CREATE POLICY "partido_comments_select" ON partido_comments
  FOR SELECT USING (true);

-- Solo usuarios autenticados pueden insertar
CREATE POLICY "partido_comments_insert" ON partido_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Solo el dueño del comentario puede actualizarlo (editarlo)
CREATE POLICY "partido_comments_update" ON partido_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Solo el dueño del comentario puede borrarlo
CREATE POLICY "partido_comments_delete" ON partido_comments
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- HABILITAR REALTIME (Para que el chat sea en vivo)
-- ============================================

-- IMPORTANTE: Ejecutar esto habilita a Supabase a escuchar cambios en esta tabla
-- y enviarlos por WebSockets al cliente instantáneamente.
ALTER PUBLICATION supabase_realtime ADD TABLE partido_comments;
