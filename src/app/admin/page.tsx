'use client'

import { useState } from 'react'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { fetchFixturesAction } from '@/app/actions/football'
import { LIGAS } from '@/lib/constants'
import { MatchUpdater } from '@/components/admin/MatchUpdater'

export default function AdminPage() {
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])

    const handleSyncFixtures = async () => {
        setLoading(true)
        addLog('Iniciando sincronización de fixtures...')
        try {
            for (const liga of LIGAS) {
                if (liga === 'Todos') continue
                addLog(`Buscando partidos para: ${liga}...`)
                const fixtures = await fetchFixturesAction(liga)
                addLog(`Encontrados ${fixtures.length} partidos para ${liga}`)
            }
            addLog('✅ Sincronización completada.')
        } catch (error) {
            console.error(error)
            addLog('❌ Error al sincronizar fixtures')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                <div className="px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-black mb-1">🛠️ Panel de Admin</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Herramientas de gestión (Desarrollo)
                        </p>
                    </div>
                </div>

                <div className="px-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Acciones Rápidas */}
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="font-bold mb-4">Acciones Rápidas</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={handleSyncFixtures}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    🔄 Sincronizar Fixtures (API)
                                </button>
                            </div>
                        </div>

                        <MatchUpdater />

                        {/* Logs */}
                        <div className="bg-black/50 border border-[var(--card-border)] rounded-2xl p-4 font-mono text-xs h-64 overflow-y-auto">
                            <h3 className="text-[var(--text-muted)] mb-2 sticky top-0 bg-black/90 p-1">Logs de Actividad</h3>
                            {logs.length === 0 ? (
                                <span className="text-gray-500 italic">Esperando acciones...</span>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="mb-1 text-green-400">{log}</div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
