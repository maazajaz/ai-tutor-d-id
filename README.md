# 🎓 AI Digital Tutor with D-ID Live Avatar

> An intelligent live avatar-based tutoring system with D-ID's real-time video synthesis, emotion detection, multilingual support, and personalized learning experiences.

[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-success?style=for-the-badge)](https://ai-tutor-final-sepia.vercel.app/)
[![GitHub](https://img.shields.io/badge/📁-GitHub-black?style=for-the-badge&logo=github)](https://github.com/maazajaz/ai-avatar-final)

## ✨ Latest Features (October 2025)

### 🎭 **Advanced Emotion Detection**
- **Real-time facial emotion recognition** using face-api.js
- **Automatic mood detection** (sad, angry, happy, neutral, surprised, fearful, disgusted)
- **Smart intervention system** - Agent proactively helps when detecting:
  - 😢 **Sadness**: Offers jokes and encouragement
  - 😠 **Frustration**: Provides targeted help and explanations
  - 😊 **Happiness**: Positive reinforcement and praise
- **Live camera preview** with face detection status
- **Pattern-based detection** (3+ consecutive emotions trigger response)
- **Cooldown system** to prevent spam (2 min for sad/angry, 5 min for happy)

### 🤖 **Intelligent Dual-AI System**
- **OpenAI GPT** for detailed text responses and explanations
- **D-ID Live Avatar** for personalized video responses
- **Smart message routing**: Agent receives user questions directly, not AI responses
- **Context-aware conversations** with chat history
- **Session persistence** with automatic reconnection

### 🎭 **D-ID Live Avatar Experience**
- **Real-time AI avatar** with live video synthesis
- **Photorealistic human presenters** with natural movements
- **Advanced lip-sync** and facial expressions
- **Session management** with auto-refresh (prevents 5-min expiration)
- **Idle animations** when not speaking
- **Mobile-optimized** video streaming

### 💾 **Enhanced Data Management**
- **Supabase integration** for authentication and persistence
- **Automatic chat saving** with session management
- **AI-generated study notes** from conversations
- **Multiple chat sessions** support
- **Export chat as PDF** functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- API Keys: [OpenAI](https://platform.openai.com/), [D-ID](https://www.d-id.com/), [Supabase](https://supabase.com/)

### Installation
```bash
# Clone the repository
git clone https://github.com/maazajaz/ai-avatar-final.git
cd ai-avatar-final

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys

# Start development servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 🛠️ Technology Stack

```
Frontend:
├── React 18 + Vite
├── D-ID Client SDK for live avatars
├── face-api.js for emotion detection
├── TailwindCSS + PostCSS
├── Context-based state management
└── Mobile-responsive design

Backend:
├── Express.js with CORS
├── OpenAI API integration
├── D-ID API for avatar synthesis
└── RESTful API endpoints

Database & Auth:
├── Supabase (Auth + PostgreSQL)
├── Session management
├── Chat history persistence
└── User profiles with roles

AI & ML:
├── OpenAI GPT-4 for conversations
├── TensorFlow.js (via face-api.js)
├── Face detection & recognition
└── Emotion classification models
```

## 🎭 Key Features Explained

### Emotion Detection System
The system uses face-api.js with TensorFlow.js to detect 7 base emotions in real-time:

**Detection Flow:**
1. Camera captures video feed (640x480)
2. TinyFaceDetector locates face
3. FaceExpressionNet analyzes emotions
4. Pattern detection (analyzes last 5 readings)
5. Triggers intervention when 3+ consecutive same emotions

**Smart Interventions:**
- **Sadness Detected** → "I am feeling a bit sad. Can you crack some jokes to cheer me up? 😄"
- **Frustration Detected** → "I am feeling frustrated with this topic. Can you help me understand it better? 🎯"
- **Happiness Detected** → "Great energy! You're doing amazing! Keep it up! 🌟"

### Session Management
- **Auto-refresh**: Sessions refresh after 4 minutes (before 5-min D-ID expiration)
- **Error recovery**: Automatic reconnection on session errors
- **Timeout tracking**: Resets on each message sent
- **Clean cleanup**: Proper resource management on unmount

## 🎭 D-ID Integration

This project uses D-ID's live streaming avatar technology to create photorealistic AI tutors. Key features:

- **Real-time video synthesis**: Live avatar generation with natural movements
- **Advanced lip-sync**: Perfect synchronization between text and avatar speech
- **Multiple presenter options**: Choose from various avatar styles
- **Live streaming**: Real-time interaction with minimal latency
- **Mobile optimization**: Works seamlessly across all devices

### D-ID API Configuration

1. Sign up at [D-ID](https://www.d-id.com/)
2. Get your API key from the dashboard
3. Add to `.env` file:
   ```
   DID_API_KEY=your_d_id_api_key_here
   VITE_DID_API_KEY=your_d_id_api_key_here
   ```
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
