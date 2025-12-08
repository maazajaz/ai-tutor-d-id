import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DIDExperience } from './DIDExperience';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Interview = ({ onBack }) => {
  const { user } = useAuth();
  const [interviewType, setInterviewType] = useState(null); // 'technical', 'behavioral', 'hr'
  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('fresher'); // 'fresher', 'intermediate', 'expert'
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentMessage, setAgentMessage] = useState(''); // Message for D-ID agent to speak
  const [messageKey, setMessageKey] = useState(0); // Force message updates
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const recognitionRef = useRef(null);
  const welcomeMessageSentRef = useRef(false);

  const interviewTypes = [
    {
      id: 'technical',
      icon: '💻',
      title: 'Technical Interview',
      description: 'Test your coding, problem-solving, and technical knowledge',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'behavioral',
      icon: '🧠',
      title: 'Behavioral Interview',
      description: 'Practice answering questions about your experiences and soft skills',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'hr',
      icon: '👔',
      title: 'HR Interview',
      description: 'Prepare for general HR questions and company fit assessment',
      color: 'from-green-500 to-teal-500'
    }
  ];

  const experienceLevels = [
    { id: 'fresher', label: 'Fresher (0-2 years)', icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate (2-5 years)', icon: '🌿' },
    { id: 'expert', label: 'Expert (5+ years)', icon: '🌳' }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startInterview = async () => {
    if (!jobRole.trim()) {
      alert('Please enter the job role');
      return;
    }
    
    setIsLoading(true);
    setIsStarted(true);
    welcomeMessageSentRef.current = false;
    
    // Wait for agent to connect before sending welcome message
    console.log('🎬 Interview starting, waiting for agent connection...');
  };

  // Send welcome message once agent is connected
  useEffect(() => {
    if (isStarted && isAgentConnected && !welcomeMessageSentRef.current && !interviewComplete) {
      console.log('✅ Agent connected, sending welcome message');
      welcomeMessageSentRef.current = true;
      
      // Welcome message - Agent speaks as the interviewer
      setAgentMessage(`Hello! Welcome to your ${interviewType} interview for the ${jobRole} position. I'll be asking you ${totalQuestions} questions today. Take your time to think through your answers, and remember - there are no wrong answers, only opportunities to showcase your skills and experience. Let's begin!`);
      setMessageKey(prev => prev + 1);
      
      // Wait a bit for welcome message to play, then show first question
      setTimeout(async () => {
        const question = await generateQuestion(1);
        setCurrentQuestion(question);
        setQuestionNumber(1);
        setAgentMessage(`${question} Take your time and give me your best answer. Good luck!`);
        setMessageKey(prev => prev + 1);
        setIsLoading(false);
      }, 3000);
    }
  }, [isStarted, isAgentConnected, interviewComplete]);

  const generateQuestion = async (qNumber) => {
    try {
      console.log(`📝 Generating question ${qNumber} for ${interviewType} interview...`);
      
      const response = await fetch(`${API_URL}/api/interview/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          jobRole,
          experience,
          questionNumber: qNumber,
          totalQuestions,
          previousAnswers: userAnswers
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.question) {
        throw new Error('No question received from API');
      }
      
      console.log(`✅ Question ${qNumber} generated successfully`);
      return data.question;
    } catch (error) {
      console.error('❌ Error generating question:', error);
      
      // Generate a fallback question based on interview type and question number
      const fallbackQuestions = {
        technical: [
          `Explain the core concepts and technologies you would use for building a ${jobRole} solution.`,
          `Describe a challenging technical problem you've solved and your approach to solving it.`,
          `How would you optimize the performance of an application in your role as a ${jobRole}?`,
          `What are the best practices you follow for code quality and maintainability?`,
          `Explain how you would design a scalable system for ${jobRole} requirements.`
        ],
        behavioral: [
          `Tell me about a time when you had to work under pressure. How did you handle it?`,
          `Describe a situation where you had to collaborate with a difficult team member.`,
          `Give me an example of when you took initiative on a project without being asked.`,
          `Tell me about a time when you failed at something. What did you learn?`,
          `Describe how you handle constructive criticism and feedback.`
        ],
        hr: [
          `Why are you interested in the ${jobRole} position at our company?`,
          `What are your greatest strengths and how do they apply to this role?`,
          `Where do you see yourself in 5 years?`,
          `What motivates you in your professional career?`,
          `Why should we hire you for this ${jobRole} position?`
        ]
      };
      
      const questions = fallbackQuestions[interviewType] || fallbackQuestions.technical;
      return questions[(qNumber - 1) % questions.length];
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) {
      alert('Please provide an answer');
      return;
    }
    
    // Agent acknowledges the answer as the interviewer
    setAgentMessage("Thank you for your answer. Let me prepare the next question.");
    setMessageKey(prev => prev + 1);
    
    // Save answer
    const answer = {
      questionNumber,
      question: currentQuestion,
      answer: transcript,
      timestamp: new Date().toISOString()
    };
    
    setUserAnswers([...userAnswers, answer]);
    setTranscript('');
    
    // Check if interview is complete
    if (questionNumber >= totalQuestions) {
      setIsLoading(true);
      setAgentMessage("That was your final question. Let me analyze your performance and prepare detailed feedback for you. This will just take a moment.");
      setMessageKey(prev => prev + 1);
      
      const feedbackData = await generateFeedback([...userAnswers, answer]);
      setFeedback(feedbackData);
      setInterviewComplete(true);
      
      // Agent delivers final feedback as the interviewer
      let feedbackMessage = '';
      if (feedbackData.overallScore >= 80) {
        feedbackMessage = `Excellent work! You scored ${feedbackData.overallScore} out of 100. ${feedbackData.summary} You showed great understanding and communication skills. Keep up the fantastic work!`;
      } else if (feedbackData.overallScore >= 60) {
        feedbackMessage = `Good job! You scored ${feedbackData.overallScore} out of 100. ${feedbackData.summary} With some practice on the areas I've highlighted, you'll be even better prepared for your next interview. Keep practicing!`;
      } else {
        feedbackMessage = `You scored ${feedbackData.overallScore} out of 100. ${feedbackData.summary} Don't be discouraged! Every interview is a learning opportunity. Focus on the improvement areas I've identified, practice regularly, and you'll see great progress. You've got this!`;
      }
      
      setAgentMessage(feedbackMessage);
      setMessageKey(prev => prev + 1);
      setIsLoading(false);
    } else {
      // Generate next question
      setIsLoading(true);
      
      setTimeout(async () => {
        const nextQuestion = await generateQuestion(questionNumber + 1);
        setCurrentQuestion(nextQuestion);
        setQuestionNumber(questionNumber + 1);
        setAgentMessage(`Great! Here's your next question: ${nextQuestion} Take your time and answer confidently. You're doing well!`);
        setMessageKey(prev => prev + 1);
        setIsLoading(false);
      }, 2000);
    }
  };

  const generateFeedback = async (answers) => {
    try {
      console.log(`📊 Generating feedback for ${answers.length} answers...`);
      
      const response = await fetch(`${API_URL}/api/interview/generate-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          jobRole,
          experience,
          answers
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Feedback generated successfully');
      return data.feedback;
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      
      // Generate basic fallback feedback
      const avgScore = 70; // Default middle score
      return {
        overallScore: avgScore,
        strengths: [
          'Provided thoughtful responses to the questions',
          'Demonstrated understanding of the role requirements',
          'Communicated clearly throughout the interview'
        ],
        improvements: [
          'Could provide more specific examples from past experience',
          'Consider structuring answers using the STAR method',
          'Practice technical terminology relevant to the role'
        ],
        summary: `You completed the ${interviewType} interview for ${jobRole}. Keep practicing to improve your interview skills!`
      };
    }
  };

  const resetInterview = () => {
    setInterviewType(null);
    setJobRole('');
    setExperience('fresher');
    setIsStarted(false);
    setCurrentQuestion('');
    setQuestionNumber(0);
    setUserAnswers([]);
    setTranscript('');
    setInterviewComplete(false);
    setFeedback(null);
  };

  // Setup Screen
  if (!interviewType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎯 Interview Practice</h1>
              <p className="text-amber-200">Practice with AI-powered mock interviews</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Interview Type Selection */}
          <div className="grid md:grid-cols-3 gap-6">
            {interviewTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setInterviewType(type.id)}
                className={`p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all transform hover:-translate-y-2 hover:shadow-2xl text-left group`}
              >
                <div className={`text-6xl mb-4 transition-transform group-hover:scale-110`}>
                  {type.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{type.title}</h3>
                <p className="text-gray-300">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Configuration Screen
  if (!isStarted) {
    const selectedType = interviewTypes.find(t => t.id === interviewType);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{selectedType.icon} {selectedType.title}</h1>
              <p className="text-amber-200">Configure your interview session</p>
            </div>
            <button
              onClick={() => setInterviewType(null)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              ← Change Type
            </button>
          </div>

          {/* Configuration Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Job Role */}
            <div>
              <label className="block text-sm font-semibold mb-2">Job Role / Position</label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold mb-2">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {experienceLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`p-4 rounded-xl border transition-all ${
                      experience === level.id
                        ? 'bg-amber-400 border-amber-400 text-black'
                        : 'bg-white/5 border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-3xl mb-2">{level.icon}</div>
                    <div className="text-sm font-semibold">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-semibold mb-2">Number of Questions</label>
              <div className="flex gap-3">
                {[3, 5, 7, 10].map(num => (
                  <button
                    key={num}
                    onClick={() => setTotalQuestions(num)}
                    className={`flex-1 py-3 rounded-xl border transition-all ${
                      totalQuestions === num
                        ? 'bg-amber-400 border-amber-400 text-black'
                        : 'bg-white/5 border-white/20 hover:border-white/40'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startInterview}
              disabled={!jobRole.trim()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                jobRole.trim()
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-2xl transform hover:-translate-y-1'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Interview 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview Complete Screen
  if (interviewComplete && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold mb-2">Interview Complete!</h1>
            <p className="text-amber-200">Here's your performance feedback</p>
          </div>

          {/* Feedback Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-xl">
              <div className="text-6xl font-bold mb-2">{feedback.overallScore}/100</div>
              <div className="text-xl text-amber-200">Overall Performance</div>
            </div>

            {/* Strengths */}
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>💪</span> Strengths
              </h3>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                    <span className="text-green-400">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📈</span> Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                    <span className="text-amber-400">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary */}
            <div className="p-6 bg-white/5 rounded-xl">
              <h3 className="text-xl font-bold mb-3">Summary</h3>
              <p className="text-gray-300 leading-relaxed">{feedback.summary}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={resetInterview}
                className="py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition-all"
              >
                Start New Interview
              </button>
              <button
                onClick={onBack}
                className="py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold hover:shadow-2xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interview In Progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white">
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-red-900/90 to-black border-2 border-red-500 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Exit Interview?</h2>
              <p className="text-gray-300">
                Are you sure you want to exit? Your progress will be lost and you won't receive any feedback for this session.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-semibold"
              >
                Continue Interview
              </button>
              <button
                onClick={() => {
                  setShowExitWarning(false);
                  resetInterview();
                  onBack();
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition-all font-semibold"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - AI Avatar */}
        <div className="lg:w-1/2 h-[40vh] lg:h-screen relative bg-black/30">
          <DIDExperience 
            message={{ text: agentMessage || currentQuestion, key: messageKey }}
            onMessagePlayed={() => {}}
            onConnectionChange={setIsAgentConnected}
            speakOnly={true}
            skipChatHistory={true}
          />
          {/* Agent Message Display - Visual Text */}
          {agentMessage && isAgentConnected && (
            <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-amber-400/95 to-yellow-500/95 text-black rounded-2xl p-4 shadow-2xl border-2 border-amber-600 animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎤</span>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">Interviewer Says:</p>
                  <p className="text-base leading-relaxed">{agentMessage}</p>
                </div>
              </div>
            </div>
          )}
          {/* Connection Status */}
          {isStarted && !isAgentConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-semibold">Connecting to AI Agent...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Interview Panel */}
        <div className="lg:w-1/2 p-4 lg:p-6 flex flex-col h-[60vh] lg:h-screen overflow-y-auto">
          {/* Header with Exit Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Question {questionNumber} of {totalQuestions}</span>
                <span className="text-xs sm:text-sm text-amber-200">{Math.round((questionNumber / totalQuestions) * 100)}% Complete</span>
              </div>
            </div>
            <button
              onClick={() => setShowExitWarning(true)}
              className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-500 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              ❌ Exit Interview
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 lg:mb-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-6 mb-4">
            <div className="flex items-start gap-2 lg:gap-3">
              <span className="text-2xl lg:text-3xl">❓</span>
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3">Current Question</h3>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-400">Loading next question...</span>
                  </div>
                ) : (
                  <p className="text-base lg:text-lg text-gray-200 leading-relaxed">{currentQuestion}</p>
                )}
              </div>
            </div>
          </div>

          {/* Answer Input */}
          <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-6 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 lg:mb-4">
              <h3 className="text-lg lg:text-xl font-bold">Your Answer</h3>
              <button
                onClick={toggleListening}
                disabled={isLoading}
                className={`px-3 py-2 rounded-xl font-semibold transition-all text-sm lg:text-base ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-amber-400 hover:bg-amber-500 text-black'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isListening ? '⏸️ Stop' : '🎤 Record'}
              </button>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Click 'Record' to speak or type here..."
              disabled={isLoading}
              className="flex-1 w-full px-3 py-2 lg:px-4 lg:py-3 rounded-xl bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none resize-none transition-colors text-sm lg:text-base min-h-[100px]"
            />

            <button
              onClick={submitAnswer}
              disabled={!transcript.trim() || isLoading}
              className={`mt-3 lg:mt-4 py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg transition-all ${
                transcript.trim() && !isLoading
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-2xl transform hover:-translate-y-1'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {questionNumber >= totalQuestions ? 'Submit & Get Feedback' : 'Submit & Next'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
