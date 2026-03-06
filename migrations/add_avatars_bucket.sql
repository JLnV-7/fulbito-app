-- Migration to create the 'avatars' storage bucket and set up RLS policies
-- Execute this using the Supabase SQL editor or CLI

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Needs to be public for avatar URLs to work
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the storage.objects table if not already enabled
-- Nota: Si tira error "must be owner of table objects", ya está habilitado por defecto en Supabase.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Access
-- Allow anyone to read avatars (since they are public profiles)
CREATE POLICY "Public Access for avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Policy: Authenticated users can upload avatars
-- Only allow authenticated users to upload files to their own folder path (user_id/filename)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    -- Ensure the user can only upload to a folder matching their own ID
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Authenticated users can update/delete their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
