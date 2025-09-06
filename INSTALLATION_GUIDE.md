# 💻 Installation Guide - Transfer to New Laptop

This guide provides step-by-step instructions to set up the AI Python Tutor project on a new laptop using Git clone.

## 📋 Prerequisites Checklist

Before starting, ensure your new laptop has the following installed:

### ✅ Required Software

1. **Node.js (v16 or higher)**
   - Download: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git**
   - Download: https://git-scm.com/
   - Verify installation: `git --version`

3. **FFmpeg** (Required for audio processing)
   - **Windows**: Download from https://ffmpeg.org/download.html
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`
   - Verify installation: `ffmpeg -version`

### 🔑 Required API Keys

Prepare these API keys before installation:

1. **OpenAI API Key**
   - Sign up: https://platform.openai.com/
   - Create API key: https://platform.openai.com/api-keys
   - Ensure billing is set up for usage

2. **ElevenLabs API Key**
   - Sign up: https://elevenlabs.io/
   - Get API key from your dashboard
   - Free tier includes 10,000 characters per month

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository

Open your terminal/command prompt and run:

```bash
# Clone the repository
git clone https://github.com/maazajaz/ai-tutor-full-stack.git

# Navigate to the project directory
cd ai-tutor-full-stack
```

### Step 2: Install Dependencies

Install all project dependencies with a single command:

```bash
npm run install:all
```

This command will:
- Install root-level dependencies (concurrently)
- Install backend dependencies (Express, OpenAI, ElevenLabs, etc.)
- Install frontend dependencies (React, Vite, Three.js, etc.)

### Step 3: Set Up Environment Variables

Create the environment configuration file:

#### For Windows:
```cmd
# Navigate to backend directory
cd backend

# Create .env file
echo. > .env
```

#### For macOS/Linux:
```bash
# Navigate to backend directory
cd backend

# Create .env file
touch .env
```

#### Edit the .env file:
Open `backend/.env` in your preferred text editor and add:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key_here

# Optional: Port configuration (default is 3000)
PORT=3000
```

**Important**: Replace the placeholder values with your actual API keys.

### Step 4: Verify Installation

Test that everything is working:

```bash
# Go back to project root
cd ..

# Start the development servers
npm run dev
```

You should see output similar to:
```
[0] 🎓 AI Python Tutor listening on port 3000
[0] 🌐 Frontend: http://localhost:5173
[0] 🤖 Backend: http://localhost:3000
[1] ➜  Local:   http://localhost:5173/
```

### Step 5: Test the Application

1. **Open your browser** and go to: http://localhost:5173
2. **Test the interface**:
   - You should see the 3D avatar on the left
   - Whiteboard interface on the right
   - Pre-made question buttons at the bottom
3. **Test functionality**:
   - Click on "What is Python?" button
   - Wait for AI response with voice and lip-sync
   - Try typing a question in Hinglish: "Python kya hai?"

## 🛠 Project Structure Overview

After successful installation, your project structure will be:

```
ai-tutor-full-stack/
├── 📁 backend/                 # Node.js server
│   ├── 📄 index.js            # Main server file
│   ├── 📄 package.json        # Backend dependencies
│   ├── 📄 .env                # Your API keys (keep private!)
│   ├── 📁 audios/             # Generated audio files
│   ├── 📁 bin/                # Rhubarb lip-sync tools
│   └── 📄 test.html           # API testing page
├── 📁 frontend/               # React application
│   ├── 📁 src/                # Source code
│   ├── 📁 public/             # 3D models and animations
│   ├── 📄 package.json        # Frontend dependencies
│   └── 📄 vite.config.js      # Vite configuration
├── 📄 package.json            # Root package.json
├── 📄 README.md               # Main documentation
└── 📄 INSTALLATION_GUIDE.md   # This file
```

## 🎯 Available Commands

Once installed, you can use these commands:

### Development Commands
```bash
# Start both frontend and backend
npm run dev

# Start only backend (port 3000)
npm run dev:backend

# Start only frontend (port 5173)
npm run dev:frontend
```

### Production Commands
```bash
# Build frontend for production
npm run build

# Start production servers
npm start
```

