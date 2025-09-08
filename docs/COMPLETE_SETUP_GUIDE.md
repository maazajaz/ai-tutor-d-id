# 🎓 AI Digital Tutor - Complete Setup Guide

## Overview
This guide will help you set up the AI Digital Tutor project on a new laptop. The project consists of a React frontend with 3D avatar and a Node.js backend for AI chat functionality.

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Choose LTS version
   - Verify installation: `node --version` and `npm --version`

2. **Git** 
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **Code Editor** (Recommended: VS Code)
   - Download from: https://code.visualstudio.com/

### Required API Keys
You'll need to obtain these API keys:

1. **OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create account and generate API key
   - Note: This requires a paid OpenAI account

2. **ElevenLabs API Key**
   - Go to: https://elevenlabs.io/
   - Create account and get API key from profile
   - Note: Free tier available with limited characters

3. **Supabase Project** (for chat persistence)
   - Go to: https://supabase.com/
   - Create new project
   - Get project URL and anon key from settings

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/maazajaz/ai-tutor-full-stack.git
cd ai-tutor-full-stack
```

### Step 2: Install Dependencies

```bash
npm install
```

**Note**: This project uses a monorepo setup where all dependencies (frontend and backend) are managed from the root directory. There's no separate `server/package.json` file.

### Step 3: Environment Configuration

Create a **single** `.env` file in the root directory with all configuration:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Frontend Configuration (VITE_ prefix required)
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NODE_ENV=development
```

**Important Notes**: 
- Only **ONE** `.env` file in the root directory
- Backend variables (OPENAI_API_KEY, ELEVENLABS_API_KEY) don't need VITE_ prefix
- Frontend variables need `VITE_` prefix to be accessible in browser
- Both frontend and backend read from the same `.env` file

### Step 4: Supabase Database Setup

#### 4.1 Create Supabase Tables
Execute these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS (Row Level Security)
create table public.chat_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  messages jsonb default '[]'::jsonb,
  notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_sessions enable row level security;

-- Create policies
create policy "Users can view their own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create their own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);
```

#### 4.2 Configure Supabase Authentication
1. Go to Authentication > Settings in Supabase dashboard
2. Enable Email authentication
3. **Site URL Configuration:**
   - For Development: `http://localhost:5173`
   - For Production: `https://ai-tutor-final-sepia.vercel.app`
4. **Redirect URLs Configuration:**
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://ai-tutor-final-sepia.vercel.app/auth/callback`
   
**Important for Production:**
- Set Site URL to: `https://ai-tutor-final-sepia.vercel.app`
- Add redirect URL: `https://ai-tutor-final-sepia.vercel.app/auth/callback`
- This ensures email verification links redirect to your live app, not localhost

### Step 5: Project Structure Verification
Ensure your project has this structure:
```
ai-tutor-full-stack/
├── src/
│   ├── components/
│   │   ├── Avatar.jsx                       # 3D avatar with lip-sync
│   │   ├── UI.jsx                           # User interface
│   │   └── Experience.jsx                   # 3D scene setup
│   ├── hooks/
│   │   └── useChat.jsx                      # Chat logic and API integration
│   └── lib/
│       └── supabase.js                      # Supabase configuration
├── public/
│   ├── models/
│   │   ├── 64f1a714fe61576b46f27ca2.glb     # Main avatar
│   │   └── animations.glb                   # Avatar animations
│   └── animations/                          # Additional animations
├── server/
│   ├── server.js                            # Main backend file (NO package.json here)
│   └── serverless-audio.js                  # Audio processing
├── bin/
│   └── rhubarb.exe                         # Lip-sync tool
├── audios/                                 # Generated audio files
├── package.json                            # ALL dependencies here
├── .env                                    # SINGLE environment file
└── COMPLETE_SETUP_GUIDE.md
```
└── COMPLETE_SETUP_GUIDE.md
```

## 🚀 Production Configuration (Vercel Deployment)

### Update Supabase for Production
To fix email verification redirecting to localhost instead of your live app:

1. **Go to Supabase Dashboard** → Your Project → Authentication → Settings
2. **Update Site URL:**
   ```
   https://ai-tutor-final-sepia.vercel.app
   ```
3. **Update Redirect URLs** (add both development and production):
   ```
   http://localhost:5173/auth/callback
   https://ai-tutor-final-sepia.vercel.app/auth/callback
   ```
4. **Save Configuration**

### Vercel Environment Variables
In your Vercel dashboard, add these environment variables:
```env
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_URL=https://ai-tutor-final-sepia.vercel.app
CORS_ORIGIN=https://ai-tutor-final-sepia.vercel.app
NODE_ENV=production
```

## 🏃‍♂️ Running the Application

### Start the App (Single Terminal)
```bash
npm run dev
```

This command will:
- Start the backend server on port 3000
- Start the frontend development server on port 5173
- Run both concurrently with live reload

Expected output:
```
[0] 🔧 Environment Check:
[0] OpenAI API Key present: true
[0] ElevenLabs API Key present: true
[0] 🎓 AI Digital Tutor listening on port 3000
[1] VITE v4.x.x  ready in xxx ms
[1] ➜  Local:   http://localhost:5173/
```

### Step 6: Verify Installation

#### 6.1 Check Backend Health
Visit: http://localhost:3000
Should show: "🎓 AI Digital Tutor API - Ready to help students learn!"

#### 6.2 Check Frontend
Visit: http://localhost:5173
Should show the 3D avatar and chat interface

#### 6.3 Test API Keys
1. Check ElevenLabs: http://localhost:3000/elevenlabs-status
2. Try sending a chat message to verify OpenAI integration

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: "Module not found" errors
**Solution:**
```bash
# Clear node_modules and reinstall (single command)
rm -rf node_modules package-lock.json
npm install
```

#### Issue 2: Port already in use
**Solution:**
```bash
# Kill processes on ports 3000 and 5173
npx kill-port 3000
npx kill-port 5173
```

#### Issue 3: CORS errors
**Solution:**
- Ensure `.env` file has `CORS_ORIGIN=http://localhost:5173`
- Restart the application: `npm run dev`

