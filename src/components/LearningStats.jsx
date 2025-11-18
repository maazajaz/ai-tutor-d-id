import { useState, useEffect, useMemo } from 'react';
import { useChat } from '../hooks/useChat';

export const LearningStats = () => {
  const { chatSessions, initialLoading } = useChat();
  const panelClasses = 'rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_15px_45px_rgba(0,0,0,0.45)] p-6 text-gray-100';
  const statCardClasses = 'rounded-xl bg-white/5 border border-white/10 p-4';
  
  // Show loading state while data is being fetched
  if (initialLoading) {
    return (
      <div className={panelClasses}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              📊 Learning Statistics
            </h3>
            <p className="text-sm text-gray-300">Loading your stats...</p>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse border border-white/5">
              <div className="h-4 bg-white/10 rounded w-24 mb-3"></div>
              <div className="h-8 bg-white/10 rounded w-16 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-20"></div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="h-4 bg-white/10 rounded w-32 mb-3"></div>
          <div className="flex items-end justify-between gap-2 h-32">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-1 bg-white/10 rounded-t-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Memoize expensive stats calculation - only recalculate when chatSessions actually changes
  const stats = useMemo(() => {
    console.log('📊 Calculating stats... Sessions:', chatSessions?.length || 0);
    
    if (!chatSessions || chatSessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        topicsDiscussed: [],
        learningStreak: 0,
        averageSessionLength: 0,
        mostActiveDay: 'Monday',
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      };
    }

    let totalMessages = 0;
    let topicsMap = {};
    let dailyActivity = {};
    const weekActivity = [0, 0, 0, 0, 0, 0, 0];

    chatSessions.forEach(session => {
      const messages = session.messages || [];
      totalMessages += messages.length;

      // Extract topics from first user message
      const firstMessage = messages.find(m => m.sender === 'user');
      if (firstMessage) {
        // Simple topic extraction (first 3 words)
        const words = firstMessage.text.split(' ').slice(0, 3).join(' ');
        topicsMap[words] = (topicsMap[words] || 0) + 1;
      }

      // Calculate daily activity
      if (session.created_at) {
        const date = new Date(session.created_at);
        const dayOfWeek = date.getDay();
        weekActivity[dayOfWeek]++;

        const dateStr = date.toDateString();
        dailyActivity[dateStr] = (dailyActivity[dateStr] || 0) + 1;
      }
    });

    // Calculate streak (consecutive days with activity)
    const sortedDates = Object.keys(dailyActivity).sort((a, b) => 
      new Date(b) - new Date(a)
    );
    
    let streak = 0;
    let lastDate = new Date();
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor((lastDate - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        lastDate = date;
      } else {
        break;
      }
    }

    // Get top 5 topics
    const topTopics = Object.entries(topicsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    // Find most active day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDayIndex = weekActivity.indexOf(Math.max(...weekActivity));

    // Calculate average session length
    const totalMessagesPerSession = chatSessions.reduce((sum, s) => 
      sum + (s.messages?.length || 0), 0
    );
    const avgLength = chatSessions.length > 0 
      ? Math.round(totalMessagesPerSession / chatSessions.length) 
      : 0;

    console.log('✅ Stats calculated:', {
      totalSessions: chatSessions.length,
      totalMessages,
      topicsCount: topTopics.length
    });

    return {
      totalSessions: chatSessions.length,
      totalMessages,
      topicsDiscussed: topTopics,
      learningStreak: streak,
      averageSessionLength: avgLength,
      mostActiveDay: dayNames[mostActiveDayIndex] || 'Monday',
      weeklyActivity: weekActivity,
    };
  }, [chatSessions]); // Only recalculate when chatSessions reference changes

  return (
    <div className={panelClasses}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            📊 Learning Statistics
          </h3>
          <p className="text-sm text-gray-300">Your learning journey at a glance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Sessions */}
        <div className={statCardClasses}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💬</span>
            <span className="text-xs font-medium text-gray-300">Total Sessions</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </div>

        {/* Learning Streak */}
        <div className={statCardClasses}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <span className="text-xs font-medium text-gray-300">Streak</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.learningStreak}</div>
          <div className="text-xs text-gray-400 mt-1">days in a row</div>
        </div>

        {/* Total Messages */}
        <div className={statCardClasses}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💭</span>
            <span className="text-xs font-medium text-gray-300">Messages</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalMessages}</div>
          <div className="text-xs text-gray-400 mt-1">total exchanges</div>
        </div>

        {/* Avg Session Length */}
        <div className={statCardClasses}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏱️</span>
            <span className="text-xs font-medium text-gray-300">Avg Length</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.averageSessionLength}</div>
          <div className="text-xs text-gray-400 mt-1">messages/session</div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-200 mb-3">Weekly Activity</h4>
        <div className="flex items-end justify-between gap-2 h-32">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
            const maxActivity = Math.max(...stats.weeklyActivity, 1);
            const height = (stats.weeklyActivity[index] / maxActivity) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-white/5 rounded-t-lg relative flex items-end justify-center" style={{ height: '100%' }}>
                  <div 
                    className="w-full bg-gradient-to-t from-amber-400 to-yellow-500 rounded-t-lg transition-all duration-300"
                    style={{ height: `${height}%`, minHeight: stats.weeklyActivity[index] > 0 ? '10%' : '0%' }}
                  >
                    {stats.weeklyActivity[index] > 0 && (
                      <div className="text-white text-xs font-bold text-center pt-1">
                        {stats.weeklyActivity[index]}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-300">{day}</span>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-400 text-center mt-2">
          Most active: <span className="font-semibold text-gray-100">{stats.mostActiveDay}</span>
        </div>
      </div>

      {/* Top Topics */}
      {stats.topicsDiscussed.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-200 mb-3">Top Topics</h4>
          <div className="space-y-2">
            {stats.topicsDiscussed.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-100 truncate">
                      {item.topic}
                    </span>
                    <span className="text-xs text-gray-400">{item.count}x</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(item.count / stats.topicsDiscussed[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalSessions === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-3">📚</div>
          <p className="text-gray-300 text-sm">
            Start your first learning session to see statistics!
          </p>
        </div>
      )}
    </div>
  );
};
