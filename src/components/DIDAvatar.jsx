import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';

const DIDAvatar = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [streamId, setStreamId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  const { message, onMessagePlayed, loading } = useChat();

  // D-ID API configuration
  const DID_API_KEY = import.meta.env.VITE_DID_API_KEY;
  const API_URL = "https://api.d-id.com";

  // Default presenter image (you can change this to any image URL)
  const PRESENTER_URL = "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg";

  // Utility function for API calls with retry
  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Create WebRTC peer connection
  const createPeerConnection = async (offer, iceServers) => {
    console.log('🔄 Creating WebRTC peer connection...');
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
      if (event.candidate && streamId) {
        console.log('🧊 Sending ICE candidate...', event.candidate.candidate);
        try {
          const response = await fetchWithRetry(`${API_URL}/talks/streams/${streamId}/ice`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${DID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              session_id: sessionId,
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
          await fetchWithRetry(`${API_URL}/talks/streams/${streamId}/ice`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${DID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
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
        console.log('✅ WebRTC connection established');
      } else if (peerConnection.iceConnectionState === 'failed' || 
                 peerConnection.iceConnectionState === 'disconnected') {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('❌ WebRTC connection failed/disconnected');
      }
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      console.log('� Connection state:', peerConnection.connectionState);
    });

    peerConnection.addEventListener('track', (event) => {
      console.log('📺 Received media track');
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        console.log('🎥 Video stream attached to element');
      }
    });

    // Set remote description and create answer
    await peerConnection.setRemoteDescription(offer);
    const sessionClientAnswer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(sessionClientAnswer);

    return sessionClientAnswer;
  };

  // Initialize streaming session
  const initializeAvatar = async () => {
    if (!DID_API_KEY) {
      setError('D-ID API key not found. Please check your environment variables.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setConnectionStatus('connecting');
      
      console.log('🎭 Creating D-ID streaming session...');
      
      // Step 1: Create a new stream
      const sessionResponse = await fetchWithRetry(`${API_URL}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: PRESENTER_URL,
        }),
      });

      const sessionData = await sessionResponse.json();
      console.log('✅ Stream session created:', sessionData);

      setStreamId(sessionData.id);
      setSessionId(sessionData.session_id);

      // Step 2: Create peer connection and get SDP answer
      const sdpAnswer = await createPeerConnection(
        sessionData.offer, 
        sessionData.ice_servers
      );

      // Step 3: Send SDP answer to start the connection
      console.log('📤 Sending SDP answer...');
      await fetchWithRetry(`${API_URL}/talks/streams/${sessionData.id}/sdp`, {
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
      
      // Add a timeout for connection establishment
      setTimeout(() => {
        if (!isConnected && isConnecting) {
          console.log('⏰ Connection timeout reached');
          setError('Connection timeout. Please check your internet connection and try again.');
          setIsConnecting(false);
          setConnectionStatus('error');
        }
      }, 30000); // 30 second timeout
      
    } catch (error) {
      console.error('❌ Failed to initialize D-ID Avatar:', error);
      setError(`Failed to initialize avatar: ${error.message}`);
      setIsConnecting(false);
      setConnectionStatus('error');
    }
  };

  // Cleanup function
  const cleanup = async () => {
    console.log('🧹 Cleaning up D-ID Avatar...');
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (streamId) {
      try {
        await fetchWithRetry(`${API_URL}/talks/streams/${streamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
        console.log('✅ Stream session closed');
      } catch (error) {
        console.error('❌ Error closing stream session:', error);
      }
    }

    setIsConnected(false);
    setStreamId(null);
    setSessionId(null);
    setConnectionStatus('disconnected');
  };

  // Handle speaking
  const speak = async (text) => {
    if (!streamId || !sessionId || !isConnected) {
      console.warn('⚠️ Avatar not connected, cannot speak');
      onMessagePlayed(); // Skip this message
      return;
    }

    try {
      console.log('🗣️ Making avatar speak:', text);
      
      const response = await fetchWithRetry(`${API_URL}/talks/streams/${streamId}`, {
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
              voice_id: 'en-US-JennyNeural',
              voice_config: {
                style: 'cheerful'
              }
            }
          },
          config: {
            fluent: true,
            pad_audio: 0.0,
            stitch: true,
            align_driver: true
          },
          session_id: sessionId,
        }),
      });

      const responseData = await response.json();
      console.log('✅ Speech command sent successfully:', responseData);
      
      // Mark message as played after a delay (since we don't get completion events)
      setTimeout(() => {
        onMessagePlayed();
      }, text.length * 50 + 2000); // Approximate timing based on text length
      
    } catch (error) {
      console.error('❌ Error making avatar speak:', error);
      setError(`Speech error: ${error.message}`);
      onMessagePlayed(); // Skip this message on error
    }
  };

  // Initialize avatar on component mount
  useEffect(() => {
    initializeAvatar();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  // Handle incoming messages
  useEffect(() => {
    if (message && message.text && isConnected) {
      speak(message.text);
    } else if (message && message.text && !isConnected) {
      console.warn('⚠️ Message received but avatar not connected, skipping...');
      onMessagePlayed();
    }
  }, [message, isConnected]);

  // Reconnect function for manual retry
  const reconnect = async () => {
    await cleanup();
    setTimeout(() => {
      initializeAvatar();
    }, 1000);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      {/* Video element for D-ID stream */}
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
            {isConnecting ? 'Connecting to AI Avatar...' : 'Processing...'}
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
            ? 'Avatar Connected'
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
          Reconnect Avatar
        </button>
      )}

      {/* Debug info (only in development) */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white p-2 rounded text-xs">
          <div>Stream ID: {streamId || 'None'}</div>
          <div>Session ID: {sessionId || 'None'}</div>
          <div>WebRTC: {peerConnectionRef.current?.iceConnectionState || 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default DIDAvatar;
