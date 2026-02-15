-- RLS NUCLEAR FIX
-- This script dynamically drops ALL policies on the affected tables to ensure no recursive policy remains.

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- 1. Drop ALL policies on 'grupos_prode'
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'grupos_prode' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON grupos_prode';
    END LOOP;

    -- 2. Drop ALL policies on 'miembros_grupo'
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'miembros_grupo' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON miembros_grupo';
    END LOOP;
END $$;

-- 3. Re-create the Security Definer function (Essential to break recursion)
DROP FUNCTION IF EXISTS is_group_member(uuid);

CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This runs as Admin, so it does NOT trigger RLS policies
  RETURN EXISTS (
    SELECT 1 
    FROM miembros_grupo 
    WHERE grupo_id = group_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Re-apply Clean Policies

-- GRUPOS PRODE
ALTER TABLE grupos_prode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_grupos_final"
  ON grupos_prode FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR 
    is_group_member(id)
  );

CREATE POLICY "insert_grupos_final"
  ON grupos_prode FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "admin_grupos_final"
  ON grupos_prode FOR ALL
  USING (admin_id = auth.uid());

-- MIEMBROS GRUPO
ALTER TABLE miembros_grupo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_miembros_final"
  ON miembros_grupo FOR SELECT
  USING (
    user_id = auth.uid() -- See self
    OR 
    is_group_member(grupo_id) -- See others in my groups
  );

CREATE POLICY "insert_miembros_final"
  ON miembros_grupo FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_miembros_final"
  ON miembros_grupo FOR DELETE
  USING (
    user_id = auth.uid() -- Leave
    OR
    EXISTS ( -- Admin kick
      SELECT 1 FROM grupos_prode WHERE id = miembros_grupo.grupo_id AND admin_id = auth.uid()
    )
  );
