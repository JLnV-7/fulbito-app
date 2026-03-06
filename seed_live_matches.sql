-- MASTER BETA SETUP SCRIPT
-- Run this in Supabase SQL Editor to fix missing tables and seed live data

-- 1. Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create chat_polls table if missing
CREATE TABLE IF NOT EXISTS public.chat_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partido_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings: ["Opción A", "Opción B"]
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create chat_poll_votes table if missing
CREATE TABLE IF NOT EXISTS public.chat_poll_votes (
    poll_id UUID REFERENCES public.chat_polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (poll_id, user_id)
);

-- 4. Enable RLS and add basic policies (if not already there)
ALTER TABLE public.chat_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_poll_votes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can see polls') THEN
        CREATE POLICY "Anyone can see polls" ON public.chat_polls FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can see votes') THEN
        CREATE POLICY "Anyone can see votes" ON public.chat_poll_votes FOR SELECT USING (true);
    END IF;
END $$;

-- 3. MOCK MATCHES (Using Simulation IDs for API Fallbacks)
INSERT INTO partidos (id, fixture_id, equipo_local, equipo_visitante, logo_local, logo_visitante, goles_local, goles_visitante, fecha_inicio, estado, liga, temporada)
VALUES 
-- EN JUEGO (Simulado)
('00000000-0000-0000-0000-000000000001', 999901, 'River Plate', 'Boca Juniors', 'https://media.api-sports.io/football/teams/435.png', 'https://media.api-sports.io/football/teams/451.png', 2, 1, NOW() - INTERVAL '45 minutes', 'EN_JUEGO', 'Liga Profesional', 2026),
-- PREVIA (Simulado para hoy más tarde)
('00000000-0000-0000-0000-000000000002', 999902, 'Racing Club', 'Independiente', 'https://media.api-sports.io/football/teams/436.png', 'https://media.api-sports.io/football/teams/438.png', 0, 0, NOW() + INTERVAL '3 hours', 'PREVIA', 'Liga Profesional', 2026),
-- FINALIZADO (Simulado de ayer)
('00000000-0000-0000-0000-000000000003', 999903, 'San Lorenzo', 'Huracán', 'https://media.api-sports.io/football/teams/445.png', 'https://media.api-sports.io/football/teams/448.png', 1, 1, NOW() - INTERVAL '24 hours', 'FINALIZADO', 'Liga Profesional', 2026),
-- PROXIMO (Simulado de mañana)
('00000000-0000-0000-0000-000000000004', 999904, 'Talleres', 'Belgrano', 'https://media.api-sports.io/football/teams/456.png', 'https://media.api-sports.io/football/teams/459.png', 0, 0, NOW() + INTERVAL '24 hours', 'PREVIA', 'Liga Profesional', 2026)
ON CONFLICT (id) DO UPDATE SET
  goles_local = EXCLUDED.goles_local,
  goles_visitante = EXCLUDED.goles_visitante,
  estado = EXCLUDED.estado,
  fecha_inicio = EXCLUDED.fecha_inicio;

-- 6. Insert Live Polls
INSERT INTO chat_polls (partido_id, question, options)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '¿Quién fue la figura del primer tiempo?', '["Miguel Borja", "Nacho F.", "Paulo Díaz", "Otro"]'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '¿Cómo sale el partido?', '["Gana River", "Empate", "Lo da vuelta Boca"]'::jsonb)
ON CONFLICT DO NOTHING;
