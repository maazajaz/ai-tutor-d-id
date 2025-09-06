# 🚀 Supabase Setup Guide - User Authentication

This guide will help you set up Supabase for user authentication in your AI Python Tutor application.

## 📋 Prerequisites

- A Supabase account (free tier available)
- Basic understanding of SQL (for database setup)

## 🔧 Step 1: Create Supabase Project

1. **Sign up for Supabase**:
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Create account or sign in

2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - Name: `ai-python-tutor`
     - Database Password: (create a strong password)
     - Region: Choose closest to your users
   - Click "Create new project"

3. **Wait for Setup** (2-3 minutes)

## 🔑 Step 2: Get API Keys

1. **Navigate to Project Settings**:
   - Go to Settings → API
   - Copy these values:
     - `Project URL`
     - `anon public` key

2. **Add to Environment Variables**:
   ```bash
   # In frontend/.env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 🗄️ Step 3: Set Up Database Tables

1. **Go to SQL Editor**:
   - Navigate to SQL Editor in Supabase dashboard

2. **Create Profiles Table**:
   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     display_name TEXT,
     avatar_preference TEXT DEFAULT 'default',
     language_preference TEXT DEFAULT 'english',
     theme_preference TEXT DEFAULT 'light',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
     PRIMARY KEY (id)
   );

   -- Set up Row Level Security (RLS)
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Create policy for users to read their own profile
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   -- Create policy for users to update their own profile
   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);

   -- Create policy for users to insert their own profile
   CREATE POLICY "Users can insert own profile" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id);

   -- Create function to handle new user creation
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, display_name, avatar_preference, language_preference, theme_preference)
     VALUES (
       new.id,
       COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
       'default',
       'english',
       'light'
     );
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Create trigger to automatically create profile on signup
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. **Create Learning Progress Table** (Optional for future features):
   ```sql
   -- Create learning progress table
   CREATE TABLE learning_progress (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users ON DELETE CASCADE,
     topic TEXT NOT NULL,
     completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
     score INTEGER DEFAULT 0,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- Enable RLS
   ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own progress" ON learning_progress
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own progress" ON learning_progress
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own progress" ON learning_progress
     FOR UPDATE USING (auth.uid() = user_id);
   ```

## 🔐 Step 4: Configure Authentication

1. **Email Settings**:
   - Go to Authentication → Settings
   - Configure email templates (optional)
   - Set redirect URLs for your domain

2. **Provider Settings**:
   - Email/Password authentication is enabled by default
   - Add social providers if needed (Google, GitHub, etc.)

## 🧪 Step 5: Test Authentication

1. **Start Your Application**:
   ```bash
   npm run dev
   ```

2. **Test Signup Flow**:
   - Try creating a new account
   - Check Supabase dashboard → Authentication → Users
   - Verify profile was created in profiles table

3. **Test Login Flow**:
   - Sign out and sign back in
   - Verify user session persists

## 📊 Step 6: Database Verification

Check your Supabase dashboard:

1. **Authentication → Users**: Should show registered users
2. **Table Editor → profiles**: Should show user profiles
3. **SQL Editor**: Run test queries:
   ```sql
   SELECT * FROM profiles;
   SELECT * FROM auth.users;
   ```

## 🔧 Advanced Configuration

### Email Templates
Customize email templates in Authentication → Templates:
- Welcome email
- Password reset
- Email change confirmation

### Custom Claims
Add custom user metadata:
```sql
-- Add custom fields to user metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"subscription": "free", "role": "student"}'::jsonb
WHERE id = 'user-id-here';
```

### Security Rules
Additional RLS policies for enhanced security:
```sql
-- Prevent users from seeing other users' data
CREATE POLICY "No access to other users" ON profiles
  FOR ALL USING (auth.uid() = id);
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API key"**:
   - Verify environment variables are correct
   - Check .env file is in frontend/ directory
   - Restart development server

2. **"Row Level Security violation"**:
   - Check RLS policies are correctly set
   - Verify user is authenticated
   - Check policy conditions

3. **"Profile not found"**:
   - Check if trigger is working: `SELECT * FROM profiles;`
   - Manually create profile if needed
   - Verify handle_new_user() function exists

4. **Development Issues**:
   ```bash
   # Check environment variables
   console.log(import.meta.env.VITE_SUPABASE_URL)
   console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
   ```

## 📈 Usage Statistics

Monitor your application usage:
- Authentication → Users (user registrations)
- Reports → API (API usage)
- Settings → Billing (usage limits)

## 🔄 Backup & Recovery

1. **Database Backup**:
   - Settings → Database → Backups
   - Enable automatic backups

2. **Environment Variables Backup**:
   - Store API keys securely
   - Document configuration settings

## 🌟 Next Steps

After basic setup:
1. Customize user profiles with additional fields
2. Implement learning progress tracking
3. Add social authentication providers
4. Set up email notifications
5. Configure custom domains

---

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Discord**: https://discord.supabase.com

Your AI Python Tutor now has robust user authentication! 🎉
