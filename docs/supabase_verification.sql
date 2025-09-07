-- 🧪 Verification Queries
-- Run these after setting up the main tables to verify everything works

-- 1. Check if profiles table exists and has correct structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if learning_progress table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'learning_progress' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'learning_progress');

-- 4. Check if policies exist
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'learning_progress');

-- 5. Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'handle_updated_at');

-- 6. Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('on_auth_user_created', 'on_profiles_updated');

-- 7. Test data (after you create your first user)
-- SELECT * FROM auth.users;
-- SELECT * FROM profiles;
