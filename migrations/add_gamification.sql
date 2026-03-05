-- ============================================
-- GAMIFICATION - Sistema de Niveles y Badges
-- ============================================

-- 1. Modificar Perfiles para agregar XP y Nivel
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Crear tabla de Insignias (Catálogo)
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,         -- Emoji o URL de icono
  condition TEXT,             -- Referencia interna de codigo, ej: '10_reviews'
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Crear tabla de relación (Usuario - Insignia)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================
-- FUNCIONES Y TRIGGERS (Automatización XP)
-- ============================================

-- Función: Calcular nivel automáticamente antes de actualizar el Profile si cambió el XP
CREATE OR REPLACE FUNCTION update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.xp IS DISTINCT FROM OLD.xp THEN
        -- Formula de Nivel (Empieza en 1, cada nivel cuesta mas)
        -- Usando raiz cuadrada: Nivel = floor(sqrt(xp/100)) + 1
        -- Ej: 0 = lvl 1, 100 = lvl 2, 400 = lvl 3, 900 = lvl 4, etc.
        NEW.level := floor(sqrt(NEW.xp / 100.0)) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_profile_level ON profiles;
CREATE TRIGGER tr_update_profile_level
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_level();


-- Función: Dar XP por Reseñar (+50 XP)
CREATE OR REPLACE FUNCTION add_xp_on_match_log()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET xp = xp + 50 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_add_xp_match_log ON match_logs;
CREATE TRIGGER tr_add_xp_match_log
AFTER INSERT ON match_logs
FOR EACH ROW
EXECUTE FUNCTION add_xp_on_match_log();

-- Función: Dar XP por comentar en vivo (+10 XP)
CREATE OR REPLACE FUNCTION add_xp_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET xp = xp + 10 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_add_xp_comment ON partido_comments;
CREATE TRIGGER tr_add_xp_comment
AFTER INSERT ON partido_comments
FOR EACH ROW
EXECUTE FUNCTION add_xp_on_comment();

-- Función: Dar XP por Votar en 11 ideal (+5 XP)
CREATE OR REPLACE FUNCTION add_xp_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET xp = xp + 5 WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_add_xp_vote ON votaciones;
CREATE TRIGGER tr_add_xp_vote
AFTER INSERT ON votaciones
FOR EACH ROW
EXECUTE FUNCTION add_xp_on_vote();


-- ============================================
-- INSERTAR BADGES POR DEFAULT Y POLITICAS
-- ============================================

INSERT INTO badges (name, description, icon, condition, xp_reward) 
VALUES 
  ('Hincha Fundador', 'Estuvo presente en la Beta de FutLog', '🎯', 'beta_tester', 100),
  ('10 Partidos', 'Bancó 10 partidos en la tribuna', '🔟', '10_reviews', 50),
  ('Voz de la Hinchada', 'Chatteó más de 50 veces en vivo', '📢', '50_live_chat', 200)
ON CONFLICT DO NOTHING;

-- RLS para Badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT USING (true);
-- Las de insert dependerán del backend o de funciones postgres de admin.
