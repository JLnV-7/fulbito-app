-- Quick Polls: Predicciones rápidas de 1 tap
-- "¿Quién gana?" antes de cada partido

CREATE TABLE IF NOT EXISTS quick_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fixture_id INTEGER NOT NULL, -- TheSportsDB event ID

  -- La predicción: 'local', 'empate', o 'visitante'
  prediccion VARCHAR(10) NOT NULL CHECK (prediccion IN ('local', 'empate', 'visitante')),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, fixture_id)
);

CREATE INDEX IF NOT EXISTS idx_quick_polls_fixture ON quick_polls(fixture_id);
CREATE INDEX IF NOT EXISTS idx_quick_polls_user ON quick_polls(user_id);

-- RLS
ALTER TABLE quick_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quick_polls_select" ON quick_polls
  FOR SELECT USING (true);

CREATE POLICY "quick_polls_insert" ON quick_polls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quick_polls_update" ON quick_polls
  FOR UPDATE USING (auth.uid() = user_id);
