-- Seed script for simulating live matches (River vs Boca and Racing vs Independiente)
-- Run this in the Supabase SQL Editor

-- 1. Insert Matches
INSERT INTO partidos (id, equipo_local, equipo_visitante, logo_local, logo_visitante, liga, fecha_inicio, estado, goles_local, goles_visitante)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', 'River Plate', 'Boca Juniors', 'https://media.api-sports.io/football/teams/435.png', 'https://media.api-sports.io/football/teams/451.png', 'Liga Profesional', NOW() - INTERVAL '45 minutes', 'EN_JUEGO', 1, 0),
  ('b2c3d4e5-f6a7-4b5c-9d8e-e2f3a4b5c6d7', 'Racing Club', 'Independiente', 'https://media.api-sports.io/football/teams/434.png', 'https://media.api-sports.io/football/teams/453.png', 'Liga Profesional', NOW() + INTERVAL '2 hours', 'PREVIA', 0, 0)
ON CONFLICT (id) DO UPDATE SET 
  estado = EXCLUDED.estado,
  goles_local = EXCLUDED.goles_local,
  goles_visitante = EXCLUDED.goles_visitante;

-- 2. Insert Polls for those matches (match_id is likely text or uuid)
INSERT INTO chat_polls (match_id, question, created_at)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', '¿Quién fue la figura del primer tiempo?', NOW()),
  ('b2c3d4e5-f6a7-4b5c-9d8e-e2f3a4b5c6d7', '¿Quién gana el clásico de Avellaneda?', NOW())
ON CONFLICT DO NOTHING;

-- 4. Insert Timeline Events for River vs Boca
INSERT INTO match_events (match_id, player_name, event_type, minute, team_id, detail)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', 'Miguel Borja', 'goal', 22, 435, 'Normal Goal'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', 'Nacho Fernández', 'card', 35, 435, 'Yellow Card'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', 'Kevin Zenón', 'card', 40, 451, 'Yellow Card')
ON CONFLICT DO NOTHING;

-- 5. Insert Mock Advanced Stats
INSERT INTO match_stats (match_id, team_id, shots_on_goal, possession, passes, fouls)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', 435, 5, 58, 240, 8),
  ('a1b2c3d4-e5f6-4a5b-8c9d-d1e2f3a4b5c6', 451, 2, 42, 180, 12)
ON CONFLICT DO NOTHING;
