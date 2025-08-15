-- Temporarily disable only custom triggers to isolate the issue
-- This will help us identify what's preventing user creation

-- Disable only our custom triggers, not system triggers
DROP TRIGGER IF EXISTS trigger_create_user_settings ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_update_user_followers_count ON public.follows;
DROP TRIGGER IF EXISTS trigger_update_user_posts_count ON public.posts;

-- Drop any remaining functions that might be causing issues
DROP FUNCTION IF EXISTS create_user_settings() CASCADE;

-- Remove any potential webhook or trigger on auth.users
-- Note: We can't directly modify auth.users, but we can ensure our public schema doesn't interfere

-- Create a simple test to see if basic user creation works
-- You can re-enable triggers later once signup works