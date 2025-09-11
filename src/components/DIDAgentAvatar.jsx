import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';

const DIDAgentAvatar = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [streamId, setStreamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [agentId, setAgentId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); // Prevent multiple inits
  const [pendingMessages, setPendingMessages] = useState([]); // Queue messages until ready
  
  const { message, onMessagePlayed, loading } = useChat();

  // D-ID API configuration
  const DID_API_KEY = import.meta.env.VITE_DID_API_KEY;
  const API_URL = "https://api.d-id.com"; // Always use the full URL
  const IS_PRODUCTION = import.meta.env.PROD;

  // Debug environment variables in production
  useEffect(() => {
    const debugData = {
      hasApiKey: !!DID_API_KEY,
      apiKeyLength: DID_API_KEY?.length || 0,
      apiKeyFirst10: DID_API_KEY?.substring(0, 10) || 'Not found',
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      allViteEnv: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
      timestamp: new Date().toISOString()
    };
    
    console.log('🔧 Environment Debug:', debugData);
    
    // Force alert in production to see what's happening
    if (import.meta.env.PROD && !DID_API_KEY) {
      alert('🚨 PRODUCTION DEBUG: D-ID API Key is missing!\n\nEnvironment variables available: ' + 
            JSON.stringify(debugData.allViteEnv, null, 2));
    }
  }, []);

  // Use your specific agent ID instead of creating new ones
  const CUSTOM_AGENT_ID = "v2_agt_IgDqbqGR"; // Your educational tutor agent

  // Utility function for API calls with better retry logic
  const fetchWithRetry = async (url, options, retries = 5, backoffMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 API call attempt ${i + 1}/${retries}: ${url}`);
        
        let finalUrl, finalOptions;
        
        if (IS_PRODUCTION) {
          // In production, use our proxy
          const apiPath = url.replace('https://api.d-id.com', '');
          console.log(`🎯 API path for proxy: ${apiPath}`);
          
          finalUrl = '/api/did-proxy';
          finalOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: apiPath,
              method: options.method || 'GET',
              headers: options.headers || {},
              body: options.body ? JSON.parse(options.body) : undefined,
            }),
          };
          
          console.log(`📤 Calling proxy with:`, JSON.parse(finalOptions.body));
        } else {
          // In development, call D-ID API directly
          finalUrl = url;
          finalOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'omit',
          };
        }
        
        const response = await fetch(finalUrl, finalOptions);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP ${response.status} Response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        console.log(`✅ API call successful: ${url}`);
        return response;
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed:`, error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          url: url,
          attempt: i + 1
        });
        
        if (i === retries - 1) throw error;
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const waitTime = backoffMs * Math.pow(2, i);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  // Use your specific agent directly
  const setupAgent = async () => {
    try {
      console.log('🤖 Using custom educational agent:', CUSTOM_AGENT_ID);
      setAgentId(CUSTOM_AGENT_ID);
      return CUSTOM_AGENT_ID;
    } catch (error) {
      console.error('❌ Failed to setup agent:', error);
      throw new Error(`Agent setup failed: ${error.message}`);
    }
  };

  // Create WebRTC peer connection for Agents
  const createPeerConnection = async (offer, iceServers, currentAgentId, currentStreamId, currentSessionId) => {
    console.log('🔄 Creating WebRTC peer connection for agent...');
    console.log('🧊 ICE Servers:', iceServers);
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = peerConnection;

    // Event listeners
    peerConnection.addEventListener('icegatheringstatechange', (event) => {
      console.log('🧊 ICE gathering state:', peerConnection.iceGatheringState);
    });

    peerConnection.addEventListener('icecandidate', async (event) => {
      if (event.candidate && currentStreamId) {
        console.log('🧊 Sending ICE candidate...', event.candidate.candidate);
        try {
          const response = await fetchWithRetry(`${API_URL}/agents/${currentAgentId}/streams/${currentStreamId}/ice`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${DID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              session_id: currentSessionId,
            }),
          });
          console.log('✅ ICE candidate sent successfully');
        } catch (error) {
          console.error('❌ Failed to send ICE candidate:', error);
          setError(`ICE candidate error: ${error.message}`);
        }
      } else if (!event.candidate) {
        // End of ICE gathering
        console.log('🏁 ICE gathering complete');
        try {
          await fetchWithRetry(`${API_URL}/agents/${currentAgentId}/streams/${currentStreamId}/ice`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${DID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: currentSessionId,
            }),
          });
          console.log('✅ ICE gathering end signal sent');
        } catch (error) {
          console.error('❌ Failed to send ICE gathering end signal:', error);
        }
      }
    });

    peerConnection.addEventListener('iceconnectionstatechange', () => {
      console.log('🔗 ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        setLastConnectionTime(new Date());
        setRetryCount(0); // Reset retry count on successful connection
        console.log('✅ WebRTC connection established');
      } else if (peerConnection.iceConnectionState === 'failed' || 
                 peerConnection.iceConnectionState === 'disconnected') {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('❌ WebRTC connection failed/disconnected');
        
        // Auto-retry connection if it fails (up to 3 times)
        if (retryCount < 3) {
          console.log(`🔄 Auto-retry attempt ${retryCount + 1}/3 in 5 seconds...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            reconnect();
          }, 5000);
        } else {
          setError('Connection failed after multiple attempts. Please click Reconnect to try again.');
        }
      }
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
    });

    peerConnection.addEventListener('track', (event) => {
      console.log('🎥 Received video track');
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    });

    // Set remote description (offer)
    await peerConnection.setRemoteDescription(offer);
    console.log('✅ Remote description set');

    // Create and set local description (answer)
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('✅ Local description set');

    return answer;
  };

  // Initialize agent and streaming
  const initializeAgent = async () => {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('🚫 Agent already initialized, skipping...');
      return;
    }

    try {
      setIsInitialized(true);
      setIsConnecting(true);
      setError(null);
      setConnectionStatus('connecting');
      
      console.log('🎭 Creating D-ID Agent streaming session...');

      // Production-specific checks
      if (!DID_API_KEY) {
        throw new Error('D-ID API key not found. Please check environment variables.');
      }

      console.log(`🎭 Using API URL: ${API_URL} (Production: ${IS_PRODUCTION}, will use proxy: ${IS_PRODUCTION ? 'YES' : 'NO'})`);
      
      // Step 1: Setup or get agent
      const currentAgentId = await setupAgent();
      
      // Step 2: Create a new stream for the agent
      const sessionResponse = await fetchWithRetry(`${API_URL}/agents/${currentAgentId}/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compatibility_mode: "on",
          fluent: true,
        }),
      });

      const sessionData = await sessionResponse.json();
      console.log('✅ Agent stream session created:', sessionData);

      setStreamId(sessionData.id);
      setSessionId(sessionData.session_id);

      // Step 3: Create peer connection and get SDP answer
      const sdpAnswer = await createPeerConnection(
        sessionData.offer, 
        sessionData.ice_servers,
        currentAgentId,
        sessionData.id,
        sessionData.session_id
      );

      // Step 4: Send SDP answer to start the connection
      console.log('📤 Sending SDP answer...');
      await fetchWithRetry(`${API_URL}/agents/${currentAgentId}/streams/${sessionData.id}/sdp`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: sdpAnswer,
          session_id: sessionData.session_id,
        }),
      });

      console.log('✅ SDP answer sent, waiting for connection...');
      
      // Step 5: Create a chat session for conversations
      console.log('💬 Creating chat session...');
      const chatResponse = await fetchWithRetry(`${API_URL}/agents/${currentAgentId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const chatData = await chatResponse.json();
      setChatId(chatData.id);
      console.log('✅ Chat session created:', chatData.id);
      
      // Add connection timeout with longer duration for better reliability
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && isConnecting) {
          console.log('⏰ Connection timeout reached');
          setError('Connection timeout. The avatar service may be busy. Please try again.');
          setIsConnecting(false);
          setConnectionStatus('error');
        }
      }, 45000); // 45 second timeout (increased from 30)
      
      // Clear timeout if component unmounts
      return () => clearTimeout(connectionTimeout);
      
    } catch (error) {
      console.error('❌ Failed to initialize D-ID Agent:', error);
      setError(`Failed to initialize agent: ${error.message}`);
      setIsConnecting(false);
      setConnectionStatus('error');
      setIsInitialized(false); // Reset flag on error to allow retry
    }
  };

  // Send message to agent via chat
  const speakWithAgent = async (text) => {
    if (!agentId || !chatId || !streamId || !sessionId || !isConnected) {
      console.warn('⚠️ Agent not ready; queueing message:', text);
      setPendingMessages(prev => [...prev, text]);
      return;
    }

    try {
      console.log('💬 Sending message to agent (ready):', text);
      const response = await fetchWithRetry(`${API_URL}/agents/${agentId}/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamId,        // API expects snake_case
          session_id: sessionId,      // API expects snake_case
          messages: [
            {
              role: 'user',
              content: text,
              created_at: new Date().toISOString(),
            }
          ],
        }),
      });

      let data = {};
      try { data = await response.clone().json(); } catch { /* non-JSON */ }
      console.log('🗣️ Chat API response:', data);
      console.log('✅ Message sent to agent');
      
      // Simulate processing time (rough heuristic)
      setTimeout(() => {
        onMessagePlayed();
      }, Math.min(8000, text.length * 60 + 1500));
      
    } catch (error) {
      console.error('❌ Error sending message to agent:', error);
      setError(prev => prev || `Chat error: ${error.message}`);
      onMessagePlayed(); // Avoid UI lock
    }
  };

  // Cleanup function
  const cleanup = async () => {
    console.log('🧹 Cleaning up D-ID Agent...');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (agentId && streamId && sessionId) {
      try {
        await fetchWithRetry(`${API_URL}/agents/${agentId}/streams/${streamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
        console.log('✅ Agent stream session closed');
      } catch (error) {
        console.error('❌ Error closing agent stream session:', error);
      }
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    setStreamId(null);
    setSessionId(null);
    setAgentId(null);
    setChatId(null);
    setIsInitialized(false); // Reset initialization flag for fresh start
  };

  // Initialize agent on component mount
  useEffect(() => {
    initializeAgent();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  // Handle incoming messages
  useEffect(() => {
    if (message && message.text && isConnected) {
      speakWithAgent(message.text);
    } else if (message && message.text && !isConnected) {
      console.warn('⚠️ Message received but agent not connected yet; queued.');
      setPendingMessages(prev => [...prev, message.text]);
    }
  }, [message, isConnected]);

  // Flush queued messages once fully ready
  useEffect(() => {
    if (isConnected && chatId && pendingMessages.length > 0) {
      console.log(`🚚 Flushing ${pendingMessages.length} queued message(s)...`);
      const toSend = [...pendingMessages];
      setPendingMessages([]);
      toSend.forEach(txt => speakWithAgent(txt));
    }
  }, [isConnected, chatId, pendingMessages]);

  // Auto-greet once connected (only once per session)
  const greetedRef = useRef(false);
  useEffect(() => {
    if (isConnected && chatId && !greetedRef.current) {
      greetedRef.current = true;
      // Send a short greeting to verify audio pipeline
      speakWithAgent('Hello! I am your AI learning tutor. How can I help you today?');
    }
  }, [isConnected, chatId]);

  // Reconnect function for manual retry
  const reconnect = async () => {
    console.log('🔄 Manual reconnection initiated...');
    setRetryCount(0); // Reset retry count for manual reconnection
    setError(null);
    await cleanup();
    setTimeout(() => {
      initializeAgent();
    }, 1000);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      {/* Video element for D-ID agent stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className={`w-full h-full object-cover ${
          isConnected ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-500`}
        style={{
          transform: 'scaleX(-1)', // Mirror the video horizontally
        }}
      />

      {/* Loading overlay */}
      {(isConnecting || loading) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-lg font-semibold">
            {isConnecting ? 'Connecting to AI Agent...' : 'Processing...'}
          </p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex flex-col items-center justify-center p-4">
          <div className="text-white text-center max-w-md">
            <h3 className="text-xl font-bold mb-4">Connection Error</h3>
            <p className="text-sm mb-6">{error}</p>
            <button
              onClick={reconnect}
              className="bg-white text-red-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-500'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-red-500'
          }`}
        ></div>
        <span className="text-white text-sm font-medium">
          {connectionStatus === 'connected'
            ? 'Agent Connected'
            : connectionStatus === 'connecting'
            ? 'Connecting...'
            : 'Disconnected'}
        </span>
      </div>

      {/* Manual reconnect button (only show when disconnected and not connecting) */}
      {!isConnected && !isConnecting && (
        <button
          onClick={reconnect}
          className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Reconnect Agent
        </button>
      )}
    </div>
  );
};

export default DIDAgentAvatar;
