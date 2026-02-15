-- ============================================
-- PARTIDOS ENTRE AMIGOS - Database Schema
-- ============================================

-- Tabla principal de partidos amateur
CREATE TABLE IF NOT EXISTS partidos_amigos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID REFERENCES grupos_prode(id) ON DELETE CASCADE,
  creado_por UUID REFERENCES auth.users(id),
  
  -- Info del partido
  tipo_partido VARCHAR(2) NOT NULL CHECK (tipo_partido IN ('5','7','8','9','11')),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  cancha VARCHAR(200),
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador','votacion_abierta','finalizado')),
  
  -- Resultado (opcional, lo pone el admin al cerrar)
  resultado_azul INTEGER,
  resultado_rojo INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_partidos_amigos_grupo ON partidos_amigos(grupo_id);
CREATE INDEX idx_partidos_amigos_estado ON partidos_amigos(estado);
CREATE INDEX idx_partidos_amigos_fecha ON partidos_amigos(fecha DESC);

-- ============================================
-- Jugadores cargados por el admin
-- ============================================

CREATE TABLE IF NOT EXISTS jugadores_partido_amigo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_amigo_id UUID REFERENCES partidos_amigos(id) ON DELETE CASCADE,
  
  nombre VARCHAR(100) NOT NULL,
  equipo VARCHAR(4) NOT NULL CHECK (equipo IN ('azul','rojo')),
  orden INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jugadores_partido ON jugadores_partido_amigo(partido_amigo_id);

-- ============================================
-- Votos de los miembros del grupo
-- ============================================

CREATE TABLE IF NOT EXISTS votos_partido_amigo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_amigo_id UUID REFERENCES partidos_amigos(id) ON DELETE CASCADE,
  jugador_id UUID REFERENCES jugadores_partido_amigo(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 10),
  comentario TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Un usuario solo puede votar una vez a cada jugador en cada partido
  UNIQUE(partido_amigo_id, jugador_id, user_id)
);

CREATE INDEX idx_votos_partido ON votos_partido_amigo(partido_amigo_id);
CREATE INDEX idx_votos_jugador ON votos_partido_amigo(jugador_id);
CREATE INDEX idx_votos_user ON votos_partido_amigo(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE partidos_amigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores_partido_amigo ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos_partido_amigo ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTIDOS_AMIGOS policies
-- ============================================

-- Todos los miembros del grupo pueden ver los partidos
CREATE POLICY "Members can view partidos_amigos"
  ON partidos_amigos FOR SELECT
  USING (
    grupo_id IN (
      SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
    )
  );

-- Solo el admin del grupo puede crear partidos
CREATE POLICY "Admin can create partidos_amigos"
  ON partidos_amigos FOR INSERT
  WITH CHECK (
    auth.uid() = creado_por
    AND grupo_id IN (
      SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
    )
  );

-- Solo el admin puede actualizar (cambiar estado, resultado, etc)
CREATE POLICY "Admin can update partidos_amigos"
  ON partidos_amigos FOR UPDATE
  USING (
    grupo_id IN (
      SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
    )
  );

-- Solo el admin puede eliminar
CREATE POLICY "Admin can delete partidos_amigos"
  ON partidos_amigos FOR DELETE
  USING (
    grupo_id IN (
      SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
    )
  );

-- ============================================
-- JUGADORES_PARTIDO_AMIGO policies
-- ============================================

-- Miembros del grupo pueden ver los jugadores
CREATE POLICY "Members can view jugadores"
  ON jugadores_partido_amigo FOR SELECT
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

-- Solo admin puede agregar jugadores
CREATE POLICY "Admin can insert jugadores"
  ON jugadores_partido_amigo FOR INSERT
  WITH CHECK (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
      )
    )
  );

-- Solo admin puede eliminar jugadores
CREATE POLICY "Admin can delete jugadores"
  ON jugadores_partido_amigo FOR DELETE
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT id FROM grupos_prode WHERE admin_id = auth.uid()
      )
    )
  );

-- ============================================
-- VOTOS_PARTIDO_AMIGO policies
-- ============================================

-- Miembros pueden ver todos los votos del partido (para ver resultados)
CREATE POLICY "Members can view votos"
  ON votos_partido_amigo FOR SELECT
  USING (
    partido_amigo_id IN (
      SELECT id FROM partidos_amigos WHERE grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

-- Miembros pueden votar (solo en votación abierta)
CREATE POLICY "Members can insert votos"
  ON votos_partido_amigo FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND partido_amigo_id IN (
      SELECT id FROM partidos_amigos 
      WHERE estado = 'votacion_abierta'
      AND grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );

-- Miembros pueden actualizar su propio voto (solo en votación abierta)
CREATE POLICY "Members can update their votos"
  ON votos_partido_amigo FOR UPDATE
  USING (
    auth.uid() = user_id
    AND partido_amigo_id IN (
      SELECT id FROM partidos_amigos 
      WHERE estado = 'votacion_abierta'
      AND grupo_id IN (
        SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
      )
    )
  );
