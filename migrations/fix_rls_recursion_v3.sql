-- RLS FIX V3: SIMPLIFICATION STRATEGY

-- 1. Reset: Drop all potential conflicting policies and functions to be clean
DROP POLICY IF EXISTS "Users can view grupos they belong to" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view miembros of their grupos" ON miembros_grupo;
DROP POLICY IF EXISTS "Users can view groups they belong to v2" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view members of their groups v2" ON miembros_grupo;
DROP POLICY IF EXISTS "Users can view own membership" ON miembros_grupo;
DROP POLICY IF EXISTS "ver_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "ver_miembros" ON miembros_grupo;
DROP POLICY IF EXISTS "crear_grupos" ON grupos_prode;
DROP POLICY IF EXISTS "unirse_grupos" ON miembros_grupo;
DROP FUNCTION IF EXISTS is_group_member(uuid);

-- 2. Helpers
-- We keep the function but make sure it is owned by postgres (implicit in SQL Editor usually)
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple check: Am I in the group?
  RETURN EXISTS (
    SELECT 1 FROM miembros_grupo 
    WHERE grupo_id = group_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- 3. MIEMBROS_GRUPO (The problematic one)
-- To Avoid Recursion: We simplify read access.
-- ALLOW any authenticated user to read the members table.
-- This breaks the loop because checking "Am I a member?" doesn't trigger a complex policy, just checks "Am I logged in?".
CREATE POLICY "public_read_miembros"
  ON miembros_grupo FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/DELETE: Strict
CREATE POLICY "insert_own_miembro"
  ON miembros_grupo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_miembro"
  ON miembros_grupo FOR DELETE
  USING (user_id = auth.uid());


-- 4. GRUPOS_PRODE
-- SELECT: Restrictive (Only see groups I am in or Admin)
-- SAFE NOW: calls is_group_member -> queries miembros_grupo -> hits "public_read_miembros" (TRUE) -> No recursion.
CREATE POLICY "ver_mis_grupos"
  ON grupos_prode FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR 
    is_group_member(id)
  );

-- INSERT: Create group
CREATE POLICY "crear_grupos"
  ON grupos_prode FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- UPDATE/DELETE: Admin only
CREATE POLICY "admin_grupos"
  ON grupos_prode FOR ALL
  USING (admin_id = auth.uid());
