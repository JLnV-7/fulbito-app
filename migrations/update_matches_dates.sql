-- Actualizar 5 partidos antiguos para que sean "futuros"
-- y así poder probar el sistema de pronósticos

UPDATE partidos
SET 
  fecha_inicio = NOW() + interval '1 day' + (random() * interval '2 days'),
  estado = 'PREVIA',
  goles_local = NULL,
  goles_visitante = NULL
WHERE id IN (
  SELECT id FROM partidos ORDER BY fecha_inicio DESC LIMIT 5
);
