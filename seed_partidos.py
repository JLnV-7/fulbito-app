"""
Script para cargar partidos de ejemplo a Supabase
Ejecutar: python seed_partidos.py
"""
import os
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Partidos de ejemplo - campos minimos
PARTIDOS_EJEMPLO = [
    {
        "liga": "Liga Profesional",
        "equipo_local": "Talleres",
        "equipo_visitante": "Belgrano",
        "fecha_inicio": (datetime.now() - timedelta(hours=3)).isoformat(),
    },
    {
        "liga": "Liga Profesional",
        "equipo_local": "River Plate",
        "equipo_visitante": "Boca Juniors",
        "fecha_inicio": (datetime.now() + timedelta(hours=2)).isoformat(),
    },
    {
        "liga": "Liga Profesional",
        "equipo_local": "Racing Club",
        "equipo_visitante": "Independiente",
        "fecha_inicio": datetime.now().isoformat(),
    },
    {
        "liga": "La Liga",
        "equipo_local": "Real Madrid",
        "equipo_visitante": "Barcelona",
        "fecha_inicio": (datetime.now() - timedelta(days=1)).isoformat(),
    },
    {
        "liga": "La Liga",
        "equipo_local": "Atletico Madrid",
        "equipo_visitante": "Sevilla",
        "fecha_inicio": (datetime.now() + timedelta(days=1)).isoformat(),
    },
    {
        "liga": "Premier League",
        "equipo_local": "Manchester City",
        "equipo_visitante": "Liverpool",
        "fecha_inicio": (datetime.now() - timedelta(hours=5)).isoformat(),
    },
    {
        "liga": "Premier League",
        "equipo_local": "Arsenal",
        "equipo_visitante": "Chelsea",
        "fecha_inicio": (datetime.now() + timedelta(days=2)).isoformat(),
    },
]

def main():
    print("=" * 50)
    print("CARGANDO PARTIDOS DE EJEMPLO A SUPABASE")
    print("=" * 50)
    
    exitos = 0
    for partido in PARTIDOS_EJEMPLO:
        try:
            result = supabase.table("partidos").insert(partido).execute()
            print(f"[OK] {partido['equipo_local']} vs {partido['equipo_visitante']}")
            exitos += 1
        except Exception as e:
            print(f"[X] Error: {e}")
    
    print(f"\n{'=' * 50}")
    print(f"Cargados exitosamente: {exitos}/{len(PARTIDOS_EJEMPLO)} partidos")
    print("=" * 50)

if __name__ == "__main__":
    main()
