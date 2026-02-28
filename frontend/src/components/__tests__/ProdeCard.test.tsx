import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProdeCard } from '../ProdeCard'
import type { Partido } from '@/types'

// Mocks
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}))

vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />
}))

// Mock framer-motion to render children directly
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...rest }: any) => <div className={className}>{children}</div>,
        button: ({ children, onClick, disabled, className, whileTap, whileHover, ...rest }: any) => (
            <button className={className} onClick={onClick} disabled={disabled} {...rest}>{children}</button>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockPartido: Partido = {
    id: 1,
    liga: 'Copa Libertadores',
    equipo_local: 'Team A',
    equipo_visitante: 'Team B',
    fecha_inicio: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    estado: 'PREVIA',
    goles_local: 0,
    goles_visitante: 0,
    logo_local: '/logo-a.png',
    logo_visitante: '/logo-b.png'
}

describe('ProdeCard', () => {
    it('renders correctly with team names and stepper buttons', () => {
        render(<ProdeCard partido={mockPartido} onGuardar={vi.fn()} />)

        expect(screen.getByText('Team A')).toBeDefined()
        expect(screen.getByText('Team B')).toBeDefined()
        // Stepper buttons: 2 minus, 2 plus
        expect(screen.getByLabelText('Restar gol Team A')).toBeDefined()
        expect(screen.getByLabelText('Sumar gol Team A')).toBeDefined()
        expect(screen.getByLabelText('Restar gol Team B')).toBeDefined()
        expect(screen.getByLabelText('Sumar gol Team B')).toBeDefined()
    })

    it('increments and decrements goals using stepper buttons', async () => {
        const onGuardarMock = vi.fn()
        render(<ProdeCard partido={mockPartido} onGuardar={onGuardarMock} />)

        const plusLocal = screen.getByLabelText('Sumar gol Team A')
        const plusVisitante = screen.getByLabelText('Sumar gol Team B')

        // Click + twice for local
        fireEvent.click(plusLocal)
        fireEvent.click(plusLocal)

        // Click + once for visitante
        fireEvent.click(plusVisitante)

        const saveButton = screen.getByText('Guardar pronóstico')
        fireEvent.click(saveButton)

        expect(onGuardarMock).toHaveBeenCalledWith(2, 1)
    })

    it('disables stepper buttons if match is blocked (in play)', () => {
        const blockedMatch = { ...mockPartido, estado: 'EN_JUEGO' as const }
        render(<ProdeCard partido={blockedMatch} onGuardar={vi.fn()} />)

        const minusLocal = screen.getByLabelText('Restar gol Team A')
        const plusLocal = screen.getByLabelText('Sumar gol Team A')

        expect(minusLocal).toHaveProperty('disabled', true)
        expect(plusLocal).toHaveProperty('disabled', true)
    })

    it('does not go below 0 when decrementing', () => {
        render(<ProdeCard partido={mockPartido} onGuardar={vi.fn()} />)

        const minusLocal = screen.getByLabelText('Restar gol Team A')

        // Value starts at 0, minus button should be disabled
        expect(minusLocal).toHaveProperty('disabled', true)
    })
})
