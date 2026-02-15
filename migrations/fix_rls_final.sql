-- RLS RECURSION FIX FINAL
-- Run this in Supabase SQL Editor

-- 1. Clean up ALL existing RLS policies to ensure no conflicts
-- We drop policies by name based on previous versions found in the codebase
DROP POLICY IF EXISTS "Users can view grupos they belong to" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view miembros of their grupos" ON miembros_grupo;
DROP POLICY IF EXISTS "Users can view groups they belong to v2" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view members of their groups v2" ON miembros_grupo;
DROP POLICY IF EXISTS "Users can view own membership" ON miembros_grupo;
DROP POLICY IF EXISTS "ver_mis_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "ver_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "crear_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "admin_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "admin_gestionar_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "public_read_miembros" ON miembros_grupo;
DROP POLICY IF EXISTS "ver_miembros" ON miembros_grupo;
DROP POLICY IF EXISTS "insert_own_miembro" ON miembros_grupo;
DROP POLICY IF EXISTS "delete_own_miembro" ON miembros_grupo;
DROP POLICY IF EXISTS "unirse_grupos" ON miembros_grupo;
DROP POLICY IF EXISTS "salir_o_kickear" ON miembros_grupo;

-- 2. Drop the helper function to recreate it safely
DROP FUNCTION IF EXISTS is_group_member(uuid);

-- 3. Create Security Definer Function
-- This is the key to fixing recursion. It runs with "admin" privileges (BYPASS RLS),
-- so checking membership doesn't trigger the infinite loop of policies.
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM miembros_grupo 
    WHERE grupo_id = group_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Create Policies for GRUPOS_PRODE
ALTER TABLE grupos_prode ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin or Member
CREATE POLICY "select_grupos"
  ON grupos_prode FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR 
    is_group_member(id)
  );

-- INSERT: Anyone authenticated
CREATE POLICY "insert_grupos"
  ON grupos_prode FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- UPDATE/DELETE: Only Admin
CREATE POLICY "admin_grupos"
  ON grupos_prode FOR ALL
  USING (admin_id = auth.uid());


-- 5. Create Policies for MIEMBROS_GRUPO
ALTER TABLE miembros_grupo ENABLE ROW LEVEL SECURITY;

-- SELECT: See self OR see others if we share a group
CREATE POLICY "select_miembros"
  ON miembros_grupo FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    is_group_member(grupo_id)
  );

-- INSERT: Join (self)
CREATE POLICY "insert_miembros"
  ON miembros_grupo FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: Leave (self) or Kick (Group Admin)
CREATE POLICY "delete_miembros"
  ON miembros_grupo FOR DELETE
  USING (
    user_id = auth.uid() -- I leave
    OR
    EXISTS ( -- Admin kicks
      SELECT 1 FROM grupos_prode WHERE id = miembros_grupo.grupo_id AND admin_id = auth.uid()
    )
  );
