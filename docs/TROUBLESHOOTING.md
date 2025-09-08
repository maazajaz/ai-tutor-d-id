# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 🚫 Installation Issues

#### "node is not recognized as internal command"
**Problem**: Node.js not installed or not in PATH
**Solution**:
1. Download Node.js from https://nodejs.org/
2. Run installer as administrator
3. Restart terminal/command prompt
4. Verify: `node --version`

#### "git is not recognized as internal command"
**Problem**: Git not installed or not in PATH  
**Solution**:
1. Download Git from https://git-scm.com/
2. Run installer with default settings
3. Restart terminal
4. Verify: `git --version`

### 🔌 API Connection Issues

#### "OpenAI API key not found" or 401 errors
**Problem**: Invalid or missing OpenAI API key
**Solution**:
1. Check `.env` file in `server/` folder
2. Verify API key format: `OPENAI_API_KEY=sk-...`
3. Ensure no extra spaces or quotes
4. Check OpenAI account has credits
5. Restart backend server

#### "ElevenLabs API error" or 401 errors
**Problem**: Invalid ElevenLabs API key
**Solution**:
1. Check `.env` file: `ELEVENLABS_API_KEY=your_key`
2. Visit http://localhost:3000/elevenlabs-status to test
3. Verify account has character credits
4. Try regenerating API key

#### "Failed to connect to Supabase"
**Problem**: Supabase configuration issues
**Solution**:
1. Check frontend `.env` file
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Check Supabase project is active
4. Verify tables are created correctly

### 🌐 Server Issues

#### "Port 3000 is already in use"
**Problem**: Another process using port 3000
**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use kill-port
npx kill-port 3000
```

#### "Port 5173 is already in use"
**Problem**: Another process using port 5173
**Solution**:
```bash
npx kill-port 5173
# Or change port in package.json
npm run dev -- --port 3001
```

#### "CORS policy error"
**Problem**: Frontend can't connect to backend
**Solution**:
1. Check `server/.env` has `CORS_ORIGIN=http://localhost:5173`
2. Restart backend server
3. Clear browser cache
4. Check browser console for exact error

### 🎭 Avatar Issues

#### "Avatar not loading" or black screen
**Problem**: 3D model files missing or corrupted
**Solution**:
1. Verify files exist in `public/models/`:
   - `64f1a714fe61576b46f27ca2.glb`
   - `animations.glb`
2. Check browser console for 404 errors
3. Re-clone repository if files missing
4. Clear browser cache

#### "No lip-sync animation"
**Problem**: Lip-sync not working
**Solution**:
1. Check backend logs for lip-sync processing
2. Verify `bin/rhubarb.exe` exists
3. Check audio generation in browser console
4. Test with simple message first

### 📱 Frontend Issues

#### "Module not found" errors
**Problem**: Missing dependencies
**Solution**:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Also for server
cd server
rm -rf node_modules package-lock.json  
npm install
```

#### "Vite build errors"
**Problem**: Build configuration issues
**Solution**:
1. Check Node.js version (need v18+)
2. Clear Vite cache: `npx vite --force`
3. Delete `.vite` folder and restart

#### "Environment variables not loading"
**Problem**: .env files not read correctly
**Solution**:
1. Ensure `.env` is in root directory
2. Restart development server
3. Check for syntax errors in .env
4. Use `VITE_` prefix for frontend variables

### 🔊 Audio Issues

#### "No audio playback"
**Problem**: Audio not playing in browser
**Solution**:
1. Check browser audio permissions
2. Try clicking somewhere first (browser autoplay policy)
3. Check ElevenLabs API status
4. Verify audio files generated in `audios/` folder

#### "Audio but no lip-sync"
**Problem**: Rhubarb lip-sync tool not working
**Solution**:
1. Check `bin/rhubarb.exe` exists
2. Verify audio conversion to WAV format
3. Check backend logs for lip-sync processing errors
4. Test with shorter messages first

### 💾 Database Issues

#### "Chat history not saving"
**Problem**: Supabase connection or permissions
**Solution**:
1. Check Supabase tables exist
2. Verify RLS policies are set up
3. Test with anonymous chat first
4. Check browser network tab for API errors

#### "Email verification redirects to localhost instead of live app"
**Problem**: Supabase Site URL configured for development
**Solution**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Change Site URL from `http://localhost:5173` to `https://ai-tutor-final-sepia.vercel.app`
3. Add production redirect URL: `https://ai-tutor-final-sepia.vercel.app/auth/callback`
4. Keep development URL for local testing: `http://localhost:5173/auth/callback`
5. Save settings and test email verification again

#### "User authentication not working"  
**Problem**: Supabase auth configuration
**Solution**:
1. Check Supabase auth settings
2. Verify site URL matches your deployment URL
3. Check redirect URLs are configured correctly
4. Clear browser localStorage
5. For production: ensure Site URL is set to your Vercel domain

### 🖥️ Development Environment

#### "Hot reload not working"
**Problem**: File changes not detected
**Solution**:
1. Restart development server
2. Check file permissions
3. Clear browser cache
4. Use `npm run dev -- --force`

#### "TypeScript errors"
**Problem**: Type checking issues
**Solution**:
1. Install TypeScript globally: `npm i -g typescript`
2. Check tsconfig.json exists
3. Restart VS Code TypeScript service

## 🔍 Debug Commands

### Check Environment Setup
```bash
# Node version
node --version
npm --version

# Git version  
git --version

# Check project dependencies
npm list --depth=0
cd server && npm list --depth=0
```

### Test API Endpoints
```bash
# Backend health
curl http://localhost:3000

# ElevenLabs status
curl http://localhost:3000/elevenlabs-status

# Test chat (with proper JSON)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"hello test\"}"
```

### Check Environment Variables
```bash
# Windows PowerShell
cd server
Get-Content .env

# Check if variables are loaded
node -e "require('dotenv').config(); console.log(process.env.OPENAI_API_KEY ? 'OpenAI key loaded' : 'OpenAI key missing')"
```

### Clear Everything & Restart
```bash
# Kill all processes
npx kill-port 3000
npx kill-port 5173

# Clear dependencies
rm -rf node_modules package-lock.json
cd server && rm -rf node_modules package-lock.json && cd ..

# Reinstall
npm install
cd server && npm install && cd ..

# Clear browser data
# Ctrl+Shift+Delete in browser, clear all data for localhost

# Restart servers
cd server && npm start  # Terminal 1
npm run dev             # Terminal 2
```

## 📞 Getting Help

### Log Files to Check
1. **Browser Console**: F12 → Console tab
2. **Backend Terminal**: Look for error messages
3. **Frontend Terminal**: Vite build errors
4. **Network Tab**: Check API request/response

### Information to Provide When Asking for Help
- Operating System (Windows/Mac/Linux)
- Node.js version (`node --version`)
- Exact error message
- Browser console logs
- Terminal output
- Which step failed

### Common Success Indicators
- ✅ Backend: "AI Digital Tutor listening on port 3000"
- ✅ Frontend: "ready in xxx ms" and avatar loads
- ✅ ElevenLabs: API status shows subscription info
- ✅ Chat: Messages send and avatar responds

---

**💡 Tip**: Most issues are resolved by checking environment variables and restarting servers!
