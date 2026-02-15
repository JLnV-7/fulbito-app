-- PARTE 2: Habilitar RLS y policies de partidos_amigos + jugadores
-- Ejecutar DESPUÉS de la parte 1

ALTER TABLE partidos_amigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores_partido_amigo ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos_partido_amigo ENABLE ROW LEVEL SECURITY;

-- PARTIDOS_AMIGOS policies
CREATE POLICY "Members can view partidos_amigos"
  ON partidos_amigos FOR SELECT
  USING (
    grupo_id IN (
      SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can create partidos_amigos"
  ON partidos_amigos FOR INSERT
  WITH CHECK (
    auth.uid() = creado_por
    AND grupo_id IN (
      SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update partidos_amigos"
  ON partidos_amigos FOR UPDATE
  USING (
    grupo_id IN (
      SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete partidos_amigos"
  ON partidos_amigos FOR DELETE
  USING (
    grupo_id IN (
      SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
    )
  );

-- JUGADORES policies
CREATE POLICY "Members can view jugadores"
  ON jugadores_partido_amigo FOR SELECT
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin can insert jugadores"
  ON jugadores_partido_amigo FOR INSERT
  WITH CHECK (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin can delete jugadores"
  ON jugadores_partido_amigo FOR DELETE
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
      )
    )
  );
