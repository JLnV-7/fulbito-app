-- 1. Agregar columna estado si no existe
ALTER TABLE partidos 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'FINALIZADO';

-- 2. Actualizar partidos pasados a FINALIZADO
UPDATE partidos SET estado = 'FINALIZADO' WHERE estado IS NULL;

-- 3. Actualizar 5 partidos para testear PRODE (futuros = PREVIA)
UPDATE partidos
SET 
  fecha_inicio = NOW() + interval '1 day' + (random() * interval '2 days'),
  estado = 'PREVIA',
  goles_local = NULL,
  goles_visitante = NULL
WHERE id IN (
  SELECT id FROM partidos ORDER BY fecha_inicio DESC LIMIT 5
);
