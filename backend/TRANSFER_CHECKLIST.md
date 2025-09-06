# 📋 Transfer Checklist for Your Friend

## 📦 Files to Share

Share these files/folders with your friend:

### ✅ Required Files
```
📁 python-tutor-backend/
├── 📄 index.js                      # Main server code
├── 📄 package.json                  # Dependencies list
├── 📄 .env.example                  # Environment template
├── 📄 test.html                     # Test interface
├── 📄 README.md                     # Quick guide
├── 📄 COMPLETE_SETUP_GUIDE.md       # Detailed instructions
├── 📄 setup.bat                     # Auto-setup script
├── 📁 audios/                       # Audio files folder
│   ├── 📄 intro_0.wav
│   ├── 📄 intro_0.json
│   ├── 📄 intro_1.wav
│   └── 📄 intro_1.json
└── 📁 bin/                          # Will be created automatically
```

### ❌ Don't Share
- `.env` file (contains your API keys)
- `node_modules/` folder (will be installed automatically)
- Generated `message_X.mp3/wav/json` files

## 🔑 What Your Friend Needs

### 1. ElevenLabs Account
- They need their OWN ElevenLabs account
- Their own API key with credits
- Don't share your API key!

### 2. System Requirements
- Windows 10/11
- At least 8GB RAM
- ~10GB free storage
- Internet connection

## 🚀 Quick Setup for Your Friend

### Option 1: Easy Setup
1. **Extract project** to a folder
2. **Double-click** `setup.bat`
3. **Follow the prompts**
4. **Add their ElevenLabs API key** when prompted

### Option 2: Manual Setup
1. **Install Node.js** from nodejs.org
2. **Install Ollama** from ollama.com
3. **Download Llama 3**: `ollama pull llama3`
4. **Install FFmpeg**: `winget install "FFmpeg (Essentials Build)"`
5. **Setup project**: `yarn install`
6. **Configure API key** in `.env` file
7. **Start services**: `ollama serve` & `yarn dev`

## ✅ Testing Steps

Your friend should verify:

1. **Ollama Working**:
   ```powershell
   ollama list
   # Should show: llama3:latest
   ```

2. **Server Running**:
   ```powershell
   yarn dev
   # Should show: Virtual Girlfriend listening on port 3000
   ```

3. **API Response**:
   - Open: `http://localhost:3000/test`
   - Type: "Python kya hai?"
   - Should get Hinglish response

4. **Files Generated**:
   - `audios/message_0.mp3` (audio)
   - `audios/message_0.json` (lip-sync)
   - `audios/message_0.wav` (converted)

## 🆘 Common Issues

### "Ollama not found"
```powershell
winget install Ollama.Ollama
ollama pull llama3
```

### "FFmpeg not found"
```powershell
winget install "FFmpeg (Essentials Build)"
# Restart PowerShell after installation
```

### "ElevenLabs API error"
- Check API key in `.env` file
- Verify account has credits
- Ensure API key has "Text to Speech" permissions

### "Port 3000 in use"
```powershell
Stop-Process -Name "node" -Force
```

## 🎯 Success Indicators

Your friend will know it's working when:

✅ No errors in terminal  
✅ Can ask questions in Hinglish  
✅ Gets natural voice responses  
✅ Audio files appear in `audios/` folder  
✅ Lip-sync JSON files generated  
✅ Test page works at `localhost:3000/test`  

## 💡 Pro Tips

1. **Keep Ollama running**: Always start `ollama serve` first
2. **Monitor ElevenLabs usage**: Set spending limits in their account  
3. **Backup audio files**: Generated files can be reused
4. **Update regularly**: Check for new Ollama models and updates

## 🤝 Support

If your friend needs help:
1. Check `COMPLETE_SETUP_GUIDE.md` for detailed instructions
2. Look for error messages in the terminal
3. Ensure all services are running
4. Verify API keys are correct
5. Try restarting everything

---

**Good luck with the transfer! 🚀**
