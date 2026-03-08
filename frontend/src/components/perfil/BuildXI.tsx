'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
// @ts-ignore
import html2canvas from 'html2canvas'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Save, Share2, Users, Download, Trash2 } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Player {
    id: number
    name: string
    position: string
    photo?: string
    team?: string
}

const FORMATIONS = {
    '4-3-3': [
        { id: '1', role: 'POR', pos: { top: '85%', left: '50%' } },
        { id: '2', role: 'DEF', pos: { top: '65%', left: '15%' } },
        { id: '3', role: 'DEF', pos: { top: '70%', left: '38%' } },
        { id: '4', role: 'DEF', pos: { top: '70%', left: '62%' } },
        { id: '5', role: 'DEF', pos: { top: '65%', left: '85%' } },
        { id: '6', role: 'MED', pos: { top: '45%', left: '30%' } },
        { id: '7', role: 'MED', pos: { top: '50%', left: '50%' } },
        { id: '8', role: 'MED', pos: { top: '45%', left: '70%' } },
        { id: '9', role: 'DEL', pos: { top: '20%', left: '30%' } },
        { id: '10', role: 'DEL', pos: { top: '15%', left: '50%' } },
        { id: '11', role: 'DEL', pos: { top: '20%', left: '70%' } },
    ],
    '4-4-2': [
        { id: '1', role: 'POR', pos: { top: '85%', left: '50%' } },
        { id: '2', role: 'DEF', pos: { top: '65%', left: '15%' } },
        { id: '3', role: 'DEF', pos: { top: '70%', left: '38%' } },
        { id: '4', role: 'DEF', pos: { top: '70%', left: '62%' } },
        { id: '5', role: 'DEF', pos: { top: '65%', left: '85%' } },
        { id: '6', role: 'MED', pos: { top: '42%', left: '15%' } },
        { id: '7', role: 'MED', pos: { top: '48%', left: '38%' } },
        { id: '8', role: 'MED', pos: { top: '48%', left: '62%' } },
        { id: '9', role: 'MED', pos: { top: '42%', left: '85%' } },
        { id: '10', role: 'DEL', pos: { top: '20%', left: '35%' } },
        { id: '11', role: 'DEL', pos: { top: '20%', left: '65%' } },
    ]
}

type FormationKey = keyof typeof FORMATIONS

interface SlotProps {
    id: string
    role: string
    pos: { top: string, left: string }
    player?: Player
    onDrop: (item: { player: Player }, slotId: string) => void
    onRemove: (slotId: string) => void
}

