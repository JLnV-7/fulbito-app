"""
Script para cargar partidos reales desde API-SPORTS a Supabase
Usa partidos recientes históricos (Enero 2025) ya que la API no tiene datos futuros
"""
import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
import requests

load_dotenv()

API_KEY = os.getenv("API_KEY_FUTBOL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# IDs de ligas en API-SPORTS
LIGAS = {
    128: "Liga Profesional",    # Argentina Primera División
    129: "Primera Nacional",    # Argentina Segunda División (Ascenso)
    140: "La Liga",             # España
    39: "Premier League",       # Inglaterra
}

def obtener_partidos(liga_id: int):
    """Obtiene partidos recientes de una liga"""
    # Usar fechas de Enero 2025 que sí tienen datos
    fecha_desde = "2025-01-15"
    fecha_hasta = "2025-01-31"
    
    # Temporada correcta
    season = 2025 if liga_id == 128 else 2024
    
    url = "https://v3.football.api-sports.io/fixtures"
    params = {
        "league": liga_id,
        "season": season,
        "from": fecha_desde,
        "to": fecha_hasta,
    }
    headers = {
        "x-rapidapi-host": "v3.football.api-sports.io",
        "x-rapidapi-key": API_KEY,
    }
    
    print(f"    Consultando: liga={liga_id}, season={season}, desde={fecha_desde}, hasta={fecha_hasta}")
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    if "response" not in data:
        print(f"[X] Error: {data.get('message', 'Sin respuesta')}")
        return []
    
    return data["response"]

def cargar_partido(partido_api, nombre_liga: str):
    """Carga un partido a Supabase con fixture_id, logos y scores"""
    try:
        fixture = partido_api["fixture"]
        teams = partido_api["teams"]
        goals = partido_api["goals"]
        
        partido_data = {
            "fixture_id": fixture["id"],
            "liga": nombre_liga,
            "equipo_local": teams["home"]["name"],
            "equipo_visitante": teams["away"]["name"],
            "fecha_inicio": fixture["date"],
            "logo_local": teams["home"]["logo"],
            "logo_visitante": teams["away"]["logo"],
            "goles_local": goals["home"] or 0,
            "goles_visitante": goals["away"] or 0,
        }
        
        # Upsert por fixture_id
        supabase.table("partidos").upsert(
            partido_data,
            on_conflict="fixture_id"
        ).execute()
        
        status = fixture["status"]["short"]
        print(f"[OK] {teams['home']['name']} vs {teams['away']['name']} [{status}]")
        return True
    except Exception as e:
        print(f"[X] Error: {e}")
        return False

def main():
    print("=" * 50)
    print("CARGANDO PARTIDOS REALES")
    print("=" * 50)
    
    total = 0
    
    for liga_id, nombre_liga in LIGAS.items():
        print(f"\n[*] {nombre_liga}...")
        partidos = obtener_partidos(liga_id)
        
        if not partidos:
            print("    Sin partidos")
            continue
        
        print(f"    Encontrados: {len(partidos)}")
        
        # Tomar primeros 5 de cada liga
        for partido in partidos[:5]:
            if cargar_partido(partido, nombre_liga):
                total += 1
    
    print(f"\n{'=' * 50}")
    print(f"Total: {total} partidos")
    print("=" * 50)

if __name__ == "__main__":
    main()
