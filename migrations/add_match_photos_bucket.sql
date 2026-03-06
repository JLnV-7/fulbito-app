-- Insert match_photos bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('match_photos', 'match_photos', true) 
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
-- Allow public access to view photos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING ( bucket_id = 'match_photos' );

-- Allow authenticated users to upload photos
CREATE POLICY "Auth Users Upload" ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'match_photos' AND auth.role() = 'authenticated' );

-- Allow users to manage their own photos
CREATE POLICY "Auth Users Update" ON storage.objects FOR UPDATE 
USING ( bucket_id = 'match_photos' AND auth.uid() = owner ) 
WITH CHECK ( bucket_id = 'match_photos' AND auth.uid() = owner );

CREATE POLICY "Auth Users Delete" ON storage.objects FOR DELETE 
USING ( bucket_id = 'match_photos' AND auth.uid() = owner );