const PitchSlot = ({ id, role, pos, player, onDrop, onRemove }: SlotProps) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'player',
        canDrop: (item: { player: Player }) => {
            // Very basic validation, could be improved
            return true
        },
        drop: (item: { player: Player }) => onDrop(item, id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop()
        })
    }))

    return (
        <div
            ref={drop as any}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-16 sm:w-16 sm:h-18 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer z-10
                ${isOver ? 'bg-[#10b981]/40 border-2 border-[#10b981] scale-110' : canDrop ? 'bg-white/10 border-2 border-white/30 border-dashed' : ''}
                ${!canDrop && !isOver && !player ? 'bg-black/30 border border-white/20 hover:bg-black/40' : ''}
            `}
            style={{ top: pos.top, left: pos.left }}
        >
            {player ? (
                <div className="relative group w-full h-full flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#10b981] flex items-center justify-center overflow-hidden mb-1">
                        {player.photo ? (
                            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-xs font-bold">{role}</span>
                        )}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white whitespace-nowrap bg-black/60 px-1 rounded truncate max-w-[120%]">
                        {player.name}
                    </span>
                    <button
                        onClick={() => onRemove(id)}
                        className="absolute -top-2 -right-2 bg-[#ff6b6b] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
            ) : (
                <span className="text-white/50 text-[10px] font-bold tracking-widest">{role}</span>
            )}
        </div>
    )
}

const PlayerDraggableItem = ({ player }: { player: Player }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'player',
        item: { player },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging()
        })
    }))

    return (
        <div
            ref={drag as any}
            className={`flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl cursor-grab active:cursor-grabbing hover:bg-[var(--hover-bg)] transition-colors
                ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
            `}
        >
            <div className="w-10 h-10 rounded-full bg-slate-800 1-0 overflow-hidden flex items-center justify-center shrink-0">
                {player.photo ? (
                    <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white text-xs font-bold">{player.position}</span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{player.name}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#10b981]">{player.position}</span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate">{player.team}</span>
                </div>
            </div>
            <div className="shrink-0 text-[10px] bg-[var(--background)] px-2 py-1 rounded-md text-[var(--text-muted)] border border-[var(--card-border)]">
                Arrastrar
            </div>
        </div>
    )
}

export function BuildXI() {
    const { user } = useAuth()
    const pitchRef = useRef<HTMLDivElement>(null)
    const [formation, setFormation] = useState<FormationKey>('4-3-3')
    const [lineup, setLineup] = useState<Record<string, Player>>({})
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [suggestedPlayers, setSuggestedPlayers] = useState<Player[]>([])

    useEffect(() => {
        // En una app real, acá buscamos en user_votaciones los players más votados
        // y generamos estas sugerencias dinámicas usando Supabase.
        const mockSuggested: Player[] = [
            { id: 101, name: 'Dibu Martínez', position: 'POR', team: 'Aston Villa' },
            { id: 102, name: 'Cuti Romero', position: 'DEF', team: 'Tottenham' },
            { id: 103, name: 'L. Martínez', position: 'DEF', team: 'Man United' },
            { id: 104, name: 'E. Fernández', position: 'MED', team: 'Chelsea' },
            { id: 105, name: 'A. Mac Allister', position: 'MED', team: 'Liverpool' },
            { id: 106, name: 'L. Messi', position: 'DEL', team: 'Inter Miami' },
            { id: 107, name: 'J. Álvarez', position: 'DEL', team: 'Man City' },
            { id: 108, name: 'A. Di María', position: 'MED', team: 'Benfica' },
        ]
        setSuggestedPlayers(mockSuggested)
    }, [])

    const handleDrop = (item: { player: Player }, slotId: string) => {
        setLineup(prev => ({
            ...prev,
            [slotId]: item.player
        }))
    }

    const handleRemove = (slotId: string) => {
        setLineup(prev => {
            const next = { ...prev }
            delete next[slotId]
            return next
        })
    }

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        try {
            const payload = Object.values(lineup)
            await supabase.from('user_lineups').insert({
                user_id: user.id,
                formation: formation,
                players: payload
            })
            setSaved(true)
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#fbbf24']
            })
            setTimeout(() => setSaved(false), 3000)
        } catch (e) {
            console.error('Error saving lineup:', e)
        } finally {
            setSaving(false)
        }
    }

    const handleShare = async () => {
        if (!pitchRef.current) return
        try {
            const canvas = await html2canvas(pitchRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#0a0e17'
            })
            const dataUrl = canvas.toDataURL('image/png')

            // Si el browser lo soporta, abrimos el share native api con el blob
            if (navigator.share && navigator.canShare) {
                const blob = await (await fetch(dataUrl)).blob()
                const file = new File([blob], 'futlog-dreamteam.png', { type: 'image/png' })
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Mi XI Ideal',
                        text: '¡Mirá mi XI Ideal armado en FutLog! ⚽🔥',
                        files: [file]
                    })
                    return
                }
            }

            // Fallback: Descargar
            const a = document.createElement('a')
            a.href = dataUrl
            a.download = 'futlog-dreamteam.png'
            a.click()
        } catch (e) {
            console.error('Error sharing image:', e)
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-[var(--background)] min-h-[500px]">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Pitch Section */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-lg flex items-center gap-2">
                                <Users size={18} className="text-[#10b981]" />
                                Tu XI Ideal
                            </h3>
                            <div className="flex items-center gap-2">
                                <select
                                    className="bg-[var(--card-bg)] border border-[var(--card-border)] text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                                    value={formation}
                                    onChange={(e) => setFormation(e.target.value as FormationKey)}
                                >
                                    <option value="4-3-3">4-3-3</option>
                                    <option value="4-4-2">4-4-2</option>
                                </select>
                            </div>
                        </div>

                        {/* Cancha */}
                        <div
                            ref={pitchRef}
                            className="relative w-full aspect-[2/3] sm:aspect-[3/4] max-w-lg mx-auto bg-green-800 rounded-xl overflow-hidden border-4 border-green-900 shadow-2xl"
                            style={{
                                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0.05) 20%)`
                            }}
                        >
                            {/* Líneas de la cancha (decorativo) */}
                            <div className="absolute inset-4 border border-white/40" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/3 h-[15%] border border-t-0 border-white/40" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/3 h-[15%] border border-b-0 border-white/40" />
                            <div className="absolute top-1/2 left-4 right-4 h-px bg-white/40 -translate-y-1/2" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/40" />

                            {/* Watermark for Share */}
                            <div className="absolute bottom-2 left-6 text-white/30 text-[10px] font-black tracking-widest pointer-events-none">
                                FUTLOG APP
                            </div>

                            {/* Slots de Jugadores */}
                            {FORMATIONS[formation].map((posInfo) => (
                                <PitchSlot
                                    key={posInfo.id}
                                    id={posInfo.id}
                                    role={posInfo.role}
                                    pos={posInfo.pos}
                                    player={lineup[posInfo.id]}
                                    onDrop={handleDrop}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>

                        {/* Botonera Guardar/Compartir */}
                        <div className="mt-6 flex items-center justify-between gap-4 max-w-lg mx-auto">
                            <button
                                onClick={handleSave}
                                disabled={saving || Object.keys(lineup).length === 0}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all
                                    ${saved ? 'bg-[#10b981] text-white' : 'bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white'}
                                    disabled:opacity-50 disabled:cursor-not-allowed border border-[#10b981]/30
                                `}
                            >
                                <Save size={18} />
                                {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar XI'}
                            </button>
                            <button
                                onClick={handleShare}
                                disabled={Object.keys(lineup).length === 0}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl font-bold hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Share2 size={18} />
                                Compartir
                            </button>
                        </div>
                    </div>

                    {/* Players Selector Sidebar */}
                    <div className="w-full lg:w-72 flex flex-col pt-2 lg:pt-11">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 flex-1">
                            <h4 className="text-sm font-bold mb-1">Recomendados</h4>
                            <p className="text-[10px] text-[var(--text-muted)] mb-4">
                                Jugadores que más has votado
                            </p>

                            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto no-scrollbar pb-4 pr-1">
                                {suggestedPlayers.map(p => (
                                    <PlayerDraggableItem key={p.id} player={p} />
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                                <button className="w-full py-2 text-xs font-bold text-[var(--text-muted)] border border-dashed border-[var(--card-border)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
                                    + Buscar más jugadores
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DndProvider>
    )
}
