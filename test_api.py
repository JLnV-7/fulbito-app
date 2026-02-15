import os
import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

API_KEY_FUTBOL = os.getenv("API_KEY_FUTBOL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ID_PARTIDO = "1158661" 


url = f"https://v3.football.api-sports.io/fixtures/lineups?fixture={ID_PARTIDO}"
headers = {'x-rapidapi-host': "v3.football.api-sports.io", 'x-rapidapi-key': API_KEY_FUTBOL}
data = requests.get(url, headers=headers).json()

print("\n--- MODO 1x1 ACTIVADO ---")
for equipo in data['response']:
    print(f"\nPuntuando a: {equipo['team']['name']}")
    for jug in equipo['startXI'][:3]:  
        nombre = jug['player']['name']
        nota = input(f"¿Qué puntaje le ponés a {nombre}? (1-10): ")
        
        datos_voto = {
            "partido_id": int(ID_PARTIDO),
            "nombre_jugador": nombre,
            "puntaje": int(nota)
        }
        
        res = supabase.table("ratings_jugadores").insert(datos_voto).execute()
        print(f"✅ Guardado en Supabase: {nombre} sacó un {nota}")

print("\n¡Listo! Revisá tu tabla en Supabase ahora.")