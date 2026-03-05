-- ============================================
-- MATCH LOGS - Columnas Futez (Rating DT, Estrella, Villano, Foto, Neutral)
-- ============================================

-- Rating del Director Técnico (0.5-5 estrellas)
ALTER TABLE match_logs
  ADD COLUMN IF NOT EXISTS rating_dt NUMERIC(2,1) CHECK (rating_dt >= 0.5 AND rating_dt <= 5);

-- Jugador estrella del partido (MVP)
ALTER TABLE match_logs
  ADD COLUMN IF NOT EXISTS jugador_estrella TEXT;

-- Jugador villano del partido (peor rendimiento)
ALTER TABLE match_logs
  ADD COLUMN IF NOT EXISTS jugador_villano TEXT;

-- URL de foto del momento
ALTER TABLE match_logs
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Modo neutral (anti-bias)
ALTER TABLE match_logs
  ADD COLUMN IF NOT EXISTS is_neutral BOOLEAN DEFAULT false;
