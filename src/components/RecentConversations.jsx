import { useState } from 'react';
import { useChat } from '../hooks/useChat';

export const RecentConversations = ({ onResumeChat }) => {
  const { chatSessions, loadChatSession, initialLoading } = useChat();
  const [hoveredSession, setHoveredSession] = useState(null);
  const panelClasses = 'rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_15px_45px_rgba(0,0,0,0.45)] p-6 text-gray-100';
  const sessionButtonClasses = 'w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-200/60 hover:bg-white/10 transition-all duration-200 group';

  // Show loading skeleton while data is being fetched
  if (initialLoading) {
    return (
      <div className={panelClasses}>
        <h3 className="text-xl font-bold text-white mb-4">💬 Recent Conversations</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get recent sessions (last 5)
  const recentSessions = chatSessions
    .filter(session => session.messages && session.messages.length > 0)
    .slice(0, 5);

  const getTimeSince = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getPreviewText = (messages) => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const text = lastMessage.text;
      return text.length > 80 ? text.substring(0, 80) + '...' : text;
    }
    return 'No messages yet';
  };

  const getSessionIcon = (index) => {
    const icons = ['💬', '🎓', '📝', '💡', '🔬'];
    return icons[index % icons.length];
  };

  const handleResumeChat = (sessionId) => {
    loadChatSession(sessionId);
    if (onResumeChat) {
      onResumeChat();
    }
  };

  return (
    <div className={panelClasses}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            🕒 Recent Conversations
          </h3>
          <p className="text-sm text-gray-300">Pick up where you left off</p>
        </div>
        {recentSessions.length > 0 && (
          <span className="text-xs bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full font-medium border border-emerald-300/40">
            {recentSessions.length} active
          </span>
        )}
      </div>

      {recentSessions.length > 0 ? (
        <div className="space-y-3">
          {recentSessions.map((session, index) => (
            <button
              key={session.id}
              onClick={() => handleResumeChat(session.id)}
              onMouseEnter={() => setHoveredSession(session.id)}
              onMouseLeave={() => setHoveredSession(null)}
              className={`${sessionButtonClasses}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {getSessionIcon(index)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-white text-sm truncate group-hover:text-emerald-200 transition-colors">
                      {session.title || 'Untitled Chat'}
                    </h4>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {getTimeSince(session.updated_at || session.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-300 line-clamp-2 mb-2">
                    {getPreviewText(session.messages)}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      {session.messages?.length || 0} messages
                    </span>
                    {session.notes && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Has notes
                      </span>
                    )}
                  </div>
                </div>

                {/* Resume Arrow */}
                <div className={`flex items-center justify-center transition-all duration-200 ${
                  hoveredSession === session.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                }`}>
                  <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h4 className="text-lg font-semibold text-white mb-2">No conversations yet</h4>
          <p className="text-sm text-gray-300 mb-4">
            Start your first learning session to see your chat history here
          </p>
          <button
            onClick={onResumeChat}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <span>Start Learning</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
