-- PARTE 1: Crear tablas e índices
-- Ejecutar primero en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS partidos_amigos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID REFERENCES grupos_prode(id) ON DELETE CASCADE,
  creado_por UUID REFERENCES auth.users(id),
  tipo_partido VARCHAR(2) NOT NULL CHECK (tipo_partido IN ('5','7','8','9','11')),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  cancha VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador','votacion_abierta','finalizado')),
  resultado_azul INTEGER,
  resultado_rojo INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_partidos_amigos_grupo ON partidos_amigos(grupo_id);
CREATE INDEX idx_partidos_amigos_estado ON partidos_amigos(estado);
CREATE INDEX idx_partidos_amigos_fecha ON partidos_amigos(fecha DESC);

CREATE TABLE IF NOT EXISTS jugadores_partido_amigo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_amigo_id UUID REFERENCES partidos_amigos(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  equipo VARCHAR(4) NOT NULL CHECK (equipo IN ('azul','rojo')),
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jugadores_partido ON jugadores_partido_amigo(partido_amigo_id);

CREATE TABLE IF NOT EXISTS votos_partido_amigo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_amigo_id UUID REFERENCES partidos_amigos(id) ON DELETE CASCADE,
  jugador_id UUID REFERENCES jugadores_partido_amigo(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 10),
  comentario TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partido_amigo_id, jugador_id, user_id)
);

CREATE INDEX idx_votos_partido ON votos_partido_amigo(partido_amigo_id);
CREATE INDEX idx_votos_jugador ON votos_partido_amigo(jugador_id);
CREATE INDEX idx_votos_user ON votos_partido_amigo(user_id);
