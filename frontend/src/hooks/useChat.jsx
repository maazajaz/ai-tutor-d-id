import { createContext, useContext, useEffect, useState } from "react";
import { supabase, authHelpers, chatHelpers } from "../lib/supabase";

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

// Fallback to localStorage for anonymous users
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
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatNotes, setCurrentChatNotes] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // Current session chat history
  const [messages, setMessages] = useState([]); // Messages for avatar animation
  const [message, setMessage] = useState(); // Current message being played
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  console.log('🚀 ChatProvider initialized. Current chat ID:', currentChatId);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingUser(true);
      const { user, error } = await authHelpers.getCurrentUser();
      setUser(user);
      setIsLoadingUser(false);
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserChatSessions(session.user.id);
        } else {
          // Use localStorage for anonymous users
          setChatSessions(loadChatSessions() || []);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load chat sessions from Supabase or localStorage
  const loadUserChatSessions = async (userId) => {
    if (userId) {
      const { data, error } = await chatHelpers.getChatSessions(userId);
      if (error) {
        console.error('Error loading chat sessions:', error);
        // Fallback to localStorage
        setChatSessions(loadChatSessions() || []);
      } else {
        setChatSessions(data || []);
      }
    } else {
      setChatSessions(loadChatSessions() || []);
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
      // Update in Supabase
      const { data, error } = await chatHelpers.updateChatSession(currentChatId, updates);
      
      if (error) {
        console.error('Error updating chat session in Supabase:', error);
        // Fallback to localStorage update
        setChatSessions(prevSessions => {
          const updatedSessions = prevSessions.map(session => {
            if (session.id === currentChatId) {
              return { ...session, ...updates, updated_at: Date.now() };
            }
            return session;
          });
          console.log('Saved to localStorage fallback:', updatedSessions);
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
      setChatHistory(session.messages);
      setCurrentChatNotes(session.notes);
      setMessages([]); // Clear animation queue when switching chats
    }
  };

  const updateChatNotes = async (notes) => {
    setCurrentChatNotes(notes);
    await updateCurrentSession({ notes });
  };

  const deleteChatSession = async (sessionId) => {
    if (user) {
      // Delete from Supabase
      const { error } = await chatHelpers.deleteChatSession(sessionId);
      if (error) {
        console.error('Error deleting chat session:', error);
        // Fallback to localStorage
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

  // Initialize chat sessions when user loads or changes
  useEffect(() => {
    console.log('Initializing chat sessions. User loading:', isLoadingUser, 'User:', user?.email || 'Anonymous');
    console.log('Current state - Chat ID:', currentChatId, 'Sessions:', chatSessions.length);
    
    if (!isLoadingUser) {
      if (user) {
        console.log('Loading user chat sessions...');
        loadUserChatSessions(user.id);
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
  }, [user, isLoadingUser]);

  // Force create a session if none exists when trying to chat
  useEffect(() => {
    if (!isLoadingUser && !currentChatId && chatSessions.length === 0) {
      console.log('🔧 Force creating initial chat session...');
      startNewChat();
    }
  }, [isLoadingUser, currentChatId, chatSessions]);

  // Auto-save chat history to current session
  useEffect(() => {
    if (currentChatId && chatHistory.length > 0) {
      console.log('Auto-saving chat history. Chat ID:', currentChatId, 'Messages:', chatHistory.length);
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
      body: JSON.stringify({ message }),
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
          msg.text === currentMsg.text && msg.sender === 'ai' && !msg.played
            ? { ...msg, played: true }
            : msg
        )
      );
    }
    // Remove from animation queue
    setMessages((messages) => messages.slice(1));
  };
  
  const clearChatHistory = () => {
    console.log("Clearing chat history...");
    setChatHistory([]);
    setMessages([]);
    setMessage(null);
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
        messages,
        chatHistory,
        onMessagePlayed,
        clearChatHistory,
        loading,
        cameraZoomed,
        setCameraZoomed,
        // New chat history features
        chatSessions,
        currentChatId,
        currentChatNotes,
        startNewChat,
        loadChatSession,
        updateChatNotes,
        deleteChatSession,
        // User authentication
        user,
        isLoadingUser,
        authHelpers,
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
