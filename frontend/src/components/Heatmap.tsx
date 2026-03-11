'use client'

import { useEffect, useRef } from 'react'

interface Point {
    x: number
    y: number
    value: number
}

interface HeatmapProps {
    points?: Point[]
    width?: number
    height?: number
}

export function Heatmap({ points = [], width = 300, height = 400 }: HeatmapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear
        ctx.clearRect(0, 0, width, height)

        // Draw Field background (dark version)
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, width, height)

        // Field lines
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1
        ctx.strokeRect(10, 10, width - 20, height - 20) // Outer
        ctx.beginPath()
        ctx.moveTo(10, height / 2)
        ctx.lineTo(width - 10, height / 2) // Mid line
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2) // Center circle
        ctx.stroke()

        // Create virtual canvas for heat calculation
        const heatCanvas = document.createElement('canvas')
        heatCanvas.width = width
        heatCanvas.height = height
        const hctx = heatCanvas.getContext('2d')
        if (!hctx) return

        // Mock points if empty for demo
        const displayPoints = points.length > 0 ? points : [
            { x: 50, y: 30, value: 0.8 },
            { x: 150, y: 80, value: 1.0 },
            { x: 250, y: 120, value: 0.7 },
            { x: 150, y: 200, value: 0.9 },
            { x: 100, y: 350, value: 0.6 },
            { x: 200, y: 320, value: 0.7 },
            { x: 150, y: 380, value: 1.0 },
        ].map(p => ({ x: (p.x / 300) * width, y: (p.y / 400) * height, value: p.value }))

        // Radial gradients for heat
        displayPoints.forEach(p => {
            const grad = hctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40)
            grad.addColorStop(0, `rgba(255,0,0,${p.value * 0.5})`)
            grad.addColorStop(1, 'rgba(255,0,0,0)')
            hctx.fillStyle = grad
            hctx.fillRect(p.x - 40, p.y - 40, 80, 80)
        })

        // Colorize based on alpha
        const imageData = hctx.getImageData(0, 0, width, height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3]
            if (alpha > 0) {
                // Map alpha to heatmap colors (blue -> green -> yellow -> red)
                if (alpha < 64) { // Blue/Cyan
                    data[i] = 0; data[i + 1] = alpha * 4; data[i + 2] = 255;
                } else if (alpha < 128) { // Green
                    data[i] = 0; data[i + 1] = 255; data[i + 2] = 255 - (alpha - 64) * 4;
                } else if (alpha < 192) { // Yellow
                    data[i] = (alpha - 128) * 4; data[i + 1] = 255; data[i + 2] = 0;
                } else { // Red
                    data[i] = 255; data[i + 1] = 255 - (alpha - 192) * 4; data[i + 2] = 0;
                }
                // Maintain smooth alpha
                data[i + 3] = alpha * 0.8
            }
        }
        ctx.putImageData(imageData, 0, 0)

    }, [points, width, height])

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative border-2 border-[var(--card-border)] rounded-2xl overflow-hidden shadow-xl bg-black">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="block"
                />

                {/* HUD Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/50 bg-white/5 px-2 py-0.5 rounded-full capitalize tracking-tighter">
                        Mapa de Calor
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6 text-[10px] font-bold text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Baja actividad
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Alta actividad
                </div>
            </div>
        </div>
    )
}
