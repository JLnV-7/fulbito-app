import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, Trophy, Users, Calendar, ArrowRight, MessageSquare } from 'lucide-react'
import { TeamLogo } from '@/components/TeamLogo'

export default async function PerfilPage({
  params,
}: {
  params: { username: string }
}) {
  const supabase = createClient()

  // Traer perfil
  const { data: perfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!perfil) notFound()

  // Traer stats (desde la vista materializada)
  const { data: stats } = await supabase
    .from('stats_usuario')
    .select('*')
    .eq('user_id', perfil.user_id)
    .single()

  // Últimas reseñas del usuario
  const { data: resenas } = await supabase
    .from('resenas')
    .select('*')
    .eq('user_id', perfil.user_id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Últimos prodes del usuario
  const { data: prodes } = await supabase
    .from('prodes')
    .select('*')
    .eq('user_id', perfil.user_id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <main className="min-h-screen bg-[var(--background)] pb-28 pt-10 md:pt-24 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Cabecera del perfil */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-6 border-b border-[var(--card-border)]/50">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-4xl shadow-2xl border-4 border-[var(--background)] relative overflow-hidden">
            {perfil.avatar_url ? (
              <img src={perfil.avatar_url} alt={perfil.username} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black italic opacity-20">{perfil.username?.[0] || '?'}</span>
            )}
          </div>
          
          <div className="text-center md:text-left space-y-2 flex-1">
            <h1 className="text-[var(--foreground)] text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
              @{perfil.username}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {perfil.equipo_favorito && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                  🏟 {perfil.equipo_favorito}
                </div>
              )}
              {perfil.bio && (
                 <p className="text-[var(--text-muted)] text-sm font-medium w-full md:w-auto">
                   {perfil.bio}
                 </p>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
             <button className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
               Compartir Perfil
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'RESEÑAS', value: stats?.total_resenas ?? 0, icon: <MessageSquare size={14} /> },
            { label: 'PRODES', value: stats?.total_prodes ?? 0, icon: <Trophy size={14} /> },
            { label: '% ACIERTOS', value: `${stats?.porcentaje_aciertos ?? 0}%`, icon: <Star size={14} /> },
            { label: 'RATING PROM.', value: Number(stats?.rating_promedio || 0).toFixed(1), icon: <Star size={14} /> },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-center group hover:border-[var(--accent)]/30 transition-all">
              <div className="flex justify-center mb-2 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                {s.icon}
              </div>
              <p className="text-[var(--foreground)] text-2xl md:text-3xl font-black italic tracking-tighter">{s.value}</p>
              <p className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest mt-1 opacity-50">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Últimas reseñas */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--foreground)] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} /> ÚLTIMAS RESEÑAS
              </h2>
              <div className="h-px flex-1 mx-4 bg-[var(--card-border)] opacity-30"></div>
            </div>
            
            {resenas?.length ? (
              <div className="space-y-4">
                {resenas.map((r) => (
                  <Link key={r.id} href={`/partido/${r.partido_id}`} className="block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:bg-[var(--hover-bg)] transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest opacity-50">
                        Partido #{r.partido_id}
                      </span>
                      {r.rating && (
                        <div className="flex gap-0.5">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    {r.texto && (
                      <p className="text-[var(--foreground)] text-sm font-medium line-clamp-2">"{r.texto}"</p>
                    )}
                    <div className="flex justify-end mt-4">
                       <ArrowRight size={14} className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed rounded-2xl">
                <p className="text-[var(--text-muted)] text-xs font-bold italic tracking-tighter uppercase opacity-30">Todavía no dejó reseñas.</p>
              </div>
            )}
          </section>

          {/* Últimos prodes */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--foreground)] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Trophy size={16} /> ÚLTIMOS PRODES
              </h2>
              <div className="h-px flex-1 mx-4 bg-[var(--card-border)] opacity-30"></div>
            </div>
            
            {prodes?.length ? (
              <div className="space-y-3">
                {prodes.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-4 flex justify-between items-center bg-[var(--card-bg)] border transition-all
                      ${p.acerto ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                                 : 'border-[var(--card-border)]'}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest opacity-50">
                        Match #{p.partido_id}
                      </span>
                      <span className="text-[var(--foreground)] text-sm font-bold">
                        Pronóstico: {p.goles_local} - {p.goles_visitante}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {p.acerto !== null && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                          ${p.acerto ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {p.acerto ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed rounded-2xl">
                <p className="text-[var(--text-muted)] text-xs font-bold italic tracking-tighter uppercase opacity-30">Todavía no hay prodes.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
