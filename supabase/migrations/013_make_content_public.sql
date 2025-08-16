-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Posts are viewable by users and their followers" ON public.posts;
DROP POLICY IF EXISTS "Stories are viewable by users and their followers" ON public.stories;

-- Create truly public policies for posts and stories
CREATE POLICY "Posts are publicly viewable" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Stories are publicly viewable" ON public.stories
  FOR SELECT USING (true);

-- Also ensure storage buckets are publicly accessible
-- Update storage bucket policies for public access
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true), 
       ('stories', 'stories', true), 
       ('avatars', 'avatars', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- Create storage policies for public read access
CREATE POLICY IF NOT EXISTS "Public read access for posts" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY IF NOT EXISTS "Public read access for stories" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY IF NOT EXISTS "Public read access for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');