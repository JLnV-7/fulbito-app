// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// ✅ Usar variables de entorno en lugar de hardcodear las keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Faltan variables de entorno de Supabase.\n' +
    'Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local\n' +
    'Copiá .env.local.example y renombralo a .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 🔧 Helper para verificar si el usuario está autenticado
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

// 🔧 Helper para verificar sesión
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error obteniendo sesión:', error)
    return null
  }
}

// 🔧 Helper para cerrar sesión
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    return false
  }
}