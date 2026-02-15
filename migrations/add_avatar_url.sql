-- Migration: Add avatar_url to profiles
-- 

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS if needed (usually profiles policies already cover updates)
-- Just in case, ensure update policy includes new column
