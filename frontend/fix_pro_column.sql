-- Script para agregar soporte de suscripciones PRO a la tabla perfiles
-- Ejecutar en SQL Editor de Supabase
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pro_since TIMESTAMPTZ;
