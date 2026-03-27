// src/app/comunidad/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, MessageCircle, ChevronRight, Layout } from 'lucide-react'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PullToRefresh } from '@/components/PullToRefresh'
import { CreateGroupModal } from '@/components/CreateGroupModal'
import { TopMatchesToday } from '@/components/feed/TopMatchesToday'
import { FeedGlobal } from '@/components/feed/FeedGlobal'

export default function ComunidadPage() {
    const router = useRouter()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [feedKey, setFeedKey] = useState(0)

    const handleRefresh = useCallback(async () => {
        setFeedKey(k => k + 1)
    }, [])

    const options = [
        {
            title: 'Grupos',
            description: 'Competí en prodes cerrados con tus amigos.',
            icon: Users,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            path: '/grupos'
        },
        {
            title: 'Armá tu XI',
            description: 'Diseñá tu equipo ideal y compartilo.',
            icon: Layout,
            color: 'text-[#16a34a]',
            bg: 'bg-[#16a34a]/10',
            path: '/lineup'
        },
        {
            title: 'Chat Global',
            description: 'Debatí en vivo sobre los partidos.',
            icon: MessageCircle,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            path: '/chat'
        }
    ]

    return (
        <>
            <DesktopNav />
            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <PullToRefresh onRefresh={handleRefresh}>
                <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 md:pt-20 relative">
                    {/* Header */}
                    <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-6 md:hidden">
                        <h1 className="text-2xl font-black mb-1">Comunidad</h1>
                        <p className="text-sm text-[var(--text-muted)]">Interactuá con otros hinchas.</p>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
                        <div className="hidden md:flex mb-8 justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-black mb-2">Comunidad</h1>
                                <p className="text-[var(--text-muted)]">Interactuá con otros hinchas y amigos.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-[#16a34a] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#16a34a]/25 flex items-center gap-2"
                            >
                                <span className="text-xl leading-none">+</span>
                                Crear Grupo
                            </button>
                        </div>

                        {/* Top Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                            {options.map((opt, i) => {
                                const Icon = opt.icon
                                return (
                                    <motion.button
                                        key={opt.title}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => router.push(opt.path)}
                                        className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]
                                                 hover:border-[var(--accent)]/40 card-hover text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-full ${opt.bg} ${opt.color} flex items-center justify-center shrink-0`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold group-hover:text-[var(--accent)] transition-colors">{opt.title}</h3>
                                        </div>
                                        <ChevronRight className="text-[var(--text-muted)] shrink-0" size={16} />
                                    </motion.button>
                                )
                            })}
                        </div>

                        {/* Trending Section */}
                        <TopMatchesToday />

                        {/* Social Feed Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    Feed global
                                </h2>
                            </div>
                            <FeedGlobal key={feedKey} />
                        </div>
                    </div>
                </main>
            </PullToRefresh>
            <NavBar />
        </>
    )
}

