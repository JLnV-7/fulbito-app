// src/types/index.ts

// 🎯 Tipos centralizados para toda la app

export interface Partido {
  id: string | number
  liga: string
  equipo_local: string
  equipo_visitante: string
  fecha_inicio: string
  fecha_fin?: string
  estado?: 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO'
  goles_local?: number
  goles_visitante?: number
  logo_local?: string
  logo_visitante?: string
  fixture_id?: number
  created_at?: string
}

export interface Jugador {
  id: number
  nombre: string
  numero: number
  posicion: 'ARQ' | 'DEF' | 'MED' | 'DEL'
  equipo_id: number
  foto_url?: string
}

export interface JugadorFormacion {
  id: number
  name: string
  n: number // número de camiseta
  pos: {
    x: number // posición X en el campo (0-100%)
    y: number // posición Y en el campo (0-100%)
  }
}

export interface Votacion {
  id: number
  user_id: string
  partido_id: string
  jugador_id: number
  nota: number // 1-10
  created_at: string
}

export interface Comentario {
  id: string
  partido_id: string
  user_id: string
  mensaje: string
  created_at: string
  profile?: {
    username: string
    avatar_url?: string
  }
}

export interface Profile {
  id: string
  username: string
  equipo: string
  avatar_url?: string
  created_at: string
}

export interface UserStats {
  partidos_vistos: number
  promedio_general: number
  total_votos: number
}

// 🎯 PRODE System Types

export interface Pronostico {
  id: string
  user_id: string
  partido_id: string
  goles_local_pronostico: number
  goles_visitante_pronostico: number
  created_at: string
  updated_at: string
  bloqueado: boolean

  // Relaciones
  partido?: Partido
  profile?: Profile
}

export interface PuntuacionProde {
  id: string
  user_id: string
  partido_id: string
  pronostico_id: string
  puntos: number
  tipo_acierto: 'exacto' | 'ganador_diferencia' | 'ganador' | 'ninguno'
  calculated_at: string

  // Relaciones
  partido?: Partido
  pronostico?: Pronostico
}

export interface RankingProde {
  id: string
  user_id: string
  puntos_totales: number
  partidos_jugados: number
  aciertos_exactos: number
  aciertos_ganador_diferencia: number
  aciertos_ganador: number
  racha_actual: number
  mejor_racha: number
  liga: string
  temporada: string
  updated_at: string

  // Relaciones
  profile?: Profile
}

export interface GrupoProde {
  id: string
  nombre: string
  descripcion?: string
  admin_id: string
  codigo_invitacion: string
  es_privado: boolean
  max_miembros: number
  created_at: string
  updated_at: string
  mi_posicion?: number
  mi_puntos?: number

  // Relaciones
  admin?: Profile
  miembros?: MiembroGrupo[]
  miembros_count?: number
}

export interface MiembroGrupo {
  id: string
  grupo_id: string
  user_id: string
  puntos_grupo: number
  posicion?: number
  joined_at: string

  // Relaciones
  profile?: Profile
  grupo?: GrupoProde
}

// 🎨 Tipos para UI
import { Liga } from '@/lib/constants'
export type { Liga }

export type EstadoPartido = 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO'

export type TipoAcierto = 'exacto' | 'ganador_diferencia' | 'ganador' | 'ninguno'

export type TipoRanking = 'global' | 'semanal' | 'mensual' | 'grupo'

// 🔧 Tipos de respuesta de Supabase
export interface SupabaseResponse<T> {
  data: T | null
  error: Error | null
}

// 🎯 Helpers de tipos
export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

// 🏆 Tipos para estadísticas de PRODE
export interface StatsProde {
  puntos_totales: number
  partidos_jugados: number
  exactos: number
  ganador_diferencia: number
  ganador: number
  accuracy: number // porcentaje de aciertos
  racha: number
}

// ⚽ Partidos entre Amigos
export type TipoPartidoAmigo = '5' | '7' | '8' | '9' | '11'
export type EstadoPartidoAmigo = 'borrador' | 'votacion_abierta' | 'finalizado'

export interface PartidoAmigo {
  id: string
  grupo_id: string
  creado_por: string
  tipo_partido: TipoPartidoAmigo
  fecha: string
  hora: string
  cancha?: string
  estado: EstadoPartidoAmigo
  resultado_azul?: number
  resultado_rojo?: number
  created_at: string
  updated_at: string

  // Computados
  jugadores_count?: number
  votos_usuarios?: number
  total_miembros?: number
  jugadores?: JugadorPartidoAmigo[]
}

export interface JugadorPartidoAmigo {
  id: string
  partido_amigo_id: string
  nombre: string
  equipo: 'azul' | 'rojo'
  orden: number
  created_at: string

  // Computados
  promedio?: number
  total_votos?: number
  mi_voto?: VotoPartidoAmigo | null
}

export interface VotoPartidoAmigo {
  id: string
  partido_amigo_id: string
  jugador_id: string
  user_id: string
  nota: number
  comentario?: string
  created_at: string

  // Relaciones
  profile?: Profile
}
