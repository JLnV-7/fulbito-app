'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AutoShareModal } from '@/components/AutoShareModal'

export function AutoShareListener() {
    const { user } = useAuth()
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'prode_exact' | 'badge_unlock';
        title: string;
        subtitle: string;
        achievementData: any;
    }>({
        isOpen: false,
        type: 'badge_unlock',
        title: '',
        subtitle: '',
        achievementData: {}
    })

    useEffect(() => {
        if (!user) return

        // Listen for new badge unlocks
        const badgeChannel = supabase
            .channel('public:user_badges')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_badges',
                    filter: `user_id=eq.${user.id}`
                },
                async (payload) => {
                    // Fetch badge details
                    const { data: badgeData } = await supabase
                        .from('badges')
                        .select('*')
                        .eq('id', payload.new.badge_id)
                        .single()

                    if (badgeData) {
                        setModalState({
                            isOpen: true,
                            type: 'badge_unlock',
                            title: '¡Nueva Insignia!',
                            subtitle: badgeData.description,
                            achievementData: {
                                badgeIcon: badgeData.icon,
                                badgeName: badgeData.name
                            }
                        })
                    }
                }
            )
            .subscribe()

        // Listen for new prode exact hits.
        // The trigger evaluates and inserts a record in ranking_prode or updates it.
        // It's tricky to catch *exactly* when an exact hit happens just from DB inserts unless we have an audit log or notifications table.
        // If we use the user_notifications table, we can catch it!

        const notificationChannel = supabase
            .channel('public:user_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const type = payload.new.type
                    const data = payload.new.data || {}

                    if (type === 'PRODE_RESULT' && data.puntos === 8) {
                        setModalState({
                            isOpen: true,
                            type: 'prode_exact',
                            title: '¡Pleno Exacto!',
                            subtitle: 'Adivinaste el resultado exacto del partido.',
                            achievementData: {
                                matchDetails: data.partido_str || 'Partido',
                                pointsText: '8'
                            }
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(badgeChannel)
            supabase.removeChannel(notificationChannel)
        }
    }, [user])

    return (
        <AutoShareModal
            isOpen={modalState.isOpen}
            onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
            type={modalState.type}
            title={modalState.title}
            subtitle={modalState.subtitle}
            achievementData={modalState.achievementData}
        />
    )
}
