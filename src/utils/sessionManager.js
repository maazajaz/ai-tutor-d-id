// 🔐 Enhanced Session Management
// This helps with debugging session persistence issues

export const sessionManager = {
  // Check if there's a stored session
  hasStoredSession: () => {
    try {
      const stored = localStorage.getItem('ai-tutor-auth')
      console.log('📦 Stored auth data:', stored ? 'Present' : 'Not found')
      
      if (stored) {
        const parsed = JSON.parse(stored)
        const expiresAt = parsed.expires_at ? new Date(parsed.expires_at * 1000) : null
        const isExpired = expiresAt ? expiresAt < new Date() : false
        
        console.log('🔍 Parsed session data:', {
          hasAccessToken: !!parsed.access_token,
          hasRefreshToken: !!parsed.refresh_token,
          expiresAt: expiresAt ? expiresAt.toLocaleString() : 'N/A',
          isExpired: isExpired
        })
        
        if (isExpired) {
          console.log('⏰ Session is expired, clearing...')
          localStorage.removeItem('ai-tutor-auth')
          return false
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error checking stored session:', error)
      return false
    }
  },

  // Clear stored session (for debugging)
  clearSession: () => {
    try {
      localStorage.removeItem('ai-tutor-auth')
      console.log('🗑️ Cleared stored session')
    } catch (error) {
      console.error('❌ Error clearing session:', error)
    }
  },

  // Get session info
  getSessionInfo: () => {
    try {
      const stored = localStorage.getItem('ai-tutor-auth')
      if (stored) {
        return JSON.parse(stored)
      }
      return null
    } catch (error) {
      console.error('❌ Error getting session info:', error)
      return null
    }
  }
}

// Auto-check on import
if (typeof window !== 'undefined') {
  console.log('🔐 Session Manager: Checking stored session...')
  sessionManager.hasStoredSession()
}
