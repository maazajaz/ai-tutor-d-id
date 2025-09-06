@echo off
echo ================================================
echo Python Tutor Backend - Quick Setup Script
echo ================================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js first.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

echo [2/5] Checking Yarn installation...
yarn --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Yarn not found, installing...
    npm install -g yarn
) else (
    echo ✅ Yarn found
)

echo [3/5] Installing project dependencies...
yarn install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
) else (
    echo ✅ Dependencies installed
)

echo [4/5] Checking environment configuration...
if not exist ".env" (
    echo ⚠️  .env file not found, creating from template...
    copy ".env.example" ".env"
    echo ⚠️  Please edit .env file and add your ElevenLabs API key!
    echo Opening .env file for editing...
    notepad .env
)

echo [5/5] Checking Ollama installation...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Ollama not found! 
    echo Please install Ollama from: https://ollama.com
    echo After installation, run: ollama pull llama3
    pause
    exit /b 1
) else (
    echo ✅ Ollama found
)

echo.
echo ================================================
echo 🎉 Setup Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Make sure Ollama is running: ollama serve
echo 2. Start the server: yarn dev
echo 3. Open browser: http://localhost:3000/test
echo.
echo For detailed instructions, see COMPLETE_SETUP_GUIDE.md
echo.
pause
