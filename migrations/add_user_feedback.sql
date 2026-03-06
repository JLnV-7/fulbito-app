-- Migration to create the 'user_feedback' table and set up RLS policies
-- Execute this using the Supabase SQL editor or CLI

CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT NULL, -- Null if not logged in
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios (autenticados o anónimos) pueden insertar feedback
-- Usamos 'anon' y 'authenticated' roles en Postgres (que en Supabase son representados por la DB)
CREATE POLICY "Anyone can insert feedback" 
ON user_feedback FOR INSERT 
WITH CHECK (true);

-- Política: Solo los admins pueden leer el feedback (asumiendo que tenés un rol o no querés que nadie lea por ahora)
-- Por simplicidad, bloqueamos la lectura pública. Nadie puede hacer select desde la app cliente.
CREATE POLICY "No one can read feedback except admins" 
ON user_feedback FOR SELECT 
USING (false);

-- Opcional: Si querés que los propios usuarios puedan leer su propio feedback (aunque no suele ser necesario para esta feature)
-- CREATE POLICY "Users can read their own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);
