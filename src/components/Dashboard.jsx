import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LearningStats } from './LearningStats'
import { RecentConversations } from './RecentConversations'
import { QuizGenerator } from './QuizGenerator'

export const Dashboard = ({ onNavigateToChat, onNavigateToCustomize }) => {
  const { user, profile } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('dashboard') // dashboard, quiz

  // Get display name or fallback to email
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User'

  const navigationItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', active: activeView === 'dashboard' },
    { id: 'agents', icon: '🤖', label: 'My Agents', active: false },
    { id: 'history', icon: '📚', label: 'Learning History', active: false },
    { id: 'analytics', icon: '📊', label: 'Analytics', active: false },
    { id: 'settings', icon: '⚙️', label: 'Settings', active: false },
  ]

  const handleNavigationClick = (itemId) => {
    if (itemId === 'dashboard') {
      setActiveView('dashboard')
    }
    setMobileMenuOpen(false) // Close mobile menu after navigation
    // Add other navigation handlers as needed
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-lg p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">🎓 AI Tutor</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation - Desktop & Mobile */}
      <aside className={`
        bg-white shadow-xl transition-all duration-300 flex flex-col
        md:relative fixed inset-y-0 left-0 z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarCollapsed ? 'md:w-20 w-64' : 'w-64'}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">🎓 AI Tutor</h1>
                <p className="text-xs text-gray-500 mt-1">Digital Learning</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
              title={sidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg 
                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                  sidebarCollapsed ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="text-2xl">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Section at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate text-sm">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Continue Learning Card */}
          <button
            onClick={onNavigateToChat}
            className="group bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 md:p-6 text-left border-2 border-transparent hover:border-green-500 transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                🤖
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
              Continue Learning
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
              Resume your AI-powered learning session with your personal tutor
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 font-medium">
              <span>Open Agent Chat</span>
              <svg className="w-3 h-3 md:w-4 md:h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Customize Agent Card */}
          <button
            onClick={onNavigateToCustomize}
            className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 md:p-6 text-left border-2 border-dashed border-purple-300 hover:border-purple-500 transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-purple-300 group-hover:border-purple-500 transition-colors">
                <span className="text-2xl md:text-3xl">➕</span>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
              Customize Your Agent
            </h3>
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">
              Personalize your AI tutor's appearance, voice, and teaching style
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-purple-600 font-medium">
              <span>Customize Now</span>
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          {/* Learning Statistics - Full Width */}
          <div className="md:col-span-2">
            <LearningStats />
          </div>

          {/* Recent Conversations - Full Width */}
          <div className="md:col-span-2">
            <RecentConversations onResumeChat={onNavigateToChat} />
          </div>

          {/* Quiz Generator - Full Width */}
          <div className="md:col-span-2">
            <QuizGenerator />
          </div>

          {/* Achievements Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border-2 border-transparent">
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-xl md:text-2xl">
                🏆
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
              Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center text-lg md:text-xl border-2 border-yellow-300 shadow-sm" title="First Session">
                🌟
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center text-lg md:text-xl border-2 border-blue-300 shadow-sm" title="5 Day Streak">
                🔥
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center text-lg md:text-xl border-2 border-green-300 shadow-sm" title="Quick Learner">
                ⚡
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg md:text-xl border-2 border-dashed border-gray-300" title="Locked">
                🔒
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border-2 border-transparent">
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                ⚡
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button 
                onClick={onNavigateToChat}
                className="w-full text-left p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs md:text-sm font-medium text-gray-700"
              >
                📚 View All Notes
              </button>
              <button 
                onClick={() => setActiveView('quiz')}
                className="w-full text-left p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs md:text-sm font-medium text-gray-700"
              >
                🎯 Take a Quiz
              </button>
              <button className="w-full text-left p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs md:text-sm font-medium text-gray-700">
                💡 Get Study Tips
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
