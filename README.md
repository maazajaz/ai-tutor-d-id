# 🎓 AI Digital Tutor

> An intelligent 3D avatar-based tutoring system with voice synthesis, multilingual support, and personalized learning experiences.

[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-success?style=for-the-badge)](https://ai-tutor-final-sepia.vercel.app/)
[![GitHub](https://img.shields.io/badge/📁-GitHub-black?style=for-the-badge&logo=github)](https://github.com/maazajaz/ai-tutor-full-stack)

## ✨ Features

### 🤖 **Intelligent AI Tutoring**
- **GPT-powered conversations** with context-aware responses
- **Programming & CS focused** with support for all academic subjects
- **Multilingual support** (English/Hinglish) with automatic language detection
- **Personalized learning** with chat history and progress tracking

### 🎭 **3D Avatar Experience**
- **Realistic 3D avatar** with facial expressions and animations
- **Lip-sync technology** synchronized with AI voice responses
- **Interactive animations** for engaging learning sessions
- **Mobile-optimized** rendering and performance

### 🔊 **Voice & Audio**
- **ElevenLabs TTS** for natural voice synthesis
- **Real-time lip-sync** generation using Rhubarb tool
- **Mobile-friendly** audio playback with autoplay handling
- **High-quality voice** with emotion and expression

### 💾 **Data Management**
- **Supabase integration** for user authentication and data persistence
- **Chat history** with automatic saving and retrieval
- **Session management** with multiple chat support
- **AI-generated notes** and study summaries

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Git
- API Keys: [OpenAI](https://platform.openai.com/), [ElevenLabs](https://elevenlabs.io/), [Supabase](https://supabase.com/)

### Installation
```bash
# Clone the repository
git clone https://github.com/maazajaz/ai-tutor-full-stack.git
cd ai-tutor-full-stack

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the application
npm run dev
```

The app will be available at `http://localhost:5173`

## 📚 Documentation

| Document | Description |
|----------|-------------|
| 📖 [Setup Guide](docs/COMPLETE_SETUP_GUIDE.md) | Complete installation and configuration |
| ⚡ [Quick Setup](docs/QUICK_SETUP_CHECKLIST.md) | Rapid setup checklist |
| 🔧 [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| 📦 [Transfer Guide](docs/TRANSFER_CHECKLIST.md) | Project transfer instructions |
| 🔐 [Authentication](docs/AUTHENTICATION_FEATURES.md) | User auth implementation |
| 💬 [Chat History](docs/CHAT_HISTORY_GUIDE.md) | Chat persistence features |

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server  
- **Three.js & R3F** - 3D graphics and avatar rendering
- **Tailwind CSS** - Styling framework
- **Supabase Auth** - User authentication

### Backend
- **Node.js & Express** - Server framework
- **OpenAI API** - AI conversation engine
- **ElevenLabs API** - Text-to-speech synthesis
- **Supabase** - Database and authentication
- **Rhubarb** - Lip-sync generation

### 3D & Audio
- **GLTF Models** - 3D avatar and animations
- **Web Audio API** - Audio processing
- **Morph Targets** - Facial animation system
- **FFmpeg** - Audio format conversion

## 🎯 Use Cases

- **Programming Education** - Learn Python, JavaScript, C++, Data Structures
- **Academic Subjects** - Math, Science, English, Social Studies  
- **Language Learning** - English/Hindi bilingual support
- **Interactive Tutoring** - Conversational learning with visual feedback
- **Study Sessions** - Persistent chat history and note generation

## 🌟 Key Capabilities

### Educational Features
✅ **Multi-subject tutoring** across all academic levels  
✅ **Code examples** with syntax highlighting and explanations  
✅ **Step-by-step problem solving** with detailed breakdowns  
✅ **Language flexibility** with English/Hinglish support  
✅ **Progress tracking** through chat history analysis  

### Technical Features  
✅ **Real-time 3D rendering** optimized for web and mobile  
✅ **Synchronized lip-sync** with generated speech  
✅ **Responsive design** working across all device sizes  
✅ **Error handling** with graceful fallbacks  
✅ **Production deployment** ready for Vercel/cloud platforms  

## 📱 Browser Support

- ✅ **Chrome/Edge** - Full support with optimal performance
- ✅ **Firefox** - Full support with WebGL compatibility
- ✅ **Safari** - Full support with iOS audio handling
- ✅ **Mobile browsers** - Optimized touch interface

## 🔧 Environment Variables

```env
# AI Services
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# Database  
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...

# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

## 🚀 Deployment

The application is deployed on **Vercel** with automatic builds:

**Live Demo**: [https://ai-tutor-final-sepia.vercel.app/](https://ai-tutor-final-sepia.vercel.app/)

For deployment instructions, see [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Maaz Ajaz**
- GitHub: [@maazajaz](https://github.com/maazajaz)
- Email: maazajaz1234@gmail.com

## 🙏 Acknowledgments

- OpenAI for GPT API and AI capabilities
- ElevenLabs for voice synthesis technology  
- Supabase for backend infrastructure
- Ready Player Me for 3D avatar inspiration
- Three.js community for 3D web graphics

---

**🎓 Empowering education through AI and immersive technology!**
