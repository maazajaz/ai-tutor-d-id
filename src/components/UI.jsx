import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useEmotionDetection } from "../hooks/useEmotionDetection";
import { ChatSidebar } from "./ChatSidebar";
import { ChatNotes } from "./ChatNotes";
import { MessageDisplay } from "./MessageDisplay";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const whiteboardRef = useRef();
  const previewVideoRef = useRef(); // Separate ref for preview video
  const { chat, loading, cameraZoomed, setCameraZoomed, message, chatHistory, clearChatHistory, startNewChat } = useChat();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [inputValue, setInputValue] = useState(''); // Track input value for button switching
  const [emotionDetectionEnabled, setEmotionDetectionEnabled] = useState(true);
  const [cameraStreamReady, setCameraStreamReady] = useState(false); // Track when camera is ready
  
  // Use refs to access current values in speech recognition callbacks
  const isLiveModeRef = useRef(false);
  const chatRef = useRef(chat);
  
  // Emotion detection handler
  const handleEmotionDetected = (emotionType, message) => {
    console.log(`🎭 Emotion detected: ${emotionType}`);
    
    // Automatically send the message to the AI tutor
    if (!loading && emotionType !== 'happy') {
      // For non-happy emotions, trigger the AI response
      chat(message);
    }
  };
  
  // Initialize emotion detection
  const { videoRef, isModelLoaded, currentEmotion } = useEmotionDetection({
    onEmotionDetected: handleEmotionDetected,
    enabled: emotionDetectionEnabled
  });
  
  // Update preview video when the main video starts playing
  useEffect(() => {
    if (!emotionDetectionEnabled || !videoRef.current || !previewVideoRef.current) return;
    
    const mainVideo = videoRef.current;
    const previewVideo = previewVideoRef.current;
    let isSetup = false;
    
    const setupPreview = () => {
      const stream = mainVideo.srcObject;
      console.log('🔍 Checking for stream:', !!stream, 'Already setup:', isSetup);
      
      if (stream && !isSetup) {
        console.log('🎥 Setting up preview video with stream');
        previewVideo.srcObject = stream;
        isSetup = true;
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
    
    // Try immediately
    setupPreview();
    
    // Fallback: check every 500ms for first 5 seconds
    const checkInterval = setInterval(() => {
      if (!isSetup) {
        setupPreview();
      } else {
        clearInterval(checkInterval);
      }
    }, 500);
    
    // Clean up after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000);
    
    return () => {
      mainVideo.removeEventListener('playing', setupPreview);
      mainVideo.removeEventListener('loadedmetadata', setupPreview);
      clearInterval(checkInterval);
      setCameraStreamReady(false);
    };
  }, [emotionDetectionEnabled]);
  
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
      clearChatHistory();
    }
  };

  const handleNewChat = () => {
    console.log('New chat button clicked');
    startNewChat();
  };

  const handleSidebarToggle = () => {
    console.log('Sidebar button clicked, current state:', showSidebar);
    setShowSidebar(!showSidebar);
  };

  const handleNotesToggle = () => {
    console.log('Notes button clicked, current state:', showNotes);
    setShowNotes(!showNotes);
  };

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message && text.trim()) {
      chat(text);
      input.current.value = "";
      setInputValue(''); // Clear the input value state
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-1 lg:p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Chat History Button */}
              <button
                onClick={() => setShowSidebar(true)}
                className="bg-green-500 hover:bg-green-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="Chat History"
              >
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-sm lg:text-2xl font-bold">🎓 AI Learning Board</h1>
                <p className="text-green-100 text-xs lg:text-sm hidden sm:block">Interactive AI-Powered Classroom</p>
              </div>
            </div>
            
            <div className="flex gap-1 lg:gap-2">
              {/* Chat History Button */}
              <button
                onClick={handleSidebarToggle}
                className="bg-purple-500 hover:bg-purple-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="Chat History"
              >
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </button>
              
              {/* Notes Button */}
              <button
                onClick={handleNotesToggle}
                className="bg-yellow-500 hover:bg-yellow-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="Chat Notes"
              >
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              {/* Emotion Detection Toggle */}
              <button
                onClick={() => setEmotionDetectionEnabled(!emotionDetectionEnabled)}
                className={`p-1 lg:p-2 rounded-lg transition-all ${
                  emotionDetectionEnabled 
                    ? "bg-green-500 hover:bg-green-400" 
                    : "bg-gray-500 hover:bg-gray-400"
                } text-white`}
                title={emotionDetectionEnabled ? "Emotion Detection: ON" : "Emotion Detection: OFF"}
              >
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isModelLoaded && emotionDetectionEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                )}
              </button>
              
              <button
                onClick={handleNewChat}
                className="bg-blue-500 hover:bg-blue-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
                title="Start New Chat"
              >
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
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
              <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Whiteboard Content Area */}
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
        {loading && (
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

      {/* Input Area */}
      <div className="border-t-2 border-gray-200 p-1 lg:p-4 bg-gray-50">
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
        
        {/* Quick Actions */}
        <div className="mt-1 lg:mt-3 flex flex-wrap gap-1 lg:gap-2">
          <button 
            onClick={() => handleQuickAction("Python code to write factorial function")}
            disabled={loading || message}
            className={`text-xs px-2 lg:px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            Python factorial code
          </button>
          <button 
            onClick={() => handleQuickAction("What is a node in data structure?")}
            disabled={loading || message}
            className={`text-xs px-2 lg:px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-purple-100 hover:bg-purple-200 text-purple-700"
            }`}
          >
            Data structure nodes
          </button>
          <button 
            onClick={() => handleQuickAction("What are classes and objects in C++?")}
            disabled={loading || message}
            className={`text-xs px-2 lg:px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-green-100 hover:bg-green-200 text-green-700"
            }`}
          >
            C++ classes & objects
          </button>
        </div>
      </div>
      
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
      
      {/* Debug: Camera Preview (visible when emotion detection is enabled) */}
      {emotionDetectionEnabled && (
        <div className="fixed bottom-32 left-4 z-50">
          <div className="bg-white border-2 border-green-500 rounded-lg p-2 shadow-lg">
            <div className="text-xs text-gray-600 mb-1 font-semibold">Camera Preview</div>
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              className="w-48 h-36 rounded border border-gray-300 object-cover bg-gray-100"
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
            <div className="text-xs text-gray-500 mt-1 text-center">
              {cameraStreamReady ? 'Face detection active' : 'Waiting for camera...'}
            </div>
          </div>
        </div>
      )}
      
      {/* Emotion Detection Status Indicator */}
      {emotionDetectionEnabled && (
        <div className="fixed bottom-20 right-4 bg-white border-2 border-green-500 rounded-lg p-3 shadow-lg z-50">
          {!isModelLoaded ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading models...</span>
            </div>
          ) : !videoRef.current?.srcObject ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Waiting for camera...</span>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-blue-500 hover:underline"
              >
                Reload if stuck
              </button>
            </div>
          ) : !currentEmotion ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Detecting face...</span>
              <span className="text-xs text-gray-500">Position your face in frame</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                {currentEmotion.emotion === 'happy' && '😊'}
                {currentEmotion.emotion === 'sad' && '😢'}
                {currentEmotion.emotion === 'angry' && '😠'}
                {currentEmotion.emotion === 'surprised' && '😮'}
                {currentEmotion.emotion === 'fearful' && '😨'}
                {currentEmotion.emotion === 'disgusted' && '🤢'}
                {currentEmotion.emotion === 'neutral' && '😐'}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-gray-800 capitalize">{currentEmotion.emotion}</div>
                <div className="text-gray-500">{Math.round(currentEmotion.confidence * 100)}%</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
};
