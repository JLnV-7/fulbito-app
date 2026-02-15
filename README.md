# ⚽ Fulbito - App de Votación de Jugadores

Progressive Web App para votar jugadores de fútbol en tiempo real.

## 🚀 Deploy en Vercel

### Opción 1: Deploy con Vercel CLI (Rápido)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login (te abre el navegador)
vercel login

# 3. Deploy desde la raíz del proyecto
vercel

# 4. Seguir las instrucciones:
#    - Set up and deploy? Yes
#    - Which scope? Tu cuenta
#    - Link to existing? No
#    - Project name? fulbito (o el que quieras)
#    - Directory? ./ (la raíz)
#    - Override settings? No
```

### Opción 2: Deploy desde el Dashboard (Sin CLI)

**Si no tenés Git instalado:**

1. **Descargá GitHub Desktop:** https://desktop.github.com/
2. **Subí el proyecto a GitHub:**
   - Abrí GitHub Desktop
   - File → Add Local Repository → Elegí `C:\Users\julia\Desktop\fulbitoo`
   - Publish repository → Público
   
3. **Deploy en Vercel:**
   - Andá a https://vercel.com
   - Registrate/Login (podés usar GitHub)
   - Click en "Add New..." → "Project"
   - "Import Git Repository" → Buscá "fulbitoo"
   - **Settings importantes:**
     - Framework Preset: **Next.js**
     - Root Directory: **frontend** ⚠️ (MUY IMPORTANTE)
     - Build Command: `npm run build`
     - Output Directory: `.next`
   - **Environment Variables:** Agregá las del `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://vedoanybvpwjmcalkpmi.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2
     API_KEY_FUTBOL=f5b26d9993569070de3e2f5e12ade21c
     ```
   - Click en **Deploy**

4. **Esperá 2-3 minutos** → ¡Listo! Tenés tu link tipo `fulbito-xxx.vercel.app`

### Opción 3: Si tenés Git instalado

```bash
# 1. Inicializar repo
git init
git add .
git commit -m "Initial commit - Fulbito PWA"

# 2. Subir a GitHub
# (Creá un repo en github.com primero)
git remote add origin https://github.com/TU_USUARIO/fulbito.git
git push -u origin main

# 3. Deploy en Vercel (conectar repo desde dashboard)
# Seguir los pasos de la Opción 2
```

## 📱 Después del Deploy

Una vez deployado, tus amigos pueden:

1. **Android:** Entrar a `fulbito-xxx.vercel.app` → Menú (⋮) → "Instalar app"
2. **iPhone:** Safari → Compartir → "Agregar a pantalla de inicio"

La app va a funcionar con HTTPS y se podrá instalar correctamente como PWA.

## 🛠️ Stack Técnico

- **Frontend:** Next.js 16 + React + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **API:** API-Football
- **PWA:** Service Worker + Manifest
- **Deploy:** Vercel

## 📁 Estructura

```
fulbitoo/
├── frontend/          # App Next.js (lo que se deploya)
├── migrations/        # SQL para Supabase
├── *.py              # Scripts Python para cargar datos
└── vercel.json       # Config de deploy
```
