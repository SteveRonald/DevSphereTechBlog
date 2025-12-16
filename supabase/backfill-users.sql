-- Backfill existing users into user_profiles table
-- Run this if you have existing users in auth.users but not in user_profiles

-- Insert all existing auth.users into user_profiles
INSERT INTO user_profiles (id, email, created_at, updated_at)
SELECT 
  id,
  COALESCE(email, ''),
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO UPDATE
SET email = COALESCE(EXCLUDED.email, user_profiles.email),
    updated_at = NOW();

-- Verify the trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Check user counts
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM user_profiles) as profiles_count;

