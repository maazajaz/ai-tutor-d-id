-- 🧪 Quick Database Test
-- Run this AFTER running the fixed setup to verify everything works

-- 1. Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'learning_progress');

-- 2. Check if trigger function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- 3. Check if trigger exists
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';

-- 4. Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'learning_progress');

-- 5. Check policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'learning_progress');

-- ✅ If you see results for all queries above, the setup is correct!
