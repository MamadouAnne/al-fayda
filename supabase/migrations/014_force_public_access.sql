-- Force public access for all users' posts and stories
-- Disable RLS temporarily to ensure complete access

-- Disable RLS entirely for posts and stories tables
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Posts are viewable by users and their followers" ON public.posts;
DROP POLICY IF EXISTS "Stories are viewable by users and their followers" ON public.stories;
DROP POLICY IF EXISTS "Posts are publicly viewable" ON public.posts;
DROP POLICY IF EXISTS "Stories are publicly viewable" ON public.stories;
DROP POLICY IF EXISTS "User profiles are publicly viewable" ON public.user_profiles;

-- Re-enable RLS with truly public policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create completely open public policies
CREATE POLICY "Allow all access to posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Ensure storage is completely public
UPDATE storage.buckets SET public = true WHERE id IN ('posts', 'stories', 'avatars');

-- Drop and recreate storage policies to ensure they're open
DROP POLICY IF EXISTS "Public read access for posts" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for stories" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;

CREATE POLICY "Public access for posts storage" ON storage.objects 
  FOR ALL USING (bucket_id = 'posts') WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Public access for stories storage" ON storage.objects 
  FOR ALL USING (bucket_id = 'stories') WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Public access for avatars storage" ON storage.objects 
  FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');