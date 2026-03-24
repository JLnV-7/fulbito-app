// src/components/grupos/partido-modal-components/TabNav.tsx
'use client'

import { Info, Inbox, Trophy, BarChart2 } from 'lucide-react'

type Tab = 'info' | 'votos' | 'resultados' | 'stats'

interface TabNavProps {
    activeTab: Tab
    setActiveTab: (tab: Tab) => void
}

export function TabNav({ activeTab, setActiveTab }: TabNavProps) {
    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'info',       label: 'Info',       icon: Info },
        { id: 'votos',      label: 'Votos',      icon: Inbox },
        { id: 'resultados', label: 'Resultados', icon: Trophy },
        { id: 'stats',      label: 'Stats',      icon: BarChart2 },
    ]

    return (
        <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-2 shrink-0">
            <div className="max-w-2xl mx-auto flex gap-1">
                {tabs.map(tab => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                            activeTab === tab.id
                                ? 'bg-[#16a34a]/10 text-[#16a34a]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                        }`}
                    >
                        <tab.icon size={18} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
