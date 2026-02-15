import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatearHora = (fecha: string) => {
    try {
        const date = new Date(fecha)
        return date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return '--:--'
    }
}

export const formatearFecha = (fecha: string) => {
    try {
        const date = new Date(fecha)
        const hoy = new Date()
        const esHoy = date.toDateString() === hoy.toDateString()

        if (esHoy) return 'Hoy'

        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short'
        })
    } catch {
        return ''
    }
}

export const generateCalendarUrl = (partido: {
    fecha_inicio: string,
    equipo_local: string,
    equipo_visitante: string,
    liga: string
}) => {
    const startDate = new Date(partido.fecha_inicio)
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // +2 horas

    const formatForCalendar = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '')
    }

    const title = encodeURIComponent(`⚽ ${partido.equipo_local} vs ${partido.equipo_visitante}`)
    const details = encodeURIComponent(`Partido de ${partido.liga}\n\nSeguilo en Fulbito 🔥`)
    const location = encodeURIComponent(partido.liga)

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${details}&location=${location}`
}
