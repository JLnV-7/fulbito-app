-- Fix: Auto-crear perfil cuando un usuario se registra
-- Esto evita el error de FK cuando un usuario nuevo intenta unirse a un grupo
-- sin haber visitado su perfil primero.

-- 1. Crear función que auto-crea el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Retroactivo: crear perfiles para usuarios que ya existen pero no tienen perfil
INSERT INTO public.profiles (id, username, avatar_url)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email::text, '@', 1)),
  NULL
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
