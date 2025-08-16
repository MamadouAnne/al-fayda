-- Drop the existing policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;

-- Create new policies
CREATE POLICY "Posts are viewable by users and their followers" ON public.posts
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid() AND following_id = posts.user_id
    )
  );

CREATE POLICY "Stories are viewable by users and their followers" ON public.stories
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid() AND following_id = stories.user_id
    )
  );
