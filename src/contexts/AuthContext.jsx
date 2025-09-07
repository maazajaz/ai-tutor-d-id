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
    // Get initial session with improved efficiency
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking for existing session...')
        console.log('🔧 Supabase client available:', !!supabase)
        
        // Quick check for stored session
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
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
        
        try {
          const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
          console.log('📊 Session check result:', { session: !!session, error })
          
          if (error) {
            console.error('Session check error:', error)
            sessionManager.clearSession()
            setUser(null)
            setProfile(null)
          } else if (session?.user) {
            console.log('✅ Successfully restored session for:', session.user.email)
            setUser(session.user)
            await loadUserProfile(session.user.id)
          } else {
            console.log('❌ Session restoration failed - no valid session')
            sessionManager.clearSession()
            setUser(null)
            setProfile(null)
          }
        } catch (sessionError) {
          console.error('❌ Session check failed or timed out:', sessionError)
          sessionManager.clearSession()
          setUser(null)
          setProfile(null)
        }
        
      } catch (error) {
        console.error('❌ Error getting initial session:', error)
        sessionManager.clearSession()
        setUser(null)
        setProfile(null)
      } finally {
        console.log('🏁 Setting loading to false')
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
        
        setUser(session?.user || null)
        
        // Set loading to false immediately - don't wait for profile
        setLoading(false)
        console.log('✅ Auth processing completed, loading set to false')
        
        if (session?.user) {
          console.log('👤 User authenticated:', session.user.email)
          // Load profile separately (non-blocking)
          loadUserProfile(session.user.id).catch(error => {
            console.error('Profile loading failed:', error)
            setProfile(null)
          })
        } else {
          console.log('👤 User signed out')
          setProfile(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading profile for user:', userId)
      
      // Add timeout to prevent hanging
      const profilePromise = authHelpers.getProfile(userId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 5000)
      )
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])
      
      if (error) {
        console.error('Profile loading error:', error)
        // If profile doesn't exist, that's okay - user might be newly registered
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user might be newly registered')
        } else {
          console.error('Error loading profile:', error)
        }
        setProfile(null)
      } else {
        console.log('Profile loaded successfully:', data)
        setProfile(data)
      }
      console.log('✅ Profile loading completed')
    } catch (error) {
      console.error('Profile loading exception:', error)
      setProfile(null)
      console.log('❌ Profile loading failed with exception')
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
