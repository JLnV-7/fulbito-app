-- Habilitar RLS
ALTER TABLE jugadores_partido_amigo ENABLE ROW LEVEL SECURITY;
ALTER TABLE racha_mundial ENABLE ROW LEVEL SECURITY;

-- LIMPIEZA PREVENTIVA
DROP POLICY IF EXISTS "Ver jugadores (grupo)" ON jugadores_partido_amigo;
DROP POLICY IF EXISTS "Gestionar jugadores (grupo)" ON jugadores_partido_amigo;
DROP POLICY IF EXISTS "Ver racha (grupo)" ON racha_mundial;
DROP POLICY IF EXISTS "Gestionar racha (sistema)" ON racha_mundial;

-- 1. JUGADORES PARTIDO
-- Lectura: Todo el grupo
CREATE POLICY "Ver jugadores (grupo)" ON jugadores_partido_amigo FOR SELECT 
USING (
  exists (
    select 1 from partidos_amigos p
    join miembros_grupo m on m.grupo_id = p.grupo_id
    where p.id = jugadores_partido_amigo.partido_amigo_id
    and m.user_id = auth.uid()
  )
);

-- Escritura (Insert/Update/Delete): Todo el grupo 
-- (Idealmente solo creador/admin, pero para simplificar la interacción en el "lobby" dejamos grupo)
CREATE POLICY "Gestionar jugadores (grupo)" ON jugadores_partido_amigo FOR ALL
USING (
  exists (
    select 1 from partidos_amigos p
    join miembros_grupo m on m.grupo_id = p.grupo_id
    where p.id = jugadores_partido_amigo.partido_amigo_id
    and m.user_id = auth.uid()
  )
);

-- 2. RACHA MUNDIAL
-- Lectura: Todo el grupo
CREATE POLICY "Ver racha (grupo)" ON racha_mundial FOR SELECT 
USING (
  exists (
    select 1 from miembros_grupo 
    where miembros_grupo.grupo_id = racha_mundial.grupo_id 
    and miembros_grupo.user_id = auth.uid()
  )
);

-- Escritura: Inicialmente solo el sistema/server action modifica esto, 
-- pero si usamos clientes directos necesitamos permisos.
-- Permitimos lectura/escritura a miembros para simplificar (la lógica pesada está en la RPC igual).
CREATE POLICY "Gestionar racha (grupo)" ON racha_mundial FOR ALL
USING (
  exists (
    select 1 from miembros_grupo 
    where miembros_grupo.grupo_id = racha_mundial.grupo_id 
    and miembros_grupo.user_id = auth.uid()
  )
);
