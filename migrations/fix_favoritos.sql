-- Migration: Fix favoritos table (Clean slate)
-- 1. Borrar tabla anterior si existe para evitar conflictos de políticas duplicadas
DROP TABLE IF EXISTS favoritos;

-- 2. Crear tabla limpia
CREATE TABLE favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipo_nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, equipo_nombre)
);

-- 3. Índices
CREATE INDEX idx_favoritos_user 
  ON favoritos(user_id);

-- 4. Habilitar seguridad
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas
CREATE POLICY "Users can read own favorites"
  ON favoritos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favoritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favoritos FOR DELETE
  USING (auth.uid() = user_id);
