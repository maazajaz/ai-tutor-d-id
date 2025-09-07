# 📦 Transfer Checklist for Friend's Laptop

## Before Transfer
- [ ] Push all changes to GitHub: `git push origin main`
- [ ] Verify GitHub repository is public or friend has access
- [ ] Share this checklist with your friend

## Required Information to Share

### 🔑 API Keys (Share Securely)
Your friend will need these API keys:

1. **OpenAI API Key**: `sk-...`
   - From: https://platform.openai.com/api-keys
   - Share via secure method (encrypted message/call)

2. **ElevenLabs API Key**: `...`
   - From: https://elevenlabs.io/ profile section
   - Share via secure method

3. **Supabase Configuration**:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJ...`
   - From: Supabase Project → Settings → API

### 📋 Setup Files Created
I've created these guides for you:
- `COMPLETE_SETUP_GUIDE.md` - Detailed step-by-step instructions
- `QUICK_SETUP_CHECKLIST.md` - Quick reference checklist  
- `TROUBLESHOOTING.md` - Common issues and solutions

## Friend's Laptop Setup Steps

### 1. Prerequisites Installation
```bash
# Install Node.js (v18+)
# Download from: https://nodejs.org/

# Install Git
# Download from: https://git-scm.com/

# Install VS Code (optional but recommended)
# Download from: https://code.visualstudio.com/
```

### 2. Project Setup
```bash
# Clone the repository
git clone https://github.com/maazajaz/ai-tutor-full-stack.git
cd ai-tutor-full-stack

# Install all dependencies
npm install
cd server && npm install && cd ..
```

### 3. Environment Configuration

#### Create `server/.env`:
```env
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

#### Create `.env` (in root):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_NODE_ENV=development
```

### 4. Database Setup
- Follow Supabase setup instructions in `COMPLETE_SETUP_GUIDE.md`
- Create tables using provided SQL commands
- Configure authentication settings

### 5. Running the Application
```bash
# Terminal 1: Start Backend
cd server
npm start

# Terminal 2: Start Frontend
npm run dev
```

### 6. Verification
- [ ] Backend accessible at: http://localhost:3000
- [ ] Frontend accessible at: http://localhost:5173
- [ ] Avatar loads correctly
- [ ] Chat functionality works
- [ ] Audio/lip-sync working

## 🚨 Security Notes

### API Key Security
- **NEVER** commit API keys to GitHub
- Share API keys via secure, encrypted channels only
- Consider using environment variable management tools
- Regenerate keys if accidentally exposed

### Environment Files
```bash
# These files contain secrets - never commit:
server/.env
.env

# Verify they're in .gitignore:
cat .gitignore | grep ".env"
```

## 📁 File Structure Verification
After setup, verify this structure exists:
```
ai-tutor-full-stack/
├── .env                           # Frontend environment variables
├── COMPLETE_SETUP_GUIDE.md        # Detailed setup guide
├── QUICK_SETUP_CHECKLIST.md       # Quick reference
├── TROUBLESHOOTING.md              # Common issues
├── package.json                   # Frontend dependencies
├── public/
│   └── models/
│       ├── 64f1a714fe61576b46f27ca2.glb  # Main avatar
│       └── animations.glb                # Animations
├── server/
│   ├── .env                       # Backend environment variables
│   ├── server.js                  # Main backend file
│   └── package.json               # Backend dependencies
├── src/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── bin/
│   └── rhubarb.exe               # Lip-sync tool
└── audios/                       # Generated audio files
```

## ✅ Success Checklist

### Installation Success
- [ ] Node.js and npm working (`node --version`, `npm --version`)
- [ ] Git working (`git --version`)
- [ ] Repository cloned successfully
- [ ] All dependencies installed without errors

### Configuration Success  
- [ ] Both `.env` files created with correct keys
- [ ] Supabase project created and configured
- [ ] Database tables created successfully

### Runtime Success
- [ ] Backend starts without errors
- [ ] Frontend starts without errors  
- [ ] No CORS errors in browser console
- [ ] Avatar renders correctly
- [ ] Chat messages work
- [ ] Audio generation and playback working

### Feature Testing
- [ ] Send test message: "Hello, can you help me with Python?"
- [ ] Verify AI responds appropriately
- [ ] Check lip-sync animation works
- [ ] Test programming questions
- [ ] Verify chat history saves

## 🆘 If Issues Occur

1. **Check `TROUBLESHOOTING.md`** for common issues
2. **Verify all API keys** are correctly set
3. **Restart both servers** after any config changes
4. **Check browser console** for error messages
5. **Verify network connectivity** to all APIs

## 📞 Support Resources

### Documentation Files
- `COMPLETE_SETUP_GUIDE.md` - Full detailed instructions
- `TROUBLESHOOTING.md` - Solutions for common problems
- `QUICK_SETUP_CHECKLIST.md` - Quick reference

### Online Resources
- OpenAI API Docs: https://platform.openai.com/docs
- ElevenLabs API Docs: https://elevenlabs.io/docs
- Supabase Docs: https://supabase.com/docs
- React + Vite Docs: https://vitejs.dev/guide/

### Debug Commands
```bash
# Test backend health
curl http://localhost:3000

# Test ElevenLabs integration
curl http://localhost:3000/elevenlabs-status

# Check environment variables loaded
cd server && node -e "require('dotenv').config(); console.log('OpenAI:', !!process.env.OPENAI_API_KEY)"
```

---

## 🎯 Final Notes

1. **Take your time** with each step
2. **Don't skip environment configuration** - most issues come from here
3. **Test each component** before moving to the next
4. **Keep API keys secure** and never share publicly
5. **Use the troubleshooting guide** if you get stuck

**🚀 Once everything is working, you'll have a fully functional AI Digital Tutor with 3D avatar, voice synthesis, and intelligent chat capabilities!**
