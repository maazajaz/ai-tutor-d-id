import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config:', { url: supabaseUrl, hasKey: !!supabaseAnonKey })

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'ai-tutor-auth',
    storage: window.localStorage
  }
})

// Auth helper functions
export const authHelpers = {
  // Sign up new user
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Sign in existing user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        ...updates,
        updated_at: new Date().toISOString()
      })
    return { data, error }
  },

  // Get user profile
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  }
}

// Chat session helper functions
export const chatHelpers = {
  // Create a new chat session
  createChatSession: async (userId, sessionData) => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        ...sessionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    return { data, error }
  },

  // Get all chat sessions for a user
  getChatSessions: async (userId) => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    return { data, error }
  },

  // Update a chat session
  updateChatSession: async (sessionId, updates) => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()
    return { data, error }
  },

  // Delete a chat session
  deleteChatSession: async (sessionId) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
    return { error }
  }
}

// Study Room helper functions
export const studyRoomHelpers = {
  // Generate unique room code
  generateRoomCode: () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Create a new study room
  createStudyRoom: async (userId, roomData) => {
    const roomCode = studyRoomHelpers.generateRoomCode();
    const { data, error } = await supabase
      .from('study_rooms')
      .insert({
        host_user_id: userId,
        room_code: roomCode,
        title: roomData.title || 'Collaborative Study Session',
        chat_session_id: roomData.chatSessionId,
        max_participants: roomData.maxParticipants || 10,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        settings: roomData.settings || { voiceEnabled: true, allowChat: true, maxDuration: 7200 }
      })
      .select()
      .single();
    
    if (!error && data) {
      // Add host as first participant
      await studyRoomHelpers.joinRoom(data.id, userId, roomData.displayName || 'Host', true);
    }
    
    return { data, error };
  },

  // Get room by code
  getRoomByCode: async (roomCode) => {
    const { data, error } = await supabase
      .from('study_rooms')
      .select(`
        *,
        participants:room_participants(
          id,
          user_id,
          display_name,
          joined_at,
          is_online,
          audio_enabled,
          is_host
        )
      `)
      .eq('room_code', roomCode.toUpperCase())
      .eq('is_active', true)
      .single();
    return { data, error };
  },

  // Get room by ID
  getRoomById: async (roomId) => {
    const { data, error } = await supabase
      .from('study_rooms')
      .select(`
        *,
        participants:room_participants(
          id,
          user_id,
          display_name,
          joined_at,
          is_online,
          audio_enabled,
          is_host
        )
      `)
      .eq('id', roomId)
      .single();
    return { data, error };
  },

  // Join a study room
  joinRoom: async (roomId, userId, displayName, isHost = false) => {
    const { data, error } = await supabase
      .from('room_participants')
      .upsert({
        room_id: roomId,
        user_id: userId,
        display_name: displayName,
        is_online: true,
        is_host: isHost,
        joined_at: new Date().toISOString()
      }, {
        onConflict: 'room_id,user_id'
      })
      .select()
      .single();
    return { data, error };
  },

  // Leave a study room
  leaveRoom: async (roomId, userId) => {
    const { error } = await supabase
      .from('room_participants')
      .update({
        is_online: false,
        left_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('user_id', userId);
    return { error };
  },

  // Update participant audio status
  updateAudioStatus: async (roomId, userId, audioEnabled) => {
    const { error } = await supabase
      .from('room_participants')
      .update({ audio_enabled: audioEnabled })
      .eq('room_id', roomId)
      .eq('user_id', userId);
    return { error };
  },

  // Get active participants
  getActiveParticipants: async (roomId) => {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_online', true)
      .order('joined_at', { ascending: true });
    return { data, error };
  },

  // End study room (host only)
  endRoom: async (roomId) => {
    const { error } = await supabase
      .from('study_rooms')
      .update({ is_active: false })
      .eq('id', roomId);
    
    // Mark all participants as offline
    await supabase
      .from('room_participants')
      .update({ is_online: false, left_at: new Date().toISOString() })
      .eq('room_id', roomId);
    
    return { error };
  },

  // WebRTC Signaling
  sendSignal: async (roomId, fromUserId, toUserId, signalType, signalData) => {
    const { data, error } = await supabase
      .from('webrtc_signals')
      .insert({
        room_id: roomId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        signal_type: signalType,
        signal_data: signalData,
        processed: false
      })
      .select()
      .single();
    return { data, error };
  },

  // Get pending signals for user
  getPendingSignals: async (roomId, userId) => {
    const { data, error } = await supabase
      .from('webrtc_signals')
      .select('*')
      .eq('room_id', roomId)
      .eq('to_user_id', userId)
      .eq('processed', false)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // Mark signal as processed
  markSignalProcessed: async (signalId) => {
    const { error } = await supabase
      .from('webrtc_signals')
      .update({ processed: true })
      .eq('id', signalId);
    return { error };
  },

  // Subscribe to room changes
  subscribeToRoom: (roomId, callbacks) => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        callbacks.onParticipantChange || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `room_id=eq.${roomId}`
        },
        callbacks.onSignal || (() => {})
      )
      .subscribe();
    
    return channel;
  },

  // Unsubscribe from room
  unsubscribeFromRoom: async (channel) => {
    await supabase.removeChannel(channel);
  }
}

