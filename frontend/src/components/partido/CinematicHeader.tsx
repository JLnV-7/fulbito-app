'use client'

import { TeamLogo } from '@/components/TeamLogo'
import { CommunityRating } from '@/components/CommunityRating'
import { getTeamColor } from '@/lib/helpers'
import type { Partido, EstadoPartido } from '@/types'

interface CinematicHeaderProps {
    partido: Partido
    estado: EstadoPartido
    equipos: any[]
}

export function CinematicHeader({ partido, estado, equipos }: CinematicHeaderProps) {
    const isLive = estado === 'EN_JUEGO'
    const isFinished = estado === 'FINALIZADO'
    
    // Fallback ID
    const numericId = !isNaN(Number(partido.id)) ? Number(partido.id) : null

    return (
        <div className="relative w-full pb-8 md:pb-12 bg-[#050505] overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {/* Background Texture & Glows */}
            <div className="absolute inset-0 bg-[var(--background)] opacity-50" />
            
            {/* Local Glow */}
            <div 
                className="absolute top-0 left-0 w-1/2 h-full opacity-30 mix-blend-screen blur-[100px]"
                style={{ backgroundColor: getTeamColor(partido.equipo_local) }}
            />
            
            {/* Visitante Glow */}
            <div 
                className="absolute top-0 right-0 w-1/2 h-full opacity-30 mix-blend-screen blur-[100px]"
                style={{ backgroundColor: getTeamColor(partido.equipo_visitante) }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto pt-8 px-6 flex flex-col items-center">
                
                {/* Meta details */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-[10px] font-black tracking-widest uppercase text-white/70 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                        {partido.liga}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md border ${
                        isLive ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' :
                        isFinished ? 'bg-white/5 text-white/50 border-white/10' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                        {estado === 'PREVIA' ? 'Próximo' : estado === 'EN_JUEGO' ? 'EN VIVO' : 'FINALIZADO'}
                    </span>
                </div>

                {/* Scoreboard Layout */}
                <div className="flex items-center justify-between w-full max-w-2xl px-2">
                    {/* Equipo Local */}
                    <div className="flex flex-col items-center flex-1 gap-4 w-[140px]">
                        <div className="relative">
                            <TeamLogo src={partido.logo_local || undefined} teamName={partido.equipo_local} size={100} className="relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] md:w-[120px] md:h-[120px]" />
                        </div>
                        <h3 className="font-black text-lg md:text-xl text-center leading-tight text-white drop-shadow-md">
                            {partido.equipo_local}
                        </h3>
                    </div>

                    {/* Score / VS Center */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-[120px]">
                        {estado === 'PREVIA' ? (
                            <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-lg">
                                <span className="font-black text-2xl text-white/50 italic tracking-tighter">VS</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-3 font-black text-6xl md:text-7xl tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                    <span>{partido.goles_local ?? '-'}</span>
                                    <span className="text-white/30 text-5xl font-light mb-2">-</span>
                                    <span>{partido.goles_visitante ?? '-'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Equipo Visitante */}
                    <div className="flex flex-col items-center flex-1 gap-4 w-[140px]">
                        <div className="relative">
                            <TeamLogo src={partido.logo_visitante || undefined} teamName={partido.equipo_visitante} size={100} className="relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] md:w-[120px] md:h-[120px]" />
                        </div>
                        <h3 className="font-black text-lg md:text-xl text-center leading-tight text-white drop-shadow-md">
                            {partido.equipo_visitante}
                        </h3>
                    </div>
                </div>

                {/* Date & Time if Previa */}
                {estado === 'PREVIA' && partido.fecha_inicio && (
                    <div className="mt-8 text-center text-white/60 text-xs font-bold tracking-widest uppercase">
                        {new Date(partido.fecha_inicio).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}

                {/* Rating Integrado directo en el Header */}
                {isFinished && numericId !== null && (
                    <div className="mt-10 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl w-full max-w-sm">
                        <CommunityRating 
                            partidoId={numericId} 
                            equipoLocal={partido.equipo_local} 
                            equipoVisitante={partido.equipo_visitante} 
                            equipos={equipos} 
                            compact 
                        />
                    </div>
                )}

            </div>
        </div>
    )
}
