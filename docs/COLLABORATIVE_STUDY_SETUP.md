# Collaborative Study Feature - Setup Guide

## 🎯 Overview
The collaborative study feature allows multiple students to join a shared study room with real-time voice chat, similar to Google Meet, but integrated directly into the AI tutoring experience.

## 📋 Setup Steps

### 1. Database Setup
Run the SQL schema to create the necessary tables in your Supabase database:

```bash
# Navigate to Supabase SQL Editor and run:
docs/study_rooms_schema.sql
```

This creates:
- `study_rooms` - Stores study room sessions
- `room_participants` - Tracks participants in rooms
- `webrtc_signals` - Handles WebRTC signaling for voice chat

### 2. Enable Realtime in Supabase

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for these tables:
   - `study_rooms`
   - `room_participants`
   - `webrtc_signals`

3. Verify in Supabase Dashboard → Realtime settings

### 3. Test the Feature

#### Creating a Study Room:
1. Login to the dashboard
2. Click "Collaborate & Study Together" card
3. Click "Create New Study Room"
4. Grant microphone permissions when prompted
5. You'll see a 6-character room code (e.g., "ABC123")
6. Click "Share Room Link" to share via native share dialog

#### Joining a Study Room:
1. Another user opens the shared link OR enters the room code
2. They login/signup
3. Grant microphone permissions
4. They'll join the room and voice chat will connect automatically

#### During the Session:
- See all participants in real-time
- Toggle microphone on/off
- See who's speaking (audio enabled indicator)
- Leave room anytime

## 🔧 Technical Architecture

### Frontend Components:
- **CollaborativeStudy.jsx** - Main UI component
- **useVoiceChat.jsx** - WebRTC voice chat hook
- **studyRoomHelpers** - Supabase database operations

### WebRTC Flow:
```
User A creates room
  ↓
User B joins via link/code
  ↓
Supabase Realtime signals connection
  ↓
WebRTC P2P connection established
  ↓
Direct audio streaming (no server relay)
```

### Voice Chat Technology:
- **WebRTC** - Peer-to-peer voice communication
- **STUN Servers** - Google's free STUN servers for NAT traversal
- **Supabase Realtime** - Signaling for peer discovery
- **ICE Candidates** - Connection negotiation

## 🎨 Features

### ✅ Implemented:
- Create study rooms with unique codes
- Join rooms via code or shareable link
- Native Web Share API integration
- Real-time participant tracking
- WebRTC voice chat (P2P)
- Microphone toggle
- Room expiration (24 hours)
- Host controls (end room)
- Automatic reconnection

### 🔄 To Be Added:
- Screen sharing
- Chat messages in room
- Whiteboard collaboration
- Recording sessions
- Room templates
- Scheduled study sessions

## 📱 Browser Compatibility

### Fully Supported:
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

### Requirements:
- HTTPS (required for microphone access)
- Microphone permission
- Modern browser with WebRTC support

## 🐛 Troubleshooting

### Microphone not working:
1. Check browser permissions (Settings → Privacy → Microphone)
2. Ensure HTTPS is enabled (localhost or deployed site)
3. Try different browser

### Can't connect to peer:
1. Check internet connection
2. Firewall may be blocking WebRTC
3. Try disabling VPN temporarily

### Room code not found:
1. Verify room hasn't expired (24 hours)
2. Check code is entered correctly (6 characters)
3. Ensure room creator is still logged in

## 🔐 Security

### Implemented:
- Row Level Security (RLS) on all tables
- Only participants can view room data
- Hosts can control room settings
- Encrypted WebRTC connections
- Auto-expiring rooms (24 hours)

### Best Practices:
- Never share room codes publicly
- End rooms when finished
- Use strong passwords for user accounts

## 🚀 Performance Optimization

### Current Optimizations:
- P2P connections (no server bottleneck)
- Efficient Supabase queries with indexes
- Real-time subscriptions with filters
- ICE candidate batching

### Recommended:
- Max 10 participants per room (configurable)
- Use headphones to prevent echo
- Stable internet connection (3+ Mbps)

## 📊 Monitoring

Check these metrics in Supabase Dashboard:
- Active rooms count
- Average participants per room
- Room creation/join rate
- Signal processing latency

## 🎓 Usage Example

```javascript
// User A creates room
const room = await studyRoomHelpers.createStudyRoom(userId, {
  title: 'Math Study Session',
  maxParticipants: 5
});

// Share link
const shareUrl = `${window.location.origin}/study/${room.room_code}`;
navigator.share({ url: shareUrl });

// User B joins
await studyRoomHelpers.joinRoom(room.id, userId, 'StudentName');

// Start voice chat
await initializeAudio();
await connectToPeer(otherUserId);

// Toggle mic
await toggleAudio();

// Leave room
await leaveRoom();
```

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase tables are created
3. Test with 2 users in different browsers
4. Check microphone permissions

## 🎉 Success!

Your collaborative study feature is now ready! Users can:
- ✅ Create study rooms with voice chat
- ✅ Share links via native share dialog
- ✅ Join with simple 6-character codes
- ✅ Talk with multiple participants
- ✅ Study together in real-time

Enjoy collaborative learning! 🚀
