import { useState, useEffect, useRef, useCallback } from 'react';
import { studyRoomHelpers } from '../lib/supabase';

// ICE servers configuration (using free STUN servers)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export const useVoiceChat = (roomId, userId, onParticipantUpdate) => {
  const [peers, setPeers] = useState(new Map()); // userId -> RTCPeerConnection
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  const pendingCandidatesRef = useRef(new Map()); // Store ICE candidates before remote description

  // Initialize local audio stream
  const initializeAudio = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setConnecting(false);
      
      console.log('🎤 Local audio stream initialized');
      return stream;
    } catch (err) {
      console.error('❌ Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
      setConnecting(false);
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((peerId, isInitiator = false) => {
    console.log(`🔗 Creating peer connection with ${peerId}, initiator: ${isInitiator}`);
    
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
        console.log(`➕ Added local ${track.kind} track to peer ${peerId}`);
      });
    }

    // Handle incoming tracks (remote audio)
    peerConnection.ontrack = (event) => {
      console.log(`🎵 Received remote track from ${peerId}:`, event.track.kind);
      const [remoteStream] = event.streams;
      
      // Create or get audio element for this peer
      let audioElement = document.getElementById(`audio-${peerId}`);
      if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = `audio-${peerId}`;
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        document.body.appendChild(audioElement);
      }
      audioElement.srcObject = remoteStream;
      
      console.log(`🔊 Playing audio from ${peerId}`);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log(`❄️ Sending ICE candidate to ${peerId}`);
        try {
          await studyRoomHelpers.sendSignal(
            roomId,
            userId,
            peerId,
            'ice-candidate',
            { candidate: event.candidate }
          );
        } catch (err) {
          console.error('Error sending ICE candidate:', err);
        }
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔌 Peer ${peerId} connection state:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        console.log(`✅ Successfully connected to ${peerId}`);
      } else if (peerConnection.connectionState === 'failed') {
        console.error(`❌ Connection to ${peerId} failed`);
        closePeerConnection(peerId);
      } else if (peerConnection.connectionState === 'disconnected') {
        console.log(`⚠️ Disconnected from ${peerId}`);
      }
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 Peer ${peerId} ICE state:`, peerConnection.iceConnectionState);
    };

    peersRef.current.set(peerId, peerConnection);
    setPeers(new Map(peersRef.current));

    return peerConnection;
  }, [roomId, userId]);

  // Create and send offer
  const createOffer = useCallback(async (peerId) => {
    const peerConnection = peersRef.current.get(peerId) || createPeerConnection(peerId, true);
    
    try {
      console.log(`📤 Creating offer for ${peerId}`);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await peerConnection.setLocalDescription(offer);
      
      await studyRoomHelpers.sendSignal(
        roomId,
        userId,
        peerId,
        'offer',
        { sdp: offer }
      );
      
      console.log(`✅ Offer sent to ${peerId}`);
    } catch (err) {
      console.error(`Error creating offer for ${peerId}:`, err);
    }
  }, [roomId, userId, createPeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (fromUserId, offerData) => {
    console.log(`📥 Received offer from ${fromUserId}`);
    
    const peerConnection = peersRef.current.get(fromUserId) || createPeerConnection(fromUserId, false);
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
      
      // Process any pending ICE candidates
      const pending = pendingCandidatesRef.current.get(fromUserId) || [];
      for (const candidate of pending) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(fromUserId);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      await studyRoomHelpers.sendSignal(
        roomId,
        userId,
        fromUserId,
        'answer',
        { sdp: answer }
      );
      
      console.log(`✅ Answer sent to ${fromUserId}`);
    } catch (err) {
      console.error(`Error handling offer from ${fromUserId}:`, err);
    }
  }, [roomId, userId, createPeerConnection]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (fromUserId, answerData) => {
    console.log(`📥 Received answer from ${fromUserId}`);
    
    const peerConnection = peersRef.current.get(fromUserId);
    if (!peerConnection) {
      console.error(`No peer connection found for ${fromUserId}`);
      return;
    }
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answerData.sdp));
      
      // Process any pending ICE candidates
      const pending = pendingCandidatesRef.current.get(fromUserId) || [];
      for (const candidate of pending) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(fromUserId);
      
      console.log(`✅ Remote description set for ${fromUserId}`);
    } catch (err) {
      console.error(`Error handling answer from ${fromUserId}:`, err);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (fromUserId, candidateData) => {
    console.log(`❄️ Received ICE candidate from ${fromUserId}`);
    
    const peerConnection = peersRef.current.get(fromUserId);
    if (!peerConnection) {
      console.log(`Peer connection not ready, storing candidate for ${fromUserId}`);
      const pending = pendingCandidatesRef.current.get(fromUserId) || [];
      pending.push(candidateData.candidate);
      pendingCandidatesRef.current.set(fromUserId, pending);
      return;
    }
    
    try {
      if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
        console.log(`✅ ICE candidate added for ${fromUserId}`);
      } else {
        // Store candidate until remote description is set
        const pending = pendingCandidatesRef.current.get(fromUserId) || [];
        pending.push(candidateData.candidate);
        pendingCandidatesRef.current.set(fromUserId, pending);
      }
    } catch (err) {
      console.error(`Error adding ICE candidate from ${fromUserId}:`, err);
    }
  }, []);

  // Close peer connection
  const closePeerConnection = useCallback((peerId) => {
    console.log(`🔌 Closing connection to ${peerId}`);
    
    const peerConnection = peersRef.current.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      peersRef.current.delete(peerId);
      setPeers(new Map(peersRef.current));
    }

    // Remove audio element
    const audioElement = document.getElementById(`audio-${peerId}`);
    if (audioElement) {
      audioElement.remove();
    }

    pendingCandidatesRef.current.delete(peerId);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        
        // Update in database
        await studyRoomHelpers.updateAudioStatus(roomId, userId, audioTrack.enabled);
        
        console.log(`🎤 Audio ${audioTrack.enabled ? 'enabled' : 'muted'}`);
      }
    }
  }, [roomId, userId]);

  // Connect to new participant
  const connectToPeer = useCallback(async (peerId) => {
    if (peerId === userId) return; // Don't connect to self
    if (peersRef.current.has(peerId)) return; // Already connected
    
    console.log(`🤝 Initiating connection to ${peerId}`);
    await createOffer(peerId);
  }, [userId, createOffer]);

  // Subscribe to room signals
  useEffect(() => {
    if (!roomId || !userId) return;

    console.log('📡 Setting up signaling channel for room:', roomId);

    const channel = studyRoomHelpers.subscribeToRoom(roomId, {
      onParticipantChange: (payload) => {
        console.log('👥 Participant change:', payload);
        if (onParticipantUpdate) {
          onParticipantUpdate(payload);
        }
      },
      onSignal: async (payload) => {
        console.log('📨 Received signal:', payload);
        const signal = payload.new;
        
        if (signal.to_user_id !== userId) return; // Not for us
        
        const { from_user_id, signal_type, signal_data } = signal;
        
        switch (signal_type) {
          case 'offer':
            await handleOffer(from_user_id, signal_data);
            break;
          case 'answer':
            await handleAnswer(from_user_id, signal_data);
            break;
          case 'ice-candidate':
            await handleIceCandidate(from_user_id, signal_data);
            break;
          default:
            console.log('Unknown signal type:', signal_type);
        }
        
        // Mark signal as processed
        await studyRoomHelpers.markSignalProcessed(signal.id);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        studyRoomHelpers.unsubscribeFromRoom(channelRef.current);
      }
    };
  }, [roomId, userId, handleOffer, handleAnswer, handleIceCandidate, onParticipantUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Close all peer connections
      peersRef.current.forEach((_, peerId) => {
        closePeerConnection(peerId);
      });

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('🧹 Voice chat cleanup complete');
    };
  }, [closePeerConnection]);

  return {
    initializeAudio,
    toggleAudio,
    connectToPeer,
    closePeerConnection,
    audioEnabled,
    connecting,
    error,
    peers: Array.from(peers.keys())
  };
};
