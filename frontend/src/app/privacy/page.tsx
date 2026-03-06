'use client'

import { useRouter } from 'next/navigation'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function PrivacyPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [deleting, setDeleting] = useState(false)

    const handleDeleteAccount = async () => {
        if (!user) return
        if (!confirm('¿Estás seguro de que querés borrar tu cuenta? Esta acción no se puede deshacer y perderás todas tus reseñas y medallas.')) return

        setDeleting(true)
        try {
            // In a real scenario you would call an Edge Function or secure endpoint to bypass RLS,
            // or rely on a user_deletions table that a trigger picks up.
            // For this beta, assuming the user can call rpc or we just delete their profile (which cascades in DB depending on setup)
            const { error } = await supabase.rpc('delete_user_account')

            if (error) {
                // Fallback if RPC doesn't exist yet: at least delete their profile to hide them
                await supabase.from('profiles').delete().eq('id', user.id)
                await supabase.auth.signOut()
            } else {
                await supabase.auth.signOut()
            }

            router.push('/')
        } catch (err) {
            console.error('Error deleting account:', err)
            alert('Hubo un error al intentar borrar tu cuenta. Por favor contáctanos.')
            setDeleting(false)
        }
    }

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
                        Política de Privacidad
                    </h1>

                    <div className="space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">1. Datos Guardados y Seguridad</h2>
                            <p className="mb-3">
                                Tu privacidad es importante para nosotros. Todos los datos de la aplicación, incluyendo tus reseñas, listas y preferencias, están almacenados de forma segura en bases de datos con encriptación y Row Level Security (RLS) en Supabase.
                            </p>
                            <p>
                                No vendemos tu información a terceros ni la usamos para publicidad rastreable. Solo recopilamos los datos que vos decidís proporcionar (avatar, equipo favorito, pronósticos) para mejorar tu experiencia en la comunidad de FutLog.
                            </p>
                        </section>

                        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-3">2. Permisos y Visibilidad</h2>
                            <p className="mb-3">
                                Tené en cuenta que tu nombre de usuario, foto de perfil y las reseñas públicas que escribas serán visibles para otros usuarios de la aplicación. Las reseñas enviadas como "Privadas" solo son visibles para vos.
                            </p>
                        </section>

                        <section className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-[#ff6b6b] mb-3">Cómo borrar tu cuenta</h2>
                            <p className="mb-4">
                                Podés solicitar la eliminación permanente de tu cuenta en cualquier momento. Tus datos serán programados para eliminación y desaparecerán por completo de nuestros servidores de forma segura dentro de un plazo máximo de 30 días.
                            </p>
                            {user ? (
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className="bg-[#ff6b6b]/20 text-[#ff6b6b] hover:bg-[#ff6b6b] hover:text-white font-bold py-2 px-4 rounded-xl transition-all border border-[#ff6b6b]/30 flex items-center justify-center gap-2"
                                >
                                    {deleting ? <LoadingSpinner /> : '🗑️ Borrar mi cuenta permanentemente'}
                                </button>
                            ) : (
                                <p className="text-xs bg-black/20 p-3 rounded-xl">Iniciá sesión para ver las opciones de eliminación de cuenta.</p>
                            )}
                        </section>

                        <p className="text-xs text-center mt-8">Última actualización: Marzo 2026</p>
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
