-- Migration: Add missing foreign key between match_logs and profiles
-- Run this in the Supabase SQL Editor
-- 
-- The match_logs table has user_id → auth.users(id)
-- But the PostgREST query uses profiles!match_logs_user_id_fkey
-- We need a FK from match_logs.user_id → profiles.id

-- Step 1: Drop the old FK if it exists (it goes to auth.users)
-- We keep the auth.users FK but add an ADDITIONAL one to profiles
DO $$ 
BEGIN
  -- Add FK to profiles (this is what PostgREST needs for the join)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_logs_user_id_fkey'
      AND confrelid = 'public.profiles'::regclass
  ) THEN
    -- The constraint might exist but point to auth.users, so we need to handle that
    -- First drop if it exists pointing somewhere else
    BEGIN
      ALTER TABLE match_logs DROP CONSTRAINT IF EXISTS match_logs_user_id_fkey;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
    -- Now create pointing to profiles
    ALTER TABLE match_logs
      ADD CONSTRAINT match_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Keep a FK to auth.users as well (with different name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_logs_user_id_auth_fkey'
  ) THEN
    ALTER TABLE match_logs
      ADD CONSTRAINT match_logs_user_id_auth_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Verify
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conrelid = 'match_logs'::regclass AND contype = 'f';
