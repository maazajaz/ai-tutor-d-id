import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, authHelpers } from '../lib/supabase'
import { sessionManager } from '../utils/sessionManager'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    // Get initial session with better error handling and retries
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking for existing session...')
        
        // First check if we have a stored session
        const hasStored = sessionManager.hasStoredSession()
        if (!hasStored) {
          console.log('❌ No stored session found in localStorage')
          setUser(null)
          setProfile(null)
          setLoading(false)
          setSessionChecked(true)
          return
        }
        
        console.log('✅ Found stored session, attempting to restore...')
        
        // Try multiple times to get session (sometimes it takes a moment)
        let session = null
        let attempts = 0
        const maxAttempts = 3
        
        while (!session && attempts < maxAttempts) {
          attempts++
          console.log(`📡 Attempt ${attempts} to get session...`)
          
          const { data: { session: sessionData }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session check error:', error)
            if (attempts === maxAttempts) {
              console.log('❌ Failed to get session after max attempts')
              // Clear invalid stored session
              sessionManager.clearSession()
              break
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
          
          session = sessionData
          break
        }
        
        if (session?.user) {
          console.log('✅ Successfully restored session for:', session.user.email)
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          console.log('❌ Session restoration failed')
          sessionManager.clearSession()
          setUser(null)
          setProfile(null)
        }
        
      } catch (error) {
        console.error('❌ Error getting initial session:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
        setSessionChecked(true)
        console.log('✅ Session check completed')
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')
        
        // Don't process initial session event if we haven't checked session yet
        if (!sessionChecked && event === 'INITIAL_SESSION') {
          console.log('⏳ Skipping initial session event - waiting for manual check')
          return
        }
        
        setUser(session?.user || null)
        
        if (session?.user) {
          console.log('👤 User authenticated:', session.user.email)
          await loadUserProfile(session.user.id)
        } else {
          console.log('👤 User signed out')
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading profile for user:', userId)
      const { data, error } = await authHelpers.getProfile(userId)
      
      if (error) {
        console.error('Profile loading error:', error)
        // If profile doesn't exist, that's okay - user might be newly registered
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user might be newly registered')
          setProfile(null)
        } else {
          console.error('Error loading profile:', error)
          setProfile(null)
        }
      } else {
        console.log('Profile loaded successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile loading exception:', error)
      setProfile(null)
    }
  }

  const signUp = async (email, password, userData = {}) => {
    setAuthLoading(true)
    try {
      const { data, error } = await authHelpers.signUp(email, password, {
        ...userData,
        avatar_preference: 'default',
        language_preference: 'english',
        theme_preference: 'light'
      })
      
      if (!error && data.user) {
        // Create initial profile
        await authHelpers.updateProfile(data.user.id, {
          email: data.user.email,
          display_name: userData.display_name || email.split('@')[0],
          avatar_preference: 'default',
          language_preference: 'english',
          theme_preference: 'light'
        })
      }
      
      return { data, error }
    } finally {
      setAuthLoading(false)
    }
  }

  const signIn = async (email, password) => {
    setAuthLoading(true)
    try {
      const result = await authHelpers.signIn(email, password)
      return result
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = async () => {
    setAuthLoading(true)
    try {
      await authHelpers.signOut()
      setProfile(null)
      sessionManager.clearSession()
    } finally {
      setAuthLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' }
    
    try {
      const { data, error } = await authHelpers.updateProfile(user.id, updates)
      if (!error) {
        setProfile(prev => ({ ...prev, ...updates }))
      }
      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    authLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    loadUserProfile: () => user && loadUserProfile(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
