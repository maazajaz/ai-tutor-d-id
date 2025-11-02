import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase, authHelpers, chatHelpers } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// For production, use the current domain if VITE_API_URL is not set or is placeholder
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If we're on Vercel (production), use the current origin with /api path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // For localhost, use the configured API URL or default to localhost:3000
  if (envUrl && !envUrl.includes('your-app-name')) {
    return envUrl;
  }
  
  return "http://localhost:3000";
};

const backendUrl = getBackendUrl();

const ChatContext = createContext();

// Chat history utilities
const loadChatSessions = () => {
  try {
    const saved = localStorage.getItem('aiTutorChatSessions');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveChatSessions = (sessions) => {
  try {
    // Limit to last 10 sessions to prevent quota issues
    // Keep only essential data (no full message history in localStorage)
    const recentSessions = sessions
      .slice(-10) // Only keep last 10 sessions
      .map(session => ({
        id: session.id,
        title: session.title,
        timestamp: session.timestamp,
        // Don't store full messages array - fetch from Supabase instead
        messageCount: session.messages?.length || 0
      }));
    
    localStorage.setItem('aiTutorChatSessions', JSON.stringify(recentSessions));
  } catch (error) {
    console.error('Failed to save chat sessions:', error);
    // If quota exceeded, clear and try with just the latest session
    try {
      localStorage.removeItem('aiTutorChatSessions');
      const latestSession = sessions[sessions.length - 1];
      if (latestSession) {
        localStorage.setItem('aiTutorChatSessions', JSON.stringify([{
          id: latestSession.id,
          title: latestSession.title,
          timestamp: latestSession.timestamp,
          messageCount: latestSession.messages?.length || 0
        }]));
      }
    } catch (e) {
      console.error('Failed to save even single session:', e);
    }
  }
};

const generateChatId = () => {
  // Generate a UUID v4 compatible with older browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const ChatProvider = ({ children }) => {
  const { user, loading: authLoading, profile } = useAuth(); // Use existing auth context
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatNotes, setCurrentChatNotes] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // Current session chat history
  const [messages, setMessages] = useState([]); // Messages for avatar animation
  const [message, setMessage] = useState(); // Current message being played
  const [loading, setLoading] = useState(false); // Loading state for operations (sending messages, generating notes)
  const [initialLoading, setInitialLoading] = useState(true); // Loading state for initial data fetch
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded
  const [cameraZoomed, setCameraZoomed] = useState(true);
  
  // Refs for debouncing
  const saveTimeoutRef = useRef(null);
  const lastSaveRef = useRef(Date.now());
  const hasLoadedDataRef = useRef(false); // Track if we've already loaded data to prevent re-loading

  console.log('🚀 ChatProvider initialized. Current chat ID:', currentChatId);
  console.log('👤 Auth state - User:', user?.email || 'Anonymous', 'Loading:', authLoading);

  // Utility function for delay with exponential backoff
  const delay = (attempt) => {
    const baseDelay = 1000; // Start with 1 second
    const maxDelay = 10000; // Max 10 seconds between retries
    return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  };

  // Load chat sessions from Supabase or localStorage with timeout and retries
  const loadUserChatSessions = async (userId) => {
    console.log('📂 Loading chat sessions for user:', userId);
    setInitialLoading(true); // Start initial loading
    
    try {
      if (userId) {
        console.log('🔍 Fetching from Supabase...');
        
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`🔄 Retry attempt ${attempt} of ${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, delay(attempt)));
            }
            
            // Add timeout to prevent hanging (45 seconds)
            const chatsPromise = chatHelpers.getChatSessions(userId);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Chat sessions loading timeout')), 45000)
            );
            
            const { data, error } = await Promise.race([chatsPromise, timeoutPromise]);
            
            if (error) {
              lastError = error;
              console.error(`❌ Attempt ${attempt + 1} failed:`, error);
              continue; // Try next attempt
            }
          
            console.log('✅ Loaded from Supabase:', data?.length || 0, 'sessions');
            console.log('📊 Sessions data:', data);
            setChatSessions(data || []);
            
            // If we have sessions and no current chat, set the latest one as current
            if (data && data.length > 0 && !currentChatId) {
              const latestSession = data[0];
              console.log('🎯 Setting current chat to latest session:', latestSession.id);
              setCurrentChatId(latestSession.id);
              setChatHistory(latestSession.messages || []);
              setCurrentChatNotes(latestSession.notes || '');
            }
            
            // Clean up empty sessions (sessions with no messages)
            const emptySessions = data?.filter(session => !session.messages || session.messages.length === 0) || [];
            if (emptySessions.length > 0) {
              console.log('🗑️ Found', emptySessions.length, 'empty sessions, cleaning up...');
              await Promise.all(emptySessions.map(session => chatHelpers.deleteChatSession(session.id)));
              // Reload sessions after cleanup
              const { data: cleanData } = await chatHelpers.getChatSessions(userId);
              setChatSessions(cleanData || []);
            }
            
            // Success - break out of retry loop
            setDataLoaded(true);
            break;
            
          } catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${attempt + 1} failed:`, error);
            
            // If this was the last attempt, fall back to localStorage
            if (attempt === maxRetries) {
              console.error('Error loading chat sessions after all retries:', error);
              // Load from localStorage as fallback
              const localSessions = loadChatSessions() || [];
              console.log('💾 Loading from localStorage as fallback:', localSessions.length, 'sessions');
              setChatSessions(localSessions);
              setDataLoaded(true);
            }
          }
        }
      } else {
        const localSessions = loadChatSessions() || [];
        console.log('💾 Loading from localStorage:', localSessions.length, 'sessions');
        setChatSessions(localSessions);
        setDataLoaded(true);
      }
    } finally {
      // Always set initialLoading to false when done (success or error)
      console.log('✅ Data loading complete');
      setInitialLoading(false);
    }
  };

  const generateChatTitle = useCallback((messages) => {
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      return firstUserMessage.text.length > 50 
        ? firstUserMessage.text.substring(0, 50) + '...'
        : firstUserMessage.text;
    }
    return 'New Chat';
  }, []);

  const startNewChat = async () => {
    const newChatId = generateChatId();
    console.log('🆕 Starting new chat with ID:', newChatId);
    
    const newSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      notes: '',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    console.log('New session object:', newSession);
    
    if (user) {
      console.log('👤 User is authenticated, saving to Supabase...');
      // Save to Supabase
      const { data, error } = await chatHelpers.createChatSession(user.id, {
        id: newChatId,
        title: newSession.title,
        messages: newSession.messages,
        notes: newSession.notes
      });
      
      if (error) {
        console.error('❌ Error creating chat session in Supabase:', error);
        // Fallback to localStorage
        const updatedSessions = [newSession, ...chatSessions];
        setChatSessions(updatedSessions);
        saveChatSessions(updatedSessions);
        console.log('💾 Saved to localStorage as fallback');
      } else {
        console.log('✅ Successfully created session in Supabase:', data);
        const updatedSessions = [data, ...chatSessions];
        setChatSessions(updatedSessions);
      }
    } else {
      console.log('👤 Anonymous user, saving to localStorage...');
      // Use localStorage for anonymous users
      const updatedSessions = [newSession, ...chatSessions];
      setChatSessions(updatedSessions);
      saveChatSessions(updatedSessions);
      console.log('💾 Saved to localStorage:', updatedSessions.length, 'sessions');
    }
    
    setCurrentChatId(newChatId);
    setChatHistory([]);
    setMessages([]);
    setCurrentChatNotes('');
    console.log('🎯 Set current chat ID to:', newChatId);
  };

  const updateCurrentSession = useCallback(async (updates) => {
    if (!currentChatId) {
      console.log('No currentChatId, cannot update session');
      return;
    }
    
    console.log('Updating session:', currentChatId, 'with updates:', updates);
    
    // Debounce: Only save if 2 seconds have passed since last save
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;
    
    if (timeSinceLastSave < 2000 && !updates.forceImmediate) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout to save after 2 seconds of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        updateCurrentSession({ ...updates, forceImmediate: true });
      }, 2000);
      
      // Update local state immediately for UI responsiveness
      setChatSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session => {
          if (session.id === currentChatId) {
            return { ...session, ...updates, updated_at: Date.now() };
          }
          return session;
        });
        return updatedSessions;
      });
      
      return;
    }
    
    // Clear the debounce flag
    lastSaveRef.current = now;
    
    if (user) {
      console.log('User authenticated, saving to Supabase...');
      
      // First, check if the session exists, if not create it
      const sessionExists = chatSessions.find(s => s.id === currentChatId);
      if (!sessionExists) {
        console.log('Session does not exist, creating it first...');
        const newSession = {
          id: currentChatId,
          title: 'New Chat',
          messages: [],
          notes: '',
          created_at: Date.now(),
          updated_at: Date.now()
        };
        
        const { data: createdSession, error: createError } = await chatHelpers.createChatSession(user.id, {
          id: currentChatId,
          title: newSession.title,
          messages: newSession.messages,
          notes: newSession.notes
        });
        
        if (createError) {
          console.error('Failed to create session:', createError);
          // Add to local sessions for fallback
          const newSessionWithData = { ...newSession, ...updates };
          setChatSessions(prev => {
            const updated = [newSessionWithData, ...prev.filter(s => s.id !== currentChatId)];
            saveChatSessions(updated);
            return updated;
          });
          return; // Exit early since we've handled the update in the fallback
        } else {
          console.log('Session created successfully:', createdSession);
          setChatSessions(prev => [createdSession, ...prev.filter(s => s.id !== currentChatId)]);
        }
      }
      
      // Now update the session
      const { data, error } = await chatHelpers.updateChatSession(currentChatId, updates);
      
      if (error) {
        console.error('Error updating chat session in Supabase:', error);
        console.log('Current sessions before fallback:', chatSessions);
        // Fallback to localStorage update
        setChatSessions(prevSessions => {
          const updatedSessions = prevSessions.map(session => {
            if (session.id === currentChatId) {
              return { ...session, ...updates, updated_at: Date.now() };
            }
            return session;
          });
          console.log('Updated sessions for localStorage:', updatedSessions);
          saveChatSessions(updatedSessions);
          return updatedSessions;
        });
      } else {
        console.log('Successfully saved to Supabase:', data);
        setChatSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === currentChatId ? data : session
          )
        );
      }
    } else {
      console.log('Anonymous user, saving to localStorage...');
      // Update localStorage for anonymous users
      setChatSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session => {
          if (session.id === currentChatId) {
            return { ...session, ...updates, updated_at: Date.now() };
          }
          return session;
        });
        saveChatSessions(updatedSessions);
        return updatedSessions;
      });
    }
  }, [currentChatId, user, chatSessions]);

  const loadChatSession = useCallback((sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentChatId(sessionId);
      setChatHistory(session.messages || []);
      setCurrentChatNotes(session.notes || '');
      setMessages([]); // Clear animation queue when switching chats
    }
  }, [chatSessions]);

  const saveCurrentChatNotes = useCallback(async (notes) => {
    setCurrentChatNotes(notes);
    await updateCurrentSession({ notes });
  }, [updateCurrentSession]);

  // Generate AI notes summary
  const generateAINotes = useCallback(async () => {
    if (!currentChatId || chatHistory.length === 0) {
      console.log('No chat history to generate notes from');
      return null;
    }

    try {
      console.log('🤖 Generating AI notes summary...');
      console.log('📡 Backend URL:', backendUrl);
      setLoading(true);

      // Prepare chat history for API
      const chatMessages = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      console.log('📤 Sending request to:', `${backendUrl}/api/generate-notes`);
      console.log('📤 Request payload:', JSON.stringify({ messages: chatMessages.length, chatTitle: generateChatTitle(chatHistory) }));
      
      const response = await fetch(`${backendUrl}/api/generate-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          chatTitle: generateChatTitle(chatHistory)
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Server error response:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI notes generated successfully');
      console.log('📝 Notes length:', data.notes?.length || 0);
      console.log('📝 Notes preview:', data.notes?.substring(0, 100) || 'EMPTY');
      
      // Check if notes are empty
      if (!data.notes || data.notes.trim().length === 0) {
        console.error('⚠️ Received empty notes from server');
        throw new Error('Server returned empty notes. Please try again.');
      }
      
      setLoading(false);
      return data.notes;
    } catch (error) {
      console.error('❌ Error generating AI notes:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      setLoading(false);
      throw error;
    }
  }, [currentChatId, chatHistory, generateChatTitle]);

  const deleteChatSession = async (sessionId) => {
    if (user) {
      // Delete from Supabase
      const { error } = await chatHelpers.deleteChatSession(sessionId);
      if (error) {
        console.error('Error deleting chat session:', error);
        // Fallback to localStorage delete
        const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
        setChatSessions(updatedSessions);
        saveChatSessions(updatedSessions);
      } else {
        setChatSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
      }
    } else {
      // Delete from localStorage
      const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
      setChatSessions(updatedSessions);
      saveChatSessions(updatedSessions);
    }
    
    if (currentChatId === sessionId) {
      const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        loadChatSession(remainingSessions[0].id);
      } else {
        await startNewChat();
      }
    }
  };

  // Initialize chat sessions when auth state changes
  useEffect(() => {
    // Skip if we've already loaded data (prevents re-loading on component re-renders)
    if (hasLoadedDataRef.current) {
      console.log('✅ Data already loaded, skipping initialization');
      return;
    }

    console.log('Initializing chat sessions. Auth loading:', authLoading, 'User:', user?.email || 'Anonymous');
    console.log('Current state - Chat ID:', currentChatId, 'Sessions:', chatSessions.length);
    
    if (!authLoading) {
      hasLoadedDataRef.current = true; // Mark that we're loading data
      
      if (user) {
        console.log('Loading user chat sessions...');
        loadUserChatSessions(user.id);
        
        // Migrate current session to Supabase if it exists and isn't already there
        if (currentChatId && chatSessions.length > 0) {
          const currentSession = chatSessions.find(s => s.id === currentChatId);
          if (currentSession && currentSession.messages && currentSession.messages.length > 0) {
            console.log('🔄 Migrating current session to Supabase...');
            migrateSessionToSupabase(currentSession);
          }
        }
      } else {
        // For anonymous users, load from localStorage
        setInitialLoading(true);
        const localSessions = loadChatSessions();
        console.log('Loaded localStorage sessions:', localSessions.length);
        
        if (localSessions.length > 0) {
          console.log('Using existing localStorage sessions...');
          setChatSessions(localSessions);
          if (!currentChatId) {
            const latestSession = localSessions[0];
            setCurrentChatId(latestSession.id);
            setChatHistory(latestSession.messages || []);
            setCurrentChatNotes(latestSession.notes || '');
            console.log('Loaded session:', latestSession.id, 'with', latestSession.messages?.length || 0, 'messages');
          }
        } else {
          console.log('No sessions found, starting new chat...');
          startNewChat();
        }
        setDataLoaded(true);
        setInitialLoading(false);
      }
    }
  }, [user, authLoading]);

  // Migration helper function
  const migrateSessionToSupabase = async (session) => {
    try {
      console.log('🚀 Creating session in Supabase:', session.id);
      const { data, error } = await chatHelpers.createChatSession(user.id, {
        id: session.id,
        title: session.title || generateChatTitle(session.messages),
        messages: session.messages || [],
        notes: session.notes || ''
      });
      
      if (error) {
        console.error('❌ Failed to migrate session to Supabase:', error);
      } else {
        console.log('✅ Session migrated successfully:', data);
        // Update local sessions with the Supabase version
        setChatSessions(prev => prev.map(s => s.id === session.id ? data : s));
      }
    } catch (error) {
      console.error('❌ Migration error:', error);
    }
  };

  // Force create a session if none exists when trying to chat
  useEffect(() => {
    if (!authLoading && !currentChatId && chatSessions.length === 0) {
      console.log('🔧 Force creating initial chat session...');
      console.log('📊 Current state - authLoading:', authLoading, 'currentChatId:', currentChatId, 'chatSessions:', chatSessions.length);
      // Don't auto-create session, wait for actual chat message
      // startNewChat();
    }
  }, [authLoading, currentChatId, chatSessions]);

  // Auto-save chat history to current session
  useEffect(() => {
    if (currentChatId && chatHistory.length > 0) {
      console.log('💾 Auto-saving chat history. Chat ID:', currentChatId, 'Messages:', chatHistory.length);
      console.log('📝 Chat history being saved:', chatHistory);
      updateCurrentSession({ 
        messages: chatHistory,
        title: generateChatTitle(chatHistory)
      });
    }
  }, [chatHistory, currentChatId]);

  const chat = async (message, options = {}) => {
    setLoading(true);
    
    // Ensure we have a chat session started
    if (!currentChatId) {
      console.log('No chat session found, starting new chat...');
      await startNewChat();
    }
    
    console.log('Current chat ID:', currentChatId);
    console.log('Current user:', user?.email || 'Anonymous');
    
    // Store the original user input
    const originalInput = message;
    
    // Check if this is a YouTube URL
    const isYouTubeUrl = typeof message === 'string' && message.includes('youtu');
    
    // Add user message to chat history
    const userMsg = { 
      text: message, 
      sender: 'user', 
      timestamp: Date.now(),
      type: isYouTubeUrl ? 'youtube' : 'text'
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      // If it's a YouTube URL, handle it differently
      if (isYouTubeUrl) {
        console.log('🎥 Processing YouTube URL:', message);
        
        const placeholderResponse = {
          text: "I'll help you summarize this video...",
          sender: 'ai',
          timestamp: Date.now(),
          played: false,
          isPlaceholder: true
        };
        setChatHistory(prev => [...prev, placeholderResponse]);
        
        try {
          // Call backend to get video summary
          const response = await fetch(`${backendUrl}/api/summarize-youtube`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: message })
          });

          if (!response.ok) {
            throw new Error('Failed to get video summary');
          }

          const data = await response.json();
          
          // Update chat with summary
          const summaryResponse = {
            text: data.summary,
            sender: 'ai',
            timestamp: Date.now(),
            type: 'youtube-summary',
            played: false
          };
          
          // Replace placeholder with actual summary
          setChatHistory(prev => prev.map(msg => 
            msg.isPlaceholder ? summaryResponse : msg
          ));
          
          // Queue the summary for the avatar to speak
          setMessages(prev => [...prev, {
            text: data.summary,
            type: "youtube-summary"
          }]);
          
        } catch (error) {
          console.error('Failed to get video summary:', error);
          const errorMsg = {
            text: "Sorry, I couldn't process that YouTube video. Please try another video or ask me something else.",
            sender: 'ai',
            timestamp: Date.now(),
            played: false
          };
          // Replace placeholder with error message
          setChatHistory(prev => prev.map(msg => 
            msg.isPlaceholder ? errorMsg : msg
          ));
        }
      } else {
        // Regular chat message - send to D-ID Agent
        console.log('📤 Sending message to D-ID Agent:', message);
        
        // Queue the message for the avatar to speak
        const messageForAgent = {
          text: message,
          userQuestion: originalInput,
          type: "text"
        };
        
        // Set message for avatar to process
        setMessages(prev => [...prev, messageForAgent]);
        
        // Add placeholder response
        const placeholderResponse = {
          text: "...",
          sender: 'ai',
          timestamp: Date.now(),
          played: false,
          isPlaceholder: true
        };
        setChatHistory(prev => [...prev, placeholderResponse]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Chat request failed:', error);
      // Add error message to chat
      const errorMsg = {
        text: "Sorry, I'm having trouble connecting. Please try again.",
        sender: 'ai',
        timestamp: Date.now(),
        played: false
      };
      setChatHistory(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };
  
  const onMessagePlayed = () => {
    // Mark the current message as played in chat history
    const currentMsg = messages[0];
    if (currentMsg) {
      setChatHistory(prev => 
        prev.map(msg => 
          msg.text === currentMsg.text && msg.sender === 'ai' 
            ? { ...msg, played: true }
            : msg
        )
      );
    }
    
    setMessages((messages) => messages.slice(1));
  };

  const clearCurrentChat = async () => {
    setChatHistory([]);
    setMessages([]);
    if (currentChatId) {
      updateCurrentSession({ messages: [], title: 'New Chat' });
    }
  };

  // Function to update agent response in chat history
  const updateAgentResponse = (responseText) => {
    console.log('📝 Updating agent response in chat history:', responseText);
    
    // Remove placeholder and add actual response
    setChatHistory(prev => {
      const filtered = prev.filter(msg => !msg.isPlaceholder);
      return [
        ...filtered,
        {
          text: responseText,
          sender: 'ai',
          timestamp: Date.now(),
          played: true
        }
      ];
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading, // Operation loading (sending messages, generating notes)
        initialLoading, // Initial data loading
        cameraZoomed,
        setCameraZoomed,
        chatHistory,
        setChatHistory, // Add this for direct chat history manipulation
        clearCurrentChat,
        chatSessions,
        currentChatId,
        startNewChat,
        loadChatSession,
        deleteChatSession,
        currentChatNotes,
        saveCurrentChatNotes,
        generateAINotes,
        updateAgentResponse, // Add this for DIDAgentAvatar to update responses
        user: user, // Pass user from auth context
        authHelpers
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
