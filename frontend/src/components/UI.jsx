import { useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const whiteboardRef = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message, chatHistory, clearChatHistory } = useChat();

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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎓 Python Learning Board</h1>
            <p className="text-green-100 text-sm">Interactive AI-Powered Classroom</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNewChat}
              disabled={chatHistory.length === 0}
              className={`p-2 rounded-lg transition-colors ${
                chatHistory.length === 0 
                  ? "bg-gray-400 cursor-not-allowed text-gray-200" 
                  : "bg-blue-500 hover:bg-blue-400 text-white"
              }`}
              title={chatHistory.length === 0 ? "No chat to restart" : "Start New Chat"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={handleClearChat}
              disabled={chatHistory.length === 0}
              className={`p-2 rounded-lg transition-colors ${
                chatHistory.length === 0 
                  ? "bg-gray-400 cursor-not-allowed text-gray-200" 
                  : "bg-red-500 hover:bg-red-400 text-white"
              }`}
              title={chatHistory.length === 0 ? "No chat to clear" : "Clear Chat History"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => setCameraZoomed(!cameraZoomed)}
              className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-lg transition-colors"
              title={cameraZoomed ? "Zoom Out" : "Zoom In"}
            >
              {cameraZoomed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="flex-1 p-6 overflow-y-auto bg-white whiteboard-scroll whiteboard-grid"
      >
        {/* Welcome Message */}
        {chatHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-blue-800 mb-3">
                🚀 Welcome to Python Class!
              </h3>
              <p className="text-blue-600 mb-4">
                Ask me anything about Python programming. I can explain concepts in both English and Hinglish!
              </p>
              <div className="text-sm text-blue-500">
                <p><strong>Try asking:</strong></p>
                <p>• "What is Python?"</p>
                <p>• "Python kya hai?"</p>
                <p>• "How do variables work?"</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className="message-appear">
              {msg.sender === 'user' ? (
                // User message
                <div className="flex justify-end mb-4">
                  <div className="bg-blue-500 text-white rounded-xl p-4 max-w-md shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-white leading-relaxed font-medium">
                          {msg.text}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        👤
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // AI message
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-gray-800 leading-relaxed font-medium">
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
      <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              className="w-full p-4 pr-12 border-2 border-gray-300 rounded-xl bg-white placeholder:text-gray-500 focus:border-green-500 focus:outline-none text-gray-800 font-medium enhanced-input transition-all"
              placeholder="Ask your Python question here... (English or Hinglish)"
              ref={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
              </svg>
            </div>
          </div>
          <button
            disabled={loading || message}
            onClick={sendMessage}
            className={`bg-green-600 hover:bg-green-700 text-white p-4 px-8 font-semibold rounded-xl transition-all transform ${
              loading || message 
                ? "cursor-not-allowed opacity-50 scale-95" 
                : "hover:scale-105 shadow-lg"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Sending</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button 
            onClick={() => handleQuickAction("What is Python?")}
            disabled={loading || message}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            What is Python?
          </button>
          <button 
            onClick={() => handleQuickAction("Variables kaise use karte hain?")}
            disabled={loading || message}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-purple-100 hover:bg-purple-200 text-purple-700"
            }`}
          >
            Variables kaise use karte hain?
          </button>
          <button 
            onClick={() => handleQuickAction("Teach me about functions with examples")}
            disabled={loading || message}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              loading || message 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-green-100 hover:bg-green-200 text-green-700"
            }`}
          >
            Teach me functions
          </button>
        </div>
      </div>
    </div>
  );
};
