# 📦 Transfer Checklist for D-ID AI Avatar Project

## ⚡ Quick Setup Reference

**What Your Friend Needs:**
- **OpenAI API Key** (from: https://platform.openai.com/api-keys)
- **D-ID API Key** (from: https://studio.d-id.com/account-settings)
- **Supabase URL & Anon Key** (from: https://supabase.com/dashboard/project/_/settings/api)
- **Camera access** for emotion detection feature

**Time Required:** ~15 minutes

---

## Before Transfer
- [ ] Push all changes to GitHub: `git push origin main`
- [ ] Verify repository is public or friend has access
- [ ] Share this checklist with your friend
- [ ] Send API keys via secure method (encrypted message/call)

---

## 🔑 API Keys to Share (Securely!)

Your friend will need these API keys. **Never commit these to GitHub!**

1. **OpenAI API Key**: `sk-proj-...`
   - Get from: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Share via secure method only

2. **D-ID API Key**: `xxxxxxxx`
   - Get from: https://studio.d-id.com/account-settings
   - Find "API Key" section
   - Same value for both `DID_API_KEY` and `VITE_DID_API_KEY`

3. **Supabase Configuration**:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx`
   - Get from: Supabase Project → Settings → API

---

## Friend's Laptop Setup Steps

### 1️⃣ Prerequisites Installation (~5 min)

**Required Software:**
```bash
# Check if Node.js is installed (need v18+)
node --version

# Check if Git is installed
git --version
```

**If Not Installed:**
- Download **Node.js** from: https://nodejs.org/ (LTS version)
- Download **Git** from: https://git-scm.com/downloads
- **(Optional)** Download **VS Code**: https://code.visualstudio.com/

---

### 3️⃣ Environment Configuration (~5 min)

**Create `.env` file in project root:**

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# D-ID Configuration  
DID_API_KEY=xxxxxxxxxxxxxxxxxxxxxxx
VITE_DID_API_KEY=xxxxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Server Configuration (default ports)
PORT=3000
VITE_API_URL=http://localhost:3000
```

**⚠️ Important:** Replace the `xxxxx` values with the actual API keys shared with you.

---

### 4️⃣ Start the Application (~2 min)

```bash
# Start both frontend and backend together
npm run dev
```

**Expected Output:**
```
> Backend server running on http://localhost:3000
> Frontend server running on http://localhost:5173
```

**Access the App:**
- Open browser: http://localhost:5173

---

## ✅ Verification Checklist

Run through these tests to ensure everything works:

### Basic Functionality:
- [ ] **Landing page loads** without errors
- [ ] **Login/Signup works** with Supabase authentication
- [ ] **Chat interface displays** after login

### AI Features:
- [ ] **Send a message** and get OpenAI response
- [ ] **D-ID avatar appears** and speaks
- [ ] **Audio plays** with lip-sync
- [ ] **Chat history saves** and persists after refresh
- [ ] **Sessions stay active** (no random disconnections after 5 minutes)

### 🎭 Emotion Detection (New Feature):
- [ ] **Enable emotion detection** toggle in UI
- [ ] **Camera permission granted** (browser will prompt)
- [ ] **Camera preview displays** your face
- [ ] **Emotion indicator shows** current emotion with confidence %
- [ ] **Face detection works** (green indicator when face detected)
- [ ] **Emotion alerts trigger** after showing same emotion 3+ times:
  - Try looking sad repeatedly → Agent asks if you need jokes
  - Try looking frustrated → Agent offers help
  - Try smiling → Agent gives encouragement

### Advanced Features:
- [ ] **Language detection** works (try English and Hinglish)
- [ ] **New chat session** can be created
- [ ] **Previous chats** can be loaded
- [ ] **Notes generation** works

---

## �️ Troubleshooting Common Issues

### Camera/Emotion Detection Issues:
- **Camera not working**: Grant camera permission in browser settings
- **Preview blank**: Refresh page and re-enable emotion detection
- **Emotion not detecting**: Ensure good lighting and face clearly visible
- **Camera permission denied**: Check browser settings → Site permissions → Camera

### D-ID Session Issues:
- **"SessionError" after 5 minutes**: This is fixed! Sessions auto-refresh every 4 minutes
- **Avatar stops responding**: Click "New Chat" to reconnect
- **No video/audio**: Check internet connection and D-ID API key

### General Issues:
- **"API key missing"**: Check `.env` file has all required keys
- **CORS errors**: Ensure backend is running on port 3000
- **Chat not saving**: Verify Supabase credentials are correct
- **OpenAI errors**: Check API key and account has credits

---

## 📁 File Structure Reference

After setup, verify this structure exists:
```
ai-tutor-d-id/
├── .env                           # Environment variables (create this)
├── .env.example                   # Environment template
├── package.json                   # Dependencies and scripts
├── index.html                     # Main HTML file
├── README.md                      # Project documentation
├── docs/
│   ├── TRANSFER_CHECKLIST.md      # This file
│   └── TROUBLESHOOTING.md         # Detailed troubleshooting
├── public/
│   ├── models/                    # D-ID avatar models
│   └── animations/                # Avatar animations
├── server/
│   ├── server.js                  # Backend server
│   └── didService.js              # D-ID API integration
├── src/
│   ├── components/
│   │   ├── DIDAgentAvatar.jsx     # D-ID avatar component
│   │   └── UI.jsx                 # Main chat UI
│   ├── hooks/
│   │   ├── useChat.jsx            # Chat management
│   │   └── useEmotionDetection.jsx # Emotion detection
│   └── lib/
├── bin/
│   └── rhubarb.exe               # Lip-sync tool (Windows)
└── audios/                       # Generated audio files
```

---

## ✅ Complete Success Checklist

### Installation Success
- [ ] Node.js and npm working (`node --version` shows v18+)
- [ ] Git working (`git --version`)
- [ ] Repository cloned successfully
- [ ] All dependencies installed without errors (`npm install` completes)

### Configuration Success  
- [ ] `.env` file created with all API keys
- [ ] D-ID API key format correct
- [ ] Supabase project configured
- [ ] No syntax errors in `.env` file

### Runtime Success
- [ ] Backend starts on http://localhost:3000
- [ ] Frontend starts on http://localhost:5173
- [ ] No errors in terminal or browser console
- [ ] Avatar renders correctly
- [ ] Chat messages work end-to-end

### Feature Testing (Comprehensive)
- [ ] **Basic Chat**: Send "Hello" → Get AI response → Avatar speaks
- [ ] **Programming Questions**: Ask about Python/JavaScript → Get educational response
- [ ] **Chat History**: Refresh page → Previous messages load
- [ ] **New Session**: Click "New Chat" → Fresh conversation starts
- [ ] **Emotion Detection**: Enable toggle → Camera works → Emotions detected
- [ ] **Session Stability**: Chat for 5+ minutes → No disconnections
- [ ] **Language Detection**: Type Hinglish → Agent responds appropriately

---

## 📞 Support & Resources

### Project Documentation
- `README.md` - Complete project overview
- `docs/TROUBLESHOOTING.md` - Detailed troubleshooting guide
- This checklist for setup guidance

### Online Resources
- OpenAI API Docs: https://platform.openai.com/docs
- D-ID API Docs: https://docs.d-id.com/
- D-ID Studio: https://studio.d-id.com/
- React + Vite Docs: https://vitejs.dev/guide/

### Debug Commands
```bash
# Test backend health
curl http://localhost:3000

# Check if frontend builds correctly
npm run build

# Check environment variables loaded
node -e "console.log('OpenAI Key:', !!process.env.OPENAI_API_KEY)"
```

---

## 🎯 Final Notes

1. **Take your time** with each step
2. **Don't skip environment configuration** - most issues come from here
3. **Test each component** before moving to the next
4. **Keep API keys secure** and never share publicly
5. **Use the troubleshooting guide** if you get stuck

**🚀 Once everything is working, you'll have a fully functional AI Digital Tutor with D-ID live streaming avatar, intelligent chat capabilities, and real-time video responses!**
