-- Índices de rendimiento para FutLog
-- Ejecutar en el SQL Editor de Supabase

-- Índice más importante: partidos_amigos por grupo y fecha
CREATE INDEX IF NOT EXISTS idx_partidos_amigos_grupo_fecha
    ON partidos_amigos(grupo_id, fecha DESC);

-- Votos por partido (se consulta mucho en TabVotos)
CREATE INDEX IF NOT EXISTS idx_votos_partido_amigo_partido
    ON votos_partido_amigo(partido_amigo_id);

-- Jugadores por partido
CREATE INDEX IF NOT EXISTS idx_jugadores_partido_amigo_partido
    ON jugadores_partido_amigo(partido_amigo_id, equipo, orden);

-- Match logs por usuario y fecha (feed, perfil)
CREATE INDEX IF NOT EXISTS idx_match_logs_user_created
    ON match_logs(user_id, created_at DESC);

-- Match logs públicos por fecha (feed global)
CREATE INDEX IF NOT EXISTS idx_match_logs_public_feed
    ON match_logs(is_private, created_at DESC)
    WHERE is_private = false;

-- Player ratings por match_log
CREATE INDEX IF NOT EXISTS idx_match_log_player_ratings_log
    ON match_log_player_ratings(match_log_id);

-- Facet votes por partido
CREATE INDEX IF NOT EXISTS idx_facet_votes_partido
    ON facet_votes(partido_amigo_id);
