-- Migration to add asistencias column to jugadores_partido_amigo

ALTER TABLE jugadores_partido_amigo 
ADD COLUMN IF NOT EXISTS asistencias INTEGER DEFAULT 0;
