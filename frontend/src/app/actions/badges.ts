'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function checkAndAwardBadges(userId: string) {
    const awardedBadges: any[] = []

    try {
        // 1. Get user's current badges
        const { data: userBadges } = await supabase
            .from('user_badges')
            .select('badge_id, badges(condition)')
            .eq('user_id', userId)

        const existingConditions = new Set(
            userBadges?.map(ub => (ub.badges as any)?.condition).filter(Boolean) || []
        )

        // 2. Fetch all available badges to know their IDs and conditions
        const { data: allBadges } = await supabase.from('badges').select('*')
        if (!allBadges) return []

        const newAwards = []

        // --- Condition Checkers ---

        // Check "10 Partidos" (10_reviews)
        if (!existingConditions.has('10_reviews')) {
            const { count } = await supabase
                .from('match_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)

            if (count && count >= 10) {
                const badge = allBadges.find(b => b.condition === '10_reviews')
                if (badge) newAwards.push(badge)
            }
        }

        // Check "Voz de la Hinchada" (50_live_chat)
        if (!existingConditions.has('50_live_chat')) {
            const { count } = await supabase
                .from('partido_comments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)

            if (count && count >= 50) {
                const badge = allBadges.find(b => b.condition === '50_live_chat')
                if (badge) newAwards.push(badge)
            }
        }
        
        // Check "Prodista" (10_prode_exactos)
        if (!existingConditions.has('10_prode_exactos')) {
             const { data: ranking } = await supabase
                .from('ranking_prode')
                .select('aciertos_exactos')
                .eq('user_id', userId)
                
             const stats = ranking?.reduce((acc, curr) => acc + (curr.aciertos_exactos || 0), 0) || 0;
             if (stats >= 10) {
                 const badge = allBadges.find(b => b.condition === '10_prode_exactos')
                 if (badge) newAwards.push(badge)
             }
        }

        // --- Award Badges ---
        for (const badge of newAwards) {
            // Insert into user_badges
            const { error: insertError } = await supabase
                .from('user_badges')
                .insert({ user_id: userId, badge_id: badge.id })

            if (!insertError && badge.xp_reward > 0) {
                const { error: rpcError } = await supabase.rpc('increment_profile_xp', {
                    p_user_id: userId,
                    p_amount: badge.xp_reward
                })

                if (rpcError) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('xp')
                        .eq('id', userId)
                        .single()
                    if (profile) {
                        await supabase
                            .from('profiles')
                            .update({ xp: profile.xp + badge.xp_reward })
                            .eq('id', userId)
                    }
                }

                awardedBadges.push(badge)
            }
        }

        return awardedBadges
    } catch (error) {
        console.error('Error in checkAndAwardBadges:', error)
        return []
    }
}
