'use client'

import { useState } from 'react'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Crown, Star, Zap, Shield, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'

export default function ProLandingPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(false)

  const isPro = profile?.is_pro

  const handleSubscribe = async () => {
    if (!user) {
      alert('Iniciá sesión para suscribirte a FutLog Pro')
      return
    }
    
    hapticFeedback(50)
    setLoading(true)

    try {
      // Simulamos un checkout de Stripe (Mock)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true, pro_since: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      setSuccessMsg(true)
      hapticFeedback([50, 50, 50])
      // Refrecar la página para montar el contexto nuevo (en una real se usaría router.refresh o update context state)
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      console.error(err)
      alert('Error en el pago.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!user) return
    if (!confirm('¿Seguro que querés cancelar tu suscripción Pro? Vas a perder tu badge y los beneficios exclusivos.')) return

    setLoading(true)
    await supabase.from('profiles').update({ is_pro: false }).eq('id', user.id)
    window.location.reload()
  }

  const features = [
    {
      icon: <Shield size={24} className="text-[var(--accent)]" />,
      title: 'Cero Anuncios',
      desc: 'Navegá, calificá y relatá sin interrupciones. Experiencia 100% limpia.'
    },
    {
      icon: <Star size={24} className="text-yellow-400" />,
      title: 'Badge Dorado VIP',
      desc: 'Destacá en La Tribuna y en las reseñas con la insignia Pro junto a tu nombre.'
    },
    {
      icon: <Zap size={24} className="text-purple-400" />,
      title: 'Estadísticas Avanzadas',
      desc: 'Mapas de calor de actividad, radar de rendimiento personal y analíticas profundas desbloqueadas.'
    },
    {
      icon: <Crown size={24} className="text-emerald-400" />,
      title: 'Wrapped Premium',
      desc: 'Generá y exportá tu resumen de temporada con layouts exclusivos y resoluciones 4K.'
    }
  ]

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 md:pt-20 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px] -mr-64 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] -ml-64 -mb-32 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
          
          <header className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/5 text-yellow-500 mb-6 shadow-2xl border border-yellow-500/20"
            >
              <Crown size={48} strokeWidth={1.5} />
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tighter italic mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-sm"
            >
              FUTLOG PRO
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-[var(--text-muted)] font-bold tracking-tight max-w-2xl mx-auto"
            >
              Subí de categoría. Accedé a analíticas profundas, destacá en la comunidad y convertite en el hincha definitivo.
            </motion.p>
          </header>

          <div className="grid md:grid-cols-5 gap-8 items-center max-w-5xl mx-auto">
            
            {/* Beneficios */}
            <div className="md:col-span-3 space-y-4">
              {features.map((feat, i) => (
                <motion.div 
                  key={feat.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)]/50 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-yellow-500/30 transition-colors group"
                >
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight mb-1 group-hover:text-yellow-400 transition-colors">{feat.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pricing Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-2 relative mt-8 md:mt-0"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/20 to-[var(--accent)]/0 rounded-[2.5rem] blur-xl" />
              <div className="bg-[#0a0a0a] border border-yellow-500/30 rounded-[2.5rem] p-8 relative z-10 shadow-2xl flex flex-col h-full">
                
                {isPro && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-[1.5rem] rounded-tr-[2rem]">
                    Activo
                  </div>
                )}

                <h3 className="text-xl font-black italic tracking-tighter text-[var(--foreground)] mb-2">Pase de Temporada</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black tracking-tighter text-yellow-400">$1900</span>
                  <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">/mes</span>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                   <div className="flex items-center gap-3 text-sm font-medium">
                     <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                     <span>Soporte prioritario</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm font-medium">
                     <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                     <span>Votación con peso doble (+2x)</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm font-medium">
                     <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                     <span>Reporte mensual por mail</span>
                   </div>
                </div>

                {isPro ? (
                  <div className="text-center">
                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-4 mb-4">
                      <p className="text-yellow-400 text-sm font-black italic tracking-tighter">¡Ya sos miembro Pro!</p>
                      <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest mt-1">Gracias por bancar el proyecto</p>
                    </div>
                    <button 
                      onClick={handleUnsubscribe}
                      disabled={loading}
                      className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors uppercase font-bold tracking-widest underline decoration-dashed underline-offset-4"
                    >
                      {loading ? 'Procesando...' : 'Cancelar Suscripción'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    disabled={loading || successMsg}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Aprobando pago...' : successMsg ? '¡Suscrito!' : 'Suscribirme Ahora'}
                    {!loading && !successMsg && <ChevronRight size={18} />}
                  </button>
                )}

                <p className="text-center text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-5 opacity-50">
                  Renovación automática. Cancelá cuando quieras.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </main>
      <NavBar />
    </>
  )
}
