import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';

const DIDAgentAvatar = () => {
  const videoRef = useRef(null);
  const idleVideoRef = useRef(null); // For continuous idle animation
  const peerConnectionRef = useRef(null);
  const initializingRef = useRef(false); // Prevent double initialization
  const cleanupCalledRef = useRef(false); // Track cleanup state
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
  const [isPlaying, setIsPlaying] = useState(false); // Track if agent is speaking
  const [idleVideoUrl, setIdleVideoUrl] = useState(null); // Store idle video URL
  const [audioEnabled, setAudioEnabled] = useState(false); // Track if audio is enabled by user
  const sessionTimeoutRef = useRef(null); // Track session timeout
  
  const { message, onMessagePlayed, loading, updateAgentResponse } = useChat();
  const audioProcessorRef = useRef(null);

  // D-ID API configuration
  const DID_API_KEY = import.meta.env.VITE_DID_API_KEY;
  const API_URL = "https://api.d-id.com";

  // Initialize audio processor
  useEffect(() => {
    const initAudio = async () => {
      const { AudioProcessor } = await import('../utils/audioProcessor');
      audioProcessorRef.current = new AudioProcessor();
      await audioProcessorRef.current.initialize();
    };
    
    initAudio();
    
    return () => {
      audioProcessorRef.current?.cleanup();
    };
  }, []);
  
  // Backend URL for proxying D-ID requests (to avoid CORS)
  const getBackendUrl = () => {
    // Always use http for local development
    return "http://localhost:3000";
  };
  const backendUrl = getBackendUrl();
  
  // Session expires after 5 minutes of inactivity, so refresh after 4 minutes
  const SESSION_TIMEOUT = 4 * 60 * 1000; // 4 minutes

  // Debug environment variables in production
  useEffect(() => {
    console.log('🔧 Environment Debug:', {
      hasApiKey: !!DID_API_KEY,
      apiKeyLength: DID_API_KEY?.length || 0,
      apiKeyPreview: DID_API_KEY ? `${DID_API_KEY.substring(0, 10)}...` : 'NOT FOUND',
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      agentId: CUSTOM_AGENT_ID
    });
    
    if (!DID_API_KEY) {
      console.error('❌ CRITICAL: VITE_DID_API_KEY not found in environment!');
      console.log('💡 Make sure .env file has: VITE_DID_API_KEY=your_key');
      setError('API key not configured. Please check your .env file.');
      setConnectionStatus('error');
    }
  }, []);

  // Use Amber agent (Important: Agent ID is tied to the API key - if you change the API key, update this ID too!)
  // To find agents for your current API key: run `node server/createAgent.js list`
  const CUSTOM_AGENT_ID = "v2_agt_E_R-le__"; // Amber - Live streaming agent with idle animations (New account)

  // Utility function for API calls with better retry logic
  const fetchWithRetry = async (url, options, retries = 5, backoffMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 API call attempt ${i + 1}/${retries}: ${url}`);
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        console.log(`✅ API call successful: ${url}`);
        return response;
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed:`, error);
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

    // Create data channel to receive agent responses
    const dataChannel = peerConnection.createDataChannel('JanusDataChannel');
    dataChannel.onopen = () => {
      console.log('📡 Data channel opened');
    };
    dataChannel.onmessage = (event) => {
      console.log('📨 Data channel message:', event.data);
      let msg = event.data;
      
      // Agent responses come through as 'chat/answer:' messages
      if (msg.includes('chat/answer')) {
        const responseText = decodeURIComponent(msg.replace('chat/answer:', ''));
        console.log('🤖 Agent response via data channel:', responseText);
        // Update chatbox immediately with the response
        updateAgentResponse(responseText);
      }
      
      // Stream started event (for fluent agents)
      if (msg.includes('stream/started')) {
        console.log('🎬 Stream started');
      }
      
      // Stream done event
      if (msg.includes('stream/done')) {
        console.log('✅ Stream done');
      }
    };
    dataChannel.onerror = (error) => {
      console.error('❌ Data channel error:', error);
    };

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
      if (videoRef.current && event.streams && event.streams[0]) {
        console.log('📺 Setting video source');
        const stream = event.streams[0];
        const [track] = stream.getVideoTracks();
        
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(e => console.error('❌ Video play error:', e));
        
        // Monitor video activity to switch between idle and speaking
        if (track) {
          let lastBytes = 0;
          const checkInterval = setInterval(async () => {
            if (!peerConnection || peerConnection.connectionState === 'closed') {
              clearInterval(checkInterval);
              return;
            }
            
            try {
              const receiver = peerConnection.getReceivers().find(r => r.track === track);
              if (!receiver) return;
              
              const stats = await receiver.getStats();
              stats.forEach((report) => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                  const nowPlaying = report.bytesReceived > lastBytes;
                  if (nowPlaying !== isPlaying) {
                    console.log('🎬 Stream playing state changed:', nowPlaying);
                    setIsPlaying(nowPlaying);
                    
                    // Switch video visibility
                    if (videoRef.current && idleVideoRef.current) {
                      if (nowPlaying) {
                        // Agent is speaking - show streaming video
                        videoRef.current.style.opacity = '1';
                        idleVideoRef.current.style.opacity = '0';
                      } else {
                        // Agent is idle - show idle video
                        videoRef.current.style.opacity = '0';
                        idleVideoRef.current.style.opacity = '1';
                      }
                    }
                  }
                  lastBytes = report.bytesReceived;
                }
              });
            } catch (err) {
              console.error('❌ Error checking video stats:', err);
            }
          }, 400); // Check every 400ms
        }
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
    if (initializingRef.current || isConnecting) {
      console.log('🚫 Already initializing or connecting, skipping...');
      return;
    }

    try {
      initializingRef.current = true;
      cleanupCalledRef.current = false;
      setIsConnecting(true);
      setError(null);
      setConnectionStatus('connecting');
      
      console.log('🎭 Creating D-ID Agent streaming session...');

      // Production-specific checks
      if (!DID_API_KEY) {
        throw new Error('D-ID API key not found. Please check environment variables.');
      }
      
      // Step 1: Setup or get agent
      const currentAgentId = await setupAgent();
      
      // Step 1.5: Fetch agent info to get idle video URL
      console.log('📥 Fetching agent info for idle video...');
      const agentInfoResponse = await fetchWithRetry(`${API_URL}/agents/${currentAgentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      const agentInfo = await agentInfoResponse.json();
      console.log('✅ Agent info received:', agentInfo);
      
      // Set idle video if available
      if (agentInfo.presenter && agentInfo.presenter.idle_video) {
        console.log('🎬 Setting idle video URL:', agentInfo.presenter.idle_video);
        setIdleVideoUrl(agentInfo.presenter.idle_video);
      }
      
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
      
      // Start session timeout tracker
      resetSessionTimeout();
      
      // Initial greeting removed to save credits
      // Agent will show idle animation and wait for user input
      
      // Add connection timeout with longer duration for better reliability
      console.log('⏳ Starting connection monitor...');
      const connectionTimeout = setTimeout(() => {
        console.log('🔍 Checking connection state:', { isConnected, isConnecting });
        if (!isConnected && isConnecting) {
          console.log('⏰ Connection timeout reached - attempting recovery...');
          // Try to reinitialize
          setIsConnecting(false);
          setTimeout(() => {
            if (!cleanupCalledRef.current) {
              console.log('🔄 Attempting connection recovery...');
              initializeAgent();
            }
          }, 1000);
        }
      }, 60000); // 60 second timeout with auto-recovery
      
      // Clear timeout if component unmounts
      return () => {
        clearTimeout(connectionTimeout);
        console.log('🧹 Connection monitor cleared');
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize D-ID Agent:', error);
      setError(`Failed to initialize agent: ${error.message}`);
      setIsConnecting(false);
      setConnectionStatus('error');
      initializingRef.current = false; // Reset flag on error to allow retry
    } finally {
      // Always reset initializing flag when done
      initializingRef.current = false;
    }
  };

  // Send message to agent via chat
  const speakWithAgent = async (text) => {
    // Check all required fields
    const missing = [];
    if (!agentId) missing.push('agentId');
    if (!chatId) missing.push('chatId');
    if (!streamId) missing.push('streamId');
    if (!sessionId) missing.push('sessionId');
    if (!isConnected) missing.push('connection');
    
    if (missing.length > 0) {
      console.warn('⚠️ Agent not ready:', missing.join(', '), 'missing');
      // Try to recover
      if (!cleanupCalledRef.current) {
        console.log('🔄 Attempting to recover agent connection...');
        await initializeAgent();
      }
      return;
    }

    try {
      console.log('💬 Sending message to agent with details:', {
        agentId,
        chatId,
        streamId,
        sessionId,
        text
      });
      
      // Send message to D-ID Agent - response will come via WebRTC data channel
      await fetchWithRetry(`${API_URL}/agents/${agentId}/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId: streamId,
          sessionId: sessionId,
          messages: [
            {
              role: 'user',
              content: text,
              created_at: new Date().toLocaleString(),
            }
          ],
        }),
      });

      console.log('✅ Message sent to agent - response will come via data channel');
      
      // The agent will:
      // 1. Process with GPT-4
      // 2. Send response text via WebRTC data channel (handled in peerConnection setup)
      // 3. Speak the response through video stream
      
      // Mark message as played after reasonable time
      setTimeout(() => {
        onMessagePlayed();
      }, text.length * 80 + 3000);
      
    } catch (error) {
      console.error('❌ Error sending message to agent:', error);
      
      // Check if it's a session error
      if (error.message.includes('SessionError') || error.message.includes('session_id')) {
        console.warn('🔄 Session expired, attempting to reconnect...');
        setError('Session expired. Reconnecting...');
        
        // Attempt to reconnect
        setTimeout(() => {
          reconnect();
        }, 1000);
      } else {
        setError(`Chat error: ${error.message}`);
      }
      onMessagePlayed(); // Skip this message on error
    }
    
    // Reset session timeout after successful message
    resetSessionTimeout();
  };
  
  // Reset session timeout to prevent expiration
  const resetSessionTimeout = () => {
    // Clear existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Set new timeout to refresh session before it expires
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Session timeout approaching, refreshing connection...');
      if (isConnected) {
        reconnect();
      }
    }, SESSION_TIMEOUT);
  };

  // Cleanup function
  const cleanup = async () => {
    // Prevent multiple cleanup calls
    if (cleanupCalledRef.current) {
      console.log('🚫 Cleanup already called, skipping...');
      return;
    }
    
    cleanupCalledRef.current = true;
    console.log('🧹 Cleaning up D-ID Agent...');
    
    // Clear session timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      console.log('✅ Session timeout cleared');
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
        console.log('✅ Peer connection closed');
      } catch (err) {
        console.error('❌ Error closing peer connection:', err);
      }
      peerConnectionRef.current = null;
    }

    // Stop video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Delete stream session if exists
    const currentAgentId = agentId;
    const currentStreamId = streamId;
    const currentSessionId = sessionId;
    
    if (currentAgentId && currentStreamId && currentSessionId) {
      try {
        await fetchWithRetry(`${API_URL}/agents/${currentAgentId}/streams/${currentStreamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: currentSessionId }),
        });
        console.log('✅ Agent stream session deleted');
      } catch (error) {
        console.error('❌ Error deleting agent stream session:', error);
      }
    }

    // Reset all state
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    setStreamId(null);
    setSessionId(null);
    setAgentId(null);
    setChatId(null);
    setIsPlaying(false);
    setIdleVideoUrl(null);
    initializingRef.current = false;
  };

  // Initialize agent on component mount
  useEffect(() => {
    console.log('🎬 Component mounted, initializing agent...');
    
    // Simple initialization without cleanup first
    if (!initializingRef.current) {
      initializeAgent();
    }
    
    // Cleanup on unmount
    return () => {
      console.log('🔚 Component unmounting, cleaning up...');
      cleanup();
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle incoming messages
  useEffect(() => {
    if (!message) return; // No message to process
    
    console.log('🔄 Processing message:', message);
    
    if (!isConnected) {
      console.warn('⚠️ Message received but agent not connected, attempting reconnection...');
      initializeAgent().then(() => {
        if (message.userQuestion) {
          speakWithAgent(message.userQuestion);
        } else if (message.text) {
          speakWithAgent(message.text);
        }
      });
      return;
    }
    
    if (message.userQuestion) {
      // Send the original user question to the agent
      console.log('📝 Sending user question to agent:', message.userQuestion);
      speakWithAgent(message.userQuestion);
    } else if (message.text) {
      // Fallback: use message text if no userQuestion
      console.log('📝 Using message text:', message.text);
      speakWithAgent(message.text);
    } else {
      console.warn('⚠️ Invalid message format:', message);
      onMessagePlayed(); // Skip invalid messages
    }
  }, [message, isConnected]);

  // Handle idle video playback
  useEffect(() => {
    if (idleVideoUrl && idleVideoRef.current) {
      console.log('🎬 Loading idle video:', idleVideoUrl);
      idleVideoRef.current.src = idleVideoUrl;
      idleVideoRef.current.load();
      idleVideoRef.current.play().catch(e => {
        console.error('❌ Idle video autoplay failed:', e);
        // Try again after user interaction
        setTimeout(() => {
          idleVideoRef.current?.play().catch(err => console.error('❌ Retry failed:', err));
        }, 1000);
      });
    }
  }, [idleVideoUrl]);

  // Reconnect function for manual retry
  const reconnect = async () => {
    console.log('🔄 Manual reconnection initiated...');
    setRetryCount(0); // Reset retry count for manual reconnection
    setError(null);
    cleanupCalledRef.current = false; // Allow cleanup to run again
    await cleanup();
    setTimeout(() => {
      cleanupCalledRef.current = false; // Reset before reinitializing
      initializeAgent();
    }, 1000);
  };

  // Enable audio after user interaction
  const enableAudio = async () => {
    console.log('🔊 Enabling audio after user interaction...');
    setAudioEnabled(true);
    
    try {
      // Connect audio processor to video element
      if (audioProcessorRef.current && videoRef.current) {
        audioProcessorRef.current.connectAgentAudio(videoRef.current);
        await audioProcessorRef.current.startMicrophoneMonitoring();
        console.log('✅ Audio processing active');
      }
      
      // Unmute videos
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(e => console.error('❌ Video play error:', e));
      }
      if (idleVideoRef.current) {
        idleVideoRef.current.muted = false;
        idleVideoRef.current.play().catch(e => console.error('❌ Idle video play error:', e));
      }
    } catch (error) {
      console.error('❌ Error enabling audio:', error);
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      {/* Idle video element - shows when agent is not speaking */}
      <video
        ref={idleVideoRef}
        src={idleVideoUrl}
        autoPlay
        loop
        playsInline
        muted={true}
        className="w-full h-full object-cover absolute inset-0"
        style={{
          transform: 'scaleX(-1)', // Mirror the video horizontally
          opacity: idleVideoUrl && !isPlaying ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onLoadedMetadata={() => console.log('🎬 Idle video metadata loaded')}
        onPlay={() => console.log('▶️ Idle video started playing')}
      />
      
      {/* Streaming video element - shows when agent is speaking */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className="w-full h-full object-cover absolute inset-0"
        style={{
          transform: 'scaleX(-1)', // Mirror the video horizontally
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onLoadedMetadata={() => console.log('📹 Streaming video metadata loaded')}
        onPlay={() => console.log('▶️ Streaming video started playing')}
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

      {/* Click to enable audio overlay - shows when connected but audio not enabled */}
      {isConnected && !audioEnabled && !isConnecting && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center cursor-pointer z-50"
          onClick={enableAudio}
        >
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full p-8 mb-4 hover:bg-opacity-20 transition-all">
            <svg 
              className="w-24 h-24 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
              />
            </svg>
          </div>
          <p className="text-white text-xl font-semibold mb-2">Click to Enable Audio</p>
          <p className="text-white text-sm opacity-80">Tap anywhere to start the conversation</p>
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
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
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
