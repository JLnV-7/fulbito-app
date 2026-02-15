-- Habilitar RLS
ALTER TABLE partidos_amigos ENABLE ROW LEVEL SECURITY;

-- 1. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Ver partidos del grupo" ON partidos_amigos;
DROP POLICY IF EXISTS "Crear partidos (solo grupo)" ON partidos_amigos;
DROP POLICY IF EXISTS "Modificar partidos (admin/creador)" ON partidos_amigos;
DROP POLICY IF EXISTS "Eliminar partidos (admin/creador)" ON partidos_amigos;

-- Políticas anteriores que podrían existir con otros nombres (limpieza preventiva)
DROP POLICY IF EXISTS "Enable read access for group members" ON partidos_amigos;
DROP POLICY IF EXISTS "Enable insert for group admins" ON partidos_amigos;
DROP POLICY IF EXISTS "Enable update for group admins" ON partidos_amigos;
DROP POLICY IF EXISTS "Enable delete for group admins" ON partidos_amigos;

-- 2. POLÍTICA DE LECTURA (SELECT)
-- Cualquier miembro del grupo puede ver los partidos
CREATE POLICY "Ver partidos del grupo" 
ON partidos_amigos FOR SELECT 
USING (
  exists (
    select 1 from miembros_grupo 
    where miembros_grupo.grupo_id = partidos_amigos.grupo_id 
    and miembros_grupo.user_id = auth.uid()
  )
);

-- 3. POLÍTICA DE CREACIÓN (INSERT)
-- Cualquier miembro del grupo puede crear partidos
CREATE POLICY "Crear partidos (solo grupo)" 
ON partidos_amigos FOR INSERT 
WITH CHECK (
  exists (
    select 1 from miembros_grupo 
    where miembros_grupo.grupo_id = partidos_amigos.grupo_id 
    and miembros_grupo.user_id = auth.uid()
  )
);

-- 4. POLÍTICA DE MODIFICACIÓN (UPDATE)
-- Solo el creador del partido O el admin del grupo pueden modificar
CREATE POLICY "Modificar partidos (admin/creador)" 
ON partidos_amigos FOR UPDATE 
USING (
  auth.uid() = creado_por 
  OR 
  exists (
    select 1 from grupos_prode 
    where grupos_prode.id = partidos_amigos.grupo_id 
    and grupos_prode.admin_id = auth.uid()
  )
);

-- 5. POLÍTICA DE ELIMINACIÓN (DELETE)
-- Solo el creador del partido O el admin del grupo pueden eliminar
CREATE POLICY "Eliminar partidos (admin/creador)" 
ON partidos_amigos FOR DELETE 
USING (
  auth.uid() = creado_por 
  OR 
  exists (
    select 1 from grupos_prode 
    where grupos_prode.id = partidos_amigos.grupo_id 
    and grupos_prode.admin_id = auth.uid()
  )
);
