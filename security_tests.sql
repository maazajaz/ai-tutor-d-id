-- 🧪 Security Testing Script
-- Run these queries to test your RLS policies and security

-- 1. Test basic RLS functionality
-- First, create a test user and profile (do this as authenticated user)

-- 2. Test that users can only see their own profile
SELECT * FROM profiles; -- Should only show current user's profile

-- 3. Test that users cannot access other users' data
-- This should return empty result if RLS is working
SELECT * FROM profiles WHERE id != auth.uid();

-- 4. Test INSERT policy - try to create profile for another user
-- This should fail
-- INSERT INTO profiles (id, display_name) VALUES ('00000000-0000-0000-0000-000000000000', 'Hacker');

-- 5. Test UPDATE policy - try to update another user's profile
-- This should fail
-- UPDATE profiles SET display_name = 'Hacked' WHERE id != auth.uid();

-- 6. Test DELETE policy - try to delete another user's profile  
-- This should fail
-- DELETE FROM profiles WHERE id != auth.uid();

-- 7. Check all active policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'learning_progress')
ORDER BY tablename, policyname;

-- 8. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'learning_progress');

-- 9. Test current user context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.email() as current_email;

-- 10. Test safe functions
SELECT * FROM get_user_profile();

-- 11. Test profile update function
SELECT * FROM update_user_profile(
  new_display_name := 'Test User',
  new_avatar_preference := 'friendly'
);

-- 12. Check audit log (if implemented)
SELECT * FROM profile_audit WHERE user_id = auth.uid() ORDER BY changed_at DESC LIMIT 10;

-- 13. Test constraints
-- These should fail with constraint violations:
-- INSERT INTO profiles (id, avatar_preference) VALUES (auth.uid(), 'invalid_avatar');
-- INSERT INTO profiles (id, theme_preference) VALUES (auth.uid(), 'invalid_theme');
-- INSERT INTO profiles (id, language_preference) VALUES (auth.uid(), 'invalid_language');

-- 14. Test learning progress security
INSERT INTO learning_progress (user_id, topic, score) 
VALUES (auth.uid(), 'Python Basics', 85);

SELECT * FROM learning_progress WHERE user_id = auth.uid();

-- 15. Try to access other users' learning progress (should return empty)
SELECT * FROM learning_progress WHERE user_id != auth.uid();

-- ✅ If all tests pass, your security is properly configured!
