'use client'
import { useState, useEffect } from 'react'

// Simulamos los estados para probar
type Estado = 'PREVIA' | 'EN_JUEGO' | 'POST'

export default function EstadoPartido() {
  const [estado, setEstado] = useState<Estado>('PREVIA')

  // Lógica para cambiar de estado (Esto después lo conectamos a la hora real)
  const cambiarEstado = (nuevoEstado: Estado) => setEstado(nuevoEstado)

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Selector de prueba (solo para que veas cómo cambia mientras codeamos) */}
      <div className="flex gap-2 mb-8 justify-center">
        <button onClick={() => cambiarEstado('PREVIA')} className="bg-gray-700 px-3 py-1 rounded text-xs">Previa</button>
        <button onClick={() => cambiarEstado('EN_JUEGO')} className="bg-red-600 px-3 py-1 rounded text-xs">En Vivo</button>
        <button onClick={() => cambiarEstado('POST')} className="bg-blue-600 px-3 py-1 rounded text-xs">Post</button>
      </div>

      {/* RENDERIZADO DINÁMICO */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        
        {estado === 'PREVIA' && (
          <div className="text-center animate-fade-in">
            <h2 className="text-xl font-bold text-yellow-500">⏳ LA PREVIA</h2>
            <p className="text-gray-400 mt-2">Falta poco para el arranque. ¿Cómo sale hoy el Matador?</p>
            {/* Aquí iría el historial o la formación */}
          </div>
        )}

        {estado === 'EN_JUEGO' && (
          <div className="text-center animate-pulse">
            <h2 className="text-xl font-bold text-red-500">⚽ EN VIVO</h2>
            <div className="bg-[#0a0a0a] h-64 mt-4 rounded-xl flex items-center justify-center border border-gray-800">
              <p className="text-gray-500">Aquí va el Chat en Tiempo Real...</p>
            </div>
          </div>
        )}

        {estado === 'POST' && (
          <div className="text-center animate-fade-in">
            <h2 className="text-xl font-bold text-green-500">⭐ PUNTAJES</h2>
            <p className="text-gray-400 mt-2">Terminó el partido. ¡Votá al 1x1!</p>
            {/* Aquí irían las estrellitas tipo Letterboxd */}
          </div>
        )}

      </div>
    </div>
  )
}