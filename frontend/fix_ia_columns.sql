-- Script para agregar soporte de AI Summary a la tabla partidos
-- Ejecutar en SQL Editor de Supabase
ALTER TABLE partidos 
ADD COLUMN IF NOT EXISTS ia_summary TEXT,
ADD COLUMN IF NOT EXISTS ia_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ia_model TEXT DEFAULT 'gpt-4o-mini';