#### Issue 4: Avatar not loading
**Solution:**
- Verify files exist in `public/models/`
- Check browser console for 404 errors
- Ensure GLTF model files are not corrupted

#### Issue 5: API key errors
**Solution:**
- Verify all API keys are correctly set in .env files
- Check for extra spaces or quotes in API keys
- Restart servers after changing .env files

#### Issue 6: Supabase connection issues
**Solution:**
- Verify Supabase URL and keys in `.env` file
- Check if tables are created correctly
- Verify RLS policies are set up

### Debug Commands

#### Check Environment Variables
```bash
# Check if .env file exists and is readable
cat .env

# Test if environment variables are loading
node -e "require('dotenv').config(); console.log('OpenAI Key:', !!process.env.OPENAI_API_KEY, 'ElevenLabs Key:', !!process.env.ELEVENLABS_API_KEY)"
```

#### Test API Endpoints
```bash
# Test backend health
curl http://localhost:3000

# Test ElevenLabs integration
curl http://localhost:3000/elevenlabs-status

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

## 📱 Features Overview

### Core Features
- ✅ 3D Avatar with lip-sync animation
- ✅ AI-powered tutoring (OpenAI GPT)
- ✅ Voice synthesis (ElevenLabs)
- ✅ Multi-language support (English/Hinglish)
- ✅ Chat history persistence (Supabase)
- ✅ User authentication
- ✅ Programming/CS focused questions
- ✅ Notes generation

### Tech Stack
- **Frontend**: React, Vite, Three.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-3.5/4, ElevenLabs TTS
- **Database**: Supabase (PostgreSQL)
- **3D**: GLTF models, animations, lip-sync

## 📝 Development Notes

### Important Files
- `src/components/Avatar.jsx` - 3D avatar component with lip-sync
- `src/hooks/useChat.jsx` - Chat logic and API integration
- `src/components/UI.jsx` - User interface components
- `server/server.js` - Backend API server
- `bin/rhubarb.exe` - Lip-sync generation tool

### API Endpoints
- `POST /api/chat` - Main chat endpoint
- `GET /elevenlabs-status` - Check ElevenLabs API status
- `POST /api/generate-notes` - Generate AI notes from chat

### Environment Variables Reference
| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for chat | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |

## 🚀 Deployment Notes

### For Production Deployment
1. Update CORS_ORIGIN in backend .env
2. Update VITE_API_URL in frontend .env
3. Configure Supabase site URL for production domain
4. Ensure all environment variables are set in hosting platform

### Performance Optimization
- Avatar models are optimized for web
- Chat history limited to last 10 messages for API calls
- Backend payload limit increased to 50MB for large histories

## 🆘 Support

If you encounter issues:
1. Check this troubleshooting guide first
2. Verify all prerequisites are installed
3. Ensure all environment variables are correctly set
4. Check browser console and terminal logs for errors
5. Restart both frontend and backend servers

## 🎯 Quick Start Checklist

- [ ] Install Node.js, Git, VS Code
- [ ] Clone repository
- [ ] Install dependencies (root + server)
- [ ] Get API keys (OpenAI, ElevenLabs, Supabase)
- [ ] Create .env files (root + server)
- [ ] Set up Supabase database tables
- [ ] Start backend server (Terminal 1)
- [ ] Start frontend server (Terminal 2)
- [ ] Test application at http://localhost:5173
- [ ] Verify avatar loads and chat works

---

**🎓 Happy Learning with AI Digital Tutor!**
