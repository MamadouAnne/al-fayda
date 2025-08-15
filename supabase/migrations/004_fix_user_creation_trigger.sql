-- Fix user creation trigger to avoid foreign key constraint issues
-- Drop the existing trigger that might be causing issues (only on user_profiles since users table doesn't exist)
DROP TRIGGER IF EXISTS trigger_create_user_settings ON public.user_profiles;

-- Drop the function
DROP FUNCTION IF EXISTS create_user_settings();

-- Recreate the function to handle the case where user_profiles doesn't exist yet
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create user settings if we're working with user_profiles table
  -- or if this is being called from user_profiles
  IF TG_TABLE_NAME = 'user_profiles' THEN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only on user_profiles table, not on auth.users
CREATE TRIGGER trigger_create_user_settings
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();