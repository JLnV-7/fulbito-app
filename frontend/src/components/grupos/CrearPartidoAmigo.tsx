// src/components/grupos/CrearPartidoAmigo.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { CanchaSeleccion } from './CanchaSeleccion'
import { Formacion } from '@/lib/formaciones'
import type { TipoPartidoAmigo, JugadorPartidoAmigo } from '@/types'

interface CrearPartidoAmigoProps {
    grupoId: string
    onClose: () => void
    onCreated: () => void
}

const TIPOS_PARTIDO: { value: TipoPartidoAmigo; label: string; jugadores: number }[] = [
    { value: '5', label: 'Fútbol 5', jugadores: 10 },
    { value: '7', label: 'Fútbol 7', jugadores: 14 },
    { value: '8', label: 'Fútbol 8', jugadores: 16 },
    { value: '9', label: 'Fútbol 9', jugadores: 18 },
    { value: '11', label: 'Fútbol 11', jugadores: 22 },
]

export function CrearPartidoAmigo({ grupoId, onClose, onCreated }: CrearPartidoAmigoProps) {
    const { crearPartido, agregarJugador, eliminarJugador, abrirVotacion } = usePartidosAmigos(grupoId)
    const { showToast } = useToast()

    // Step 1 state
    const [paso, setPaso] = useState(1)
    const [tipo, setTipo] = useState<TipoPartidoAmigo>('7')
    const [fecha, setFecha] = useState('')
    const [hora, setHora] = useState('18:00')
    const [cancha, setCancha] = useState('')

    // Step 2 state
    const [partidoId, setPartidoId] = useState<string | null>(null)
    const [jugadoresAzul, setJugadoresAzul] = useState<JugadorPartidoAmigo[]>([])
    const [jugadoresRojo, setJugadoresRojo] = useState<JugadorPartidoAmigo[]>([])
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null) // Nuevo
    const [miembros, setMiembros] = useState<any[]>([]) // Nuevo
    const [equipoAgregando, setEquipoAgregando] = useState<'azul' | 'rojo' | null>(null)
    const [ordenAgregando, setOrdenAgregando] = useState<number | null>(null) // Nuevo: Slot seleccionado
    const [guardando, setGuardando] = useState(false)

    // Estado de formaciones
    const [formacionAzul, setFormacionAzul] = useState<Formacion | null>(null)
    const [formacionRojo, setFormacionRojo] = useState<Formacion | null>(null)

    // Nuevo: Fetch miembros
    useEffect(() => {
        if (grupoId) {
            supabase
                .from('miembros_grupo')
                .select('user_id, profile:profiles(username)')
                .eq('grupo_id', grupoId)
                .then(({ data }) => setMiembros(data || []))
        }
    }, [grupoId])

    const tipoInfo = TIPOS_PARTIDO.find(t => t.value === tipo)!
    const jugadoresPorEquipo = tipoInfo.jugadores / 2

    // Resetear formaciones y jugadores si cambia el tipo de partido
    useEffect(() => {
        setFormacionAzul(null)
        setFormacionRojo(null)
        setJugadoresAzul([])
        setJugadoresRojo([])
    }, [tipo])

    // ── PASO 1: Crear partido ──
    const handleSiguiente = async () => {
        if (!fecha) {
            showToast('Seleccioná una fecha', 'error')
            return
        }
        setGuardando(true)
        try {
            const partido = await crearPartido({
                tipo_partido: tipo,
                fecha,
                hora,
                cancha: cancha || undefined
            })
            setPartidoId(partido.id)
            setPaso(2)
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    // ── PASO 2: Agregar jugadores ──
    const handleAgregarJugador = async () => {
        if (!nuevoNombre.trim() || !partidoId || !equipoAgregando) return
        setGuardando(true)
        try {
            // Pasamos selectedUserId (si es null será invitado)
            const jugador = await agregarJugador(partidoId, nuevoNombre.trim(), equipoAgregando, selectedUserId || undefined)

            // Si tenemos orden, lo actualizamos (esto requeriría update en DB si queremos persistir posición exacta)
            // Por ahora, solo lo usamos visualmente en el cliente, pero el hook devuelve el objeto.
            // Hack: Asignamos 'orden' manualmente al objeto local para que se vea en la cancha
            if (ordenAgregando !== null) {
                jugador.orden = ordenAgregando
            }

            if (equipoAgregando === 'azul') {
                setJugadoresAzul(prev => [...prev, jugador])
            } else {
                setJugadoresRojo(prev => [...prev, jugador])
            }
            setNuevoNombre('')
            setSelectedUserId(null)
            setEquipoAgregando(null)
            setOrdenAgregando(null)
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    const handleEliminarJugador = async (jugador: JugadorPartidoAmigo) => {
        try {
            await eliminarJugador(jugador.id)
            if (jugador.equipo === 'azul') {
                setJugadoresAzul(prev => prev.filter(j => j.id !== jugador.id))
            } else {
                setJugadoresRojo(prev => prev.filter(j => j.id !== jugador.id))
            }
        } catch (err: any) {
            showToast(err.message, 'error')
        }
    }

    const handleCrearYAbrir = async () => {
        if (!partidoId) return
        if (jugadoresAzul.length === 0 && jugadoresRojo.length === 0) {
            showToast('Agregá al menos un jugador', 'error')
            return
        }
        setGuardando(true)
        try {
            await abrirVotacion(partidoId)
            showToast('¡Partido creado! Votación abierta 🗳️', 'success')
            onCreated()
            onClose()
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    const handleGuardarBorrador = () => {
        showToast('Partido guardado como borrador 📝', 'success')
        onCreated()
        onClose()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[var(--card-border)] shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[var(--card-bg)] z-10 p-5 border-b border-[var(--card-border)] flex items-center gap-3">
                    {paso === 2 && (
                        <button onClick={() => setPaso(1)}
                            className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center">←</button>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-black">
                            {paso === 1 ? '⚽ Crear Partido Amateur' : `🏗️ Armar Equipos (${tipoInfo.label})`}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">Paso {paso} de 2</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)]"
                    >✕</button>
                </div>

                <AnimatePresence mode="wait">
                    {paso === 1 ? (
                        <motion.div
                            key="paso1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-5 space-y-5"
                        >
                            {/* Tipo de partido */}
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">
                                    ⚽ Tipo de partido
                                </label>
                                <div className="space-y-2">
                                    {TIPOS_PARTIDO.map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setTipo(t.value)}
                                            className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${tipo === t.value
                                                ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                                                : 'border-[var(--card-border)] hover:bg-[var(--hover-bg)]'
                                                }`}
                                        >
                                            <span className="font-bold">{tipo === t.value ? '●' : '○'} {t.label}</span>
                                            <span className="text-xs text-[var(--text-muted)]">({t.jugadores} jugadores)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fecha y hora */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 block">📅 Fecha</label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={e => setFecha(e.target.value)}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 block">🕐 Hora</label>
                                    <input
                                        type="time"
                                        value={hora}
                                        onChange={e => setHora(e.target.value)}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                                    />
                                </div>
                            </div>

                            {/* Cancha */}
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 block">📍 Cancha</label>
                                <input
                                    type="text"
                                    value={cancha}
                                    onChange={e => setCancha(e.target.value)}
                                    placeholder="Ej: Cancha Don Pepe"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                                />
                            </div>

                            {/* Siguiente */}
                            <button
                                onClick={handleSiguiente}
                                disabled={!fecha || guardando}
                                className="w-full py-4 rounded-xl font-black text-white bg-[#10b981] disabled:opacity-40 hover:bg-[#059669] transition-all"
                            >
                                {guardando ? '⏳ Creando...' : 'Siguiente: Armar Equipos →'}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="paso2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="p-5 space-y-4"
                        >
                            <div className="flex flex-col sm:flex-row gap-8">
                                {/* Equipo Azul */}
                                <div className="flex-1">
                                    <h4 className="font-black text-blue-500 mb-2 text-center">🔵 EQUIPO AZUL</h4>
                                    <CanchaSeleccion
                                        tipoPartido={tipo}
                                        equipo="azul"
                                        jugadores={jugadoresAzul}
                                        onSelectPosicion={(orden) => {
                                            setEquipoAgregando('azul')
                                            setOrdenAgregando(orden)
                                        }}
                                        onEliminarJugador={handleEliminarJugador}
                                        formacionActual={formacionAzul!}
                                        setFormacionActual={setFormacionAzul}
                                    />
                                </div>

                                {/* Equipo Rojo */}
                                <div className="flex-1">
                                    <h4 className="font-black text-red-500 mb-2 text-center">🔴 EQUIPO ROJO</h4>
                                    <CanchaSeleccion
                                        tipoPartido={tipo}
                                        equipo="rojo"
                                        jugadores={jugadoresRojo}
                                        onSelectPosicion={(orden) => {
                                            setEquipoAgregando('rojo')
                                            setOrdenAgregando(orden)
                                        }}
                                        onEliminarJugador={handleEliminarJugador}
                                        formacionActual={formacionRojo!}
                                        setFormacionActual={setFormacionRojo}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={handleCrearYAbrir}
                                    disabled={guardando || (jugadoresAzul.length === 0 && jugadoresRojo.length === 0)}
                                    className="w-full py-4 rounded-xl font-black text-white bg-[#10b981] disabled:opacity-40 hover:bg-[#059669] transition-all"
                                >
                                    {guardando ? '⏳' : '🗳️ Crear y Abrir Votación'}
                                </button>
                                <button
                                    onClick={handleGuardarBorrador}
                                    className="w-full py-3 rounded-xl font-bold text-[var(--text-muted)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)]"
                                >
                                    📝 Guardar como Borrador
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal agregar jugador */}
                <AnimatePresence>
                    {equipoAgregando && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
                            onClick={() => setEquipoAgregando(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-xs border border-[var(--card-border)] shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h4 className="font-black mb-3">➕ Agregar Jugador</h4>
                                <p className="text-xs text-[var(--text-muted)] mb-3">
                                    Equipo {equipoAgregando === 'azul' ? '🔵 Azul' : '🔴 Rojo'}
                                </p>
                                <div className="mb-3 space-y-2">
                                    {/* Lista de miembros para seleccionar */}
                                    <div className="max-h-32 overflow-y-auto border border-[var(--card-border)] rounded-xl mb-2">
                                        {miembros.map(m => (
                                            <button
                                                key={m.user_id}
                                                onClick={() => {
                                                    setNuevoNombre(m.profile?.username || 'Usuario');
                                                    setSelectedUserId(m.user_id);
                                                }}
                                                className={`w-full text-left p-2 text-xs flex items-center gap-2 hover:bg-[var(--hover-bg)] ${selectedUserId === m.user_id ? 'bg-[#10b981]/10 text-[#10b981] font-bold' : ''
                                                    }`}
                                            >
                                                <span>{m.profile?.username}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={nuevoNombre}
                                            onChange={e => {
                                                setNuevoNombre(e.target.value);
                                                setSelectedUserId(null); // Si escribe manualmente, es invitado
                                            }}
                                            onKeyDown={e => e.key === 'Enter' && handleAgregarJugador()}
                                            placeholder="O escribí nombre invitado..."
                                            autoFocus
                                            className="flex-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEquipoAgregando(null); setNuevoNombre(''); setSelectedUserId(null); setOrdenAgregando(null) }}
                                        className="flex-1 py-2 rounded-xl text-[var(--text-muted)] font-bold"
                                    >Cancelar</button>
                                    <button
                                        onClick={handleAgregarJugador}
                                        disabled={!nuevoNombre.trim() || guardando}
                                        className="flex-1 py-2 rounded-xl font-black text-white bg-[#10b981] disabled:opacity-40"
                                    >{guardando ? '⏳' : 'Agregar'}</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
}

function TeamSection({ equipo, color, emoji, maxJugadores, jugadores, onAgregar, onEliminar }: {
    equipo: 'azul' | 'rojo'
    color: string
    emoji: string
    maxJugadores: number
    jugadores: JugadorPartidoAmigo[]
    onAgregar: () => void
    onEliminar: (j: JugadorPartidoAmigo) => void
}) {
    return (
        <div>
            <h4 className="font-black text-sm mb-2" style={{ color }}>
                {emoji} EQUIPO {equipo.toUpperCase()} ({jugadores.length}/{maxJugadores})
            </h4>

            <button
                onClick={onAgregar}
                className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--card-border)] text-sm text-[var(--text-muted)] hover:border-[#10b981] hover:text-[#10b981] transition-all mb-2"
            >
                + Agregar jugador
            </button>

            <div className="space-y-1">
                {jugadores.map(j => (
                    <motion.div
                        key={j.id}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl"
                    >
                        <span className="text-sm font-bold">👤 {j.nombre}</span>
                        <button
                            onClick={() => onEliminar(j)}
                            className="text-[#ef4444] hover:bg-[#ef4444]/10 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                        >❌</button>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
