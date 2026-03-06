'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import es from '../locales/es.json'
import en from '../locales/en.json'
import pt from '../locales/pt.json'

export type Language = 'es' | 'en' | 'pt'
type Dictionary = typeof es

const dictionaries: Record<Language, Dictionary> = { es, en, pt }

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (keyPath: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('es') // Default
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // 1. Try to get from local storage
        const storedLang = localStorage.getItem('futlog_lang') as Language
        if (storedLang && ['es', 'en', 'pt'].includes(storedLang)) {
            setLanguageState(storedLang)
        } else {
            // 2. Fallback to navigator language if possible
            const navLang = navigator.language.split('-')[0]
            if (['es', 'en', 'pt'].includes(navLang)) {
                setLanguageState(navLang as Language)
                localStorage.setItem('futlog_lang', navLang)
            }
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('futlog_lang', lang)
    }

    const t = (keyPath: string): string => {
        const keys = keyPath.split('.')
        let current: any = dictionaries[language]

        for (const key of keys) {
            if (current === undefined || current === null) return keyPath
            current = current[key as keyof typeof current]
        }

        return typeof current === 'string' ? current : keyPath
    }

    // Prevents SSR mismatch by avoiding render of text before mounting
    if (!isMounted) {
        return <LanguageContext.Provider value={{ language: 'es', setLanguage, t }}>{children}</LanguageContext.Provider>
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
