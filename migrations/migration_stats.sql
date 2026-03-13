-- Agregar columna asistencias a jugadores_partido_amigo
ALTER TABLE jugadores_partido_amigo 
ADD COLUMN IF NOT EXISTS asistencias INTEGER DEFAULT 0;

-- Actualizar la función de cerrar partido para que acepte asistencias
-- Nota: La función RPC existente 'cerrar_partido_mundial' no recibe los goles/asistencias por parámetro,
-- sino que se actualizan *antes* en la tabla. 
-- Por lo tanto, solo necesitamos asegurar que la tabla tenga la columna.
