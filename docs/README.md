# 🎓 AI Digital Tutor - Full Stack Application

A revolutionary AI-powered learning platform featuring a 3D avatar teacher that helps students in grades 7-8 learn any subject. The tutor responds intelligently in multiple languages including English and Hinglish, with voice synthesis, lip-sync animation, and an interactive learning interface.

## 🌟 Features

### 🔐 User Authentication & Personalization
- **Secure Login/Signup**: Supabase-powered authentication with email verification
- **Personalized Profiles**: Custom display names, avatar preferences, and learning settings
- **Side Navigation**: Intuitive sidebar with profile management and settings
- **User Progress**: Track learning journey and achievements (coming soon)
- **Custom Preferences**: Language, theme, and avatar customization options

### 🤖 Intelligent AI Teacher
- **Smart Language Detection**: Automatically detects and responds in English or Hinglish
- **Dynamic Token Allocation**: Optimizes response length based on question complexity (500-2000 tokens)
- **Complete Responses**: Enhanced system prompts ensure no cut-off mid-sentence responses
- **Multi-Subject Support**: Covers Math, Science, English, Social Studies for grades 7-8
- **Simple Language**: Explains complex topics in grade-appropriate language

### 🎭 3D Avatar & Voice
- **Realistic 3D Avatar**: Interactive teacher model with facial expressions and animations
- **Personalized Avatars**: Choose from multiple avatar styles (Professional, Casual, Formal)
- **ElevenLabs Voice Synthesis**: Natural voice generation with Adam's voice model
- **Real-time Lip Sync**: Rhubarb-powered mouth movement synchronization
- **Emotion Mapping**: Dynamic facial expressions (smile, surprised, default)

### 🏫 Classroom Interface
- **Mobile-Responsive Design**: Works perfectly on phones, tablets, and desktops
- **Persistent Chat History**: Conversations remain intact across sessions
- **Quick Action Buttons**: Pre-made questions for instant learning
- **New Chat & Clear Functions**: Easy conversation management
- **Profile Integration**: Easy access to user settings and preferences
- **Professional UI**: Modern classroom-style design with green theme

### 🛠 Technical Stack
- **Frontend**: React 18 + Vite + React Three Fiber + Tailwind CSS
- **Backend**: Node.js + Express + OpenAI GPT-3.5-turbo
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with email/password and social providers
- **Audio**: ElevenLabs API + FFmpeg + Rhubarb lip-sync
- **Development**: Concurrently for unified development experience

## 🏗️ Project Architecture

```
ai tutor/
├── backend/                    # Node.js Express server
│   ├── index.js               # Main server file with OpenAI & ElevenLabs integration
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables (API keys)
│   ├── audios/                # Generated audio files and lip-sync data
│   └── bin/                   # Rhubarb lip-sync executable and resources
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/        # Avatar, Experience, UI components
│   │   ├── hooks/             # useChat custom hook
│   │   └── assets/            # Static resources
│   ├── public/
│   │   ├── models/            # 3D avatar models (.glb, .fbx)
│   │   └── animations/        # Character animations
│   ├── vite.config.js         # Vite configuration with proxy setup
│   └── package.json           # Frontend dependencies
├── package.json               # Root package manager
├── README.md                  # This documentation
├── OPENAI_SETUP_GUIDE.md      # OpenAI API setup instructions
└── LANGUAGE_DETECTION_GUIDE.md # Language detection documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** package manager
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **ElevenLabs API Key** ([Get one here](https://elevenlabs.io/))

## 📚 Python Curriculum Covered

1. Introduction to Python
2. Variables and Data Types
3. Operators
4. Control Flow (if, else, for, while)
5. Functions
6. Lists, Tuples, and Dictionaries
7. Modules and Packages
8. File Handling
9. Error and Exception Handling
10. Object-Oriented Programming
11. Python Standard Library
12. Working with External Libraries
13. Basic Projects

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** package manager
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **ElevenLabs API Key** ([Get one here](https://elevenlabs.io/))
- **Supabase Account** ([Sign up free](https://app.supabase.com))
- **FFmpeg** installed on your system

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/maazajaz/ai-tutor-full-stack.git
cd ai-tutor-full-stack
```

2. **Install all dependencies:**
```bash
npm run install:all
```

3. **Set up Supabase (Required for Authentication):**
   - Follow the detailed [Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md)
   - Create your Supabase project
   - Set up database tables
   - Get your project URL and anon key

