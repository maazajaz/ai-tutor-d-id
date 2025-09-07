# Supabase Setup Guide for AI Tutor Chat History

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization and create a new project
5. Set a database password (save this securely)
6. Wait for the project to be created (2-3 minutes)

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxxxxxxxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Update Environment Variables

1. Open `frontend/.env` file
2. Replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

## 4. Set Up Database Tables

1. In Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy and paste the contents of `database_setup.sql`
4. Run the query to create tables and security policies

## 5. Test the Integration

1. Restart your frontend development server
2. Try signing up with a new account
3. Create some chat sessions
4. Verify data is saved in Supabase (Data → Tables)

## Features Enabled

✅ **User Authentication**: Sign up/Sign in with email
✅ **Cloud Chat Storage**: Chat sessions saved to Supabase
✅ **Cross-Device Sync**: Access chats from any device
✅ **Offline Support**: Falls back to localStorage for anonymous users
✅ **Notes**: Save notes for each chat session
✅ **Session Management**: Create, load, and switch between chat sessions

## Security Features

- Row Level Security (RLS) policies ensure users only see their own data
- Anonymous users can still use the app with localStorage
- Automatic profile creation when users sign up
- Secure password handling with Supabase Auth

## Troubleshooting

- **Environment variables not loading**: Make sure to restart your dev server after updating `.env`
- **Database errors**: Verify the SQL script ran successfully in Supabase
- **Authentication issues**: Check the browser console for detailed error messages
- **Data not syncing**: Ensure you're signed in and have proper network connectivity
