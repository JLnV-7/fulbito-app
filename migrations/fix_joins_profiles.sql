-- Arreglar relaciones para que PostgREST pueda hacer JOINS con profiles
-- Estas tablas actualmente apuntan a auth.users, lo que dificulta el join desde el frontend

-- 1. Asegurar que ranking_prode pueda unirse con profiles
ALTER TABLE ranking_prode 
DROP CONSTRAINT IF EXISTS ranking_prode_user_id_fkey,
ADD CONSTRAINT ranking_prode_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Asegurar que pronosticos pueda unirse con profiles (para el historial)
ALTER TABLE pronosticos 
DROP CONSTRAINT IF EXISTS pronosticos_user_id_fkey,
ADD CONSTRAINT pronosticos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Asegurar que miembros_grupo pueda unirse con profiles
ALTER TABLE miembros_grupo 
DROP CONSTRAINT IF EXISTS miembros_grupo_user_id_fkey,
ADD CONSTRAINT miembros_grupo_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Notificar a PostgREST que recargue el esquema (esto pasa solo al migrar, pero por las dudas)
NOTIFY pgrst, 'reload schema';
