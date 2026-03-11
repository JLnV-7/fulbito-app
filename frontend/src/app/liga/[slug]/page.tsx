// src/app/liga/[slug]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Table, Users, Star, Calendar } from 'lucide-react'
import { LIGAS, LIGAS_MAP, type Liga } from '@/lib/constants'
import { FixturesContent } from '@/components/FixturesContent'
import { TablaContent } from '@/components/TablaContent'
import { GoleadoresContent } from '@/components/GoleadoresContent'
import { ComunidadContent } from '@/components/ComunidadContent'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { hapticFeedback } from '@/lib/helpers'

type LigaTab = 'fixture' | 'tabla' | 'goleadores' | 'comunidad'

export default function LigaPage() {
    const { slug } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { classicMode } = useTheme()
    const [activeTab, setActiveTab] = useState<LigaTab>('fixture')
    const [ligaName, setLigaName] = useState<Liga | null>(null)

    useEffect(() => {
        // Revertir slug a nombre de liga
        const name = LIGAS.find(l => l.toLowerCase().replace(/\s+/g, '-') === slug)
        if (name) {
            setLigaName(name as Liga)
        } else {
            // Fallback o 404
            // router.push('/')
        }
    }, [slug])

    if (!ligaName) return null

    const tabs = [
        { id: 'fixture', label: 'Fixture', icon: <Calendar size={18} /> },
        { id: 'tabla', label: 'Posiciones', icon: <Table size={18} /> },
        { id: 'goleadores', label: 'Goleadores', icon: <Trophy size={18} /> },
        { id: 'comunidad', label: 'Comunidad', icon: <Users size={18} /> },
    ]

    const handleTabChange = (id: LigaTab) => {
        hapticFeedback(10)
        setActiveTab(id)
    }

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24">
            {/* Header Fijo */}
            <header className="sticky top-0 z-30 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { hapticFeedback(5); router.back(); }}
                        className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-muted)] transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight capitalize">{ligaName}</h1>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-tight capitalize">TEMPORADA 2025</p>
                    </div>
                </div>
                {!user && (
                    <Link href="/login" className="text-[10px] font-bold text-[var(--accent)] hover:underline capitalize">Ingresar</Link>
                )}
            </header>

            <main className="max-w-5xl mx-auto px-4 pt-6 pb-20">
                <div className="space-y-12">
                    <section id="fixture">
                        <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize mb-4 px-1">
                            Fixture
                        </h2>
                        <FixturesContent ligaExterna={ligaName} />
                    </section>

                    <section id="tabla">
                        <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize mb-4 px-1">
                            Tabla de Posiciones
                        </h2>
                        <TablaContent ligaExterna={ligaName} />
                    </section>

                    <section id="goleadores">
                        <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize mb-4 px-1">
                            Goleadores
                        </h2>
                        <GoleadoresContent ligaExterna={ligaName} />
                    </section>

                    <section id="comunidad">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize">
                                Comunidad
                            </h2>
                        </div>
                        <ComunidadContent ligaExterna={ligaName} />
                    </section>
                </div>
            </main>
        </div>
    )
}
