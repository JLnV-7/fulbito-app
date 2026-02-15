-- Add is_admin column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update specific user (Julia) to be admin
-- REPLACE WITH ACTUAL USER ID OR EMAIL IF KNOWN, OR USER MUST RUN THIS MANUALLY
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'user_uuid_here';
