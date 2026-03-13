import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Borrando todos los partidos...")
result = supabase.table("partidos").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
print(f"✅ Partidos borrados")
