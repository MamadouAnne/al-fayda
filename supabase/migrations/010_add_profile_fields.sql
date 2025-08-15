-- Add new profile fields to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS skills TEXT;