import { createContext, useContext, useEffect, useState } from "react";
import { supabase, authHelpers, chatHelpers } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// For production, use the current domain if VITE_API_URL is not set or is placeholder
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If in production and no proper URL is set, use current domain
  if (typeof window !== 'undefined' && 
      (!envUrl || envUrl.includes('your-app-name') || envUrl.includes('localhost'))) {
    return window.location.origin;
  }
  
  return envUrl || "http://localhost:3000";
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
    localStorage.setItem('aiTutorChatSessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save chat sessions:', error);
  }
};

const generateChatId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const ChatProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); // Use existing auth context
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatNotes, setCurrentChatNotes] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // Current session chat history
  const [messages, setMessages] = useState([]); // Messages for avatar animation
  const [message, setMessage] = useState(); // Current message being played
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  console.log('🚀 ChatProvider initialized. Current chat ID:', currentChatId);
  console.log('👤 Auth state - User:', user?.email || 'Anonymous', 'Loading:', authLoading);

  // Load chat sessions from Supabase or localStorage
  const loadUserChatSessions = async (userId) => {
    console.log('📂 Loading chat sessions for user:', userId);
    if (userId) {
      console.log('🔍 Fetching from Supabase...');
      
      const { data, error } = await chatHelpers.getChatSessions(userId);
      if (error) {
        console.error('❌ Error loading chat sessions:', error);
        // Fallback to localStorage
        const localSessions = loadChatSessions() || [];
        console.log('💾 Fallback to localStorage:', localSessions.length, 'sessions');
        setChatSessions(localSessions);
      } else {
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
          emptySessions.forEach(async (session) => {
            await chatHelpers.deleteChatSession(session.id);
          });
          // Reload sessions after cleanup
          const { data: cleanData } = await chatHelpers.getChatSessions(userId);
          setChatSessions(cleanData || []);
        }
      }
    } else {
      const localSessions = loadChatSessions() || [];
      console.log('💾 Loading from localStorage:', localSessions.length, 'sessions');
      setChatSessions(localSessions);
    }
  };

  const generateChatTitle = (messages) => {
    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      return firstUserMessage.text.length > 50 
        ? firstUserMessage.text.substring(0, 50) + '...'
        : firstUserMessage.text;
    }
    return 'New Chat';
  };

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

  const updateCurrentSession = async (updates) => {
    if (!currentChatId) {
      console.log('No currentChatId, cannot update session');
      return;
    }
    
    console.log('Updating session:', currentChatId, 'with updates:', updates);
    
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
        console.log('Current sessions before fallback:', prevSessions);
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
  };

  const loadChatSession = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentChatId(sessionId);
      setChatHistory(session.messages || []);
      setCurrentChatNotes(session.notes || '');
      setMessages([]); // Clear animation queue when switching chats
    }
  };

  const saveCurrentChatNotes = async (notes) => {
    setCurrentChatNotes(notes);
    await updateCurrentSession({ notes });
  };

  // Generate AI notes summary
  const generateAINotes = async () => {
    if (!currentChatId || chatHistory.length === 0) {
      console.log('No chat history to generate notes from');
      return null;
    }

    try {
      console.log('🤖 Generating AI notes summary...');
      setLoading(true);

      // Prepare chat history for API
      const chatMessages = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

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

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const data = await response.json();
      console.log('✅ AI notes generated successfully');
      setLoading(false);
      return data.notes;
    } catch (error) {
      console.error('❌ Error generating AI notes:', error);
      setLoading(false);
      throw error;
    }
  };

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
    console.log('Initializing chat sessions. Auth loading:', authLoading, 'User:', user?.email || 'Anonymous');
    console.log('Current state - Chat ID:', currentChatId, 'Sessions:', chatSessions.length);
    
    if (!authLoading) {
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
        // For anonymous users, always ensure we have a session
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

  const chat = async (message) => {
    setLoading(true);
    
    // Ensure we have a chat session started
    if (!currentChatId) {
      console.log('No chat session found, starting new chat...');
      await startNewChat();
    }
    
    console.log('Current chat ID:', currentChatId);
    console.log('Current user:', user?.email || 'Anonymous');
    
    // Add user message to chat history
    const userMsg = { text: message, sender: 'user', timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    
    console.log('Making request to:', `${backendUrl}/api/chat`);
    
    const data = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message,
        chatHistory: chatHistory // Include chat history for context
      }),
    });
    const resp = (await data.json()).messages;
    
    // Add AI responses to chat history
    const aiMessages = resp.map(msg => ({
      ...msg,
      sender: 'ai',
      timestamp: Date.now() + Math.random(), // Ensure unique timestamps
      played: false
    }));
    setChatHistory(prev => [...prev, ...aiMessages]);
    
    // Set messages for avatar animation (separate from history)
    setMessages((messages) => [...messages, ...resp]);
    setLoading(false);
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
        loading,
        cameraZoomed,
        setCameraZoomed,
        chatHistory,
        clearCurrentChat,
        chatSessions,
        currentChatId,
        startNewChat,
        loadChatSession,
        deleteChatSession,
        currentChatNotes,
        saveCurrentChatNotes,
        generateAINotes,
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
