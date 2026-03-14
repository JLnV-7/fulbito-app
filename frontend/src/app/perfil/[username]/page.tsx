import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProfileClient } from './ProfileClient'

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // 1. Intentar traer perfil por username
  let { data: perfil, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  // 2. Si no lo encuentra por username, intentar por ID (UUID) para no romper links viejos
  if (!perfil) {
    const { data: perfilById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', username) // 'username' aquí es el segemento de la URL, que puede ser un ID
      .single()
    perfil = perfilById
  }

  if (!perfil) notFound()

  // 3. Traer stats (desde la vista materializada)
  const { data: stats } = await supabase
    .from('stats_usuario')
    .select('*')
    .eq('user_id', perfil.id)
    .single()

  // 4. Últimas reseñas del usuario (desde match_logs)
  const { data: resenas } = await supabase
    .from('match_logs')
    .select(`
      id, partido_id, equipo_local, equipo_visitante,
      goles_local, goles_visitante, liga, rating_partido,
      review_text, review_title, created_at, is_spoiler,
      logo_local, logo_visitante, match_type, is_private,
      is_neutral, watched_at, updated_at, user_id,
      player_ratings:match_log_player_ratings(*),
      tags:match_log_tags(tag),
      likes_count:match_log_likes(count),
      profile:profiles!match_logs_user_id_fkey(id, username, avatar_url)
    `)
    .eq('user_id', perfil.id)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // 5. Últimos prodes del usuario
  const { data: prodes } = await supabase
    .from('prodes')
    .select('*')
    .eq('user_id', perfil.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <ProfileClient 
      initialProfile={perfil}
      initialStats={stats}
      initialResenas={resenas || []}
      initialProdes={prodes || []}
    />
  )
}
