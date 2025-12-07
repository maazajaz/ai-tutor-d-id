import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../hooks/useChat'
import { LearningStats } from './LearningStats'
import { RecentConversations } from './RecentConversations'
import { QuizGenerator } from './QuizGenerator'
import { DashboardLoader } from './DashboardLoader'
import logo from '../assets/logo_white.svg'

export const Dashboard = ({ onNavigateToChat, onNavigateToCustomize, onOpenCollabStudy, onNavigateToPractice, onNavigateToWhiteboard, onNavigateToInterview }) => {
  const { user, profile, signOut } = useAuth()
  const { initialLoading } = useChat()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('dashboard') // dashboard, quiz

  // Show loading screen while initial data is being fetched
  if (initialLoading) {
    return <DashboardLoader />;
  }

  // Get display name or fallback to email
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User'

  const navigationItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', active: activeView === 'dashboard' },
    { id: 'agents', icon: '🤖', label: 'My Agents', active: false },
    { id: 'history', icon: '📚', label: 'Learning History', active: false },
    { id: 'analytics', icon: '📊', label: 'Analytics', active: false },
    { id: 'settings', icon: '⚙️', label: 'Settings', active: false },
  ]

  const glassCardClasses = 'group rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_15px_45px_rgba(0,0,0,0.45)] hover:shadow-[0_25px_65px_rgba(0,0,0,0.55)] transition-all duration-300 p-4 md:p-6 text-left transform hover:-translate-y-1';
  const glassSectionClasses = 'rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_15px_45px_rgba(0,0,0,0.45)] p-4 md:p-6';

  const handleNavigationClick = (itemId) => {
    if (itemId === 'dashboard') {
      setActiveView('dashboard')
    }
    setMobileMenuOpen(false) // Close mobile menu after navigation
    // Add other navigation handlers as needed
  }

  const handleLogout = async () => {
    await signOut();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] flex flex-col md:flex-row text-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-black/40 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.45)] p-4 flex items-center justify-between sticky top-0 z-50 border border-white/10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Sharda Informatics" className="h-8 w-auto" />
          <div>
            <h1 className="text-sm font-bold text-white">Sharda Informatics</h1>
            <p className="text-xs text-amber-200">Informatics360.ai</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold shadow-lg"
          >
            Logout
          </button>
        </div>
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
        bg-white/5 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.55)] transition-all duration-300 flex flex-col border-r border-white/10
        fixed md:sticky md:top-0 md:h-screen md:overflow-y-auto inset-y-0 left-0 md:inset-auto md:left-auto z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarCollapsed ? 'w-72 md:w-20' : 'w-72'}
      `}>
        {/* Logo Section */}
        <div className="border-b border-white/10 bg-black/40 backdrop-blur p-5">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <img src={logo} alt="Sharda Informatics" className="h-12 w-auto" />
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-white leading-tight">Sharda Informatics</h1>
                  <p className="text-xs text-amber-200">Informatics360.ai</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 mt-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                  title="Collapse sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold shadow-lg hover:brightness-110 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
              <div className="md:hidden mt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <img src={logo} alt="Sharda Informatics" className="h-12 w-auto" />
              <div className="hidden md:flex flex-col gap-3 w-full items-center">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                  title="Expand sidebar"
                >
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-lg flex items-center justify-center"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg font-semibold'
                  : 'text-gray-200 hover:bg-white/10'
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
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-black font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate text-sm">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-sm md:text-base text-gray-400">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Continue Learning Card */}
          <button
            onClick={onNavigateToChat}
            className={`${glassCardClasses} hover:border-amber-200/60`}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                🤖
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
              Continue Learning
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
              Resume your AI-powered learning session with your personal tutor
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-yellow-500 font-medium">
              <span>Open Agent Chat</span>
              <svg className="w-3 h-3 md:w-4 md:h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Customize Agent Card */}
          <button
            onClick={onNavigateToCustomize}
            className={`${glassCardClasses} hover:border-amber-200/60`}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/40 rounded-xl flex items-center justify-center border border-dashed border-white/20 group-hover:border-amber-200/60 transition-colors">
                <span className="text-2xl md:text-3xl">➕</span>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-amber-200 transition-colors">
              Customize Your Agent
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
              Personalize your AI tutor's appearance, voice, and teaching style
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-amber-200 font-medium">
              <span>Customize Now</span>
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          {/* Practice Problems Card - NEW */}
          <button
            onClick={onNavigateToPractice}
            className={`${glassCardClasses} hover:border-amber-200/60`}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                💻
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-100 border border-amber-200/60 text-xs font-semibold rounded-full">
                  NEW
                </span>
                <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-200/10 rounded-full flex items-center justify-center text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-amber-200 transition-colors">
              Practice Problems
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
              Solve coding challenges with a built-in code editor and AI-powered hints
            </p>
            <div className="flex items-center gap-2 text-xs md:text-sm text-amber-200 font-medium">
              <span>Start Coding</span>
              <svg className="w-3 h-3 md:w-4 md:h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Visual Whiteboard Card - NEW */}
          <button
            onClick={onNavigateToWhiteboard}
            className={`${glassCardClasses} hover:border-amber-200/60`}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                🎨
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-100 border border-amber-200/60 text-xs font-semibold rounded-full">
                  NEW
                </span>
                <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-200/10 rounded-full flex items-center justify-center text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-amber-200 transition-colors">
              Visual Whiteboard
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
              Create real-time animated diagrams with AI - templates for anatomy, science & more
            </p>
            <div className="flex items-center gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2 text-amber-200 font-medium">
                <span className="text-lg">⚡</span>
                <span>Instant Templates</span>
              </div>
              <div className="flex items-center gap-2 text-amber-200 font-medium">
                <span className="text-lg">🖌️</span>
                <span>Live Animation</span>
              </div>
            </div>
          </button>

          {/* Interview Practice Card - NEW */}
          <button
            onClick={onNavigateToInterview}
            className={`${glassCardClasses} hover:border-amber-200/60`}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                🎯
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-400/20 text-purple-100 border border-purple-200/60 text-xs font-semibold rounded-full">
                  NEW
                </span>
                <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-200/10 rounded-full flex items-center justify-center text-purple-200 group-hover:bg-purple-300 group-hover:text-black transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
              Interview Practice
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
              Practice technical, behavioral, and HR interviews with AI-powered feedback
            </p>
            <div className="flex items-center gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2 text-purple-200 font-medium">
                <span className="text-lg">🤖</span>
                <span>AI Interviewer</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200 font-medium">
                <span className="text-lg">📊</span>
                <span>Performance Feedback</span>
              </div>
            </div>
          </button>

          {/* Collaborate & Study Card */}
          <button
            onClick={() => onOpenCollabStudy()}
            className={`${glassCardClasses} hover:border-amber-200/60 md:col-span-2`}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                👥
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-100 border border-amber-200/60 text-xs font-semibold rounded-full">
                  NEW
                </span>
                <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-200/10 rounded-full flex items-center justify-center text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-amber-200 transition-colors">
              Collaborate & Study Together
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 md:mb-4">
              Create or join a study room with voice chat. Learn together with friends in real-time!
            </p>
            <div className="flex items-center gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-2 text-amber-200 font-medium">
                <span className="text-lg">🎤</span>
                <span>Voice Chat</span>
              </div>
              <div className="flex items-center gap-2 text-amber-200 font-medium">
                <span className="text-lg">🔗</span>
                <span>Share Link</span>
              </div>
              <div className="flex items-center gap-2 text-amber-200 font-medium">
                <span className="text-lg">💬</span>
                <span>Live Session</span>
              </div>
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
          <div className={glassSectionClasses}>
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/40 rounded-xl flex items-center justify-center text-xl md:text-2xl border border-white/15">
                🏆
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">
              Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-black/40 rounded-lg flex items-center justify-center text-lg md:text-xl border border-white/15 shadow-sm text-amber-200" title="First Session">
                🌟
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-black/40 rounded-lg flex items-center justify-center text-lg md:text-xl border border-white/10 shadow-sm text-amber-200" title="5 Day Streak">
                🔥
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-black/40 rounded-lg flex items-center justify-center text-lg md:text-xl border border-white/10 shadow-sm text-amber-100" title="Quick Learner">
                ⚡
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-lg flex items-center justify-center text-lg md:text-xl border border-dashed border-white/15 text-gray-300" title="Locked">
                🔒
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className={glassSectionClasses}>
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center text-xl md:text-2xl">
                ⚡
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button 
                onClick={onNavigateToChat}
                className="w-full text-left p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs md:text-sm font-medium text-amber-200 border border-white/15"
              >
                📚 View All Notes
              </button>
              <button 
                onClick={() => setActiveView('quiz')}
                className="w-full text-left p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs md:text-sm font-medium text-amber-200 border border-white/15"
              >
                🎯 Take a Quiz
              </button>
              <button className="w-full text-left p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs md:text-sm font-medium text-amber-200 border border-white/15">
                💡 Get Study Tips
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
