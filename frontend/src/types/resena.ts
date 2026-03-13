export type Resena = {
  id: string
  user_id: string
  partido_id: number
  rating: number | null          // 1–5
  texto: string | null
  mvp_jugador_id: number | null
  mvp_jugador_nombre: string | null
  created_at: string
  updated_at: string
  // relaciones (cuando se hace join o vista)
  usuario?: {
    username: string
    avatar_url: string | null
  }
}

export type ResenaForm = Pick<Resena,
  'rating' | 'texto' | 'mvp_jugador_id' | 'mvp_jugador_nombre'
>
