// src/components/MatchLogForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Tv, MapPin, Users, HelpCircle, ChevronLeft, ChevronRight,
    Check, Plus, X, Eye, EyeOff, Lock, Globe, Tag, Loader2, ImagePlus
} from 'lucide-react'
import { StarRating } from './StarRating'
import { TeamLogo } from './TeamLogo'
import { NeutralModeToggle } from './NeutralModeToggle'
import { GiphyPicker } from './GiphyPicker'
import { SubRatings } from './SubRatings'
import { useMatchLogs, type CreateMatchLogData } from '@/hooks/useMatchLogs'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import { isMatchTooOld } from '@/lib/helpers'
import type { Partido, MatchLogPlayerRating } from '@/types'

const MATCH_TYPES = [
    { value: 'tv', label: 'Lo vi por TV', icon: Tv, color: '#2563eb' },
    { value: 'stadium', label: 'En la cancha', icon: MapPin, color: '#16a34a' },
    { value: 'friend', label: 'Con amigos', icon: Users, color: '#d97706' },
    { value: 'other', label: 'Otro', icon: HelpCircle, color: '#7c3aed' },
] as const

const MOODS = [
    { value: 'euforia', emoji: '🤩', label: 'Euforia' },
    { value: 'contento', emoji: '😊', label: 'Contento' },
    { value: 'indiferente', emoji: '😐', label: 'Indiferente' },
    { value: 'caliente', emoji: '😤', label: 'Caliente' },
    { value: 'destruido', emoji: '😢', label: 'Destruido' },
    { value: 'locura', emoji: '🤯', label: 'Locura' },
] as const

const POPULAR_TAGS = [
    'clasico', 'remontada', 'penales', 'goleada', 'debut', 'despedida',
    'historico', 'final', 'derbi', 'copa', 'nocturno', 'lluvia'
]

const STEPS = [
    { title: 'Partido', desc: 'Seleccioná el partido' },
    { title: 'Tipo', desc: '¿Cómo lo viste?' },
    { title: 'Rating', desc: 'Puntuá el partido' },
    { title: 'Jugadores', desc: 'Puntuá jugadores' },
    { title: 'Reseña', desc: 'Tu opinión' },
]

interface PlayerRatingInput {
    name: string
    team: 'local' | 'visitante'
    rating: number
    comment: string
}

