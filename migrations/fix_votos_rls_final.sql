-- Fix RLS para poder ver todos los votos y comentarios en un partido
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar políticas antiguas o conflictivas de lectura de votos
DROP POLICY IF EXISTS "Members can view votos" ON votos_partido_amigo;
DROP POLICY IF EXISTS "Users can view votos" ON votos_partido_amigo;
DROP POLICY IF EXISTS "select_votos" ON votos_partido_amigo;

-- 2. Asegurar que RLS esté activo
ALTER TABLE votos_partido_amigo ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para que todos los usuarios del grupo puedan LEER los votos de cualquier partido de ese grupo
CREATE POLICY "select_votos"
  ON votos_partido_amigo FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partidos_amigos
      WHERE id = votos_partido_amigo.partido_amigo_id
      AND is_group_member(grupo_id)
    )
  );

-- 4. Repetir para facet_votes (premios especiales) que pueden estar siendo bloqueados
DROP POLICY IF EXISTS "Members can view facet_votes" ON facet_votes;
DROP POLICY IF EXISTS "Users can view facet_votes" ON facet_votes;
DROP POLICY IF EXISTS "select_facet_votes" ON facet_votes;

ALTER TABLE facet_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_facet_votes"
  ON facet_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partidos_amigos
      WHERE id = facet_votes.partido_amigo_id
      AND is_group_member(grupo_id)
    )
  );
