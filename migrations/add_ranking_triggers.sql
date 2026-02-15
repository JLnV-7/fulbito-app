-- ============================================
-- Trigger para actualizar Ranking y Grupos automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_ranking_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_liga VARCHAR;
  v_temporada VARCHAR := '2024'; -- Por defecto o dinamico
  v_stats RECORD;
BEGIN
  -- Obtener liga del partido
  SELECT liga INTO v_liga
  FROM partidos
  WHERE id = NEW.partido_id;

  -- Calcular estadísticas acumuladas para el usuario en esa liga
  SELECT 
    COALESCE(SUM(pp.puntos), 0) as total_puntos,
    COUNT(pp.id) as partidos_jugados,
    COUNT(CASE WHEN pp.tipo_acierto = 'exacto' THEN 1 END) as exactos,
    COUNT(CASE WHEN pp.tipo_acierto = 'ganador_diferencia' THEN 1 END) as diferencia,
    COUNT(CASE WHEN pp.tipo_acierto = 'ganador' THEN 1 END) as ganador
  INTO v_stats
  FROM puntuaciones_prode pp
  JOIN partidos p ON pp.partido_id = p.id
  WHERE pp.user_id = NEW.user_id 
  AND p.liga = v_liga;

  -- Actualizar Ranking Global (Upsert)
  INSERT INTO ranking_prode (
    user_id, liga, temporada, 
    puntos_totales, partidos_jugados, 
    aciertos_exactos, aciertos_ganador_diferencia, aciertos_ganador,
    updated_at
  ) VALUES (
    NEW.user_id, v_liga, v_temporada,
    v_stats.total_puntos, v_stats.partidos_jugados,
    v_stats.exactos, v_stats.diferencia, v_stats.ganador,
    NOW()
  )
  ON CONFLICT (user_id, liga, temporada)
  DO UPDATE SET
    puntos_totales = EXCLUDED.puntos_totales,
    partidos_jugados = EXCLUDED.partidos_jugados,
    aciertos_exactos = EXCLUDED.aciertos_exactos,
    aciertos_ganador_diferencia = EXCLUDED.aciertos_ganador_diferencia,
    aciertos_ganador = EXCLUDED.aciertos_ganador,
    updated_at = NOW();

  -- Actualizar Puntos en Grupos
  -- (Sumamos puntos totales de todas las ligas para grupos, o filtramos? 
  -- Por ahora sumamos todo lo que tenga el usuario en puntuaciones)
  
  -- Calcular puntos totales globales del usuario
  DECLARE
    v_total_global INTEGER;
  BEGIN
    SELECT COALESCE(SUM(puntos), 0) INTO v_total_global
    FROM puntuaciones_prode
    WHERE user_id = NEW.user_id;

    -- Actualizar todos los grupos donde está el usuario
    UPDATE miembros_grupo
    SET puntos_grupo = v_total_global
    WHERE user_id = NEW.user_id;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_update_ranking ON puntuaciones_prode;

CREATE TRIGGER trigger_update_ranking
AFTER INSERT OR UPDATE ON puntuaciones_prode
FOR EACH ROW
EXECUTE FUNCTION update_ranking_stats();
