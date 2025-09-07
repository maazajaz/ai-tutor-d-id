-- 🔒 Enhanced Security Configuration for AI Python Tutor
-- Additional security policies and best practices

-- 1. Create additional security policies for edge cases

-- Prevent users from deleting other users' profiles (extra safety)
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Prevent users from deleting other users' progress
CREATE POLICY "Users can delete own progress" ON learning_progress
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Create a view for safe profile access (optional)
CREATE VIEW safe_profiles AS
SELECT 
  id,
  display_name,
  avatar_preference,
  language_preference,
  theme_preference,
  created_at
FROM profiles
WHERE auth.uid() = id;

-- 3. Function to safely get user profile
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_preference TEXT,
  language_preference TEXT,
  theme_preference TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_preference,
    p.language_preference,
    p.theme_preference,
    p.created_at
  FROM profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- 4. Function to safely update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  new_display_name TEXT DEFAULT NULL,
  new_avatar_preference TEXT DEFAULT NULL,
  new_language_preference TEXT DEFAULT NULL,
  new_theme_preference TEXT DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile profiles;
BEGIN
  UPDATE profiles SET
    display_name = COALESCE(new_display_name, display_name),
    avatar_preference = COALESCE(new_avatar_preference, avatar_preference),
    language_preference = COALESCE(new_language_preference, language_preference),
    theme_preference = COALESCE(new_theme_preference, theme_preference),
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO updated_profile;
  
  RETURN updated_profile;
END;
$$;

-- 5. Create audit table for tracking profile changes (optional)
CREATE TABLE profile_audit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users
);

-- Enable RLS on audit table
ALTER TABLE profile_audit ENABLE ROW LEVEL SECURITY;

-- Policy for audit table (users can only see their own audit logs)
CREATE POLICY "Users can view own audit logs" ON profile_audit
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO profile_audit (user_id, action, new_values, changed_by)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO profile_audit (user_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO profile_audit (user_id, action, old_values, changed_by)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for audit logging
CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- 8. Create function to validate avatar preferences
CREATE OR REPLACE FUNCTION validate_avatar_preference(avatar_pref TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN avatar_pref IN ('default', 'casual', 'professional', 'friendly', 'energetic');
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to validate theme preferences
CREATE OR REPLACE FUNCTION validate_theme_preference(theme_pref TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN theme_pref IN ('light', 'dark', 'auto');
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to validate language preferences
CREATE OR REPLACE FUNCTION validate_language_preference(lang_pref TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN lang_pref IN ('english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'russian');
END;
$$ LANGUAGE plpgsql;

-- 11. Add constraints for data validation
ALTER TABLE profiles 
ADD CONSTRAINT valid_avatar_preference 
CHECK (validate_avatar_preference(avatar_preference));

ALTER TABLE profiles 
ADD CONSTRAINT valid_theme_preference 
CHECK (validate_theme_preference(theme_preference));

ALTER TABLE profiles 
ADD CONSTRAINT valid_language_preference 
CHECK (validate_language_preference(language_preference));

-- 12. Create policy to prevent unauthorized table access
CREATE POLICY "Authenticated users only" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users only" ON learning_progress
  FOR ALL USING (auth.role() = 'authenticated');

-- 13. Create function to check if user owns profile
CREATE OR REPLACE FUNCTION user_owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profile_id AND id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Enhanced security setup complete!
-- Your database now has comprehensive security measures.
