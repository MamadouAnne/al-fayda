-- Update all foreign key constraints to reference user_profiles instead of users

-- Drop all existing foreign key constraints
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.chat_members DROP CONSTRAINT IF EXISTS chat_members_user_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE public.saves DROP CONSTRAINT IF EXISTS saves_user_id_fkey;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE public.story_views DROP CONSTRAINT IF EXISTS story_views_user_id_fkey;
ALTER TABLE public.shares DROP CONSTRAINT IF EXISTS shares_user_id_fkey;
ALTER TABLE public.mentions DROP CONSTRAINT IF EXISTS mentions_mentioned_user_id_fkey;
ALTER TABLE public.mentions DROP CONSTRAINT IF EXISTS mentions_mentioning_user_id_fkey;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE public.blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;
ALTER TABLE public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_id_fkey;

-- Add new foreign key constraints referencing user_profiles
ALTER TABLE public.posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.likes ADD CONSTRAINT likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_fkey 
  FOREIGN KEY (follower_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows ADD CONSTRAINT follows_following_id_fkey 
  FOREIGN KEY (following_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.chat_members ADD CONSTRAINT chat_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages ADD CONSTRAINT messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.saves ADD CONSTRAINT saves_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.stories ADD CONSTRAINT stories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.story_views ADD CONSTRAINT story_views_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.shares ADD CONSTRAINT shares_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mentions ADD CONSTRAINT mentions_mentioned_user_id_fkey 
  FOREIGN KEY (mentioned_user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mentions ADD CONSTRAINT mentions_mentioning_user_id_fkey 
  FOREIGN KEY (mentioning_user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friend_requests ADD CONSTRAINT friend_requests_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocker_id_fkey 
  FOREIGN KEY (blocker_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_blocked_id_fkey 
  FOREIGN KEY (blocked_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reports ADD CONSTRAINT reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reports ADD CONSTRAINT reports_reported_user_id_fkey 
  FOREIGN KEY (reported_user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.device_tokens ADD CONSTRAINT device_tokens_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;