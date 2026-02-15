import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Ver los primeros 3 partidos con sus goles
result = supabase.table("partidos").select("id, equipo_local, equipo_visitante, goles_local, goles_visitante, fecha_inicio").limit(3).execute()

for partido in result.data:
    print(f"{partido['equipo_local']} {partido.get('goles_local', '?')} - {partido.get('goles_visitante', '?')} {partido['equipo_visitante']}")
    print(f"  ID: {partido['id']}, Fecha: {partido['fecha_inicio']}")
    print()
