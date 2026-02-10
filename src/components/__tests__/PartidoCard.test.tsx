import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PartidoCard } from '../PartidoCard'
import type { Partido } from '@/types'

// Mocks
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}))

vi.mock('../TeamLogo', () => ({
    TeamLogo: () => <div data-testid="team-logo" />
}))

vi.mock('../TeamForm', () => ({
    TeamForm: () => <div data-testid="team-form" />
}))

vi.mock('../FavoriteButton', () => ({
    FavoriteButton: () => <div data-testid="favorite-button" />
}))

const mockPartido: Partido = {
    id: 1,
    liga: 'Liga Profesional',
    equipo_local: 'Boca Juniors',
    equipo_visitante: 'River Plate',
    fecha_inicio: new Date().toISOString(),
    estado: 'PREVIA',
    goles_local: 0,
    goles_visitante: 0,
    logo_local: '',
    logo_visitante: ''
}

describe('PartidoCard', () => {
    it('renders team names correctly', () => {
        render(<PartidoCard partido={mockPartido} />)

        expect(screen.getByText('Boca Juniors')).toBeDefined()
        expect(screen.getByText('River Plate')).toBeDefined()
    })

    it('renders league name', () => {
        render(<PartidoCard partido={mockPartido} />)

        expect(screen.getByText('Liga Profesional')).toBeDefined()
    })

    it('shows EN VIVO badge when status is EN_JUEGO', () => {
        const liveMatch = { ...mockPartido, estado: 'EN_JUEGO' as const }
        render(<PartidoCard partido={liveMatch} />)

        expect(screen.getByText('EN VIVO')).toBeDefined()
    })
})
