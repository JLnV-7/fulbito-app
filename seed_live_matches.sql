-- Seed script for simulating live matches (River vs Boca and Racing vs Independiente)
-- Run this in the Supabase SQL Editor

-- 1. Insert Matches
INSERT INTO partidos (id, equipo_local, equipo_visitante, logo_local, logo_visitante, liga, fecha_inicio, estado, goles_local, goles_visitante)
VALUES 
  (999901, 'River Plate', 'Boca Juniors', 'https://media.api-sports.io/football/teams/435.png', 'https://media.api-sports.io/football/teams/451.png', 'Liga Profesional', NOW() - INTERVAL '45 minutes', 'EN_JUEGO', 1, 0),
  (999902, 'Racing Club', 'Independiente', 'https://media.api-sports.io/football/teams/434.png', 'https://media.api-sports.io/football/teams/453.png', 'Liga Profesional', NOW() + INTERVAL '2 hours', 'PREVIA', 0, 0)
ON CONFLICT (id) DO UPDATE SET 
  estado = EXCLUDED.estado,
  goles_local = EXCLUDED.goles_local,
  goles_visitante = EXCLUDED.goles_visitante;

-- 2. Insert Polls for those matches
INSERT INTO chat_polls (match_id, question, created_at)
VALUES 
  (999901, '¿Quién fue la figura del primer tiempo?', NOW()),
  (999902, '¿Quién gana el clásico de Avellaneda?', NOW())
ON CONFLICT DO NOTHING;

-- 3. Insert Poll Options (Mocked for existing polls)
-- Requires manual ID handling or checking created IDs, 
-- ideally the app handles Creation. This is just for context.

-- 4. Insert Timeline Events for River vs Boca
INSERT INTO match_events (match_id, player_name, event_type, minute, team_id, detail)
VALUES 
  (999901, 'Miguel Borja', 'goal', 22, 435, 'Normal Goal'),
  (999901, 'Nacho Fernández', 'card', 35, 435, 'Yellow Card'),
  (999901, 'Kevin Zenón', 'card', 40, 451, 'Yellow Card')
ON CONFLICT DO NOTHING;

-- 5. Insert Mock Advanced Stats
-- (Assuming tables exist from previous sessions)
INSERT INTO match_stats (match_id, team_id, shots_on_goal, possession, passes, fouls)
VALUES 
  (999901, 435, 5, 58, 240, 8),
  (999901, 451, 2, 42, 180, 12)
ON CONFLICT DO NOTHING;
