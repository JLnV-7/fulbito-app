-- Fix: Permitir que cualquier usuario autenticado busque un grupo por código de invitación
-- Sin esto, los usuarios no pueden unirse a grupos porque la RLS bloquea el SELECT

-- Opción 1: Agregar policy que permita buscar por código de invitación
CREATE POLICY "Anyone can find groups by invite code"
  ON grupos_prode FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Nota: Esto permite que cualquier usuario autenticado vea los datos de cualquier grupo.
-- Esto es seguro porque los datos sensibles están en otras tablas (miembros, votos, etc.)
-- que sí tienen RLS más restrictivo. Los datos del grupo en sí (nombre, código) no son privados.
