import { useState } from 'react';
import { useChat } from '../hooks/useChat';

export const ChatSidebar = ({ isOpen, onClose }) => {
  const { 
    chatSessions, 
    currentChatId, 
    startNewChat, 
    loadChatSession, 
    deleteChatSession 
  } = useChat();
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Safety check for chatSessions
  if (!chatSessions) {
    return null;
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleDeleteChat = (sessionId, e) => {
    e.stopPropagation();
    if (deleteConfirm === sessionId) {
      deleteChatSession(sessionId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(sessionId);
    }
  };

  const handleNewChat = () => {
    startNewChat();
    onClose();
  };

  const handleLoadChat = (sessionId) => {
    loadChatSession(sessionId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:w-72 lg:w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
              <button
                onClick={onClose}
                className="md:hidden p-1 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto p-2">
            {chatSessions.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No chat history yet</p>
                <p className="text-sm">Start a conversation to see it here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleLoadChat(session.id)}
                    className={`
                      group relative p-3 rounded-lg cursor-pointer transition-colors
                      ${currentChatId === session.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {session.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(session.updatedAt)}
                        </p>
                        {session.messages.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {session.messages.length} messages
                          </p>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteChat(session.id, e)}
                        className={`
                          opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded
                          ${deleteConfirm === session.id 
                            ? 'text-red-600 bg-red-50' 
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }
                        `}
                        title={deleteConfirm === session.id ? 'Click again to confirm' : 'Delete chat'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Active indicator */}
                    {currentChatId === session.id && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
