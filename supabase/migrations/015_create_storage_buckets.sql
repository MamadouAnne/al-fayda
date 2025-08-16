-- Create storage buckets for images and media

-- Create the posts bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create the stories bucket for story media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  20971520, -- 20MB limit (larger for videos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];

-- Create the avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Create storage policies for public access to all buckets
-- Posts bucket policies
DROP POLICY IF EXISTS "Posts storage public access" ON storage.objects;
CREATE POLICY "Posts storage public access" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'posts') 
  WITH CHECK (bucket_id = 'posts');

-- Stories bucket policies  
DROP POLICY IF EXISTS "Stories storage public access" ON storage.objects;
CREATE POLICY "Stories storage public access" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'stories') 
  WITH CHECK (bucket_id = 'stories');

-- Avatars bucket policies
DROP POLICY IF EXISTS "Avatars storage public access" ON storage.objects;
CREATE POLICY "Avatars storage public access" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'avatars') 
  WITH CHECK (bucket_id = 'avatars');