import { createContext, useContext, useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    setLoading(true);
    
    // Add user message to chat history
    const userMsg = { text: message, sender: 'user', timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    
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
  
  const [chatHistory, setChatHistory] = useState([]); // Permanent chat history
  const [messages, setMessages] = useState([]); // Messages for avatar animation
  const [message, setMessage] = useState(); // Current message being played
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  
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
