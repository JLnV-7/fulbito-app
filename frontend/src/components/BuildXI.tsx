'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Save, Trash2, UserPlus, Info } from 'lucide-react'
import html2canvas from 'html2canvas'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PlayerPos {
    id: number
    name: string
    x: number // percent
    y: number // percent
    label: string
}

const TACTICS: Record<string, PlayerPos[]> = {
    '4-3-3': [
        { id: 1, name: '', x: 50, y: 85, label: 'GK' },
        { id: 2, name: '', x: 20, y: 70, label: 'DF' },
        { id: 3, name: '', x: 40, y: 72, label: 'DF' },
        { id: 4, name: '', x: 60, y: 72, label: 'DF' },
        { id: 5, name: '', x: 80, y: 70, label: 'DF' },
        { id: 6, name: '', x: 30, y: 50, label: 'MF' },
        { id: 7, name: '', x: 50, y: 55, label: 'MF' },
        { id: 8, name: '', x: 70, y: 50, label: 'MF' },
        { id: 9, name: '', x: 20, y: 30, label: 'FW' },
        { id: 10, name: '', x: 50, y: 25, label: 'FW' },
        { id: 11, name: '', x: 80, y: 30, label: 'FW' },
    ],
    '4-4-2': [
        { id: 1, name: '', x: 50, y: 85, label: 'GK' },
        { id: 2, name: '', x: 20, y: 70, label: 'DF' },
        { id: 3, name: '', x: 40, y: 72, label: 'DF' },
        { id: 4, name: '', x: 60, y: 72, label: 'DF' },
        { id: 5, name: '', x: 80, y: 70, label: 'DF' },
        { id: 6, name: '', x: 15, y: 50, label: 'MF' },
        { id: 7, name: '', x: 38, y: 50, label: 'MF' },
        { id: 8, name: '', x: 62, y: 50, label: 'MF' },
        { id: 9, name: '', x: 85, y: 50, label: 'MF' },
        { id: 10, name: '', x: 35, y: 25, label: 'FW' },
        { id: 11, name: '', x: 65, y: 25, label: 'FW' },
    ]
}

export function BuildXI() {
    const { user } = useAuth()
    const pitchRef = useRef<HTMLDivElement>(null)
    const [tactic, setTactic] = useState('4-3-3')
    const [players, setPlayers] = useState<PlayerPos[]>(TACTICS['4-3-3'])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [lineupName, setLineupName] = useState('Mi XI Ideal')
    const [exporting, setExporting] = useState(false)
    const [saving, setSaving] = useState(false)

    const handlePlayerNameChange = (id: number, name: string) => {
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p))
    }

    const exportAsImage = async () => {
        if (!pitchRef.current) return
        setExporting(true)
        try {
            const canvas = await html2canvas(pitchRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0a0a'
            })
            const image = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.href = image
            link.download = `futlog-lineup-${Date.now()}.png`
            link.click()
        } catch (err) {
            console.error('Error exporting image:', err)
        } finally {
            setExporting(false)
        }
    }

    const saveLineup = async () => {
        if (!user) return
        setSaving(true)
        try {
            const playersJson: Record<string, string> = {}
            players.forEach(p => playersJson[p.id.toString()] = p.name)

            const { error } = await supabase.from('user_lineups').insert({
                user_id: user.id,
                name: lineupName,
                tactic: tactic,
                players: playersJson
            })

            if (error) throw error

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00A651', '#ffffff', '#ff6b6b']
            })

            alert('✅ ¡Formación guardada con éxito!')
        } catch (err: any) {
            console.error('Error saving lineup:', err)
            alert('Error al guardar: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-20 mt-4">
            {/* Controls */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">
                            NOMBRE DEL EQUIPO
                        </label>
                        <input
                            type="text"
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent)] transition-all"
                            value={lineupName}
                            onChange={(e) => setLineupName(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block">
                                TÁCTICA
                            </label>
                            <div className="flex gap-2">
                                {Object.keys(TACTICS).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setTactic(t)
                                            setPlayers(TACTICS[t])
                                        }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all
                                            ${tactic === t ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)]'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pitch */}
            <div className="relative group">
                <div
                    ref={pitchRef}
                    className="relative aspect-[3/4] w-full bg-[#1a4d1a] rounded-[2rem] overflow-hidden border-4 border-[#2d5a2d] shadow-2xl"
                    style={{
                        backgroundImage: `
                            linear-gradient(to bottom, #1a4d1a 0%, #245e24 100%),
                            repeating-linear-gradient(to bottom, transparent, transparent 10%, rgba(0,0,0,0.05) 10.1%, rgba(0,0,0,0.05) 20%)
                        `
                    }}
                >
                    {/* Pitch Lines */}
                    <div className="absolute inset-4 border-2 border-white/20 rounded-xl pointer-events-none" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/20 pointer-events-none" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/20 pointer-events-none" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full pointer-events-none" />

                    {/* Branding */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none rotate-[-45deg]">
                        <span className="text-6xl font-black text-white italic tracking-tighter">FutLog</span>
                    </div>

                    {/* Players */}
                    {players.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={false}
                            animate={{ left: `${p.x}%`, top: `${p.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20"
                        >
                            <button
                                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-all
                                    ${selectedId === p.id ? 'bg-[#ff6b6b] border-white scale-125' : 'bg-white border-[#1a4d1a] text-[#1a4d1a]'}`}
                            >
                                {selectedId === p.id ? <UserPlus size={18} /> : <span className="text-[10px] font-black">{p.label}</span>}
                            </button>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nombre..."
                                    className={`bg-black/60 backdrop-blur-md text-white border border-white/20 rounded-lg px-2 py-1 text-[10px] w-24 text-center focus:outline-none focus:border-white transition-all
                                        ${p.name ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                    value={p.name}
                                    onChange={(e) => handlePlayerNameChange(p.id, e.target.value)}
                                />
                            </div>
                        </motion.div>
                    ))}

                    <div className="absolute bottom-6 right-6 opacity-30 pointer-events-none flex items-center gap-2">
                        <span className="text-[8px] font-black text-white tracking-widest uppercase">Diseñado en FutLog.app</span>
                    </div>
                </div>

                {/* Floating Hint */}
                <div className="absolute -top-3 -right-3 bg-[var(--accent)] text-white p-2 rounded-full shadow-lg animate-bounce hidden sm:block">
                    <Info size={14} />
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={saveLineup}
                    disabled={saving || !user}
                    className="flex items-center justify-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] font-bold py-4 rounded-3xl hover:bg-[var(--hover-bg)] transition-all shadow-sm"
                >
                    <Save size={18} /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                    onClick={exportAsImage}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 bg-[#00A651] text-white font-bold py-4 rounded-3xl shadow-lg shadow-[#00A651]/20 hover:brightness-110 active:scale-95 transition-all"
                >
                    <Download size={18} /> {exporting ? 'Generando...' : 'Descargar'}
                </button>
            </div>

            {!user && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3 items-center">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs text-amber-500 font-medium">
                        Deberías <a href="/login" className="underline font-bold">iniciar sesión</a> para guardar tu XI ideal en tu perfil.
                    </p>
                </div>
            )}
        </div>
    )
}
