// src/app/posiciones/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PosicionesRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/?tab=tabla')
    }, [router])
    return null
}
