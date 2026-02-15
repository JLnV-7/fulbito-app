// src/lib/formaciones.ts

export type PosicionVisual = {
    x: number // % left
    y: number // % top
    label?: string
}

export type Formacion = {
    nombre: string
    posiciones: PosicionVisual[] // Array ordenado, el índice corresponde al 'orden' del jugador
}

// Helper para generar el arquero (siempre index 0 o manejado aparte)
// En este sistema, asumiremos que el index 0 es el arquero para simplificar.
const ARQUERO: PosicionVisual = { x: 50, y: 88, label: 'ARQ' }

export const FORMACIONES: Record<string, Formacion[]> = {
    '5': [
        {
            nombre: '2-2',
            posiciones: [
                ARQUERO,
                { x: 30, y: 60, label: 'DEF' }, { x: 70, y: 60, label: 'DEF' },
                { x: 30, y: 25, label: 'DEL' }, { x: 70, y: 25, label: 'DEL' },
            ]
        },
        {
            nombre: '1-2-1',
            posiciones: [
                ARQUERO,
                { x: 50, y: 65, label: 'DEF' },
                { x: 20, y: 40, label: 'ALA' }, { x: 80, y: 40, label: 'ALA' },
                { x: 50, y: 20, label: 'DEL' },
            ]
        }
    ],
    '7': [
        {
            nombre: '3-2-1',
            posiciones: [
                ARQUERO,
                { x: 20, y: 70, label: 'LI' }, { x: 50, y: 70, label: 'LIB' }, { x: 80, y: 70, label: 'LD' },
                { x: 35, y: 40, label: 'MED' }, { x: 65, y: 40, label: 'MED' },
                { x: 50, y: 15, label: 'DEL' },
            ]
        },
        {
            nombre: '2-3-1',
            posiciones: [
                ARQUERO,
                { x: 30, y: 70, label: 'DEF' }, { x: 70, y: 70, label: 'DEF' },
                { x: 20, y: 40, label: 'ALA' }, { x: 50, y: 40, label: 'MED' }, { x: 80, y: 40, label: 'ALA' },
                { x: 50, y: 15, label: 'DEL' },
            ]
        }
    ],
    '8': [
        {
            nombre: '3-3-1',
            posiciones: [
                ARQUERO,
                { x: 20, y: 70, label: 'DEF' }, { x: 50, y: 70, label: 'DEF' }, { x: 80, y: 70, label: 'DEF' },
                { x: 20, y: 40, label: 'MED' }, { x: 50, y: 40, label: 'MED' }, { x: 80, y: 40, label: 'MED' },
                { x: 50, y: 15, label: 'DEL' },
            ]
        },
        {
            nombre: '2-3-2', // Famoso 8
            posiciones: [
                ARQUERO,
                { x: 30, y: 70, label: 'DEF' }, { x: 70, y: 70, label: 'DEF' },
                { x: 20, y: 45, label: 'CAR' }, { x: 50, y: 45, label: 'MED' }, { x: 80, y: 45, label: 'CAR' },
                { x: 35, y: 20, label: 'DEL' }, { x: 65, y: 20, label: 'DEL' },
            ]
        }
    ],
    '9': [
        {
            nombre: '3-3-2',
            posiciones: [
                ARQUERO,
                { x: 20, y: 70, label: 'LAT' }, { x: 50, y: 70, label: 'DEF' }, { x: 80, y: 70, label: 'LAT' },
                { x: 25, y: 45, label: 'MED' }, { x: 50, y: 45, label: 'MED' }, { x: 75, y: 45, label: 'MED' },
                { x: 35, y: 20, label: 'DEL' }, { x: 65, y: 20, label: 'DEL' },
            ]
        }
    ],
    '11': [
        {
            nombre: '4-3-3',
            posiciones: [
                ARQUERO,
                { x: 15, y: 75, label: 'LI' }, { x: 38, y: 75, label: 'DEC' }, { x: 62, y: 75, label: 'DEC' }, { x: 85, y: 75, label: 'LD' },
                { x: 30, y: 50, label: 'MC' }, { x: 50, y: 55, label: 'MCD' }, { x: 70, y: 50, label: 'MC' },
                { x: 20, y: 25, label: 'EXT' }, { x: 50, y: 20, label: 'DEL' }, { x: 80, y: 25, label: 'EXT' },
            ]
        },
        {
            nombre: '4-4-2',
            posiciones: [
                ARQUERO,
                { x: 15, y: 75, label: 'LI' }, { x: 38, y: 75, label: 'DEC' }, { x: 62, y: 75, label: 'DEC' }, { x: 85, y: 75, label: 'LD' },
                { x: 15, y: 50, label: 'MI' }, { x: 38, y: 50, label: 'MC' }, { x: 62, y: 50, label: 'MC' }, { x: 85, y: 50, label: 'MD' },
                { x: 35, y: 25, label: 'DEL' }, { x: 65, y: 25, label: 'DEL' },
            ]
        }
    ]
}
