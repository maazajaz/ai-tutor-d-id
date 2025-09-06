<<<<<<< HEAD
# ai-avatar-backend
=======
# Python Tutor Backend 🐍🎓

AI-powered Python teacher that responds in **Hinglish** with high-quality voice synthesis and lip-sync generation for 3D character animation.

## ⚡ Quick Start

### For Beginners
1. **Run the setup script**: Double-click `setup.bat`
2. **Follow the prompts** to install everything automatically
3. **See detailed guide**: Open `COMPLETE_SETUP_GUIDE.md`

### For Developers
```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ElevenLabs API key

# Start Ollama (in separate terminal)
ollama serve

# Start the server
yarn dev
```

## 🎯 Features

- **🤖 Local AI**: Ollama + Llama 3 (no OpenAI costs)
- **🎵 Premium Voice**: ElevenLabs natural speech synthesis
- **💬 Hinglish Responses**: Mixed Hindi-English explanations
- **👄 Lip Sync**: Rhubarb-generated mouth movement data
- **🎭 3D Ready**: Audio + animation data for R3F characters

## 📖 What It Teaches

Python concepts from beginner to intermediate:
- Variables and Data Types
- Control Flow (if/else, loops)  
- Functions and Modules
- Lists, Tuples, Dictionaries
- Object-Oriented Programming
- File Handling & Error Management
- And more!

## 🌐 Usage

1. **Start server**: `yarn dev`
2. **Open browser**: `http://localhost:3000/test`
3. **Ask in Hinglish**: "Python kya hai?", "Variables kaise use karte hain?"
4. **Get response**: Text + Audio + Lip-sync data

## 📋 Requirements

- Windows 10/11
- Node.js 18+
- 8GB+ RAM (for Ollama)
- ElevenLabs API key
- ~10GB free storage

## 📁 Generated Files

- `audios/message_X.mp3` - High-quality speech audio
- `audios/message_X.json` - Lip-sync mouth movement data
- `audios/message_X.wav` - Converted audio for lip-sync processing

## 🔧 Configuration

### Change Voice
```javascript
// In index.js
const voiceID = "pNInz6obpgDQGcFmaJgB"; // Adam (male)
const voiceID = "21m00Tcm4TlvDq8ikWAM"; // Rachel (female)
```

### Modify Language Style
Edit the `systemPrompt` in `index.js` to customize the Hinglish style.

## 🚀 Integration

Perfect for:
- React Three Fiber (R3F) 3D applications
- Virtual assistant interfaces  
- Educational platforms
- Interactive learning experiences

## 📞 API Endpoints

- `POST /chat` - Main teaching endpoint
- `GET /voices` - List available voices
- `GET /test` - Web testing interface

## 🔍 Troubleshooting

Common issues and solutions in `COMPLETE_SETUP_GUIDE.md`

## 🎉 Success Indicators

✅ Server starts without errors  
✅ Ollama responds to questions  
✅ Audio files generated in `audios/`  
✅ Lip-sync JSON files created  
✅ Hinglish responses working  

---

**Happy Learning! 📚✨**

*Made with ❤️ for Python education in India*
>>>>>>> 87d0f8d (Transfer project: Python tutor backend, Hinglish, ElevenLabs TTS, Rhubarb lipsync, setup scripts, and documentation)
