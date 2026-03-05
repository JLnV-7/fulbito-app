// src/app/fixtures/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FixturesRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/?tab=fixtures')
    }, [router])
    return null
}
