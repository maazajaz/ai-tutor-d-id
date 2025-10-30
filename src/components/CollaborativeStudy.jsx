import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { studyRoomHelpers } from '../lib/supabase';
import { useVoiceChat } from '../hooks/useVoiceChat';

export const CollaborativeStudy = ({ onClose, onRoomCreated }) => {
  const { user, profile } = useAuth();
  const { startNewChat, currentChatId } = useChat();
  const [step, setStep] = useState('create'); // 'create', 'room', 'join'
  const [roomData, setRoomData] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    initializeAudio,
    toggleAudio,
    connectToPeer,
    audioEnabled,
    connecting,
    error: voiceError,
    peers
  } = useVoiceChat(
    roomData?.id,
    user?.id,
    handleParticipantUpdate
  );

  // Handle participant updates
  function handleParticipantUpdate(payload) {
    console.log('Participant update:', payload);
    loadParticipants();
  }

  // Load participants
  const loadParticipants = useCallback(async () => {
    if (!roomData?.id) return;
    
    const { data, error } = await studyRoomHelpers.getActiveParticipants(roomData.id);
    if (!error && data) {
      setParticipants(data);
      
      // Connect to all other participants
      data.forEach(participant => {
        if (participant.user_id !== user?.id) {
          connectToPeer(participant.user_id);
        }
      });
    }
  }, [roomData?.id, user?.id, connectToPeer]);

  // Create new study room
  const createRoom = async () => {
    if (!user) {
      setError('You must be logged in to create a study room');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a new chat session for this study room
      let chatId = currentChatId;
      if (!chatId) {
        await startNewChat();
        chatId = currentChatId;
      }

      const { data, error: roomError } = await studyRoomHelpers.createStudyRoom(user.id, {
        title: 'Collaborative Study Session',
        chatSessionId: chatId,
        displayName: profile?.display_name || user.email?.split('@')[0] || 'User',
        maxParticipants: 10
      });

      if (roomError) throw roomError;

      setRoomData(data);
      setStep('room');
      
      // Initialize audio
      await initializeAudio();
      
      // Load initial participants
      await loadParticipants();
      
      if (onRoomCreated) {
        onRoomCreated(data);
      }

      console.log('✅ Study room created:', data);
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create study room');
    } finally {
      setLoading(false);
    }
  };

  // Join existing room
  const joinRoom = async () => {
    if (!user) {
      setError('You must be logged in to join a study room');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: roomError } = await studyRoomHelpers.getRoomByCode(roomCode.toUpperCase());
      
      if (roomError || !data) {
        throw new Error('Room not found. Please check the code and try again.');
      }

      // Join the room
      await studyRoomHelpers.joinRoom(
        data.id,
        user.id,
        profile?.display_name || user.email?.split('@')[0] || 'User'
      );

      setRoomData(data);
      setStep('room');
      
      // Initialize audio
      await initializeAudio();
      
      // Load participants
      await loadParticipants();

      console.log('✅ Joined room:', data);
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join study room');
    } finally {
      setLoading(false);
    }
  };

  // Share room link
  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}/study/${roomData.room_code}`;
    const shareText = `Join my collaborative study session! Room Code: ${roomData.room_code}`;

    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Collaborative Study Session',
          text: shareText,
          url: shareUrl
        });
        console.log('✅ Shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          // Fallback to copy
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback: copy to clipboard
      copyToClipboard(shareUrl);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      setError('Failed to copy link');
    });
  };

  // Leave room
  const leaveRoom = async () => {
    if (roomData && user) {
      await studyRoomHelpers.leaveRoom(roomData.id, user.id);
    }
    if (onClose) {
      onClose();
    }
  };

  // Load participants when room changes
  useEffect(() => {
    if (roomData?.id) {
      loadParticipants();
      
      // Poll for participants every 5 seconds
      const interval = setInterval(loadParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [roomData?.id, loadParticipants]);

  // Render create/join selection
  if (step === 'create') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Collaborative Study
            </h2>
            <p className="text-gray-600">
              Study together with voice chat and shared learning
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-4 px-6 font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Room...
                </>
              ) : (
                <>
                  <span className="text-2xl">🚀</span>
                  Create New Study Room
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code (e.g., ABC123)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors mb-3"
                maxLength={6}
              />
              <button
                onClick={joinRoom}
                disabled={loading || !roomCode.trim()}
                className="w-full bg-white border-2 border-purple-500 text-purple-500 rounded-xl py-4 px-6 font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🔗</span>
                    Join Study Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render active room
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Study Room</h2>
              <p className="text-white/90 text-sm">Room Code: {roomData?.room_code}</p>
            </div>
            <button
              onClick={leaveRoom}
              className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors"
            >
              Leave Room
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={shareRoom}
            className="w-full bg-white/20 hover:bg-white/30 rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? 'Link Copied!' : 'Share Room Link'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Voice Chat Controls */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              Voice Chat
            </h3>
            
            {voiceError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{voiceError}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleAudio}
                disabled={connecting}
                className={`${
                  audioEnabled
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } text-white rounded-full p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {connecting ? (
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : audioEnabled ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              {connecting ? 'Connecting...' : audioEnabled ? 'Microphone Active' : 'Microphone Muted'}
            </p>
          </div>

          {/* Participants */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Participants ({participants.length})
            </h3>
            
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      participant.is_online ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <span className="text-white text-xl">
                        {participant.display_name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {participant.display_name}
                        {participant.is_host && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                            Host
                          </span>
                        )}
                        {participant.user_id === user?.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {participant.audio_enabled ? (
                      <div className="text-green-500" title="Microphone on">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="text-red-500" title="Microphone off">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      </div>
                    )}
                    {peers.includes(participant.user_id) && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {participants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">👻</p>
                <p>No participants yet. Share the room code!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
