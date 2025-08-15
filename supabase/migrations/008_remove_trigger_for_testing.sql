-- Temporarily remove the auth trigger to test basic signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- This will allow us to test if basic Supabase auth signup works
-- without any custom triggers interfering