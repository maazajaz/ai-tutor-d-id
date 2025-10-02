import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';

const DIDTalksAvatar = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [streamId, setStreamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { message, onMessagePlayed, loading } = useChat();

  // D-ID API configuration
  const DID_API_KEY = import.meta.env.VITE_DID_API_KEY;
  const API_URL = "https://api.d-id.com";

  // Choose a presenter (you can change this to any D-ID presenter ID)
  const PRESENTER_ID = "amy-jcwCkr1grs"; // Default female presenter
  // Alternative presenters you can use:
  // "amy-jcwCkr1grs" - Professional female
  // "Mellissa-K5TXa6dqW" - Another female presenter
  // "john-Aq0FUmqk" - Male presenter

  // Debug environment variables
  useEffect(() => {
    console.log('🔧 D-ID Talks Avatar Environment:', {
      hasApiKey: !!DID_API_KEY,
      apiKeyLength: DID_API_KEY?.length || 0,
      mode: import.meta.env.MODE,
    });
  }, []);

  // Utility function for API calls with retry logic
  const fetchWithRetry = async (url, options, retries = 3, backoffMs = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 API call attempt ${i + 1}/${retries}: ${url}`);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP ${response.status}:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        console.log(`✅ API call successful`);
        return response;
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed:`, error.message);
        if (error.name === 'AbortError') {
          console.error('⏰ Request timed out after 30 seconds');
        }
        if (i === retries - 1) throw error;
        
        const waitTime = backoffMs * Math.pow(2, i);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  };

  // Create WebRTC peer connection
  const createPeerConnection = async (offer, iceServers, currentStreamId, currentSessionId) => {
    console.log('🔄 Creating WebRTC peer connection...');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = peerConnection;

    // Handle incoming tracks (video/audio)
    peerConnection.ontrack = (event) => {
      console.log('📺 Received media track:', event.track.kind);
      if (videoRef.current && event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE gathering state
    peerConnection.addEventListener('icegatheringstatechange', () => {
      console.log('🧊 ICE gathering state:', peerConnection.iceGatheringState);
    });

    // Handle ICE candidates
    peerConnection.addEventListener('icecandidate', async (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate...');
        try {
          await fetchWithRetry(`${API_URL}/talks/streams/${currentStreamId}/ice`, {
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
        } catch (error) {
          console.error('❌ Failed to send ICE candidate:', error);
        }
      }
    });

    // Connection state changes
    peerConnection.addEventListener('iceconnectionstatechange', () => {
      console.log('🔗 ICE connection state:', peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        console.log('✅ WebRTC connection established');
      } else if (peerConnection.iceConnectionState === 'failed' || 
                 peerConnection.iceConnectionState === 'disconnected') {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('❌ WebRTC connection failed/disconnected');
      }
    });

    // Set remote description
    await peerConnection.setRemoteDescription(offer);
    console.log('✅ Remote description set');

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('✅ Local description set');

    return answer;
  };

  // Initialize D-ID Talks stream
  const initializeTalksStream = async () => {
    if (isInitialized || isConnecting) {
      console.log('⚠️ Already initialized or connecting, skipping...');
      return;
    }

    try {
      setIsConnecting(true);
      setIsInitialized(true);
      setError(null);
      
      console.log('🎭 Creating D-ID Talks streaming session...');

      if (!DID_API_KEY) {
        throw new Error('D-ID API key not found. Please check your .env file.');
      }
      
      // Step 1: Create a new stream
      console.log('📡 Creating stream with presenter:', PRESENTER_ID);
      const streamResponse = await fetchWithRetry(`${API_URL}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: `https://create-images-results.d-id.com/DefaultPresenters/${PRESENTER_ID}/image.jpeg`,
          // Alternative: use a custom image URL
          // source_url: "https://path-to-your-image.jpg",
        }),
      });

      const streamData = await streamResponse.json();
      console.log('✅ Stream created:', streamData);

      const currentStreamId = streamData.id;
      const currentSessionId = streamData.session_id;
      
      setStreamId(currentStreamId);
      setSessionId(currentSessionId);

      // Step 2: Create peer connection and get SDP answer
      const sdpAnswer = await createPeerConnection(
        streamData.offer, 
        streamData.ice_servers,
        currentStreamId,
        currentSessionId
      );

      // Step 3: Send SDP answer to start the connection
      console.log('📤 Sending SDP answer...');
      await fetchWithRetry(`${API_URL}/talks/streams/${currentStreamId}/sdp`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: sdpAnswer,
          session_id: currentSessionId,
        }),
      });

      console.log('✅ SDP answer sent, waiting for connection...');
      
      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && isConnecting) {
          console.log('⏰ Connection timeout');
          setError('Connection timeout. Please try again.');
          setIsConnecting(false);
          setConnectionStatus('error');
        }
      }, 30000);
      
      return () => clearTimeout(connectionTimeout);
      
    } catch (error) {
      console.error('❌ Failed to initialize D-ID Talks stream:', error);
      setError(`Failed to initialize: ${error.message}`);
      setIsConnecting(false);
      setConnectionStatus('error');
      setIsInitialized(false);
    }
  };

  // Send text to avatar to speak
  const speakText = async (text) => {
    if (!streamId || !sessionId || !isConnected) {
      console.warn('⚠️ Stream not ready. Status:', connectionStatus);
      return;
    }

    try {
      console.log('💬 Sending text to avatar:', text);
      
      await fetchWithRetry(`${API_URL}/talks/streams/${streamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'microsoft',
              voice_id: 'en-US-JennyNeural', // Natural female voice
              // Alternative voices:
              // 'en-US-GuyNeural' - Male voice
              // 'en-IN-NeerjaNeural' - Indian English female
              // 'hi-IN-SwaraNeural' - Hindi female
            },
          },
          session_id: sessionId,
        }),
      });

      console.log('✅ Text sent to avatar');
      
      // Mark message as played after a delay
      if (onMessagePlayed) {
        setTimeout(() => {
          onMessagePlayed();
        }, text.length * 50); // Rough estimate based on text length
      }
      
    } catch (error) {
      console.error('❌ Failed to send text:', error);
      setError(`Failed to speak: ${error.message}`);
    }
  };

  // Handle new messages from chat
  useEffect(() => {
    if (message && isConnected) {
      console.log('📨 New message received:', message);
      
      if (message.text) {
        speakText(message.text);
      } else if (typeof message === 'string') {
        speakText(message);
      }
    }
  }, [message, isConnected]);

  // Initialize on component mount
  useEffect(() => {
    console.log('🚀 DIDTalksAvatar component mounted');
    initializeTalksStream();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up D-ID connection...');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      // Delete stream
      if (streamId && sessionId) {
        fetch(`${API_URL}/talks/streams/${streamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
          }),
        }).catch(err => console.error('Failed to delete stream:', err));
      }
    };
  }, []);

  // Reconnect button handler
  const handleReconnect = () => {
    setIsInitialized(false);
    setError(null);
    initializeTalksStream();
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">
      {/* Video Container */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror the video
      />

      {/* Status Overlay */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg backdrop-blur-sm ${
          isConnected ? 'bg-green-500/80' : 
          isConnecting ? 'bg-yellow-500/80' : 
          'bg-red-500/80'
        }`}>
          {isConnected ? '🟢 Live' : 
           isConnecting ? '🟡 Connecting...' : 
           '🔴 Disconnected'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-red-500 text-xl font-bold mb-2">
              ⚠️ Connection Error
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={handleReconnect}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isConnecting && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-sm">
          <div className="text-center text-white">
            <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-xl font-semibold">Initializing AI Tutor...</p>
            <p className="text-sm text-blue-200 mt-2">Setting up video connection</p>
          </div>
        </div>
      )}

      {/* Avatar Info */}
      {isConnected && (
        <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-200">AI Tutor</div>
          <div className="font-semibold">Ready to help! 👋</div>
        </div>
      )}
    </div>
  );
};

export default DIDTalksAvatar;
