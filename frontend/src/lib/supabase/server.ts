import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // In a real server environment, we should use SUPABASE_SERVICE_ROLE_KEY for admin tasks
  // but for user-scoped tasks, ANON_KEY is fine if RLS is set up.
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
