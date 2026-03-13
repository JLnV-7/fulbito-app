import { Suspense } from 'react'
import { fetchPlayerByIdAction } from '@/app/actions/football'
import { supabase } from '@/lib/supabase'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { TeamLogo } from '@/components/TeamLogo'
import { ResenasMVP } from '@/components/jugadores/ResenasMVP'
import { Star, TrendingUp, Calendar, MapPin, Scale, Ruler } from 'lucide-react'
import Link from 'next/link'

interface PlayerPageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params
  const playerId = parseInt(id)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <DesktopNav />
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-20 md:pt-24">
        <Suspense fallback={<PlayerSkeleton />}>
          <PlayerContent playerId={playerId} />
        </Suspense>
      </main>
    </div>
  )
}

async function PlayerContent({ playerId }: { playerId: number }) {
  const playerResponse = await fetchPlayerByIdAction(playerId)
  
  if (!playerResponse) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">👤</p>
        <h2 className="text-xl font-bold">Jugador no encontrado</h2>
        <p className="text-[var(--text-muted)] text-sm mt-2">No pudimos encontrar información para este jugador.</p>
        <Link href="/" className="mt-6 inline-block text-[var(--accent)] font-bold text-sm">Volver al inicio</Link>
      </div>
    )
  }

  const { player, statistics } = playerResponse
  const mainStats = statistics[0] || {}

  // Fetch community ratings from Supabase
  const { data: communityVotes } = await supabase
    .from('votaciones')
    .select('nota, created_at, partido_id')
    .eq('jugador_id', playerId)

  const votes = communityVotes || []
  const avgRating = votes.length > 0 
    ? votes.reduce((acc, v) => acc + v.nota, 0) / votes.length 
    : 0

  return (
    <div className="space-y-6">
      <Link href="javascript:history.back()" className="hidden md:inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors mb-2">
        ← VOLVER
      </Link>

      {/* Header Card */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden relative">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] -mr-32 -mt-32 rounded-full pointer-events-none" />
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center relative z-10">
          {/* Photo */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[var(--background)] rounded-2xl border-2 border-[var(--card-border)] overflow-hidden shadow-xl">
              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
            </div>
            {avgRating > 0 && (
              <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-[#f59e0b] text-white border-4 border-[var(--card-bg)] rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                {avgRating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h1 className="text-3xl font-black tracking-tighter uppercase">{player.name}</h1>
              {mainStats.team?.name && (
                <div className="flex items-center justify-center md:justify-start gap-2 bg-[var(--background)] border border-[var(--card-border)] px-3 py-1 rounded-full">
                  <TeamLogo src={mainStats.team.logo} teamName={mainStats.team.name} size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{mainStats.team.name}</span>
                </div>
              )}
            </div>
            
            <p className="text-[var(--text-muted)] text-sm font-medium mb-6">
              {player.firstname} {player.lastname} • {mapearPosicion(mainStats.games?.position)}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoItem icon={<Calendar size={14}/>} label="Edad" value={`${player.age} años`} />
              <InfoItem icon={<MapPin size={14}/>} label="Nacimiento" value={player.nationality} />
              <InfoItem icon={<Ruler size={14}/>} label="Altura" value={player.height || 'N/A'} />
              <InfoItem icon={<Scale size={14}/>} label="Peso" value={player.weight || 'N/A'} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Community Score */}
        <div className="md:col-span-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#f59e0b]/20 flex items-center justify-center mb-4 relative">
             <Star className="text-[#f59e0b]/10 absolute w-full h-full p-2" />
             <span className="text-3xl font-black text-[#f59e0b] relative z-10">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</span>
          </div>
          <h3 className="font-black text-sm uppercase tracking-widest mb-1">Rating FutLog</h3>
          <p className="text-[10px] text-[var(--text-muted)]">Basado en {votes.length} calificaciones de la comunidad</p>
          
          <div className="mt-6 w-full space-y-3">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight opacity-70">
                <span>Consistencia</span>
                <span>{votes.length > 5 ? 'Alta' : 'Baja'}</span>
             </div>
             <div className="w-full h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min(votes.length * 10, 100)}%` }} />
             </div>
          </div>
        </div>

        {/* Career Stats Summary */}
        <div className="md:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
           <h3 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
             <TrendingUp size={14} className="text-[var(--accent)]" />
             Desempeño en {mainStats.league?.name || 'Temporada Actual'}
           </h3>
           
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
             <StatMini label="Partidos" value={mainStats.games?.appearences || 0} />
             <StatMini label="Goles" value={mainStats.goals?.total || 0} />
             <StatMini label="Asistencias" value={mainStats.goals?.assists || 0} />
             <StatMini label="Amarillas" value={mainStats.cards?.yellow || 0} />
           </div>

           <div className="mt-8 p-4 bg-[var(--background)] border border-[var(--card-border)] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Valor de Mercado (Est.)</p>
                <p className="text-lg font-black tracking-tight">€ {player.id % 5 + 2}M</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</p>
                <p className="text-xs font-bold text-green-500">TITULAR</p>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Matches - Placeholder for now as we'd need to join with Partidos table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <h3 className="font-black text-xs uppercase tracking-widest mb-6">Actividad Reciente</h3>
        {votes.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-xs font-bold uppercase tracking-widest">Sin actividad registrada en FutLog</p>
          </div>
        ) : (
          <div className="space-y-3">
             {votes.slice(0, 5).map((vote, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--card-border)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center font-black text-[#f59e0b] shadow-sm">
                       {vote.nota}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tight">Calificación Global</p>
                      <p className="text-[9px] text-[var(--text-muted)]">{new Date(vote.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link href={`/partido/${vote.partido_id}`} className="text-[9px] font-black text-[var(--accent)] hover:underline uppercase tracking-widest">
                    Ver Partido →
                  </Link>
               </div>
             ))}
          </div>
        )}
      </div>

      <ResenasMVP jugadorId={playerId} jugadorNombre={player.name} />
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)]">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black tracking-tight">{value}</p>
      </div>
    </div>
  )
}

function StatMini({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black tracking-tighter">{value}</p>
      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
    </div>
  )
}

function PlayerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-64 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-40 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]" />
        <div className="md:col-span-2 h-40 bg-[var(--card-bg)] rounded-2xl border border(--card-border)]" />
      </div>
    </div>
  )
}

function mapearPosicion(pos: string | undefined): string {
  if (!pos) return 'Desconocido'
  const mapa: Record<string, string> = {
    'Goalkeeper': 'Arquero',
    'Defender': 'Defensor',
    'Midfielder': 'Mediocampista',
    'Attacker': 'Delantero',
  }
  return mapa[pos] || pos
}
