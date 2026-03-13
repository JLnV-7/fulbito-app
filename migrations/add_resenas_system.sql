-- Tabla principal de reseñas
CREATE TABLE IF NOT EXISTS resenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partido_id INTEGER NOT NULL,           -- ID del partido en API-Football (o UUID si es interno)
  
  -- Contenido de la reseña
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- calificación del partido
  texto TEXT CHECK (char_length(texto) <= 500),    -- reseña libre (opcional)
  mvp_jugador_id INTEGER,                          -- ID del jugador en API-Football
  mvp_jugador_nombre TEXT,                         -- nombre cacheado para no refetchear
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un usuario solo puede dejar una reseña por partido
  UNIQUE (user_id, partido_id)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_resenas_partido ON resenas(partido_id);
CREATE INDEX IF NOT EXISTS idx_resenas_user    ON resenas(user_id);
CREATE INDEX IF NOT EXISTS idx_resenas_created ON resenas(created_at DESC);

-- RLS: cada usuario ve todas las reseñas, solo edita las propias
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resenas_select') THEN
        CREATE POLICY "resenas_select" ON resenas FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resenas_insert') THEN
        CREATE POLICY "resenas_insert" ON resenas FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resenas_update') THEN
        CREATE POLICY "resenas_update" ON resenas FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resenas_delete') THEN
        CREATE POLICY "resenas_delete" ON resenas FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger para updated_at automático (si no existe la función general)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resenas_updated_at ON resenas;
CREATE TRIGGER resenas_updated_at
  BEFORE UPDATE ON resenas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Ampliar la tabla profiles existente con campos de perfil futbolero
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS equipo_favorito TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 160);

-- Vista materializada: estadísticas de usuario (se refresca con cron)
-- Nota: requiere que exista la tabla 'prodes' con columna 'acerto'
CREATE MATERIALIZED VIEW IF NOT EXISTS stats_usuario AS
SELECT
  p.user_id,
  COUNT(r.id)                                          AS total_resenas,
  COUNT(pr.id)                                         AS total_prodes,
  COUNT(pr.id) FILTER (WHERE pr.acerto = true)         AS prodes_correctos,
  ROUND(
    COUNT(pr.id) FILTER (WHERE pr.acerto = true)::numeric
    / NULLIF(COUNT(pr.id), 0) * 100, 1
  )                                                    AS porcentaje_aciertos,
  AVG(r.rating)                                        AS rating_promedio
FROM profiles p
LEFT JOIN resenas r  ON r.user_id = p.user_id
LEFT JOIN prodes  pr ON pr.user_id = p.user_id
GROUP BY p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stats_user_id ON stats_usuario(user_id);

-- Vista que une reseñas con info del perfil para el feed
CREATE OR REPLACE VIEW feed_global AS
SELECT
  r.id,
  r.partido_id,
  r.rating,
  r.texto,
  r.mvp_jugador_nombre,
  r.created_at,
  p.username,
  p.avatar_url
FROM resenas r
JOIN profiles p ON p.user_id = r.user_id
WHERE r.texto IS NOT NULL
ORDER BY r.created_at DESC;
