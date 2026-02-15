-- 1. Drop EVERYTHING related to the problem to start fresh
DROP POLICY IF EXISTS "Users can view grupos they belong to" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view miembros of their grupos" ON miembros_grupo;
DROP POLICY IF EXISTS "Users can view groups they belong to v2" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view members of their groups v2" ON miembros_grupo;
DROP POLICY IF EXISTS "Users can view own membership" ON miembros_grupo;
DROP FUNCTION IF EXISTS is_group_member(uuid);

-- 2. Create the Security Definer function
-- This function runs with the privileges of the creator (postgres/admin), bypassing RLS.
-- This is crucial to break the loop: The policy calls this function -> this function reads the table WITHOUT triggering the policy.
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public -- Secure search path
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

-- 3. Policies for GRUPOS_PRODE

-- SELECT: Admin or Member
CREATE POLICY "ver_grupos"
  ON grupos_prode FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR 
    is_group_member(id)
  );

-- INSERT: Authenticated users can create groups
-- (Already exists usually? "Users can create grupos", ensuring admin_id = uid)
-- Let's reinforce it just in case, but usually INSERT policies don't cause recursion unless they store return values.
DROP POLICY IF EXISTS "Users can create grupos" ON grupos_prode;
CREATE POLICY "crear_grupos"
  ON grupos_prode FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- UPDATE/DELETE: Only Admin
CREATE POLICY "admin_gestionar_grupos"
  ON grupos_prode FOR ALL
  USING (admin_id = auth.uid());


-- 4. Policies for MIEMBROS_GRUPO

-- SELECT: I can see myself OR other members if I am in the group
-- Using the function here refers to the group_id of the row being checked.
-- "Show me this member row IF I am a member of the group this row belongs to"
CREATE POLICY "ver_miembros"
  ON miembros_grupo FOR SELECT
  USING (
    user_id = auth.uid() -- Always see self
    OR
    is_group_member(grupo_id) -- See others if I'm in the group
  );

-- INSERT: I can join a group (usually via code)
-- This is tricky. If I join, I am inserting (me, group_id).
-- The check should verify I am inserting myself.
DROP POLICY IF EXISTS "Users can join grupos" ON miembros_grupo;
CREATE POLICY "unirse_grupos"
  ON miembros_grupo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: I can leave (delete myself) OR Admin can kick me
CREATE POLICY "salir_o_kickear"
  ON miembros_grupo FOR DELETE
  USING (
    user_id = auth.uid() -- I leave
    OR
    EXISTS ( -- Admin kicks
      SELECT 1 FROM grupos_prode WHERE id = miembros_grupo.grupo_id AND admin_id = auth.uid()
    )
  );
