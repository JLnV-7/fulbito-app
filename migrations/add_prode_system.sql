-- ============================================
-- FASE 1: PRODE CORE - Database Schema
-- ============================================

-- Tabla de pronósticos de usuarios
CREATE TABLE IF NOT EXISTS pronosticos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  
  -- Pronóstico
  goles_local_pronostico INTEGER NOT NULL CHECK (goles_local_pronostico >= 0),
  goles_visitante_pronostico INTEGER NOT NULL CHECK (goles_visitante_pronostico >= 0),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  bloqueado BOOLEAN DEFAULT FALSE, -- Se bloquea al inicio del partido
  
  -- Constraints
  UNIQUE(user_id, partido_id),
  CONSTRAINT valid_goles CHECK (
    goles_local_pronostico >= 0 AND 
    goles_visitante_pronostico >= 0 AND
    goles_local_pronostico <= 20 AND 
    goles_visitante_pronostico <= 20
  )
);

-- Índices para performance
CREATE INDEX idx_pronosticos_user ON pronosticos(user_id);
CREATE INDEX idx_pronosticos_partido ON pronosticos(partido_id);
CREATE INDEX idx_pronosticos_bloqueado ON pronosticos(bloqueado);

-- ============================================
-- Tabla de puntuaciones calculadas
-- ============================================

CREATE TABLE IF NOT EXISTS puntuaciones_prode (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  pronostico_id UUID REFERENCES pronosticos(id) ON DELETE CASCADE,
  
  -- Puntos ganados
  puntos INTEGER DEFAULT 0,
  tipo_acierto VARCHAR(20), -- 'exacto', 'ganador_diferencia', 'ganador', 'ninguno'
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, partido_id)
);

CREATE INDEX idx_puntuaciones_user ON puntuaciones_prode(user_id);
CREATE INDEX idx_puntuaciones_partido ON puntuaciones_prode(partido_id);

-- ============================================
-- Tabla de rankings/tablas de posiciones
-- ============================================

CREATE TABLE IF NOT EXISTS ranking_prode (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Estadísticas generales
  puntos_totales INTEGER DEFAULT 0,
  partidos_jugados INTEGER DEFAULT 0,
  aciertos_exactos INTEGER DEFAULT 0,
  aciertos_ganador_diferencia INTEGER DEFAULT 0,
  aciertos_ganador INTEGER DEFAULT 0,
  
  -- Racha
  racha_actual INTEGER DEFAULT 0,
  mejor_racha INTEGER DEFAULT 0,
  
  -- Por liga/torneo
  liga VARCHAR(100),
  temporada VARCHAR(20) DEFAULT '2024',
  
  -- Metadata
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, liga, temporada)
);

CREATE INDEX idx_ranking_puntos ON ranking_prode(puntos_totales DESC);
CREATE INDEX idx_ranking_user ON ranking_prode(user_id);
CREATE INDEX idx_ranking_liga ON ranking_prode(liga);

-- ============================================
-- Tabla de grupos privados
-- ============================================

