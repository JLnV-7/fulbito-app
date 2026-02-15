-- PARTE 3: Policies de votos
-- Ejecutar DESPUÉS de la parte 2

CREATE POLICY "Members can view votos"
  ON votos_partido_amigo FOR SELECT
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can insert votos"
  ON votos_partido_amigo FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND partido_amigo_id IN (
      SELECT id FROM partidos_amigos 
      WHERE estado = 'votacion_abierta'
      AND grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can update their votos"
  ON votos_partido_amigo FOR UPDATE
  USING (
    auth.uid() = user_id
    AND partido_amigo_id IN (
      SELECT id FROM partidos_amigos 
      WHERE estado = 'votacion_abierta'
      AND grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );
