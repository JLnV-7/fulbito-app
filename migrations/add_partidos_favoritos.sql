-- ============================================
-- PARTIDOS FAVORITOS - Top 4 Partidos Memorables
-- ============================================

CREATE TABLE IF NOT EXISTS partidos_favoritos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partido_id TEXT,
  equipo_local TEXT NOT NULL,
  equipo_visitante TEXT NOT NULL,
  logo_local TEXT,
  logo_visitante TEXT,
  goles_local INTEGER,
  goles_visitante INTEGER,
  liga TEXT,
  fecha TIMESTAMPTZ,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Un usuario solo puede tener 1 favorito por posición
  UNIQUE(user_id, position)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_partidos_favoritos_user ON partidos_favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_partidos_favoritos_position ON partidos_favoritos(user_id, position);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE partidos_favoritos ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver los favoritos de cualquier usuario (es público en el perfil)
CREATE POLICY "partidos_favoritos_select" ON partidos_favoritos
  FOR SELECT USING (true);

-- Solo el dueño puede insertar sus favoritos
CREATE POLICY "partidos_favoritos_insert" ON partidos_favoritos
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Solo el dueño puede actualizar sus favoritos
CREATE POLICY "partidos_favoritos_update" ON partidos_favoritos
  FOR UPDATE USING (user_id = auth.uid());

-- Solo el dueño puede eliminar sus favoritos
CREATE POLICY "partidos_favoritos_delete" ON partidos_favoritos
  FOR DELETE USING (user_id = auth.uid());
