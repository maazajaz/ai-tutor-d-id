# Python Tutor Backend - Complete Setup Guide

This guide will help you set up the complete Python tutor backend with Hinglish responses, ElevenLabs voice synthesis, and lip-sync generation on your Windows PC.

## 🎯 What This Project Does
- **Python Teacher**: AI-powered tutor that explains Python concepts in Hinglish
- **Natural Voice**: High-quality speech synthesis using ElevenLabs
- **Lip Sync**: Generates mouth movement data for 3D character animation
- **Local AI**: Uses Ollama with Llama 3 model (runs offline)

---

## 📋 System Requirements
- **OS**: Windows 10/11
- **RAM**: At least 8GB (16GB recommended for Ollama)
- **Storage**: ~10GB free space
- **Internet**: Required for initial setup and ElevenLabs API

---

## 🛠️ Step 1: Install Node.js and Yarn

### Install Node.js
1. Go to [nodejs.org](https://nodejs.org)
2. Download **Node.js 18.x or higher** (LTS version recommended)
3. Run the installer and follow the setup wizard
4. Open PowerShell and verify installation:
   ```powershell
   node --version
   npm --version
   ```

### Install Yarn Package Manager
1. In PowerShell, run:
   ```powershell
   npm install -g yarn
   ```
2. Verify installation:
   ```powershell
   yarn --version
   ```

---

## 🤖 Step 2: Install Ollama (Local AI)

### Download and Install Ollama
1. Go to [ollama.com](https://ollama.com)
2. Download Ollama for Windows
3. Run the installer
4. After installation, open PowerShell and verify:
   ```powershell
   ollama --version
   ```

### Download Llama 3 Model
1. In PowerShell, run:
   ```powershell
   ollama pull llama3
   ```
   This will download ~4.7GB - be patient!

2. Start Ollama service:
   ```powershell
   ollama serve
   ```
   Keep this terminal open or run in background.

3. Test Ollama (in a new PowerShell window):
   ```powershell
   ollama list
   ```
   You should see `llama3:latest` listed.

---

## 🎵 Step 3: Install FFmpeg (Audio Processing)

### Install FFmpeg via winget
1. Open PowerShell as Administrator
2. Run:
   ```powershell
   winget install "FFmpeg (Essentials Build)"
   ```

3. Restart PowerShell and verify:
   ```powershell
   ffmpeg -version
   ```

**If winget doesn't work:**
1. Go to [ffmpeg.org](https://ffmpeg.org/download.html)
2. Download Windows build from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
3. Extract to `C:\ffmpeg`
4. Add `C:\ffmpeg\bin` to your PATH environment variable

---

## 🎤 Step 4: Get ElevenLabs API Key

### Create ElevenLabs Account
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up for an account
3. Go to your profile settings
4. Create a new API key with these permissions:
   - **Text to Speech**: ✅ Access
   - **Voices**: ✅ Read access
   - **Monthly Limit**: Set a reasonable limit (e.g., $20)
   - All other permissions: ❌ No Access

5. Copy your API key - you'll need it later

---

## 📁 Step 5: Set Up the Project

### Clone or Copy Project Files
1. Create a new folder for the project:
   ```powershell
   mkdir python-tutor-backend
   cd python-tutor-backend
   ```

2. Copy all these files to your project folder:
   - `index.js`
   - `package.json`
   - `.env.example`
   - `audios/` folder (with existing audio files)
   - `bin/` folder (will be created automatically)

### Install Dependencies
1. In your project folder, run:
   ```powershell
   yarn install
   ```

This will install:
- `@elevenlabs/elevenlabs-js` - ElevenLabs voice synthesis
- `cors` - Cross-origin request handling
- `dotenv` - Environment variables
- `express` - Web server framework
- `node-fetch` - HTTP requests
- `nodemon` - Auto-restart development server

---

## 🔧 Step 6: Configure Environment Variables

### Set Up API Keys
1. Copy `.env.example` to `.env`:
   ```powershell
   copy .env.example .env
   ```

2. Edit `.env` file and add your ElevenLabs API key:
   ```
   ELEVEN_LABS_API_KEY="your_api_key_here"
   ```

---

## 🎭 Step 7: Install Rhubarb Lip Sync

### Automatic Installation (Recommended)
The first time you run the server, it will automatically download and set up Rhubarb Lip Sync.

### Manual Installation (If needed)
1. Download from [GitHub](https://github.com/DanielSWolf/rhubarb-lip-sync/releases)
2. Get `Rhubarb-Lip-Sync-1.13.0-Windows.zip`
3. Extract to `bin/` folder in your project
4. Ensure `bin/rhubarb.exe` exists

---

## 🚀 Step 8: Start the Server

### Start Ollama Service
1. Open PowerShell and run:
   ```powershell
   ollama serve
   ```
   Keep this running in the background.

### Start the Python Tutor Server
1. In your project folder, open a new PowerShell window
2. Run:
   ```powershell
   yarn dev
   ```

3. You should see:
   ```
   Virtual Girlfriend listening on port 3000
   ```

### Test the Setup
1. Open your browser and go to: `http://localhost:3000/test`
2. Type a Python question like: "Python kya hai?"
3. Click Send and wait for the response

---

## 📱 Step 9: Test All Features

### Test Basic Functionality
- ✅ Server starts without errors
- ✅ Ollama responds to questions
- ✅ Audio files are generated in `audios/` folder
- ✅ Lip-sync JSON files are created

### Test Sample Questions
Try these in Hinglish:
- "Python kya hai?"
- "Variables kaise use karte hain?"
- "Functions kaise banate hain?"
- "Lists aur dictionaries mein kya difference hai?"

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "Ollama connection refused"
```
Error: ECONNREFUSED http://localhost:11434
```
**Solution**: Make sure Ollama is running:
```powershell
ollama serve
```

#### 2. "FFmpeg not found"
**Solution**: Install FFmpeg and add to PATH, or restart PowerShell after installation.

#### 3. "ElevenLabs API error"
**Solution**: Check your API key in `.env` file and ensure you have credits.

#### 4. "Rhubarb error - missing acoustic model"
**Solution**: Delete `bin/` folder and let the server re-download Rhubarb automatically.

#### 5. "Port 3000 already in use"
**Solution**: Kill any existing Node processes:
```powershell
Stop-Process -Name "node" -Force
```

---

## 📂 Project Structure
```
python-tutor-backend/
├── index.js              # Main server file
├── package.json           # Dependencies
├── .env                  # API keys (create from .env.example)
├── test.html             # Test interface
├── audios/               # Generated audio and lip-sync files
├── bin/                  # Rhubarb lip-sync executable
│   ├── rhubarb.exe
│   └── res/              # Acoustic models
└── node_modules/         # Installed packages
```

---

## 🎯 API Endpoints

### Main Chat Endpoint
- **URL**: `POST http://localhost:3000/chat`
- **Body**: `{"message": "your question in Hinglish"}`
- **Response**: 
```json
{
  "messages": [
    {
      "text": "Python ek high-level programming language hai...",
      "facialExpression": "smile",
      "animation": "Talking_0",
      "audio": "base64_audio_data",
      "lipsync": {"mouthCues": [...]}
    }
  ]
}
```

### Other Endpoints
- `GET /` - Basic health check
- `GET /voices` - List available ElevenLabs voices
- `GET /test` - Test interface

---

## 🔧 Configuration Options

### Modify Voice Settings
In `index.js`, change the voice:
```javascript
const voiceID = "pNInz6obpgDQGcFmaJgB"; // Adam (male)
// or
const voiceID = "21m00Tcm4TlvDq8ikWAM"; // Rachel (female)
```

### Modify Language Style
Edit the `systemPrompt` in `index.js` to change the Hinglish style or add more languages.

### Add More Python Topics
Update the `pythonSyllabus` array in `index.js` to add more topics.

---

## 📊 Resource Usage
- **RAM**: ~2-4GB (mainly Ollama)
- **CPU**: Moderate during audio generation
- **Storage**: 
  - Ollama + Llama 3: ~5GB
  - Project files: ~100MB
  - Generated audio files: Grows over time

---

## 🔒 Security Notes
- Keep your `.env` file private (never commit to Git)
- Monitor your ElevenLabs usage to avoid unexpected charges
- The server runs on localhost only (not accessible from internet)

---

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Server starts and shows "Virtual Girlfriend listening on port 3000"
2. ✅ Test page loads at `http://localhost:3000/test`
3. ✅ Questions get responses in Hinglish
4. ✅ Audio files appear in `audios/message_X.mp3`
5. ✅ Lip-sync files appear in `audios/message_X.json`
6. ✅ No errors in the terminal

---

## 🤝 Support

If you encounter any issues:
1. Check the terminal for error messages
2. Ensure all services (Ollama) are running
3. Verify your API keys are correct
4. Make sure all dependencies are installed
5. Try restarting all services

Happy coding! 🚀
