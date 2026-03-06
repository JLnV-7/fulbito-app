import { NextResponse } from 'next/server'
import { syncLivePartidosToSupabase } from '@/app/actions/syncPartidos'

// Keep route dynamic
export const dynamic = 'force-dynamic'
export const maxDuration = 30 // seconds

export async function GET(request: Request) {
    try {
        const result = await syncLivePartidosToSupabase()

        return NextResponse.json({
            success: true,
            updatedMatches: result.updated,
            timestamp: new Date().toISOString()
        })
    } catch (error: any) {
        console.error('API Sync Live Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 })
    }
}
