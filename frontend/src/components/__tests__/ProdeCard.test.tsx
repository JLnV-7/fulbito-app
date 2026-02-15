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
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
        input: ({ children, onChange, value, className, ...props }: any) => (
            <input className={className} value={value} onChange={onChange} {...props} />
        ),
        button: ({ children, onClick, disabled, className }: any) => (
            <button className={className} onClick={onClick} disabled={disabled}>{children}</button>
        )
    }
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
    it('renders correctly with default values', () => {
        render(<ProdeCard partido={mockPartido} onGuardar={vi.fn()} />)

        expect(screen.getByText('Team A')).toBeDefined()
        expect(screen.getByText('Team B')).toBeDefined()
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
    })

    it('calls onGuardar with input values when clicking save', async () => {
        const onGuardarMock = vi.fn()
        render(<ProdeCard partido={mockPartido} onGuardar={onGuardarMock} />)

        // Inputs are rendered by motion.input which we mocked as input
        const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]

        fireEvent.change(inputs[0], { target: { value: '2' } })
        fireEvent.change(inputs[1], { target: { value: '1' } })

        const saveButton = screen.getByText('Guardar pronóstico')
        fireEvent.click(saveButton)

        // Verify inputs
        expect(inputs[0].value).toBe('2')
        expect(inputs[1].value).toBe('1')

        // Wait for async handler if needed, but here it's direct in mock environment?
        // ProdeCard calls onGuardar which is async.
        expect(onGuardarMock).toHaveBeenCalledWith(2, 1)
    })

    it('disables inputs if match is blocked (past or in play)', () => {
        const blockedMatch = { ...mockPartido, estado: 'EN_JUEGO' as const }
        render(<ProdeCard partido={blockedMatch} onGuardar={vi.fn()} />)

        const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]
        expect(inputs[0].disabled).toBe(true)
        expect(inputs[1].disabled).toBe(true)
    })
})
