-- 1. Tabla para el Sistema de Rachas "Mundial"
create table if not exists racha_mundial (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  grupo_id uuid references grupos_prode(id) not null,
  fase int default 0, -- 0 a 7
  copas int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, grupo_id)
);

-- 2. Modificaciones a jugadores_partido_amigo
alter table jugadores_partido_amigo 
add column if not exists user_id uuid references profiles(id),
add column if not exists goles int default 0;

-- 3. Función para Cerrar Partido y Procesar Rachas
create or replace function cerrar_partido_mundial(
  p_partido_id uuid,
  p_resultado_azul int,
  p_resultado_rojo int
) returns void as $$
declare
  v_ganador text;
  r record;
  v_grupo_id uuid;
begin
  -- Obtener grupo_id una sola vez
  select grupo_id into v_grupo_id from partidos_amigos where id = p_partido_id;

  -- 1. Determinar ganador
  if p_resultado_azul > p_resultado_rojo then
    v_ganador := 'azul';
  elsif p_resultado_rojo > p_resultado_azul then
    v_ganador := 'rojo';
  else
    v_ganador := 'empate';
  end if;

  -- 2. Actualizar estado del partido
  update partidos_amigos
  set 
    estado = 'finalizado',
    resultado_azul = p_resultado_azul,
    resultado_rojo = p_resultado_rojo,
    updated_at = now()
  where id = p_partido_id;

  -- 3. Procesar rachas
  for r in (
    select * from jugadores_partido_amigo 
    where partido_amigo_id = p_partido_id 
    and user_id is not null
  ) loop
    
    -- Inicializar racha si no existe
    insert into racha_mundial (user_id, grupo_id, fase, copas)
    values (r.user_id, v_grupo_id, 0, 0)
    on conflict (user_id, grupo_id) do nothing;

    if v_ganador = 'empate' then
      -- En empate, mantenemos racha (no hacemos nada)
      continue;
    end if;

    if r.equipo = v_ganador then
      -- GANÓ: +1 fase
      update racha_mundial
      set fase = fase + 1
      where user_id = r.user_id and grupo_id = v_grupo_id;

      -- Chequear Copa (Fase >= 7)
      update racha_mundial
      set 
        copas = copas + 1,
        fase = 0
      where user_id = r.user_id 
      and grupo_id = v_grupo_id
      and fase >= 7;

    else
      -- PERDIÓ: Reset a 0
      update racha_mundial
      set fase = 0
      where user_id = r.user_id and grupo_id = v_grupo_id;
    end if;

  end loop;

end;
$$ language plpgsql;
