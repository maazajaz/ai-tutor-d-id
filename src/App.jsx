import { useState, useEffect, lazy, Suspense } from "react";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Experience } from "./components/Experience";
import { DIDExperience } from "./components/DIDExperience";
import { UI } from "./components/UI";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load heavy components
const Dashboard = lazy(() => import("./components/Dashboard").then(module => ({ default: module.Dashboard })));
const EmotionDebug = lazy(() => import("./components/EmotionDebug").then(module => ({ default: module.EmotionDebug })));
const CollaborativeStudy = lazy(() => import("./components/CollaborativeStudy").then(module => ({ default: module.CollaborativeStudy })));
const PracticeProblems = lazy(() => import("./components/PracticeProblems"));
const RoughDrawTest = lazy(() => import("./components/RoughDrawTest"));
const RoughDrawTestV2 = lazy(() => import("./components/RoughDrawTestV2"));

// Loading fallback component
const ComponentLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading dashboard...</p>
    </div>
  </div>
);

// Main App Content (when authenticated)
const AppContent = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'chat', 'practice'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showChat, setShowChat] = useState(true); // Chat visibility state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu state
  const [showCollabStudy, setShowCollabStudy] = useState(false); // Collaborative study modal state (persists across tab switches)
  const [whiteboardLaunchKey, setWhiteboardLaunchKey] = useState(0); // Triggers chat whiteboard view
  const [cameraStatus, setCameraStatus] = useState({ // Camera status from UI
    isEnabled: false,
    isModelLoaded: false,
    hasStream: false,
    isReady: false,
    currentEmotion: null
  });

  // Check if we're in debug mode
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'emotion';
  const isDrawTestMode = new URLSearchParams(window.location.search).get('test') === 'draw';
  const isDrawTestV2Mode = new URLSearchParams(window.location.search).get('test') === 'draw-v2';

  // Show debug page if in debug mode
  if (isDebugMode) {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <EmotionDebug />
      </Suspense>
    );
  }

  // Show draw test page if in draw test mode
  if (isDrawTestMode) {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <RoughDrawTest />
      </Suspense>
    );
  }

  // Show draw test V2 page if in draw test V2 mode
  if (isDrawTestV2Mode) {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <RoughDrawTestV2 />
      </Suspense>
    );
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading your AI tutor...');

  useEffect(() => {
    if (!loading) return;

    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });

      // Update loading text based on progress
      if (loadingProgress < 30) {
        setLoadingText('Initializing AI tutor...');
      } else if (loadingProgress < 60) {
        setLoadingText('Loading user profile...');
      } else if (loadingProgress < 90) {
        setLoadingText('Preparing chat interface...');
      } else {
        setLoadingText('Almost ready...');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading && !user) {
    return <LoadingScreen isLoading={loading} />;
  }

  if (!user) {
    return <Login />;
  }

  // Render both views but toggle visibility to prevent remounting
  return (
    <>
      {/* Dashboard View - Hidden when chat/practice is active */}
      <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }}>
        <Suspense fallback={<ComponentLoader />}>
          <Dashboard 
            onNavigateToChat={() => setCurrentView('chat')}
            onNavigateToPractice={() => setCurrentView('practice')}
            onNavigateToWhiteboard={() => {
              setCurrentView('chat');
              setShowChat(true);
              setWhiteboardLaunchKey(prev => prev + 1);
            }}
            onNavigateToCustomize={() => {
              // Navigate to chat and open sidebar with settings
              setCurrentView('chat');
              setSidebarOpen(true);
            }}
            onOpenCollabStudy={() => setShowCollabStudy(true)}
          />
        </Suspense>
      </div>

      {/* Practice Problems View */}
      <div style={{ display: currentView === 'practice' ? 'block' : 'none' }}>
        <Suspense fallback={<ComponentLoader />}>
          <PracticeProblems onBack={() => setCurrentView('dashboard')} />
        </Suspense>
      </div>

      {/* Chat View - Hidden when dashboard/practice is active */}
      <div style={{ display: currentView === 'chat' ? 'block' : 'none' }}>
        <div className="w-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden fixed inset-0" style={{ height: '100dvh' }}>
      <Loader />
      <Leva hidden/>
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Top Navbar - Fully transparent */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h1 className="text-white font-bold text-base whitespace-nowrap">🎓 AI Tutor</h1>
            
            {/* Camera Status */}
            {cameraStatus.isEnabled && (
              <div className="flex items-center gap-1.5">
                {!cameraStatus.isModelLoaded ? (
                  <>
                    <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-green-100">Loading...</span>
                  </>
                ) : !cameraStatus.hasStream ? (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-[10px] text-yellow-200 hover:text-white underline"
                    >
                      Reload
                    </button>
                  </>
                ) : cameraStatus.isReady && cameraStatus.currentEmotion ? (
                  <>
                    <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                    <span className="text-[10px] text-green-100 truncate">
                      {cameraStatus.currentEmotion.emotion === 'happy' && '😊'}
                      {cameraStatus.currentEmotion.emotion === 'sad' && '😢'}
                      {cameraStatus.currentEmotion.emotion === 'angry' && '😠'}
                      {cameraStatus.currentEmotion.emotion === 'surprised' && '😮'}
                      {cameraStatus.currentEmotion.emotion === 'fearful' && '😨'}
                      {cameraStatus.currentEmotion.emotion === 'disgusted' && '🤢'}
                      {cameraStatus.currentEmotion.emotion === 'neutral' && '😐'}
                      {' '}{cameraStatus.currentEmotion.emotion}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-100">Detecting...</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="bg-green-500 hover:bg-green-400 text-white p-2 rounded-lg transition-colors flex-shrink-0"
            title="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu Content */}
            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl z-50 border-t border-gray-200">
              <div className="py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {profile?.avatar_preference === 'casual' ? '👨‍💻' : 
                       profile?.avatar_preference === 'formal' ? '👔' : '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{user.email}</p>
                      <p className="text-xs text-gray-500">Welcome back!</p>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Dashboard</p>
                    <p className="text-xs text-gray-500">Go back to home</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSidebarOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Profile</p>
                    <p className="text-xs text-gray-500">Manage your account</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    alert('Settings page coming soon!');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Settings</p>
                    <p className="text-xs text-gray-500">Preferences & privacy</p>
                  </div>
                </button>

                <div className="border-t border-gray-200 my-1"></div>

                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Sign Out</p>
                    <p className="text-xs text-red-500">End your session</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Left Side - D-ID Avatar - 1/3 on mobile, flexible on desktop */}
      <div className={`
        h-1/3 lg:h-full relative transition-all duration-500 ease-in-out min-h-0
        ${showChat ? 'w-full lg:w-1/2 lg:flex-[1]' : 'h-full w-full lg:w-full lg:flex-1'}
      `}>
        <DIDExperience />
        
        {/* Desktop Avatar Section Header - Hidden on Mobile */}
        <div className="hidden lg:block absolute top-4 left-4 backdrop-blur-md bg-white bg-opacity-80 p-3 rounded-lg shadow-lg">
          <div className="flex items-center justify-between gap-3">
            {/* Back to Dashboard Button */}
            <button
              onClick={() => setCurrentView('dashboard')}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors shadow-sm"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="font-bold text-lg text-gray-800">🧑‍🏫 AI Tutor</h2>
              <p className="text-sm text-gray-600">Live Avatar Assistant</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-md"
              title="Open Profile & Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Quick Profile Info - Hidden on Mobile */}
        <div className="hidden lg:block absolute bottom-4 left-4">
          <div className="relative">
            {/* Profile Card */}
            <div 
              className="backdrop-blur-md bg-white bg-opacity-80 p-3 rounded-lg shadow-lg cursor-pointer transition-all duration-200 hover:bg-opacity-90"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {profile?.avatar_preference === 'casual' ? '👨‍💻' : 
                   profile?.avatar_preference === 'formal' ? '👔' : '👤'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Welcome back!</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <div className="ml-2">
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                {/* Overlay to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileDropdownOpen(false)}
                ></div>
                
                <div className="absolute bottom-full left-0 mb-2 w-48 backdrop-blur-md bg-white bg-opacity-95 rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="py-1">
                  {/* Profile Button */}
                  <button
                    onClick={() => {
                      setSidebarOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Profile</p>
                      <p className="text-xs text-gray-500">Manage your account</p>
                    </div>
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={() => {
                      // Will implement settings page later
                      alert('Settings page coming soon!');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Settings</p>
                      <p className="text-xs text-gray-500">Preferences & privacy</p>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-1"></div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Sign Out</p>
                      <p className="text-xs text-red-500">End your session</p>
                    </div>
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Side - Whiteboard - 2/3 on mobile, flexible on desktop */}
      <div className={`
        h-2/3 lg:h-full flex flex-col transition-all duration-500 ease-in-out overflow-hidden min-h-0
        ${showChat ? 'translate-x-0 w-full lg:w-1/2 lg:flex-[2]' : 'translate-x-full w-0 h-0 lg:flex-none'}
      `}>
        <UI 
          showChat={showChat} 
          setShowChat={setShowChat} 
          onCameraStatus={setCameraStatus}
          whiteboardLaunchKey={whiteboardLaunchKey}
        />
      </div>
      
      {/* Floating Chat Toggle Button (visible when chat is hidden) */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-4 right-4 z-50 bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
          title="Show Chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
        </div>
      </div>
      
      {/* Collaborative Study Modal - Persists across view changes */}
      {showCollabStudy && (
        <Suspense fallback={null}>
          <CollaborativeStudy onClose={() => setShowCollabStudy(false)} />
        </Suspense>
      )}
    </>
  );
};

function App() {
  return <AppContent />;
}

export default App;
