# 🎯 Interview Practice Feature

## Overview
AI-powered mock interview system with D-ID avatar and OpenAI integration for realistic interview practice.

## Features Added

### 1. **Interview Component** (`src/components/Interview.jsx`)
- **Three Interview Types:**
  - 💻 Technical Interview - Coding, algorithms, system design
  - 🧠 Behavioral Interview - STAR method, soft skills, experiences
  - 👔 HR Interview - Background, motivation, company fit

- **Experience Levels:**
  - 🌱 Fresher (0-2 years)
  - 🌿 Intermediate (2-5 years)
  - 🌳 Expert (5+ years)

- **Features:**
  - Customizable job role input
  - 3, 5, 7, or 10 question sessions
  - Speech-to-text answer recording
  - Real-time D-ID avatar interviewer
  - AI-powered performance feedback
  - Detailed scoring (0-100)

### 2. **Dashboard Integration** (`src/components/Dashboard.jsx`)
- New Interview Practice card with purple gradient
- Click to navigate to interview setup

### 3. **App Routing** (`src/App.jsx`)
- Added 'interview' view state
- Lazy-loaded Interview component
- Proper view switching without remounting

### 4. **Backend API Endpoints** (`server/server.js`)

#### **POST /api/interview/generate-question**
Generates contextual interview questions based on:
- Interview type (technical/behavioral/hr)
- Job role
- Experience level
- Question number
- Previous Q&A history

Uses GPT-3.5-turbo for fast question generation.

#### **POST /api/interview/generate-feedback**
Analyzes complete interview transcript and provides:
- Overall score (0-100)
- 3-5 specific strengths
- 3-5 areas for improvement
- Summary assessment

Uses GPT-4 for detailed analysis and feedback.

## How It Works

### D-ID Integration
1. **Avatar Display:** Uses DIDExperience component to show interviewer
2. **Question Delivery:** Current question is passed as `message` prop to D-ID
3. **Realistic Experience:** Avatar speaks questions using D-ID's text-to-speech
4. **WebRTC Streaming:** Real-time video connection for natural interaction

### OpenAI Integration
1. **Question Generation:**
   - System prompts tailored to interview type
   - Progressive difficulty based on question number
   - Context-aware (considers previous answers)
   - Temperature: 0.8 for variety

2. **Feedback Generation:**
   - GPT-4 analyzes entire transcript
   - JSON-formatted structured feedback
   - Constructive criticism with actionable advice
   - Temperature: 0.7 for balanced assessment

### Speech Recognition
- Browser native Speech Recognition API
- Real-time transcription
- Interim and final results
- Manual text input fallback

## User Flow

1. **Select Interview Type** → Choose technical, behavioral, or HR
2. **Configure Session** → Enter job role, experience level, number of questions
3. **Start Interview** → AI generates first question
4. **Record Answer** → Use speech-to-text or type response
5. **Submit & Continue** → AI generates next question based on context
6. **Complete Interview** → Receive detailed performance feedback
7. **Review Feedback** → See score, strengths, improvements, summary

## Technical Architecture

```
Frontend (React)
  ├── Interview.jsx (Main component)
  ├── DIDExperience.jsx (Avatar display)
  └── Speech Recognition API
          ↓
Backend (Express.js)
  ├── /api/interview/generate-question
  │     └── OpenAI GPT-3.5-turbo
  └── /api/interview/generate-feedback
        └── OpenAI GPT-4
          ↓
D-ID Agents API
  └── WebRTC streaming for avatar video
```

## API Request Examples

### Generate Question
```json
POST /api/interview/generate-question
{
  "interviewType": "technical",
  "jobRole": "Frontend Developer",
  "experience": "intermediate",
  "questionNumber": 2,
  "totalQuestions": 5,
  "previousAnswers": [...]
}
```

### Generate Feedback
```json
POST /api/interview/generate-feedback
{
  "interviewType": "technical",
  "jobRole": "Frontend Developer",
  "experience": "intermediate",
  "answers": [
    {
      "questionNumber": 1,
      "question": "...",
      "answer": "...",
      "timestamp": "2025-12-08T..."
    }
  ]
}
```

## Environment Variables Required
- `VITE_DID_API_KEY` - D-ID API key for avatar
- `OPENAI_API_KEY` - OpenAI API key for questions/feedback

## Future Enhancements
- [ ] Save interview history to Supabase
- [ ] Downloadable PDF feedback reports
- [ ] Video recording of interview session
- [ ] Follow-up questions based on answers
- [ ] Industry-specific question banks
- [ ] Peer comparison metrics
- [ ] Practice with past company questions

## Testing
To test the interview feature:
1. Start backend: `npm run dev:server`
2. Start frontend: `npm run dev:client`
3. Navigate to Dashboard
4. Click "Interview Practice" card
5. Select interview type and configure
6. Practice with AI interviewer!
