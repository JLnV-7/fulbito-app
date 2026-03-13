# ⚽ FutLog - Tu Letterboxd del Fútbol

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
#    - Project name? futlog (o el que quieras)
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
      NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
      API_KEY_FUTBOL=tu_api_key_aqui
     ```
   - Click en **Deploy**

4. **Esperá 2-3 minutos** → ¡Listo! Tenés tu link tipo `futlog-xxx.vercel.app`

### Opción 3: Si tenés Git instalado

```bash
# 1. Inicializar repo
git init
git add .
git commit -m "Initial commit - Fulbito PWA"

# 2. Subir a GitHub
# (Creá un repo en github.com primero)
git remote add origin https://github.com/TU_USUARIO/futlog.git
git push -u origin main

# 3. Deploy en Vercel (conectar repo desde dashboard)
# Seguir los pasos de la Opción 2
```

## 📱 Después del Deploy

Una vez deployado, tus amigos pueden:

1. **Android:** Entrar a `futlog-xxx.vercel.app` → Menú (⋮) → "Instalar app"
2. **iPhone:** Safari → Compartir → "Agregar a pantalla de inicio"

La app va a funcionar con HTTPS y se podrá instalar correctamente como PWA.

## 🏁 Estado Actual y Logros

El proyecto ha alcanzado un estado funcional avanzado con las siguientes características implementadas:

- **Estructura Next.js 15+**: App Router configurado y listo para producción.
- **Base de Datos Supabase**: Esquema de tablas para usuarios, partidos, prodes y estadísticas globales.
- **Integración API-Football**: Consumo de datos en tiempo real para fixtures, tablas de posiciones y goleadores.
- **PWA Ready**: Configuración de manifiesto y service workers básica para instalación en dispositivos.
- **Sistema de Prodes**: Funcionalidad para que los usuarios guarden sus predicciones.
- **Auditoría de UX**: Se realizó un análisis exhaustivo de usabilidad y diseño (ver `AUDIT_REPORT.md`).

---

## 🚀 Roadmap de Futuras Mejoras

### Fase 1: Automatización (Próxima Prioridad)
- **Cron Jobs**: Implementar tareas programadas para sincronizar resultados de la API a la DB automáticamente.
- **Cálculo de Puntos**: Automatizar la distribución de puntos a los usuarios tras finalizar los partidos.

### Fase 2: Consistencia y UX
- **Detalle de Partido**: Migrar `/partido/[id]` para consumir datos vivos de la API.
- **Push Notifications**: Finalizar la integración de avisos de goles y resultados.
- **Perfil Pro**: Añadir historial detallado, rachas de aciertos y sistema de medallas.

---

## 🛠️ Stack Técnico

- **Frontend:** Next.js 15 + React + TypeScript
- **Styling:** Tailwind CSS + Custom Design System
- **Database:** Supabase (PostgreSQL)
- **API:** API-Football
- **PWA:** Service Worker + Web Manifest
- **Deploy:** Vercel

---

## 📁 Estructura

```
fulbito-app/
├── frontend/          # Aplicación Next.js (Core)
├── supabase/          # Configuración y esquemas de base de datos
├── migrations/        # Scripts SQL de evolución de DB
├── scripts/           # Herramientas de carga y prueba de datos
└── vercel.json       # Configuración de despliegue
```
