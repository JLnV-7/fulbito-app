import { describe, it, expect } from 'vitest'
import { calcularEstadoPartido } from '../helpers'

describe('calcularEstadoPartido', () => {
    it('should return FINALIZADO for past dates', () => {
        // 3 hours ago
        const pastDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        expect(calcularEstadoPartido(pastDate)).toBe('FINALIZADO')
    })

    it('should return EN_JUEGO for dates within 2 hours', () => {
        // 1 hour ago
        const ongoingDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        expect(calcularEstadoPartido(ongoingDate)).toBe('EN_JUEGO')
    })

    it('should return PREVIA for future dates', () => {
        // 1 hour in future
        const futureDate = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
        expect(calcularEstadoPartido(futureDate)).toBe('PREVIA')
    })
})
