import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useYawnDetection } from "../hooks/useYawnDetection";
import { useAuth } from "../contexts/AuthContext";
import { ChatSidebar } from "./ChatSidebar";
import { ChatNotes } from "./ChatNotes";
import { MessageDisplay } from "./MessageDisplay";
import { Whiteboard } from "./Whiteboard";

export const UI = ({ hidden, showChat, setShowChat, onCameraStatus, ...props }) => {
  const input = useRef();
  const whiteboardRef = useRef();
  const previewVideoRef = useRef(); // Separate ref for preview video
  const { chat, loading, cameraZoomed, setCameraZoomed, message, chatHistory, setChatHistory, clearCurrentChat, startNewChat, currentChatId } = useChat();
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false); // Whiteboard state
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [inputValue, setInputValue] = useState(''); // Track input value for button switching
  
  // Detect if user is on mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Disable emotion detection by default on mobile due to camera permission issues
  const [emotionDetectionEnabled, setEmotionDetectionEnabled] = useState(!isMobile);
  const [cameraStreamReady, setCameraStreamReady] = useState(false); // Track when camera is ready
  const [showCameraPreview, setShowCameraPreview] = useState(!isMobile); // Hide by default on mobile
  
  // Use refs to access current values in speech recognition callbacks
  const isLiveModeRef = useRef(false);
  const chatRef = useRef(chat);
  
  // Yawn detection handler - sends engagement message with quiz instruction
  const handleYawnDetected = (detectionType, message) => {
    console.log(`😮 Yawn detected from student: ${detectionType}`);
    
    // Add system instruction for the agent to create an interactive quiz
    const enhancedMessage = `${message}\n\n[SYSTEM INSTRUCTION: The student is showing signs of fatigue/boredom by yawning repeatedly. Your response should:
1. Acknowledge their tiredness in a friendly, encouraging way
2. Create a SHORT, FUN, INTERACTIVE quiz question (only 1 question) about the current topic we're discussing
3. Make it multiple choice (A, B, C, D) if possible
4. Keep it simple and engaging - NOT difficult
5. After they answer, give immediate positive feedback and briefly explain the correct answer
6. Then ask if they want to continue learning or take a break

Example format:
"Hey! I see you're getting a bit tired 😊 Let's wake up your brain with a quick question!

🎯 Quick Quiz: [Question about current topic]
A) [Option 1]
B) [Option 2]  
C) [Option 3]
D) [Option 4]

What's your answer? Type A, B, C, or D!"]`;
    
    // Send to agent if not already processing
    if (!loading) {
      chat(enhancedMessage);
    }
  };

  // Drowsiness detection handler - sends re-engagement message with quiz
  const handleDrowsinessDetected = (detectionType, message) => {
    console.log(`💤 Drowsiness detected from student: ${detectionType}`);
    
    // Add system instruction for urgent engagement
    const enhancedMessage = `${message}\n\n[SYSTEM INSTRUCTION: The student's eyes are closing - they're very drowsy! Your response should:
1. Use an energetic, attention-grabbing tone (emojis, exclamation marks)
2. Create a super quick, FUN question (easier than normal)
3. Keep it very short - the student needs to stay awake!
4. Use their name if you know it
5. After they answer, suggest a 5-minute stretch break

Example:
"⚠️ Hey! Wake up! 👀 Your brain needs some action!

⚡ QUICK QUESTION: [Very simple question about what we just talked about]
A) [Option 1]
B) [Option 2]

Come on, you got this! What's your answer? 🎮"]`;
    
    if (!loading) {
      chat(enhancedMessage);
    }
  };
  
  // Initialize yawn detection
  const { videoRef, canvasRef, isInitialized, isLoading, error, detectionStats } = useYawnDetection({
    onYawnDetected: handleYawnDetected,
    onDrowsinessDetected: handleDrowsinessDetected,
    enabled: emotionDetectionEnabled
  });

  // Debug log for yawn detection state
  useEffect(() => {
    console.log('📊 Yawn Detection State:', {
      emotionDetectionEnabled,
      isInitialized,
      isLoading,
      error,
      hasVideoRef: !!videoRef.current
    });
  }, [emotionDetectionEnabled, isInitialized, isLoading, error]);
  
  // Update preview video when the main video starts playing OR when preview is toggled
  useEffect(() => {
    if (!emotionDetectionEnabled || !videoRef.current || !previewVideoRef.current || !showCameraPreview) return;
    
    const mainVideo = videoRef.current;
    const previewVideo = previewVideoRef.current;
    
    const setupPreview = () => {
      const stream = mainVideo.srcObject;
      console.log('🔍 Checking for stream:', !!stream, 'Preview visible:', showCameraPreview);
      
      if (stream) {
        console.log('🎥 Setting up preview video with stream');
        previewVideo.srcObject = stream;
        setCameraStreamReady(true); // Update state to trigger re-render
        
        previewVideo.play()
          .then(() => console.log('✅ Preview video playing'))
          .catch(err => {
            console.error('❌ Preview video play error:', err);
            // Retry once after a short delay
            setTimeout(() => {
              previewVideo.play().catch(e => console.error('❌ Retry failed:', e));
            }, 500);
          });
      }
    };
    
    // Listen for when the main video starts playing
    
    mainVideo.addEventListener('playing', setupPreview);
    mainVideo.addEventListener('loadedmetadata', setupPreview);
    
    // Try immediately when preview is shown
    setupPreview();
    
    // Fallback: check every 500ms for first 5 seconds
    const checkInterval = setInterval(() => {
      setupPreview();
    }, 500);
    
    // Clean up after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
    
    return () => {
      mainVideo.removeEventListener('playing', setupPreview);
      mainVideo.removeEventListener('loadedmetadata', setupPreview);
      clearInterval(checkInterval);
      setCameraStreamReady(false);
    };
  }, [emotionDetectionEnabled, showCameraPreview]); // Added showCameraPreview  // Notify parent about camera status changes
  useEffect(() => {
    if (onCameraStatus) {
      onCameraStatus({
        isEnabled: emotionDetectionEnabled,
        isModelLoaded: isInitialized,
        hasStream: !!videoRef.current?.srcObject,
        isReady: cameraStreamReady,
        currentEmotion: detectionStats
      });
    }
  }, [emotionDetectionEnabled, isInitialized, cameraStreamReady, detectionStats, onCameraStatus]);
  
  // Keep refs in sync with state
  useEffect(() => {
    isLiveModeRef.current = isLiveMode;
  }, [isLiveMode]);
  
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      let isProcessing = false;

      recognitionInstance.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (event.results[last].isFinal) {
          console.log('🎤 Final transcript:', transcript);
          
          // Update input field
          if (input.current) {
            input.current.value = transcript;
            setInputValue(transcript);
          }
          
          // If in live mode, send immediately using ref
          if (isLiveModeRef.current && !isProcessing) {
            isProcessing = true;
            console.log('📤 Sending in live mode:', transcript);
            chatRef.current(transcript);
            
            // Stop live mode after sending the message
            console.log('🛑 Stopping live mode after message sent');
            setIsLiveMode(false);
            setIsListening(false);
            isLiveModeRef.current = false;
            
            // Stop recognition
            try {
              recognitionInstance.stop();
            } catch (e) {
              console.error('Error stopping recognition:', e);
            }
            
            setTimeout(() => {
              isProcessing = false;
              if (input.current) {
                input.current.value = '';
                setInputValue('');
              }
            }, 100);
          }
        } else {
          // Show interim results
          if (input.current) {
            input.current.value = transcript + '...';
          }
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        
        // Only stop on critical errors
        if (event.error === 'aborted' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          setIsLiveMode(false);
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access in your browser settings.');
          }
        }
        // Ignore no-speech and other minor errors
      };

      recognitionInstance.onend = () => {
        console.log('🔴 Recognition ended');
        
        // Only restart if live mode is still active (using ref for current value)
        if (isLiveModeRef.current) {
          console.log('🔄 Restarting recognition for live mode...');
          setTimeout(() => {
            try {
              recognitionInstance.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
              if (e.message.includes('already started')) {
                // Ignore if already started
                console.log('Recognition already running');
              }
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      setRecognition(recognitionInstance);
      
      // Cleanup on unmount
      return () => {
        if (recognitionInstance) {
          try {
            recognitionInstance.stop();
          } catch (e) {
            // Ignore errors on cleanup
          }
        }
      };
    } else {
      console.warn('⚠️ Speech recognition not supported in this browser');
    }
  }, []); // Only initialize once

  const handleClearChat = () => {
    if (chatHistory.length === 0) {
      return; // Nothing to clear
    }
    
    if (window.confirm("Are you sure you want to clear the entire chat history? This action cannot be undone.")) {
      clearCurrentChat();
    }
  };

  const handleNewChat = () => {
    console.log('New chat button clicked');
    startNewChat();
  };

  // Close whiteboard when switching to a new chat
  useEffect(() => {
    if (currentChatId && showWhiteboard) {
      setShowWhiteboard(false);
    }
  }, [currentChatId]);

  const handleSidebarToggle = () => {
    console.log('Sidebar button clicked, current state:', showSidebar);
    setShowSidebar(!showSidebar);
  };

  const handleNotesToggle = () => {
    console.log('Notes button clicked, current state:', showNotes);
    setShowNotes(!showNotes);
  };

  const addMessageToHistory = (message) => {
    const newMessage = {
      ...message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    const text = input.current.value;
    if (!loading && !message && text.trim()) {
      // Check if the text contains a YouTube URL
      const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = text.match(youtubeRegex);
      
      if (match) {
        const youtubeUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        console.log('🎥 YouTube URL detected:', youtubeUrl);
        
        // Clear input immediately
        input.current.value = "";
        setInputValue('');

        // Generate message IDs and timestamp
        const msgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMessageId = Date.now();
        const loadingId = userMessageId + 1;
        
        // Add messages to chat history
        setChatHistory(prev => [
          ...prev,
          {
            id: userMessageId,
            text: youtubeUrl,
            sender: "user",
            time: msgTime
          },
          {
            id: loadingId,
            text: "🎬 Fetching video transcript and analyzing content... (This may take 10-20 seconds)",
            sender: "ai",
            time: msgTime,
            isLoading: true
          }
        ]);
        
        // Call backend API to summarize YouTube video
        try {
          console.log('📤 Sending YouTube URL to backend for summarization...');
          
          const response = await fetch('http://localhost:3000/api/summarize-youtube', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: youtubeUrl })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to summarize video');
          }

          const data = await response.json();
          console.log('✅ Video summarized successfully');
          
          // Replace loading message with summary
          setChatHistory(prev => prev.map(msg => 
            msg.id === loadingId 
              ? {
                  id: Date.now() + 1,
                  text: `📹 **YouTube Video Summary**\n\n${data.summary}`,
                  sender: "ai",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isYoutubeSummary: true
                }
              : msg
          ));
          
        } catch (error) {
          console.error('❌ Error summarizing YouTube video:', error);
          
          // Parse error message
          let errorMessage = 'Sorry, I couldn\'t summarize that video.';
          if (error.message) {
            if (error.message.includes('private') || error.message.includes('unavailable')) {
              errorMessage = '🔒 This video is private or unavailable. Please try a public video.';
            } else if (error.message.includes('age-restricted')) {
              errorMessage = '⚠️ This video is age-restricted and cannot be accessed. Please try another video.';
            } else if (error.message.includes('transcript') || error.message.includes('captions')) {
              errorMessage = '📝 This video doesn\'t have accessible captions. Please try a video with captions enabled.';
            } else if (error.message.includes('OpenAI')) {
              errorMessage = '🤖 AI service is temporarily unavailable. Please try again in a moment.';
            } else {
              errorMessage = `❌ ${error.message}`;
            }
          }
          
          // Replace loading message with error
          setChatHistory(prev => prev.map(msg => 
            msg.id === loadingId 
              ? {
                  id: Date.now() + 1,
                  text: errorMessage,
                  sender: "ai",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isError: true
                }
              : msg
          ));
        }
      } else {
        // Regular message - send to D-ID agent
        chat(text);
        input.current.value = "";
        setInputValue('');
      }
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      // Stop transcribing - keep the transcribed text in the input
      try {
        recognition.stop();
        setIsListening(false);
        console.log('🛑 Transcribe mode stopped - ready to send');
        // Don't clear input or inputValue - keep the transcribed text
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    } else {
      try {
        setIsListening(true);
        recognition.start();
        console.log('🎤 Transcribe mode started...');
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsListening(false);
        if (e.message.includes('already started')) {
          // Recognition is already running, just update state
          setIsListening(true);
        }
      }
    }
  };

  const toggleLiveMode = () => {
    if (!recognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isLiveMode) {
      // Stop live mode
      try {
        setIsLiveMode(false);
        setIsListening(false);
        recognition.stop();
        input.current.value = '';
        setInputValue('');
        console.log('🛑 Live mode stopped');
      } catch (e) {
        console.error('Error stopping live mode:', e);
      }
    } else {
      // Start live mode
      try {
        setIsLiveMode(true);
        setIsListening(true);
        recognition.start();
        console.log('🎙️ Live conversation mode started - speak naturally!');
      } catch (e) {
        console.error('Error starting live mode:', e);
        setIsLiveMode(false);
        setIsListening(false);
        if (e.message.includes('already started')) {
          // Recognition is already running, just update state
          setIsLiveMode(true);
          setIsListening(true);
        }
      }
    }
  };

  const handleQuickAction = (questionText) => {
    if (!loading && !message) {
      input.current.value = questionText;
      sendMessage();
    }
  };

  // Auto-scroll whiteboard to bottom when new messages arrive
  useEffect(() => {
    if (whiteboardRef.current) {
      whiteboardRef.current.scrollTop = whiteboardRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (hidden) {
    return null;
  }

  return (
    <>
      {/* Chat History Sidebar */}
      <ChatSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      
      {/* Notes Panel */}
      <ChatNotes isOpen={showNotes} onClose={() => setShowNotes(false)} />
      
      <div className="h-full flex flex-col bg-white shadow-2xl">
        {/* Whiteboard Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-2 lg:p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Title */}
            <div className="flex items-center gap-1 lg:gap-2 min-w-0">
              <div className="min-w-0">
                <h1 className="text-xs lg:text-2xl font-bold truncate">🎓 AI Board</h1>
                <p className="text-green-100 text-[10px] lg:text-sm hidden sm:block">Interactive AI Classroom</p>
              </div>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex gap-1 flex-shrink-0 flex-wrap">
              {/* History Button */}
              <button
                onClick={handleSidebarToggle}
                className="bg-purple-500 hover:bg-purple-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="Chat History"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </button>
              
              {/* Notes Button */}
              <button
                onClick={handleNotesToggle}
                className="bg-yellow-500 hover:bg-yellow-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="Chat Notes"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              {/* Emotion Toggle */}
              <button
                onClick={() => setEmotionDetectionEnabled(!emotionDetectionEnabled)}
                className={`p-1 lg:p-2 rounded-lg transition-all relative ${
                  emotionDetectionEnabled 
                    ? "bg-green-500 hover:bg-green-400" 
                    : "bg-gray-500 hover:bg-gray-400"
                } text-white`}
                title={emotionDetectionEnabled ? "Emotion: ON" : "Emotion: OFF"}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isInitialized && emotionDetectionEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                )}
              </button>
              
              {/* Camera Preview Toggle - Only when emotion enabled */}
              {emotionDetectionEnabled && (
                <button
                  onClick={() => setShowCameraPreview(!showCameraPreview)}
                  className={`p-1 lg:p-2 rounded-lg transition-all ${
                    showCameraPreview 
                      ? "bg-blue-500 hover:bg-blue-400" 
                      : "bg-gray-500 hover:bg-gray-400"
                  } text-white`}
                  title={showCameraPreview ? "Hide Camera" : "Show Camera"}
                >
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showCameraPreview ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              )}
              
              {/* Chat Toggle */}
              <button
                onClick={() => {
                  if (showWhiteboard) {
                    // If whiteboard is open, close it to show chat
                    setShowWhiteboard(false);
                  } else {
                    // If both are closed, toggle the parent chat visibility
                    setShowChat(!showChat);
                  }
                }}
                className={`p-1 lg:p-2 rounded-lg transition-all ${
                  !showWhiteboard && showChat
                    ? "bg-indigo-500 hover:bg-indigo-400" 
                    : "bg-gray-500 hover:bg-gray-400"
                } text-white`}
                title={!showWhiteboard && showChat ? "Hide Chat" : "Show Chat"}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {!showWhiteboard && showChat ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  )}
                </svg>
              </button>

              {/* Whiteboard Toggle */}
              <button
                onClick={() => {
                  if (!showChat) {
                    // If container is hidden, show it first
                    setShowChat(true);
                  }
                  // Toggle whiteboard
                  setShowWhiteboard(!showWhiteboard);
                }}
                className={`p-1 lg:p-2 rounded-lg transition-all ${
                  showWhiteboard 
                    ? "bg-purple-500 hover:bg-purple-400" 
                    : "bg-gray-500 hover:bg-gray-400"
                } text-white`}
                title={showWhiteboard ? "Close Whiteboard" : "Open Whiteboard"}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              {/* New Chat */}
              <button
                onClick={handleNewChat}
                className="bg-blue-500 hover:bg-blue-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="New Chat"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              {/* Clear Chat */}
              <button
                onClick={handleClearChat}
                disabled={chatHistory.length === 0}
                className={`p-1 lg:p-2 rounded-lg transition-colors ${
                  chatHistory.length === 0 
                    ? "bg-gray-400 cursor-not-allowed text-gray-200" 
                    : "bg-red-500 hover:bg-red-400 text-white"
                }`}
                title={chatHistory.length === 0 ? "No chat to clear" : "Clear Chat History"}
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      {/* Content Area - Chat or Whiteboard */}
      {showWhiteboard ? (
        /* Whiteboard Mode */
        <div className="flex-1 overflow-hidden">
          <Whiteboard 
            onClose={() => setShowWhiteboard(false)}
            chatSessionId={currentChatId || `guest-${Date.now()}`}
          />
        </div>
      ) : (
        /* Chat Mode */
        <div 
          ref={whiteboardRef}
          className="flex-1 p-2 lg:p-6 overflow-y-auto bg-white whiteboard-scroll whiteboard-grid"
        >
        {/* Live Mode Indicator */}
        {isLiveMode && (
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-xl mb-4 shadow-lg animate-pulse">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <p className="font-bold text-lg">🎙️ LIVE CONVERSATION MODE</p>
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
            <p className="text-center text-sm mt-2 opacity-90">
              Speak naturally - Your voice will be sent immediately to the AI tutor
            </p>
          </div>
        )}
        
        {/* Welcome Message */}
        {chatHistory.length === 0 && (
          <div className="text-center py-3 lg:py-12">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 lg:p-8 max-w-md mx-auto">
              <h3 className="text-base lg:text-xl font-semibold text-blue-800 mb-2">
                🚀 Welcome to AI Avatar Class!
              </h3>
              <p className="text-blue-600 mb-3 text-xs lg:text-base">
                Ask me anything! I can help you learn any subject in both English and Hinglish!
              </p>
              <div className="text-xs lg:text-sm text-blue-500">
                <p><strong>Try asking:</strong></p>
                <p>• "Python code to write factorial function"</p>
                <p>• "What is a node in data structure?"</p>
                <p>• "What are classes and objects in C++?"</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-2 lg:space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className="message-appear">
              {msg.sender === 'user' ? (
                // User message
                <div className="flex justify-end mb-2 lg:mb-4">
                  <div className="bg-blue-500 text-white rounded-xl p-2 lg:p-4 max-w-xs lg:max-w-md shadow-sm">
                    <div className="flex items-start gap-2 lg:gap-3">
                      <div className="flex-1">
                        <p className="text-white leading-relaxed font-medium text-sm lg:text-base">
                          {msg.text}
                        </p>
                      </div>
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm">
                        👤
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // AI message
                <div className="bg-white border-2 border-gray-200 rounded-xl p-2 lg:p-4 shadow-sm">
                  <div className="flex items-start gap-2 lg:gap-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-2 lg:p-3 border border-gray-200">
                        <div className="text-gray-800 leading-relaxed font-medium text-sm lg:text-base">
                          <MessageDisplay message={msg.text} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {msg.played && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Spoken</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Loading Message */}
        {(loading || message) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
              <p className="text-yellow-800 font-medium">Your tutor is thinking...</p>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Input Area - Sticky at bottom on mobile - Show only in chat mode */}
      {!showWhiteboard && (
      <div className="border-t-2 border-gray-200 p-1 lg:p-4 bg-gray-50 sticky bottom-0 left-0 right-0 z-30">
        <div className="flex items-center gap-1 lg:gap-2">
          <div className="flex-1 relative">
            <input
              className="w-full p-2 lg:p-4 pr-8 lg:pr-12 border-2 border-gray-300 rounded-xl bg-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none text-gray-800 font-medium enhanced-input transition-all text-xs lg:text-base"
              placeholder={isListening ? "Listening..." : "Ask any question..."}
              ref={input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isListening || isLiveMode}
            />
          </div>
          
          {/* Show microphone buttons when input is empty and not listening */}
          {!inputValue.trim() && !isLiveMode && !isListening ? (
            <>
              {/* Transcribe Button - Simple Microphone */}
              <button
                onClick={toggleVoiceInput}
                disabled={loading || message}
                className={`p-2 lg:p-3 rounded-xl transition-all transform bg-gray-500 hover:bg-gray-600 text-white ${
                  loading || message 
                    ? "cursor-not-allowed opacity-50" 
                    : "hover:scale-105"
                }`}
                title="Transcribe voice to text"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>

              {/* Live Conversation Button - Waveform Icon */}
              <button
                onClick={toggleLiveMode}
                disabled={loading || message}
                className={`p-2 lg:p-3 rounded-xl transition-all transform bg-pink-500 hover:bg-pink-600 text-white ${
                  loading || message 
                    ? "cursor-not-allowed opacity-50" 
                    : "hover:scale-105"
                }`}
                title="Start live conversation mode"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="10" width="2" height="4" rx="1"/>
                  <rect x="6" y="6" width="2" height="12" rx="1"/>
                  <rect x="10" y="8" width="2" height="8" rx="1"/>
                  <rect x="14" y="4" width="2" height="16" rx="1"/>
                  <rect x="18" y="7" width="2" height="10" rx="1"/>
                  <rect x="22" y="9" width="2" height="6" rx="1"/>
                </svg>
              </button>
            </>
          ) : isListening && !isLiveMode ? (
            /* Transcribe mode - Show animated waveform */
            <button
              onClick={toggleVoiceInput}
              disabled={loading || message}
              className="p-2 lg:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105"
              title="Stop recording"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="10" width="2" height="4" rx="1" className="animate-[pulse_0.8s_ease-in-out_infinite]"/>
                <rect x="6" y="6" width="2" height="12" rx="1" className="animate-[pulse_0.8s_ease-in-out_0.1s_infinite]"/>
                <rect x="10" y="8" width="2" height="8" rx="1" className="animate-[pulse_0.8s_ease-in-out_0.2s_infinite]"/>
                <rect x="14" y="4" width="2" height="16" rx="1" className="animate-[pulse_0.8s_ease-in-out_0.3s_infinite]"/>
                <rect x="18" y="7" width="2" height="10" rx="1" className="animate-[pulse_0.8s_ease-in-out_0.4s_infinite]"/>
                <rect x="22" y="9" width="2" height="6" rx="1" className="animate-[pulse_0.8s_ease-in-out_0.5s_infinite]"/>
              </svg>
            </button>
          ) : inputValue.trim() && !isLiveMode ? (
            /* Show Send button when user types */
            <button
              disabled={loading || message || !inputValue.trim()}
              onClick={sendMessage}
              className={`bg-green-600 hover:bg-green-700 text-white p-2 lg:p-3 rounded-xl transition-all transform ${
                loading || message || !inputValue.trim()
                  ? "cursor-not-allowed opacity-50" 
                  : "hover:scale-105"
              }`}
              title="Send message"
            >
              {loading ? (
                <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          ) : null}

          {/* Stop Live Mode button when in live mode */}
          {isLiveMode && (
            <button
              onClick={toggleLiveMode}
              className="p-2 lg:p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white animate-pulse"
              title="Stop live conversation"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Quick Actions - Mobile optimized */}
        <div className="mt-1 lg:mt-3 flex flex-wrap gap-1 lg:gap-2 justify-center">
          <button 
            onClick={() => handleQuickAction("Python code to write factorial function")}
            disabled={loading || message}
            className={`text-[10px] lg:text-xs px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            Python code
          </button>
          <button 
            onClick={() => handleQuickAction("What is a node in data structure?")}
            disabled={loading || message}
            className={`text-[10px] lg:text-xs px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-purple-100 hover:bg-purple-200 text-purple-700"
            }`}
          >
            Data structures
          </button>
          <button 
            onClick={() => handleQuickAction("What are classes and objects in C++?")}
            disabled={loading || message}
            className={`text-[10px] lg:text-xs px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-green-100 hover:bg-green-200 text-green-700"
            }`}
          >
            C++ classes
          </button>
        </div>
      </div>
      )}
      
      {/* Hidden Video Element for Emotion Detection */}
      {/* Hidden video for emotion detection (desktop) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }}
        onLoadedMetadata={() => {
          console.log('📹 Emotion detection video metadata loaded');
          console.log('📐 Stream dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('🎬 Stream object:', videoRef.current?.srcObject ? 'Present' : 'Missing');
        }}
        onPlay={() => console.log('▶️ Emotion detection video playing')}
      />
      
      {/* Camera Preview - Much smaller mobile optimized with Yawn Detection Stats */}
      {emotionDetectionEnabled && showCameraPreview && (
        <div className="fixed bottom-20 lg:bottom-32 left-1 lg:left-4 z-50 transition-all duration-300">
          <div className="bg-white border-2 border-green-500 rounded-lg p-1 lg:p-2 shadow-lg">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-[8px] lg:text-xs text-gray-600 font-semibold">Detection</div>
              <button
                onClick={() => setShowCameraPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Hide Preview"
              >
                <svg className="w-2.5 h-2.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="w-20 h-16 lg:w-48 lg:h-36 rounded border border-gray-300 object-cover bg-gray-100"
              onLoadedMetadata={() => {
                console.log('🎬 Preview video metadata loaded');
                // Force play on metadata load
                previewVideoRef.current?.play().catch(err => 
                  console.error('Preview play on metadata failed:', err)
                );
              }}
              onPlay={() => console.log('▶️ Preview video playing')}
              onPause={() => console.log('⏸️ Preview video paused')}
              onError={(e) => console.error('❌ Preview video error:', e)}
            />
            {/* Yawn Detection Stats - Smaller text */}
            <div className="text-[7px] lg:text-[10px] text-gray-600 mt-0.5 space-y-0.5">
              {error ? (
                <div className="text-red-600 font-semibold text-center text-[7px]">
                  ❌ {error}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center gap-1">
                    <span>😮:</span>
                    <span className="font-semibold">{detectionStats.yawns}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1">
                    <span>👁️:</span>
                    <span className="font-semibold">{detectionStats.blinks}</span>
                  </div>
                  {/* Live Metrics for Calibration */}
                  {detectionStats.currentMAR > 0 && (
                    <div className="flex justify-between items-center border-t border-gray-300 pt-0.5 mt-0.5 gap-1">
                      <span className="text-gray-500">MAR:</span>
                      <span className={`font-mono font-semibold ${detectionStats.currentMAR > 0.5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {detectionStats.currentMAR.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {detectionStats.currentEAR > 0 && (
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-gray-500">EAR:</span>
                      <span className={`font-mono font-semibold ${detectionStats.currentEAR < 0.15 ? 'text-red-600' : 'text-green-600'}`}>
                        {detectionStats.currentEAR.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {detectionStats.yawnDuration > 0 && (
                    <div className="text-orange-600 font-semibold animate-pulse text-[7px]">
                      ⚠️ {detectionStats.yawnDuration.toFixed(1)}s
                    </div>
                  )}
                  {detectionStats.microsleepDuration > 0 && (
                    <div className="text-red-600 font-semibold animate-pulse text-[7px]">
                      💤 {detectionStats.microsleepDuration.toFixed(1)}s
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={`text-[10px] lg:text-xs mt-1 text-center font-semibold ${
              error ? 'text-red-500' : 
              isInitialized ? 'text-green-500' : 
              isLoading ? 'text-yellow-500' :
              emotionDetectionEnabled ? 'text-blue-500' :
              'text-gray-400'
            }`}>
              {error ? '❌ Error' : 
               isInitialized ? '✅ Active' : 
               isLoading ? '⏳ Loading...' :
               emotionDetectionEnabled ? '🔵 Starting...' :
               '⚪ Disabled'}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
