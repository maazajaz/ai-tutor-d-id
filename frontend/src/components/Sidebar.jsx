import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    avatar_preference: profile?.avatar_preference || 'default',
    language_preference: profile?.language_preference || 'english',
    theme_preference: profile?.theme_preference || 'light'
  })

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut()
      onClose()
    }
  }

  const sidebarSections = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'progress', name: 'Progress', icon: '📊' },
    { id: 'help', name: 'Help', icon: '❓' }
  ]

  const avatarOptions = [
    { value: 'default', label: '👨‍🏫 Default Teacher', description: 'Classic professional look' },
    { value: 'casual', label: '👨‍💻 Friendly Tutor', description: 'Relaxed and approachable' },
    { value: 'formal', label: '👔 Formal Instructor', description: 'Professional and focused' }
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Profile & Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
              {profile?.avatar_preference === 'casual' ? '👨‍💻' : 
               profile?.avatar_preference === 'formal' ? '👔' : '👨‍🏫'}
            </div>
            <div>
              <h3 className="font-semibold">{profile?.display_name || 'User'}</h3>
              <p className="text-green-100 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {sidebarSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 p-3 text-sm font-medium transition-colors flex flex-col items-center justify-center min-h-[60px] ${
                  activeSection === section.id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-lg mb-1">{section.icon}</span>
                <span className="text-xs">{section.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 h-full overflow-y-auto">
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Display Name</label>
                    <p className="text-gray-800 font-medium">{profile?.display_name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-gray-800">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Member Since</label>
                    <p className="text-gray-800">{new Date(user?.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Preferences</h3>

              {/* Avatar Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Avatar Preference
                </label>
                <div className="space-y-2">
                  {avatarOptions.map((option) => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="avatar"
                        value={option.value}
                        checked={formData.avatar_preference === option.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, avatar_preference: e.target.value }))}
                        className="mr-3 text-green-600"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select
                  value={formData.language_preference}
                  onChange={(e) => setFormData(prev => ({ ...prev, language_preference: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish (Hindi + English)</option>
                  <option value="auto">Auto-detect</option>
                </select>
              </div>

              {/* Theme Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={formData.theme_preference}
                  onChange={(e) => setFormData(prev => ({ ...prev, theme_preference: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">System</option>
                </select>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          )}

          {activeSection === 'progress' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Learning Progress</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">🎉 Coming Soon!</h4>
                <p className="text-green-700 text-sm">
                  We're working on detailed progress tracking, including:
                </p>
                <ul className="text-green-700 text-sm mt-2 space-y-1">
                  <li>• Topics completed</li>
                  <li>• Learning streak</li>
                  <li>• Skill assessments</li>
                  <li>• Achievements & badges</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Help & Support</h3>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">📚 How to Use</h4>
                  <p className="text-gray-600 text-sm">
                    Ask questions in English or Hinglish, use quick action buttons, and interact with your personalized avatar teacher.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🎯 Features</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Voice responses with lip-sync</li>
                    <li>• Smart language detection</li>
                    <li>• Persistent chat history</li>
                    <li>• 3D avatar interactions</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🔧 Technical Support</h4>
                  <p className="text-gray-600 text-sm">
                    Having issues? Check your internet connection and browser compatibility (Chrome/Firefox recommended).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