### Utility Commands
```bash
# Install/update all dependencies
npm run install:all

# Install only backend dependencies
npm run install:backend

# Install only frontend dependencies
npm run install:frontend
```

## 🔧 Configuration Options

### Backend Configuration (backend/.env)
```env
# Required API Keys
OPENAI_API_KEY=sk-...
ELEVEN_LABS_API_KEY=...

# Optional Settings
PORT=3000                      # Backend port (default: 3000)
NODE_ENV=development           # Environment mode
```

### Frontend Configuration (automatic)
- Frontend runs on port 5173
- Automatically proxies API calls to backend
- Hot reload enabled for development

## 🐛 Troubleshooting

### Common Installation Issues

#### 1. **Port Already in Use**
```bash
# Kill processes on ports 3000 and 5173
npx kill-port 3000 5173

# Or manually find and kill processes
netstat -ano | findstr :3000    # Windows
lsof -ti:3000 | xargs kill      # macOS/Linux
```

#### 2. **FFmpeg Not Found**
**Error**: `ffmpeg: command not found`

**Solution**:
- **Windows**: Download FFmpeg, extract, and add to PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

#### 3. **Node Version Issues**
**Error**: Requires Node.js v16 or higher

**Solution**:
```bash
# Check current version
node --version

# Update Node.js from nodejs.org
# Or use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

#### 4. **API Key Issues**
**Error**: Unauthorized or API key invalid

**Solution**:
- Verify API keys in `backend/.env`
- Check OpenAI billing is set up
- Ensure ElevenLabs account is active
- No spaces around the `=` in .env file

#### 5. **Dependencies Installation Failed**
**Error**: npm install fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 6. **3D Avatar Not Loading**
**Issue**: Avatar doesn't appear or animations fail

**Solution**:
- Check console for WebGL errors
- Ensure browser supports WebGL
- Try refreshing the page
- Check if all model files are present in `frontend/public/models/`

## 📊 Performance Tips

### For Better Performance:
1. **Close unnecessary applications** while running the AI tutor
2. **Use Chrome or Firefox** for best 3D performance
3. **Ensure stable internet** for API calls
4. **Keep FFmpeg updated** for audio processing

### System Requirements:
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: Multi-core processor recommended
- **GPU**: Dedicated graphics card for better 3D performance
- **Internet**: Stable connection for AI and voice APIs

## 🔒 Security Notes

### API Key Safety:
- **Never commit** `.env` file to Git
- **Keep API keys private** - don't share publicly
- **Regenerate keys** if accidentally exposed
- **Monitor usage** in OpenAI and ElevenLabs dashboards

### Network Security:
- Development servers are for local use only
- For production deployment, configure proper security headers
- Use HTTPS in production environments

## 📈 Next Steps

After successful installation:

1. **Explore the Features**:
   - Try different question types
   - Test both English and Hinglish inputs
   - Experiment with the camera controls

2. **Customize the Content**:
   - Modify the Python syllabus in `backend/index.js`
   - Add new animations to `frontend/public/animations/`
   - Customize the UI colors and styling

3. **Extend Functionality**:
   - Add new voice models from ElevenLabs
   - Implement additional languages
   - Create new avatar expressions

## 📞 Getting Help

If you encounter issues during installation:

1. **Check the console logs** for error messages
2. **Verify all prerequisites** are correctly installed
3. **Ensure API keys** are valid and properly configured
4. **Create an issue** on GitHub: https://github.com/maazajaz/ai-tutor-full-stack/issues

## ✅ Installation Checklist

- [ ] Node.js v16+ installed and verified
- [ ] Git installed and verified
- [ ] FFmpeg installed and verified
- [ ] Repository cloned successfully
- [ ] All dependencies installed (`npm run install:all`)
- [ ] Environment variables configured (`backend/.env`)
- [ ] OpenAI API key added and verified
- [ ] ElevenLabs API key added and verified
- [ ] Development servers started (`npm run dev`)
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend accessible at http://localhost:3000
- [ ] Test conversation completed successfully
- [ ] Audio and lip-sync working properly

---

**Congratulations! 🎉 Your AI Python Tutor is now ready to use on your new laptop!**
