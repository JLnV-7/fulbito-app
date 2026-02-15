-- Drop existing recursive policies
DROP POLICY IF EXISTS "Users can view grupos they belong to" ON grupos_prode;
DROP POLICY IF EXISTS "Users can view miembros of their grupos" ON miembros_grupo;

-- Re-create stricter, non-recursive policies

-- 1. Grupos: Users can see groups where they are members OR where they are admin
-- We avoid joining 'miembros_grupo' inside the policy if possible, or use EXISTS which might be better optimized,
-- but the main issue was likely the double recursion.
-- Let's try to break the loop by allowing reading 'miembros_grupo' without checking 'grupos_prode' first?
-- No, 'miembros_grupo' policy depends on 'grupos_prode' usually or vice versa.

-- FIX: Simple policy for members.
-- Users can view rows in miembros_grupo if they are the user in the row OR if they share a group.
-- To avoid recursion, we grant access to see *own* membership unconditionally.
CREATE POLICY "Users can view own membership"
  ON miembros_grupo FOR SELECT
  USING (auth.uid() = user_id);

-- Then for groups:
CREATE POLICY "Users can view groups they belong to"
  ON grupos_prode FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR 
    id IN (SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid())
  );

-- For seeing OTHER members in the group (e.g. leaderboard):
-- We need to check if auth.uid() is in the same group.
-- This requires querying miembros_grupo again.
-- "Show me all members of group G if I am a member of group G"
CREATE POLICY "Users can view members of their groups"
  ON miembros_grupo FOR SELECT
  USING (
    grupo_id IN (
      SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
    )
  );

-- The recursion happens if:
-- Querying 'grupos_prode' -> checks policy -> queries 'miembros_grupo' -> checks policy -> queries 'grupos_prode' (or 'miembros_grupo' again in a way that loops).

-- In the original:
-- grupos_prode policy: id IN (SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid())
-- miembros_grupo policy: grupo_id IN (SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid())

-- When inserting a new group:
-- 1. Insert into grupos_prode (admin_id = me). Policy "Users can create grupos" (CHECK admin_id=me). OK.
-- 2. Insert into miembros_grupo (grupo_id=new_id, user_id=me).
--    If there is a SELECT policy on miembros_grupo involved in the INSERT return or check...
--    The INSERT might be triggering a SELECT to verify something?

-- The error "infinite recursion" often comes from the policy trying to read the table itself.
-- "miembros_grupo" policy queries "miembros_grupo".
-- "grupo_id IN (SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid())"
-- This query on `miembros_grupo` triggers the policy on `miembros_grupo` again! BOOM. Infinite loop.

-- SOLUTION: Use `security_barrier` or separate the lookup to avoid self-reference loop.
-- Or better: A user can see a row in `miembros_grupo` if...
-- It's simpler to just trust the `grupos_prode` visibility? No, we need row level.

-- Standard fix for M2M self-referencing policies:
-- Define a secure function using SECURITY DEFINER that bypasses RLS for the membership check.
-- Or simplify the policy.

CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM miembros_grupo
    WHERE grupo_id = group_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Update policies to use the function (which bypasses RLS, avoiding recursion)

-- Grupos Policy
CREATE POLICY "Users can view groups they belong to v2"
  ON grupos_prode FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR 
    is_group_member(id)
  );

-- Miembros Policy
-- I can see a member row if it's me OR if I'm in the same group
CREATE POLICY "Users can view members of their groups v2"
  ON miembros_grupo FOR SELECT
  USING (
    user_id = auth.uid() -- I can always see myself
    OR
    is_group_member(grupo_id) -- I can see others if I'm in the group
  );