CREATE TABLE IF NOT EXISTS grupos_prode (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  
  -- Admin del grupo
  admin_id UUID REFERENCES auth.users(id),
  
  -- Configuración
  codigo_invitacion VARCHAR(20) UNIQUE NOT NULL,
  es_privado BOOLEAN DEFAULT TRUE,
  max_miembros INTEGER DEFAULT 100,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Miembros de grupos
CREATE TABLE IF NOT EXISTS miembros_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID REFERENCES grupos_prode(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Estadísticas del miembro en este grupo
  puntos_grupo INTEGER DEFAULT 0,
  posicion INTEGER,
  
  -- Metadata
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(grupo_id, user_id)
);

CREATE INDEX idx_miembros_grupo ON miembros_grupo(grupo_id);
CREATE INDEX idx_miembros_user ON miembros_grupo(user_id);

-- ============================================
-- Función para calcular puntos
-- ============================================

CREATE OR REPLACE FUNCTION calcular_puntos_pronostico(
  p_pronostico_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_puntos INTEGER := 0;
  v_tipo_acierto VARCHAR(20) := 'ninguno';
  v_goles_local_real INTEGER;
  v_goles_visitante_real INTEGER;
  v_goles_local_prono INTEGER;
  v_goles_visitante_prono INTEGER;
  v_user_id UUID;
  v_partido_id UUID;
BEGIN
  -- Obtener datos del pronóstico y resultado real
  SELECT 
    p.user_id,
    p.partido_id,
    p.goles_local_pronostico,
    p.goles_visitante_pronostico,
    pa.goles_local,
    pa.goles_visitante
  INTO
    v_user_id,
    v_partido_id,
    v_goles_local_prono,
    v_goles_visitante_prono,
    v_goles_local_real,
    v_goles_visitante_real
  FROM pronosticos p
  JOIN partidos pa ON p.partido_id = pa.id
  WHERE p.id = p_pronostico_id;
  
  -- Si el partido no tiene resultado aún, return 0
  IF v_goles_local_real IS NULL OR v_goles_visitante_real IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular puntos según reglas
  -- 1. Resultado exacto: 8 puntos
  IF v_goles_local_prono = v_goles_local_real AND 
     v_goles_visitante_prono = v_goles_visitante_real THEN
    v_puntos := 8;
    v_tipo_acierto := 'exacto';
  
  -- 2. Ganador + diferencia de goles: 5 puntos
  ELSIF (v_goles_local_prono - v_goles_visitante_prono) = 
        (v_goles_local_real - v_goles_visitante_real) AND
        SIGN(v_goles_local_prono - v_goles_visitante_prono) = 
        SIGN(v_goles_local_real - v_goles_visitante_real) THEN
    v_puntos := 5;
    v_tipo_acierto := 'ganador_diferencia';
  
  -- 3. Solo ganador: 3 puntos
  ELSIF SIGN(v_goles_local_prono - v_goles_visitante_prono) = 
        SIGN(v_goles_local_real - v_goles_visitante_real) THEN
    v_puntos := 3;
    v_tipo_acierto := 'ganador';
  
  ELSE
    v_puntos := 0;
    v_tipo_acierto := 'ninguno';
  END IF;
  
  -- Insertar o actualizar puntuación
  INSERT INTO puntuaciones_prode (
    user_id,
    partido_id,
    pronostico_id,
    puntos,
    tipo_acierto
  ) VALUES (
    v_user_id,
    v_partido_id,
    p_pronostico_id,
    v_puntos,
    v_tipo_acierto
  )
  ON CONFLICT (user_id, partido_id) 
  DO UPDATE SET
    puntos = v_puntos,
    tipo_acierto = v_tipo_acierto,
    calculated_at = NOW();
  
  RETURN v_puntos;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger para bloquear pronósticos
-- ============================================

CREATE OR REPLACE FUNCTION bloquear_pronosticos_partido()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el partido cambió a EN_JUEGO, bloquear pronósticos
  IF NEW.estado = 'EN_JUEGO' AND OLD.estado != 'EN_JUEGO' THEN
    UPDATE pronosticos
    SET bloqueado = TRUE
    WHERE partido_id = NEW.id AND bloqueado = FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bloquear_pronosticos
AFTER UPDATE ON partidos
FOR EACH ROW
EXECUTE FUNCTION bloquear_pronosticos_partido();

-- ============================================
-- Trigger para calcular puntos automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION trigger_calcular_puntos()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el partido finalizó, calcular puntos de todos los pronósticos
  IF NEW.estado = 'FINALIZADO' AND 
     NEW.goles_local IS NOT NULL AND 
     NEW.goles_visitante IS NOT NULL THEN
    
    PERFORM calcular_puntos_pronostico(id)
    FROM pronosticos
    WHERE partido_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calcular_puntos
AFTER UPDATE ON partidos
FOR EACH ROW
EXECUTE FUNCTION trigger_calcular_puntos();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE pronosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntuaciones_prode ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_prode ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_prode ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_grupo ENABLE ROW LEVEL SECURITY;

-- Políticas para pronósticos
CREATE POLICY "Users can view all pronosticos"
  ON pronosticos FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own pronosticos"
  ON pronosticos FOR INSERT
  WITH CHECK (auth.uid() = user_id AND bloqueado = FALSE);

CREATE POLICY "Users can update their own pronosticos before blocked"
  ON pronosticos FOR UPDATE
  USING (auth.uid() = user_id AND bloqueado = FALSE);

CREATE POLICY "Users can delete their own pronosticos before blocked"
  ON pronosticos FOR DELETE
  USING (auth.uid() = user_id AND bloqueado = FALSE);

-- Políticas para puntuaciones (solo lectura)
CREATE POLICY "Users can view all puntuaciones"
  ON puntuaciones_prode FOR SELECT
  USING (true);

-- Políticas para ranking (solo lectura)
CREATE POLICY "Users can view ranking"
  ON ranking_prode FOR SELECT
  USING (true);

-- Políticas para grupos
CREATE POLICY "Users can view grupos they belong to"
  ON grupos_prode FOR SELECT
  USING (
    id IN (
      SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
    ) OR admin_id = auth.uid()
  );

CREATE POLICY "Users can create grupos"
  ON grupos_prode FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Políticas para miembros de grupo
CREATE POLICY "Users can view miembros of their grupos"
  ON miembros_grupo FOR SELECT
  USING (
    grupo_id IN (
      SELECT grupo_id FROM miembros_grupo WHERE user_id = auth.uid()
    )
  );
