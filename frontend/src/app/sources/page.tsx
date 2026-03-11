'use client'

import { useRouter } from 'next/navigation'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'

export default function SourcesPage() {
    const router = useRouter()

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20 px-6 pt-6">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                        ← Volver
                    </button>

                    <h1 className="text-3xl font-black mb-8 bg-gradient-to-r from-[#16a34a] to-[#3b82f6] bg-clip-text text-transparent">
                        Fuentes y Transparencia
                    </h1>

                    <div className="space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">Estadísticas y Fixtures</h2>
                            <p className="mb-4">
                                La información oficial de los partidos, formaciones, eventos en vivo y tablas de posiciones provienen de APIs deportivas de uso gratuito o de consumo público (Principalmente <strong>SofaScore</strong> y <strong>Opta</strong>).
                            </p>
                            <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
                                <p className="font-mono text-xs text-white">
                                    Los IDs de los partidos almacenados en nuestras bases de datos corresponden a mapeos con estas plataformas para garantizar que las fichas tengan la data más precisa posible.
                                </p>
                            </div>
                        </section>

                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">User-Generated Content (UGC)</h2>
                            <p>
                                Los puntajes principales, villanos/estrellas y comentarios son 100% generados por nuestra comunidad (los usuarios). Nuestro algoritmo promedia los votos auténticos usando los registros individuales guardados en nuestras bases para obtener un reflejo genuino de lo que piensa la hinchada.
                            </p>
                        </section>

                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">Arquitectura y Almacenamiento</h2>
                            <p className="mb-3">
                                Tu información está alojada de manera segura en <strong>Supabase</strong>, una plataforma open-source de Backend-as-a-Service basada en PostgreSQL.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Los datos sensibles están encriptados.</li>
                                <li>Utilizamos RLS (Seguridad a Nivel de Filas) para garantizar que nadie puede leer o modificar información privada de otro usuario.</li>
                                <li>Tus contraseñas no se almacenan como texto plano bajo ningún concepto.</li>
                            </ul>
                        </section>

                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
