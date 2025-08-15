-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatars" ON storage.objects;

-- Create policy to allow authenticated users to upload their own avatars
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to avatars
CREATE POLICY "Allow public read access to avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Create policy to allow users to update their own avatars
CREATE POLICY "Allow users to update own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Allow users to delete own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);