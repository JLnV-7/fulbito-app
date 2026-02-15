-- FIX MISSING PROFILES (CORRECTED)
-- This script fills the 'public.profiles' table with users from 'auth.users' that don't have a profile yet.
-- Version 2: Removed 'full_name' column which does not exist.

INSERT INTO public.profiles (id, username, avatar_url, updated_at)
SELECT 
  id, 
  COALESCE(
    raw_user_meta_data->>'username', 
    split_part(email, '@', 1), 
    'user_' || substr(id::text, 1, 8)
  ) as username,
  COALESCE(
    raw_user_meta_data->>'avatar_url', 
    ''
  ) as avatar_url,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
