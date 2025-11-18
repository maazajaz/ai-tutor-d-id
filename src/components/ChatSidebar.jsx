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

  if (!chatSessions) {
    return null;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const resolveTimestamp = (session) =>
    session?.updatedAt || session?.updated_at || session?.createdAt || session?.created_at || session?.lastMessageAt || session?.last_message_at;

  const getSessionTitle = (session) => {
    if (session?.title?.trim()) return session.title.trim();
    const fallback = session?.messages?.[0]?.text?.trim();
    if (fallback) {
      return fallback.length > 40 ? `${fallback.slice(0, 37)}…` : fallback;
    }
    return 'Untitled Session';
  };

  const getMessagePreview = (session) => {
    const messages = session?.messages || [];
    const lastMessage = messages[messages.length - 1]?.text?.trim();
    if (!lastMessage) return 'Start a new conversation';
    return lastMessage.length > 60 ? `${lastMessage.slice(0, 57)}…` : lastMessage;
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
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      <div className={`
        fixed left-0 top-0 h-full w-80 z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:w-72 lg:w-80
      `}>
        <div className="flex flex-col h-full bg-gradient-to-b from-black via-[#130a04] to-[#2d1603] text-amber-100 border-r border-white/10 shadow-[0_25px_65px_rgba(0,0,0,0.7)]">
          <div className="p-5 border-b border-white/10 bg-black/40 backdrop-blur-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-[0.3em] uppercase text-amber-300/70 mb-1">History</p>
                <h2 className="text-xl font-semibold text-white truncate">Chat Timeline</h2>
                <p className="text-xs text-amber-200/70">All your tutoring sessions in one place</p>
              </div>
              <button
                onClick={onClose}
                className="md:hidden p-2 rounded-xl bg-white/5 text-amber-200 hover:bg-white/10 transition-colors"
                aria-label="Close sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full mt-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black font-semibold shadow-[0_15px_35px_rgba(0,0,0,0.45)] hover:brightness-110 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {chatSessions.length === 0 ? (
              <div className="mt-8 text-center text-amber-200/70">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-semibold text-white">No conversations yet</p>
                <p className="text-sm text-amber-200/70">Start a chat to see it listed here.</p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadChat(session.id)}
                  className={`
                    relative rounded-2xl border p-4 cursor-pointer transition-all group shadow-[0_15px_40px_rgba(0,0,0,0.35)]
                    ${currentChatId === session.id
                      ? 'bg-amber-400/15 border-amber-300/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'}
                  `}
                >
                  {currentChatId === session.id && (
                    <span className="absolute inset-y-4 left-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full"></span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-lg">
                      🧠
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {getSessionTitle(session)}
                        </h3>
                        <span className="text-[11px] uppercase tracking-wide text-amber-200/70 whitespace-nowrap">
                          {formatDate(resolveTimestamp(session))}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/80 mt-2 max-h-10 overflow-hidden leading-snug">
                        {getMessagePreview(session)}
                      </p>
                      <p className="text-[11px] text-amber-200/70 mt-2">
                        {session.messages?.length || 0} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(session.id, e)}
                      className={`ml-2 p-2 rounded-xl transition-colors text-sm ${
                        deleteConfirm === session.id
                          ? 'text-red-300 bg-red-500/10 border border-red-500/40'
                          : 'text-amber-200/60 hover:text-red-400 hover:bg-white/10'
                      }`}
                      title={deleteConfirm === session.id ? 'Click again to confirm' : 'Delete chat'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