export function MatchLogForm({ preselectedMatch }: { preselectedMatch?: Partido }) {
    const router = useRouter()
    const { user } = useAuth()
    const { showToast } = useToast()
    const { createMatchLog } = useMatchLogs()

    const [step, setStep] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    // Step 1 - Match selection
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Partido[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState<Partido | null>(preselectedMatch || null)
    const [manualMode, setManualMode] = useState(false)
    const [manualLocal, setManualLocal] = useState('')
    const [manualVisitante, setManualVisitante] = useState('')
    const [manualLiga, setManualLiga] = useState('')
    const [manualFecha, setManualFecha] = useState(new Date().toISOString().split('T')[0])
    const [manualGolesLocal, setManualGolesLocal] = useState<string>('')
    const [manualGolesVisitante, setManualGolesVisitante] = useState<string>('')

    // Step 2 - Type
    const [matchType, setMatchType] = useState<string>('tv')
    const [mood, setMood] = useState<string>('')

    // Step 3 - Ratings
    const [ratingPartido, setRatingPartido] = useState(0)
    const [ratingArbitro, setRatingArbitro] = useState(0)
    const [ratingAtmosfera, setRatingAtmosfera] = useState(0)
    const [ratingGarra, setRatingGarra] = useState(0)

    // Step 4 - Player ratings
    const [playerRatings, setPlayerRatings] = useState<PlayerRatingInput[]>([])
    const [newPlayerName, setNewPlayerName] = useState('')
    const [newPlayerTeam, setNewPlayerTeam] = useState<'local' | 'visitante'>('local')

    // Step 5 - Review
    const [reviewTitle, setReviewTitle] = useState('')
    const [reviewText, setReviewText] = useState('')
    const [isSpoiler, setIsSpoiler] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [isNeutral, setIsNeutral] = useState(false)

    // New: DT rating, estrella/villano, photo, giphy
    const [ratingDT, setRatingDT] = useState(0)
    const [jugadorEstrella, setJugadorEstrella] = useState('')
    const [jugadorVillano, setJugadorVillano] = useState('')
    const [fotoUrl, setFotoUrl] = useState('')
    const [showGiphy, setShowGiphy] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Search matches from DB
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timeout = setTimeout(async () => {
            setSearching(true)
            try {
                const { data } = await supabase
                    .from('partidos')
                    .select('*')
                    .or(`equipo_local.ilike.%${searchQuery}%,equipo_visitante.ilike.%${searchQuery}%`)
                    .order('fecha_inicio', { ascending: false })
                    .limit(10)

                setSearchResults(data || [])
            } catch {
                setSearchResults([])
            } finally {
                setSearching(false)
            }
        }, 300)

        return () => clearTimeout(timeout)
    }, [searchQuery])

    const getMatchInfo = () => {
        if (selectedMatch) {
            return {
                partido_id: String(selectedMatch.id),
                equipo_local: selectedMatch.equipo_local,
                equipo_visitante: selectedMatch.equipo_visitante,
                logo_local: selectedMatch.logo_local,
                logo_visitante: selectedMatch.logo_visitante,
                liga: selectedMatch.liga,
                fecha_partido: selectedMatch.fecha_inicio,
                goles_local: selectedMatch.goles_local,
                goles_visitante: selectedMatch.goles_visitante,
            }
        }
        return {
            equipo_local: manualLocal,
            equipo_visitante: manualVisitante,
            liga: manualLiga || undefined,
            fecha_partido: new Date(manualFecha).toISOString(),
            goles_local: manualGolesLocal ? parseInt(manualGolesLocal) : undefined,
            goles_visitante: manualGolesVisitante ? parseInt(manualGolesVisitante) : undefined,
        }
    }

    const canGoNext = () => {
        switch (step) {
            case 0: return selectedMatch || (manualMode && manualLocal && manualVisitante)
            case 1: return !!matchType
            case 2: return ratingPartido > 0
            case 3: return true // optional
            case 4: return true // optional
            default: return false
        }
    }

    const addPlayerRating = () => {
        if (!newPlayerName.trim()) return
        setPlayerRatings(prev => [...prev, {
            name: newPlayerName.trim(),
            team: newPlayerTeam,
            rating: 0,
            comment: '',
        }])
        setNewPlayerName('')
    }

    const updatePlayerRating = (index: number, field: keyof PlayerRatingInput, value: string | number) => {
        setPlayerRatings(prev => prev.map((pr, i) =>
            i === index ? { ...pr, [field]: value } : pr
        ))
    }

    const removePlayerRating = (index: number) => {
        setPlayerRatings(prev => prev.filter((_, i) => i !== index))
    }

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    const handleSubmit = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (ratingPartido === 0) {
            showToast('Ponele al menos una estrella al partido', 'error')
            return
        }

        const matchInfo = getMatchInfo()
        if (isMatchTooOld(matchInfo.fecha_partido)) {
            showToast('Este partido es muy antiguo para ser reseñado', 'error')
            return
        }

        // Check for existing log for this user/match
        if (matchInfo.partido_id) {
            const { data: existing } = await supabase
                .from('match_logs')
                .select('id')
                .eq('user_id', user.id)
                .eq('partido_id', String(matchInfo.partido_id))
                .maybeSingle()

            if (existing) {
                showToast('Ya reseñaste este partido', 'error')
                return
            }
        }

        setSubmitting(true)
        try {
            const matchInfo = getMatchInfo()
            const data: CreateMatchLogData = {
                ...matchInfo,
                match_type: matchType,
                rating_partido: ratingPartido,
                rating_arbitro: ratingArbitro || undefined,
                rating_atmosfera: ratingAtmosfera || undefined,
                rating_garra: ratingGarra || undefined,
                review_title: reviewTitle || undefined,
                review_text: reviewText || undefined,
                is_spoiler: isSpoiler,
                is_private: isPrivate,
                player_ratings: playerRatings
                    .filter(pr => pr.rating > 0)
                    .map(pr => ({
                        player_name: pr.name,
                        player_team: pr.team,
                        rating: pr.rating,
                        comment: pr.comment || undefined,
                    })),
                tags: selectedTags.length > 0 ? selectedTags : undefined,
                is_neutral: isNeutral || undefined,
                rating_dt: ratingDT || undefined,
                jugador_estrella: jugadorEstrella || undefined,
                jugador_villano: jugadorVillano || undefined,
                foto_url: fotoUrl || undefined,
                mood: mood || undefined,
            }

            await createMatchLog(data)
            showToast('¡Reseña publicada! ⚽', 'success')
            router.push('/feed')
        } catch {
            showToast('Error al publicar la reseña', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return
        const file = e.target.files[0]

        setUploadingPhoto(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `matches/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('match_photos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('match_photos').getPublicUrl(filePath)
            setFotoUrl(data.publicUrl)
            showToast('✅ Foto subida con éxito', 'success')
        } catch (error) {
            console.error('Error uploading photo:', error)
            showToast('❌ Error al subir la foto', 'error')
        } finally {
            setUploadingPhoto(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const matchInfo = getMatchInfo()
    const localName = matchInfo.equipo_local || 'Local'
    const visitanteName = matchInfo.equipo_visitante || 'Visitante'

    return (
        <div className="max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-1 mb-6">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`h-1.5 w-full transition-all duration-500 ${i <= step ? 'bg-[var(--foreground)]' : 'bg-[var(--card-border)]'
                            }`} style={{ borderRadius: 'var(--radius)' }} />
                        <span className={`text-[9px] font-black capitalize tracking-widest italic transition-colors ${i === step ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]'
                            }`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Step 0: Select Match */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">¿Qué partido viste?</h2>

                            {!manualMode ? (
                                <>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar partido por equipo..."
                                            className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl
                               text-sm focus:outline-none focus:border-[#f59e0b]/50 transition-colors"
                                        />
                                        {searching && (
                                            <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-[var(--text-muted)]" />
                                        )}
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="space-y-2 max-h-64 overflow-y-auto border-t border-[var(--card-border)] pt-2 border-dashed">
                                            {searchResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => { setSelectedMatch(p); setSearchQuery(''); setSearchResults([]) }}
                                                    className={`w-full flex items-center gap-3 p-3 border transition-all text-left ${selectedMatch?.id === p.id
                                                        ? 'border-[var(--foreground)] bg-[var(--foreground)]/5'
                                                        : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--text-muted)]'
                                                        }`}
                                                    style={{ borderRadius: 'var(--radius)' }}
                                                >
                                                    <TeamLogo src={p.logo_local} teamName={p.equipo_local} size={28} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-black capitalize italic tracking-tight truncate">
                                                            {p.equipo_local} vs {p.equipo_visitante}
                                                        </div>
                                                        <div className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-widest">
                                                            {p.liga} · {new Date(p.fecha_inicio).toLocaleDateString('es-AR')}
                                                            {p.goles_local != null && ` · ${p.goles_local}-${p.goles_visitante}`}
                                                        </div>
                                                    </div>
                                                    <TeamLogo src={p.logo_visitante} teamName={p.equipo_visitante} size={28} />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Match Display */}
                                    {selectedMatch && !searchQuery && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/5">
                                            <TeamLogo src={selectedMatch.logo_local} teamName={selectedMatch.equipo_local} size={36} />
                                            <div className="flex-1 text-center">
                                                <div className="text-sm font-bold">{selectedMatch.equipo_local}</div>
                                                {selectedMatch.goles_local != null && (
                                                    <div className="text-lg font-bold text-[#f59e0b]">
                                                        {selectedMatch.goles_local} - {selectedMatch.goles_visitante}
                                                    </div>
                                                )}
                                                <div className="text-sm font-bold">{selectedMatch.equipo_visitante}</div>
                                                <div className="text-xs text-[var(--text-muted)] mt-1">{selectedMatch.liga}</div>
                                            </div>
                                            <TeamLogo src={selectedMatch.logo_visitante} teamName={selectedMatch.equipo_visitante} size={36} />
                                            <button type="button" onClick={() => setSelectedMatch(null)} className="p-1 hover:bg-[var(--hover-bg)] rounded-lg">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setManualMode(true)}
                                        className="w-full py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        ¿No lo encontrás? <span className="underline">Cargarlo manualmente</span>
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={manualLocal}
                                            onChange={(e) => setManualLocal(e.target.value)}
                                            placeholder="Equipo local"
                                            className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                               focus:outline-none focus:border-[#f59e0b]/50"
                                        />
                                        <input
                                            type="text"
                                            value={manualVisitante}
                                            onChange={(e) => setManualVisitante(e.target.value)}
                                            placeholder="Equipo visitante"
                                            className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                               focus:outline-none focus:border-[#f59e0b]/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={manualLiga}
                                            onChange={(e) => setManualLiga(e.target.value)}
                                            placeholder="Liga/Torneo (opcional)"
                                            className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                               focus:outline-none focus:border-[#f59e0b]/50"
                                        />
                                        <input
                                            type="date"
                                            value={manualFecha}
                                            onChange={(e) => setManualFecha(e.target.value)}
                                            className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                               focus:outline-none focus:border-[#f59e0b]/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            value={manualGolesLocal}
                                            onChange={(e) => setManualGolesLocal(e.target.value)}
                                            placeholder="Goles local"
                                            min="0"
                                            className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                               focus:outline-none focus:border-[#f59e0b]/50"
                                        />
                                        <input
                                            type="number"
                                            value={manualGolesVisitante}
                                            onChange={(e) => setManualGolesVisitante(e.target.value)}
                                            placeholder="Goles visitante"
                                            min="0"
                                            className="px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                               focus:outline-none focus:border-[#f59e0b]/50"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setManualMode(false); setSelectedMatch(null) }}
                                        className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        ← Volver a buscar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 1: Match Type */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">¿Cómo lo viste?</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {MATCH_TYPES.map((type) => {
                                    const Icon = type.icon || MapPin
                                    const itemColor = type.color || '#16a34a'
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setMatchType(type.value)}
                                            className={`flex flex-col items-center gap-2 p-4 border-2 transition-all ${matchType === type.value
                                                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] scale-[1.02]'
                                                : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--text-muted)]'
                                                }`}
                                            style={{ borderRadius: 'var(--radius)' }}
                                        >
                                            <div className="w-12 h-12 flex items-center justify-center"
                                                style={{ backgroundColor: matchType === type.value ? 'var(--background)' : `${itemColor}15`, borderRadius: 'var(--radius)' }}>
                                                <Icon size={24} style={{ color: matchType === type.value ? 'var(--foreground)' : itemColor }} />
                                            </div>
                                            <span className="text-[11px] font-black capitalize tracking-widest">{type.label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Mood Selector */}
                            <div className="mt-6">
                                <h3 className="text-sm font-bold mb-3">¿Cómo te sentiste después?</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {MOODS.map(m => (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => setMood(mood === m.value ? '' : m.value)}
                                            className={`flex flex-col items-center gap-1 p-3 border-2 transition-all ${mood === m.value
                                                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] scale-[1.02]'
                                                : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--text-muted)]'
                                            }`}
                                            style={{ borderRadius: 'var(--radius)' }}
                                        >
                                            <span className="text-2xl">{m.emoji}</span>
                                            <span className="text-[10px] font-black capitalize tracking-widest">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Ratings */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold">¿Qué te pareció?</h2>

                            {/* Main rating */}
                            <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                                <div className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-3 italic">Rating del partido</div>
                                <div className="flex justify-center">
                                    <StarRating
                                        value={ratingPartido}
                                        onChange={setRatingPartido}
                                        size="lg"
                                        showValue
                                    />
                                </div>
                            </div>

                            {/* Secondary ratings */}
                            <div className="space-y-4">
                                <SubRatings
                                    ratings={{ arbitro: ratingArbitro, atmosfera: ratingAtmosfera, garra: ratingGarra }}
                                    onChange={(field, val) => {
                                        if (field === 'arbitro') setRatingArbitro(val)
                                        if (field === 'atmosfera') setRatingAtmosfera(val)
                                        if (field === 'garra') setRatingGarra(val)
                                    }}
                                />
                                <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                                    <StarRating
                                        value={ratingDT}
                                        onChange={setRatingDT}
                                        label="Director Técnico"
                                        showValue
                                        color="var(--foreground)"
                                    />
                                </div>
                            </div>

                            {/* Neutral Mode Toggle */}
                            <NeutralModeToggle enabled={isNeutral} onChange={setIsNeutral} />
                        </div>
                    )}

                    {/* Step 3: Player Ratings */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Rating de jugadores</h2>
                            <p className="text-sm text-[var(--text-muted)]">Opcional — agregá jugadores que se destacaron.</p>

                            {/* Add player */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    placeholder="Nombre del jugador"
                                    className="flex-1 px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                           focus:outline-none focus:border-[#f59e0b]/50"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlayerRating())}
                                />
                                <select
                                    value={newPlayerTeam}
                                    onChange={(e) => setNewPlayerTeam(e.target.value as 'local' | 'visitante')}
                                    className="px-2 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-xs
                           focus:outline-none"
                                >
                                    <option value="local">{localName.slice(0, 12)}</option>
                                    <option value="visitante">{visitanteName.slice(0, 12)}</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={addPlayerRating}
                                    disabled={!newPlayerName.trim()}
                                    className="px-4 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-30 transition-all font-black"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Player list */}
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {playerRatings.map((pr, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{pr.name}</div>
                                            <div className="text-[10px] text-[var(--text-muted)]">
                                                {pr.team === 'local' ? localName : visitanteName}
                                            </div>
                                        </div>
                                        <StarRating
                                            value={pr.rating}
                                            onChange={(v) => updatePlayerRating(i, 'rating', v)}
                                            size="sm"
                                        />
                                        <button type="button" onClick={() => removePlayerRating(i)}
                                            className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                                {playerRatings.length === 0 && (
                                    <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                                        <Users size={24} className="mx-auto mb-2 opacity-40" />
                                        Podés saltear este paso
                                    </div>
                                )}

                                {/* Estrella y Villano */}
                                <div className="mt-4 pt-4 border-t border-[var(--card-border)] space-y-3">
                                    <h3 className="text-sm font-bold flex items-center gap-1.5">⭐ Estrella y 😈 Villano</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">⭐ Estrella del partido</label>
                                            <input
                                                type="text"
                                                value={jugadorEstrella}
                                                onChange={(e) => setJugadorEstrella(e.target.value)}
                                                placeholder="Ej: Messi"
                                                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                                               focus:outline-none focus:border-[#f59e0b]/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">😈 Villano del partido</label>
                                            <input
                                                type="text"
                                                value={jugadorVillano}
                                                onChange={(e) => setJugadorVillano(e.target.value)}
                                                placeholder="Ej: El Árbitro"
                                                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                                               focus:outline-none focus:border-[#f59e0b]/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Tu reseña</h2>

                            <input
                                type="text"
                                value={reviewTitle}
                                onChange={(e) => setReviewTitle(e.target.value)}
                                placeholder="Título (opcional)"
                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm font-medium
                         focus:outline-none focus:border-[#f59e0b]/50"
                            />

                            <div className="relative">
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="¿Qué te pareció el partido? Contá lo que quieras..."
                                    rows={6}
                                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                           focus:outline-none focus:border-[#f59e0b]/50 resize-none"
                                />
                                <div className="absolute bottom-3 right-3 text-[10px] text-[var(--text-muted)]">
                                    {reviewText.length} caracteres
                                </div>
                            </div>

                            {/* Preview toggle */}
                            {reviewText && (
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {showPreview ? 'Ocultar preview' : 'Ver preview'}
                                </button>
                            )}
                            {showPreview && reviewText && (
                                <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-sm whitespace-pre-wrap">
                                    {reviewTitle && <h3 className="font-bold mb-2">{reviewTitle}</h3>}
                                    {reviewText}
                                </div>
                            )}

                            {/* Tags */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Tag size={12} className="text-[var(--text-muted)]" />
                                    <span className="text-xs font-medium text-[var(--text-muted)]">Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {POPULAR_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${selectedTags.includes(tag)
                                                ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                                                : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)] hover:border-[var(--text-muted)]'
                                                }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Photo URL & Giphy */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                                        📸 Foto o Meme (opcional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowGiphy(!showGiphy)}
                                        className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-500/20 transition-colors font-medium border border-indigo-500/20"
                                    >
                                        <ImagePlus size={12} />
                                        Buscar un GIF
                                    </button>
                                </div>

                                {showGiphy && (
                                    <div className="mb-3">
                                        <GiphyPicker
                                            onClose={() => setShowGiphy(false)}
                                            onSelect={(url) => { setFotoUrl(url); setShowGiphy(false); }}
                                        />
                                    </div>
                                )}

                                {!showGiphy && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={fotoUrl}
                                                onChange={(e) => setFotoUrl(e.target.value)}
                                                placeholder="Pegar link de imagen, url de GIF..."
                                                className="flex-1 px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-sm
                                                focus:outline-none focus:border-[#f59e0b]/50 placeholder:text-[var(--text-muted)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingPhoto}
                                                className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 font-black"
                                                style={{ borderRadius: 'var(--radius)' }}
                                            >
                                                {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={18} />}
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handlePhotoUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                )}

                                {fotoUrl && !showGiphy && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-[var(--card-border)] max-h-40 relative group">
                                        <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFotoUrl('')}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Privacy & Spoiler toggles */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${isPrivate
                                        ? 'border-amber-500/30 bg-amber-500/5 text-amber-500'
                                        : 'border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                                    {isPrivate ? 'Privado' : 'Público'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSpoiler(!isSpoiler)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${isSpoiler
                                        ? 'border-red-500/30 bg-red-500/5 text-red-500'
                                        : 'border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    {isSpoiler ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {isSpoiler ? 'Spoiler' : 'Sin spoiler'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)]
                     text-sm font-medium hover:bg-[var(--hover-bg)] transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Atrás
                    </button>
                )}
                <div className="flex-1" />
                {step < STEPS.length - 1 ? (
                    <button
                        type="button"
                        onClick={() => setStep(step + 1)}
                        disabled={!canGoNext()}
                        className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#f59e0b] text-white
                     text-sm font-semibold hover:bg-[#d97706] disabled:opacity-30 transition-all"
                    >
                        Siguiente
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || ratingPartido === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f59e0b] text-white
                     text-sm font-semibold hover:bg-[#d97706] disabled:opacity-30 transition-all"
                    >
                        {submitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Publicando...</>
                        ) : (
                            <><Check size={16} /> Publicar</>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
