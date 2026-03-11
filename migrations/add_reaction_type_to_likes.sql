-- ============================================
-- REACCIONES TEMÁTICAS - Reemplazar Likes por Reacciones
-- ============================================

-- Agregar columna de tipo de reacción a match_log_likes
ALTER TABLE match_log_likes
  ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'fuego', 'termo', 'roja'));

-- Comentario para documentación
COMMENT ON COLUMN match_log_likes.reaction_type IS 'Tipo de reacción futbolera (like, fuego, termo, roja).';
