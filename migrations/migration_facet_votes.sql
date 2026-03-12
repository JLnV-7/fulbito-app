-- Migration: Add Facet Voting and Status Columns to Partidos Amigos

-- 1. Add status columns to partidos_amigos
ALTER TABLE partidos_amigos 
ADD COLUMN IF NOT EXISTS stats_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS votes_completed BOOLEAN DEFAULT FALSE;

-- 2. Create facet_votes table
CREATE TABLE IF NOT EXISTS facet_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_amigo_id UUID REFERENCES partidos_amigos(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES jugadores_partido_amigo(id) ON DELETE CASCADE,
  facet TEXT NOT NULL CHECK (facet IN ('goleador', 'comilon', 'patadas', 'arquero')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partido_amigo_id, voter_id, facet)
);

-- 3. RLS Policies for facet_votes
ALTER TABLE facet_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view facet_votes"
  ON facet_votes FOR SELECT
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can insert their facet_votes"
  ON facet_votes FOR INSERT
  WITH CHECK (
    auth.uid() = voter_id
    AND partido_amigo_id IN (
      SELECT id FROM partidos_amigos 
      WHERE estado = 'votacion_abierta'
      AND grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can update their facet_votes"
  ON facet_votes FOR UPDATE
  USING (
    auth.uid() = voter_id
    AND partido_amigo_id IN (
      SELECT id FROM partidos_amigos 
      WHERE estado = 'votacion_abierta'
      AND grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );
