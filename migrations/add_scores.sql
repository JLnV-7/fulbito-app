-- Agregar columnas de score a la tabla partidos
ALTER TABLE partidos 
ADD COLUMN goles_local INTEGER DEFAULT 0,
ADD COLUMN goles_visitante INTEGER DEFAULT 0;
