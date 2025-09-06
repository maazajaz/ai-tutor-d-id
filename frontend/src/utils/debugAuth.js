// 🧪 Debug Authentication Helper
// Add this temporarily to check what's happening

import { supabase } from '../lib/supabase'

// Test function to check Supabase connection
export const debugAuth = async () => {
  console.log('🔧 Debug: Testing Supabase connection...')
  
  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
  
  try {
    // Test getting session
    console.log('🔐 Testing session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session result:', { sessionData, sessionError })
    
    // Test getting user
    console.log('👤 Testing user...')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('User result:', { userData, userError })
    
    // Test database connection
    console.log('🗄️ Testing database connection...')
    const { data: dbData, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    console.log('Database test result:', { dbData, dbError })
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
  }
}

// Auto-run debug on import (temporary)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    debugAuth()
  }, 1000)
}
