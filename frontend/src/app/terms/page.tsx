'use client'

import { useRouter } from 'next/navigation'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'

export default function TermsPage() {
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

                    <h1 className="text-3xl font-black mb-8 bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent">
                        Términos de Servicio
                    </h1>

                    <div className="space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">1. Uso de la Aplicación</h2>
                            <p>
                                Al usar FutLog, aceptás utilizar la plataforma para compartir tu opinión y pasión por el fútbol de una manera respetuosa.
                                Cualquier contenido discriminatorio, ofensivo o spam podrá ser moderado o eliminado, y tu cuenta podría ser suspendida sin previo aviso.
                            </p>
                        </section>

                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">2. Contenido Generado por el Usuario (UGC)</h2>
                            <p className="mb-3">
                                Las reseñas, avatares y votos son responsabilidad exclusiva de quienes los publican. Mantenemos el derecho de remover fotos de perfil o comentarios que infrinjan los derechos de autor de terceros o que se consideren inapropiados para la comunidad.
                            </p>
                        </section>

                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">3. Disponibilidad del Servicio</h2>
                            <p>
                                FutLog está actualmente en fase Beta. Nos esforzamos por mantener la aplicación siempre online y con datos precisos, pero dependemos de APIs de terceros (ver sección de Fuentes). No nos hacemos responsables por la información estadística o resultados en vivo que puedan tener una ligera demora o imprecisión transitoria.
                            </p>
                        </section>

                        <p className="text-xs text-center mt-8">Al continuar usando FutLog, aceptás estos términos.</p>
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
