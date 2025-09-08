# 🚀 Quick Setup Checklist

## Pre-Setup Requirements ✅
- [ ] Install Node.js (v18+): https://nodejs.org/
- [ ] Install Git: https://git-scm.com/
- [ ] Install VS Code: https://code.visualstudio.com/
- [ ] Get OpenAI API Key: https://platform.openai.com/api-keys
- [ ] Get ElevenLabs API Key: https://elevenlabs.io/
- [ ] Create Supabase Project: https://supabase.com/

## Installation Steps 📥
```bash
# 1. Clone repository
git clone https://github.com/maazajaz/ai-tutor-full-stack.git
cd ai-tutor-full-stack

# 2. Install dependencies
npm install
cd server && npm install && cd ..
```

## Configuration 🔧
- [ ] Create `server/.env` with API keys
- [ ] Create `.env` in root with Supabase config
- [ ] Set up Supabase database tables (SQL in main guide)
- [ ] Configure Supabase authentication

## Running 🏃‍♂️
```bash
# Single command runs both frontend and backend
npm run dev
```

## Verification ✅
- [ ] Backend: http://localhost:3000 shows welcome message
- [ ] Frontend: http://localhost:5173 loads avatar
- [ ] ElevenLabs: http://localhost:3000/elevenlabs-status shows API status
- [ ] Send test chat message

## Quick Fixes 🔧
```bash
# Port issues
npx kill-port 3000 && npx kill-port 5173

# Module issues
rm -rf node_modules package-lock.json && npm install
cd server && rm -rf node_modules package-lock.json && npm install
```

**📖 For detailed instructions, see COMPLETE_SETUP_GUIDE.md**
