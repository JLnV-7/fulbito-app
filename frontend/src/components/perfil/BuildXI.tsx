'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { toPng } from 'html-to-image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Save, Share2, Users, Download, Trash2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { hapticFeedback } from '@/lib/helpers'
import { useToast } from '@/contexts/ToastContext'

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
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-16 sm:w-16 sm:h-20 flex flex-col items-center justify-center transition-all cursor-pointer z-10
                ${isOver ? 'scale-110' : ''}
            `}
            style={{ top: pos.top, left: pos.left }}
        >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-lg
                ${player ? 'border-[var(--accent)] bg-[var(--card-bg)]' : isOver ? 'border-[#10b981] bg-[#10b981]/20' : 'border-white/30 bg-black/20 backdrop-blur-sm'}
            `}>
                {player ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                        {player.photo ? (
                            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white text-xs font-bold capitalize italic">
                                {player.name.charAt(0)}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-[10px] font-black text-white/50">{role}</span>
                )}
            </div>

            {player && (
                <div className="mt-1 flex flex-col items-center">
                    <span className="text-[9px] sm:text-[10px] font-black capitalize tracking-tighter text-white whitespace-nowrap bg-black/60 px-2 py-0.5 rounded-full shadow-sm max-w-[80px] truncate">
                        {player.name}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                        className="mt-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
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
            className={`flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl cursor-grab transition-all shadow-sm
                ${isDragging ? 'opacity-50 scale-95' : 'hover:border-[var(--accent)] hover:shadow-md'}
            `}
        >
            <div className="w-10 h-10 rounded-full bg-[var(--background)] overflow-hidden flex items-center justify-center border border-[var(--card-border)]">
                {player.photo ? (
                    <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[var(--text-muted)] text-xs font-bold capitalize italic">{player.position}</span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{player.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] capitalize font-medium">{player.team}</p>
            </div>
        </div>
    )
}

export function BuildXI() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const pitchRef = useRef<HTMLDivElement>(null)
    const [formation, setFormation] = useState<FormationKey>('4-3-3')
    const [lineup, setLineup] = useState<Record<string, Player>>({})
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [suggestedPlayers, setSuggestedPlayers] = useState<Player[]>([])
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

    useEffect(() => {
        const mockSuggested: Player[] = [
            { id: 101, name: 'Dibu Martínez', position: 'POR', team: 'Argentina' },
            { id: 102, name: 'Cuti Romero', position: 'DEF', team: 'Argentina' },
            { id: 103, name: 'L. Martínez', position: 'DEF', team: 'Argentina' },
            { id: 104, name: 'E. Fernández', position: 'MED', team: 'Argentina' },
            { id: 105, name: 'A. Mac Allister', position: 'MED', team: 'Argentina' },
            { id: 106, name: 'L. Messi', position: 'DEL', team: 'Argentina' },
            { id: 107, name: 'J. Álvarez', position: 'DEL', team: 'Argentina' },
            { id: 108, name: 'A. Di María', position: 'MED', team: 'Argentina' },
        ]
        setSuggestedPlayers(mockSuggested)
        // Load from local storage if exists
        if (user) {
            const saved = localStorage.getItem(`futlog_lineup_${user.id}`)
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (parsed.formation) setFormation(parsed.formation)
                    if (parsed.players && Array.isArray(parsed.players)) {
                        const newMap: Record<string, Player> = {}
                        parsed.players.forEach((p: Player, idx: number) => {
                            // Assign back to slots safely
                            const slotsStr = Object.keys(FORMATIONS[parsed.formation as FormationKey] || FORMATIONS['4-3-3']).map(String)
                            if (slotsStr[idx]) {
                                newMap[slotsStr[idx]] = p
                            }
                        })
                        setLineup(newMap)
                    }
                } catch (e) {
                    console.error('Error loading local lineup', e)
                }
            }
        }
    }, [user])

    const handleDrop = (item: { player: Player }, slotId: string) => {
        hapticFeedback(10)
        setLineup(prev => ({
            ...prev,
            [slotId]: item.player
        }))
    }

    const handleRemove = (slotId: string) => {
        hapticFeedback(5)
        setLineup(prev => {
            const next = { ...prev }
            delete next[slotId]
            return next
        })
    }

    // Mobile tap-to-assign: tap player in sidebar, then tap a slot
    const handleSlotTap = (slotId: string) => {
        if (selectedPlayer) {
            hapticFeedback(10)
            setLineup(prev => ({ ...prev, [slotId]: selectedPlayer }))
            setSelectedPlayer(null)
        }
    }

    const handlePlayerTap = (player: Player) => {
        hapticFeedback(5)
        setSelectedPlayer(prev => prev?.id === player.id ? null : player)
    }

    const handleSave = async () => {
        if (!user) {
            showToast('Iniciá sesión para guardar tu XI', 'error')
            return
        }
        if (Object.keys(lineup).length === 0) {
            showToast('Agregá al menos un jugador', 'error')
            return
        }
        setSaving(true)
        try {
            const payload = Object.values(lineup)
            const { error } = await supabase.from('user_lineups').upsert({
                user_id: user.id,
                formation: formation,
                players: payload
            }, { onConflict: 'user_id' })

            if (error) {
                console.warn('Supabase error, falling back to local storage:', error)
            }
            // Save to localStorage as reliable fallback for now
            localStorage.setItem(`futlog_lineup_${user.id}`, JSON.stringify({ formation, players: payload }))

            setSaved(true)
            showToast('¡XI Ideal guardado! ⚽', 'success')
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#10b981']
            })
            setTimeout(() => setSaved(false), 3000)
        } catch (e) {
            console.error('Error saving lineup:', e)
            showToast('No se pudo guardar el XI', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleShare = async () => {
        if (!pitchRef.current) {
            showToast('Error al capturar la cancha', 'error')
            return
        }
        setSaving(true)
        try {
            const watermark = pitchRef.current.querySelector('.watermark-hidden') as HTMLElement
            if (watermark) watermark.style.display = 'flex'

            const dataUrl = await toPng(pitchRef.current, {
                pixelRatio: 2,
                backgroundColor: '#10b981',
                style: { margin: '0' }
            })

            if (watermark) watermark.style.display = 'none'

            const response = await fetch(dataUrl)
            const blob = await response.blob()
            const file = new File([blob], 'futlog-xi.png', { type: 'image/png' })

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Mi XI Ideal',
                    text: '¡Mirá el Dream Team que armé en FutLog! ⚽🔥',
                    files: [file]
                })
            } else {
                const link = document.createElement('a')
                link.href = dataUrl
                link.download = 'futlog-xi.png'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                showToast('Imagen descargada ✅', 'success')
            }
        } catch (e: any) {
            console.error('Error sharing lineup:', e)
            if (e?.name !== 'AbortError') {
                showToast('Error al generar la imagen (posible CORS)', 'error')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-[var(--background)]">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Pitch Section */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black italic tracking-tighter capitalize">Tu XI Ideal</h3>
                                <p className="text-xs text-[var(--text-muted)] font-medium">Armá tu equipo de ensueño</p>
                            </div>
                            <select
                                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full px-4 py-2 text-sm font-bold focus:outline-none shadow-sm transition-all"
                                value={formation}
                                onChange={(e) => setFormation(e.target.value as FormationKey)}
                            >
                                <option value="4-3-3">4-3-3</option>
                                <option value="4-4-2">4-4-2</option>
                            </select>
                        </div>

                        {/* Cancha */}
                        <div
                            ref={pitchRef}
                            className="relative w-full aspect-[2/3] max-w-lg mx-auto bg-[#10b981] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white/10"
                            style={{
                                backgroundImage: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%), 
                                                repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.05) 10%, rgba(255,255,255,0.05) 20%)`
                            }}
                        >
                            {/* Líneas de la cancha */}
                            <div className="absolute inset-6 border-2 border-white/30 rounded-lg pointer-events-none" />
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1/2 h-[18%] border-2 border-t-0 border-white/30 pointer-events-none" />
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1/2 h-[18%] border-2 border-b-0 border-white/30 pointer-events-none" />
                            <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-white/30 -translate-y-1/2 pointer-events-none" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/30 pointer-events-none" />

                            {/* Watermark */}
                            <div className="hidden absolute bottom-4 left-0 right-0 justify-center watermark-hidden pointer-events-none">
                                <span className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] text-white italic">FUTLOG.APP</span>
                            </div>

                            {/* Slots */}
                            {FORMATIONS[formation].map((posInfo) => (
                                <div key={posInfo.id} onClick={() => handleSlotTap(posInfo.id)}>
                                    <PitchSlot
                                        id={posInfo.id}
                                        role={posInfo.role}
                                        pos={posInfo.pos}
                                        player={lineup[posInfo.id]}
                                        onDrop={handleDrop}
                                        onRemove={handleRemove}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-3 max-w-lg mx-auto">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={saving || Object.keys(lineup).length === 0}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-black capitalize tracking-wider text-[10px] shadow-sm transition-all border
                                    ${saved ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]' : 'bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--hover-bg)]'}
                                    disabled:opacity-40
                                `}
                            >
                                <Save size={14} />
                                {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleShare}
                                disabled={Object.keys(lineup).length === 0}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full font-black capitalize tracking-wider text-[10px] shadow-sm hover:bg-[var(--hover-bg)] transition-all disabled:opacity-40"
                            >
                                <Download size={14} />
                                Descargar
                            </motion.button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-80 space-y-6">
                        {selectedPlayer && (
                            <div className="bg-[var(--foreground)] text-[var(--background)] px-4 py-2.5 rounded-full text-center text-[10px] font-black capitalize tracking-tight">
                                ✅ Tocá una posición en la cancha para asignar a {selectedPlayer.name}
                            </div>
                        )}
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                            <h4 className="font-black italic capitalize tracking-tighter mb-4">Recomendados</h4>
                            <p className="text-[9px] text-[var(--text-muted)] font-bold capitalize tracking-tight mb-3">Arrastrá o tocá un jugador para seleccionarlo</p>
                            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                                {suggestedPlayers.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handlePlayerTap(p)}
                                        className={`cursor-pointer rounded-2xl transition-all ${selectedPlayer?.id === p.id ? 'ring-2 ring-[var(--foreground)] scale-[1.02]' : ''}`}
                                    >
                                        <PlayerDraggableItem player={p} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DndProvider>
    )
}
