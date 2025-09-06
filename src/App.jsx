import { useState, useEffect } from "react";
import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";

// Main App Content (when authenticated)
const AppContent = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading your AI tutor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-indigo-100">
      <Loader />
      <Leva hidden/>
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Left Side - 3D Avatar */}
      <div className="w-full lg:w-1/2 h-1/4 lg:h-full relative">
        <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
          <Experience />
        </Canvas>
        
        {/* Avatar Section Header with Profile Button */}
        <div className="absolute top-2 left-2 lg:top-4 lg:left-4 backdrop-blur-md bg-white bg-opacity-80 p-2 lg:p-3 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm lg:text-lg text-gray-800">🧑‍🏫 Digital Tutor</h2>
              <p className="text-xs lg:text-sm text-gray-600">Your AI Learning Assistant</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="ml-2 lg:ml-4 p-1.5 lg:p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-md"
              title="Open Profile & Settings"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Profile Info with Dropdown */}
        <div className="absolute bottom-2 left-2 lg:bottom-4 lg:left-4">
          <div className="relative">
            {/* Profile Card */}
            <div 
              className="backdrop-blur-md bg-white bg-opacity-80 p-2 lg:p-3 rounded-lg shadow-lg cursor-pointer transition-all duration-200 hover:bg-opacity-90"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {profile?.avatar_preference === 'casual' ? '�‍💻' : 
                   profile?.avatar_preference === 'formal' ? '👔' : '�👤'}
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
      
      {/* Right Side - Whiteboard */}
      <div className="w-full lg:w-1/2 h-3/4 lg:h-full flex flex-col">
        <UI />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
