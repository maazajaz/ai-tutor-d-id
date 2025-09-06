import { useRef, useEffect, useState } from "react";
import { useChat } from "../hooks/useChat";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const whiteboardRef = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message, chatHistory, clearChatHistory } = useChat();
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showMobileAudioPrompt, setShowMobileAudioPrompt] = useState(false);

  // Check if mobile and show audio initialization prompt
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const wasInitialized = localStorage.getItem('mobileAudioInitialized') === 'true';
    
    console.log('Mobile detection:', { isMobile, wasInitialized, audioInitialized });
    
    if (isMobile && !audioInitialized && !wasInitialized) {
      setShowMobileAudioPrompt(true);
    } else if (wasInitialized) {
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  const initializeMobileAudio = async () => {
    try {
      console.log('🔧 Initializing mobile audio...');
      
      // Multiple strategies to unlock mobile audio
      
      // Strategy 1: Create audio context
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext state:', ctx.state);
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
        console.log('AudioContext resumed');
      }
      
      // Strategy 2: Play multiple silent audio formats
      const silentAudioPromises = [
        // MP3 format
        new Audio('data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAW1wM1BST1YgdjMuOTggcmVsLiAxLjA3NgD/80DEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v///////////////////8AAAAATGF2YzMuOTgAAAAAAAAAAAAAAAAkAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA'),
        // WAV format fallback
        new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMfCjiN1fLNeSsFJHfH8N+RQQoUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFApGnt/xvmMfCj2N1fLNeSsFJHfH8N+RQQsUXrTp66hVFA==')
      ];
      
      // Try to play all silent audio formats
      for (const silentAudio of silentAudioPromises) {
        try {
          silentAudio.volume = 0.1; // Very low volume
          silentAudio.muted = false;
          silentAudio.playsInline = true;
          
          const playPromise = silentAudio.play();
          if (playPromise) {
            await playPromise;
            console.log('✅ Silent audio played successfully');
            break; // Success, no need to try other formats
          }
        } catch (silentError) {
          console.log('Silent audio failed:', silentError.message);
          // Continue to next format
        }
      }
      
      // Strategy 3: Create and play a very short beep
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 0.01; // Very quiet
        oscillator.frequency.value = 440; // A4 note
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.01); // 10ms beep
        console.log('✅ Oscillator beep played');
      } catch (oscError) {
        console.log('Oscillator failed:', oscError.message);
      }
      
      setAudioInitialized(true);
      setShowMobileAudioPrompt(false);
      console.log('🎉 Mobile audio fully initialized!');
      
      // Store in localStorage to remember for next visit
      localStorage.setItem('mobileAudioInitialized', 'true');
      
    } catch (error) {
      console.error('❌ Failed to initialize mobile audio:', error);
      // Still hide the prompt and try to continue
      setShowMobileAudioPrompt(false);
      setAudioInitialized(true);
    }
  };

  const handleClearChat = () => {
    if (chatHistory.length === 0) {
      return; // Nothing to clear
    }
    
    if (window.confirm("Are you sure you want to clear the entire chat history? This action cannot be undone.")) {
      clearChatHistory();
    }
  };

  const handleNewChat = () => {
    if (chatHistory.length === 0) {
      return; // Nothing to clear
    }
    
    if (window.confirm("Start a new conversation? Current chat will be cleared.")) {
      clearChatHistory();
    }
  };

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message && text.trim()) {
      chat(text);
      input.current.value = "";
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
    <div className="h-full flex flex-col bg-white shadow-2xl">
      {/* Whiteboard Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-1 lg:p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm lg:text-2xl font-bold">🎓 AI Learning Board</h1>
            <p className="text-green-100 text-xs lg:text-sm hidden sm:block">Interactive AI-Powered Classroom</p>
          </div>
          <div className="flex gap-1 lg:gap-2">
            <button
              onClick={handleNewChat}
              disabled={chatHistory.length === 0}
              className={`p-1 lg:p-2 rounded-lg transition-colors ${
                chatHistory.length === 0 
                  ? "bg-gray-400 cursor-not-allowed text-gray-200" 
                  : "bg-blue-500 hover:bg-blue-400 text-white"
              }`}
              title={chatHistory.length === 0 ? "No chat to restart" : "Start New Chat"}
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
            <button
              onClick={() => setCameraZoomed(!cameraZoomed)}
              className="bg-green-500 hover:bg-green-400 text-white p-1 lg:p-2 rounded-lg transition-colors"
              title={cameraZoomed ? "Zoom Out" : "Zoom In"}
            >
              {cameraZoomed ? (
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
              ) : (
                <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                const body = document.querySelector("body");
                if (body.classList.contains("greenScreen")) {
                  body.classList.remove("greenScreen");
                } else {
                  body.classList.add("greenScreen");
                }
              }}
              className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-lg transition-colors"
              title="Toggle Green Screen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
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
                <p>• "What is photosynthesis?"</p>
                <p>• "Math mein fractions kaise solve karte hain?"</p>
                <p>• "How do I write a good essay?"</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Audio Initialization Prompt */}
        {showMobileAudioPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-auto shadow-2xl">
              <div className="text-center">
                <div className="text-4xl mb-4">🔊</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Enable Audio
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  To hear your AI teacher speak, please tap the button below to enable audio on your mobile device.
                </p>
                <button
                  onClick={initializeMobileAudio}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  🎵 Enable Audio
                </button>
                <button
                  onClick={() => setShowMobileAudioPrompt(false)}
                  className="w-full mt-2 text-gray-500 text-sm underline"
                >
                  Skip (text only)
                </button>
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
                        <p className="text-gray-800 leading-relaxed font-medium text-sm lg:text-base">
                          {msg.text}
                        </p>
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
        <div className="flex items-center gap-1 lg:gap-3">
          <div className="flex-1 relative">
            <input
              className="w-full p-2 lg:p-4 pr-8 lg:pr-12 border-2 border-gray-300 rounded-xl bg-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none text-gray-800 font-medium enhanced-input transition-all text-xs lg:text-base"
              placeholder="Ask any question..."
              ref={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <div className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-3 h-3 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
              </svg>
            </div>
          </div>
          <button
            disabled={loading || message}
            onClick={sendMessage}
            className={`bg-green-600 hover:bg-green-700 text-white p-2 lg:p-4 px-3 lg:px-8 font-semibold rounded-xl transition-all transform text-xs lg:text-base ${
              loading || message 
                ? "cursor-not-allowed opacity-50 scale-95" 
                : "hover:scale-105 shadow-lg"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-1 lg:gap-2">
                <div className="animate-spin w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="hidden lg:inline">Sending</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 lg:gap-2">
                <span>Send</span>
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-1 lg:mt-3 flex flex-wrap gap-1 lg:gap-2">
          <button 
            onClick={() => handleQuickAction("What is photosynthesis?")}
            disabled={loading || message}
            className={`text-xs px-2 lg:px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            What is photosynthesis?
          </button>
          <button 
            onClick={() => handleQuickAction("Math mein fractions kaise solve karte hain?")}
            disabled={loading || message}
            className={`text-xs px-2 lg:px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-purple-100 hover:bg-purple-200 text-purple-700"
            }`}
          >
            Math mein fractions?
          </button>
          <button 
            onClick={() => handleQuickAction("How do I write a good essay?")}
            disabled={loading || message}
            className={`text-xs px-2 lg:px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-green-100 hover:bg-green-200 text-green-700"
            }`}
          >
            How to write essays?
          </button>
        </div>
      </div>
    </div>
  );
};