4. **Configure environment variables:**
   
   **Backend (`backend/.env`):**
   ```env
   ELEVEN_LABS_API_KEY="your_elevenlabs_api_key_here"
   OPENAI_API_KEY="your_openai_api_key_here"
   ```
   
   **Frontend (`frontend/.env`):**
   ```env
   VITE_SUPABASE_URL="your_supabase_project_url"
   VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```
```

4. **Start the application:**
```bash
npm run dev
```

### 🌐 Access Your Application
- **Frontend (User Interface)**: http://localhost:5173
- **Backend (API Server)**: http://localhost:3000

## 🎮 Usage

1. **Start the Application**: Run `npm run dev` to launch both servers
2. **Ask Questions**: Type Python questions in English or Hinglish
3. **Use Quick Actions**: Click pre-made question buttons for instant responses
4. **Manage Conversations**: Use "New Chat" or "Clear Chat" buttons in header
5. **Camera Controls**: Zoom in/out and toggle green screen mode

## 🔧 Project Structure

```
ai-tutor-full-stack/
├── backend/                 # Node.js Express server
│   ├── index.js            # Main server file with OpenAI integration
│   ├── package.json        # Backend dependencies
│   ├── .env                # Environment variables (API keys)
│   ├── audios/             # Generated audio files
│   ├── bin/                # Rhubarb lip-sync executable
│   └── test.html           # API testing interface
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── App.jsx         # Main app with split-screen layout
│   │   ├── components/
│   │   │   ├── Avatar.jsx  # 3D avatar component
│   │   │   ├── Experience.jsx # 3D scene setup
│   │   │   └── UI.jsx      # Whiteboard interface
│   │   ├── hooks/
│   │   │   └── useChat.jsx # Chat state management
│   │   └── assets/         # 3D models and animations
│   ├── public/
│   │   ├── models/         # 3D avatar files (.glb, .fbx)
│   │   └── animations/     # Facial animations
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json with unified scripts
├── README.md               # This documentation
├── INSTALLATION_GUIDE.md   # Step-by-step setup for new devices
└── Documentation files...  # Additional guides
```

## � Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:backend` | Start only the backend server |
| `npm run dev:frontend` | Start only the frontend server |
| `npm run build` | Build frontend for production |
| `npm start` | Start both servers in production mode |
| `npm run install:all` | Install dependencies for all projects |

## 🌐 API Endpoints

- `GET /` - Welcome message
- `GET /test` - API testing interface
- `GET /voices` - List available ElevenLabs voices
- `POST /chat` - Main chat endpoint for AI interactions

## � Advanced Features

### Language Detection Algorithm
The system uses sophisticated pattern matching to detect Hinglish:
- **Hindi Words**: hai, hain, kya, kaise, yaar, bhai, etc.
- **Devanagari Script**: Any Hindi characters recognition
- **Roman Hindi**: mein, aap, karna, wala, etc.
- **Context Analysis**: Smart percentage-based detection

### Dynamic Token Management
Smart token allocation (500-2000 tokens) based on:
- Question complexity analysis
- Code example requirements
- Word count consideration
- Topic difficulty assessment

### Audio Processing Pipeline
1. Text input → OpenAI GPT-3.5-turbo
2. AI response → ElevenLabs voice synthesis
3. MP3 audio → FFmpeg conversion to WAV
4. WAV file → Rhubarb lip-sync analysis
5. Synchronized audio + lip-sync → Frontend playback

## 🛠 Development

### Adding New Features
1. **New AI Responses**: Modify system prompts in `backend/index.js`
2. **New Animations**: Add .fbx files to `frontend/public/animations/`
3. **New 3D Models**: Add .glb files to `frontend/public/models/`
4. **UI Components**: Create in `frontend/src/components/`

## � Latest Updates

### ✅ Recently Fixed Issues
- **Pre-made Question Buttons**: Now fully functional with proper click handlers
- **New Chat Button**: Added beside clear chat with confirmation dialog
- **Token Limits**: Enhanced to 500-2000 tokens for complete responses
- **Language Detection**: Improved accuracy for English/Hinglish switching
- **Chat Persistence**: History maintained across sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-3.5-turbo API
- ElevenLabs for voice synthesis
- Rhubarb for lip-sync technology
- React Three Fiber community
- Ready Player Me for 3D avatar models

## 📞 Support

For support and questions:
- Create an issue on [GitHub](https://github.com/maazajaz/ai-tutor-full-stack)
- Repository: https://github.com/maazajaz/ai-tutor-full-stack

---

**Made with ❤️ for Python learners worldwide** 🎓

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review the additional documentation
- Open an issue on GitHub

---

**Happy Learning! 🐍✨**
