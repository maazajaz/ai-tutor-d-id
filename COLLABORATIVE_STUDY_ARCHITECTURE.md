# 👥 Collaborative Study System - Architecture

## 🎯 **Feature Overview**

Enable **2 or more students** to study together in real-time with:
- ✅ Shared AI tutor session
- ✅ Real-time voice communication
- ✅ Synchronized chat history
- ✅ Shared notes and whiteboard
- ✅ Presence indicators (who's online)

---

## 🏗️ **Architecture Design**

### **Option 1: WebRTC P2P (Recommended)**
**Pros:**
- Low latency voice chat
- No server costs for video/audio
- High quality peer-to-peer
- Better privacy

**Cons:**
- Complex NAT traversal
- Needs STUN/TURN servers
- Limited to ~10 students max

### **Option 2: WebSocket + Media Server**
**Pros:**
- Scales to more students
- Easier NAT handling
- Better for large groups

**Cons:**
- Higher server costs
- More latency
- Need media server infrastructure

### **Recommendation: Hybrid Approach**
- Use **WebRTC** for voice/video (P2P)
- Use **WebSockets** (Supabase Realtime) for chat sync
- Use **Supabase** for shared state

---

## 📊 **Data Flow Architecture**

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Student 1  │◄────────┤  Supabase   ├────────►│  Student 2  │
│   Browser   │         │  Realtime   │         │   Browser   │
└──────┬──────┘         └─────────────┘         └──────┬──────┘
       │                                                 │
       │            WebRTC P2P Connection               │
       └────────────────────────────────────────────────┘
                    (Voice/Video Direct)
```

### Components:
1. **Supabase Realtime** - Chat sync, presence, shared state
2. **WebRTC** - P2P voice/video communication
3. **STUN/TURN Servers** - NAT traversal (free: Google STUN)

---

## 🗄️ **Database Schema**

### New Tables:

#### 1. `study_rooms`
```sql
CREATE TABLE study_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(8) UNIQUE NOT NULL,  -- e.g., "ABC-1234"
  host_user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255),
  max_participants INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_room_code ON study_rooms(room_code);
CREATE INDEX idx_host_user ON study_rooms(host_user_id);
```

#### 2. `room_participants`
```sql
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(20) DEFAULT 'student',  -- 'host', 'student'
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_participants ON room_participants(room_id);
```

#### 3. `shared_messages`
```sql
CREATE TABLE shared_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',  -- 'text', 'youtube', 'ai_response'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_room_messages ON shared_messages(room_id, created_at);
```

#### 4. `room_presence`
```sql
CREATE TABLE room_presence (
  user_id UUID REFERENCES auth.users(id),
  room_id UUID REFERENCES study_rooms(id),
  status VARCHAR(20) DEFAULT 'online',  -- 'online', 'away', 'offline'
  last_seen TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, room_id)
);
```

---

## 🔧 **Implementation Plan**

### **Phase 1: Room System (Week 1)**
- [ ] Create database tables
- [ ] Build room creation UI
- [ ] Generate unique room codes
- [ ] Implement invite link system
- [ ] Add room joining logic

### **Phase 2: Supabase Realtime (Week 2)**
- [ ] Set up Supabase Realtime channels
- [ ] Implement presence tracking
- [ ] Sync chat messages in real-time
- [ ] Sync AI responses to all participants
- [ ] Handle user join/leave events

### **Phase 3: WebRTC Voice (Week 3)**
- [ ] Set up WebRTC peer connections
- [ ] Implement ICE candidate exchange
- [ ] Add microphone controls
- [ ] Implement mute/unmute
- [ ] Add push-to-talk option
- [ ] Handle network reconnection

### **Phase 4: UI/UX (Week 4)**
- [ ] Add participant list sidebar
- [ ] Show online status indicators
- [ ] Add "talking" indicators
- [ ] Implement shared notes
- [ ] Add room settings panel

---

## 💻 **Code Structure**

### New Files to Create:

```
src/
├── contexts/
│   └── StudyRoomContext.jsx       # Room state management
├── hooks/
│   ├── useStudyRoom.jsx            # Room operations
│   ├── useWebRTC.jsx               # Voice chat logic
│   └── useRealtimeSync.jsx         # Supabase realtime
├── components/
│   ├── StudyRoom/
│   │   ├── RoomLobby.jsx           # Join/Create room
│   │   ├── RoomView.jsx            # Main room interface
│   │   ├── ParticipantList.jsx    # List of students
│   │   ├── VoiceControls.jsx      # Mic controls
│   │   └── InviteModal.jsx        # Share room link
├── lib/
│   ├── webrtc.js                   # WebRTC utilities
│   └── studyRoom.js                # Room API calls
```

---

## 🎨 **UI/UX Design**

### Room Lobby (Before Joining):
```
┌────────────────────────────────────┐
│  🎓 Collaborative Study Session    │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Create New Study Room         │ │
│  │ [Enter Room Name]             │ │
│  │ [Create Room] 🎯              │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Join Existing Room            │ │
│  │ [Enter Room Code: XXX-XXXX]   │ │
│  │ [Join Room] 🚪                │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

### Room View (After Joining):
```
┌──────────────────────────────────────────────────────┐
│  Room: Math Study Group  |  Code: ABC-1234  | [⚙️]   │
├──────────────────────────────────────────────────────┤
│ 👥 Participants (3/10)                    🎤 [Mic ON]│
│ ┌────────────────┐                                   │
│ │ 👤 You (Host)  │  ┌─────────────────────────────┐ │
│ │ 🟢 Online      │  │                             │ │
│ │ 🎤 Speaking    │  │  AI Avatar                  │ │
│ ├────────────────┤  │     (Teaching)              │ │
│ │ 👤 Sarah       │  │                             │ │
│ │ 🟢 Online      │  └─────────────────────────────┘ │
│ │ 🎤 Muted       │                                   │
│ ├────────────────┤  ┌─────────────────────────────┐ │
│ │ 👤 Mike        │  │ Chat History (Synced)       │ │
│ │ 🟡 Away        │  │ You: Explain calculus       │ │
│ │ 🔇 Offline     │  │ AI: Calculus is...          │ │
│ └────────────────┘  │ Sarah: Can you repeat?      │ │
│                     │ AI: Sure! Let me...         │ │
│ [Share Invite Link] └─────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 **Security Considerations**

1. **Room Access Control**
   - Only host can remove participants
   - Room codes expire after 24 hours of inactivity
   - Optional password protection

2. **Voice Privacy**
   - P2P encryption (WebRTC built-in)
   - Optional recording with consent
   - Mute by default on join

3. **Data Privacy**
   - Shared messages stored per room
   - Auto-delete after 30 days
   - Host can delete entire room history

---

## 🌐 **WebRTC Implementation**

### Simple WebRTC Flow:

```javascript
// 1. Create peer connection
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }  // Free Google STUN
  ]
});

// 2. Get local audio stream
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: true, 
  video: false 
});

// 3. Add to peer connection
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});

// 4. Exchange SDP via Supabase
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    // Send to other peer via Supabase Realtime
    supabase.channel('room-123').send({
      type: 'ice-candidate',
      candidate: event.candidate
    });
  }
};

// 5. Receive remote audio
peerConnection.ontrack = (event) => {
  const audioElement = document.getElementById('remote-audio');
  audioElement.srcObject = event.streams[0];
};
```

---

## 📦 **Required Dependencies**

```json
{
  "simple-peer": "^9.11.1",  // Easier WebRTC wrapper
  "socket.io-client": "^4.5.0",  // Fallback for signaling (optional)
  "@supabase/realtime-js": "^2.0.0"  // Already installed
}
```

---

## 🚀 **MVP Features (Minimum Viable Product)**

### Must Have:
- ✅ Create/join study rooms
- ✅ Real-time chat sync
- ✅ Voice communication
- ✅ Presence indicators
- ✅ Mute/unmute controls

### Nice to Have:
- 📋 Screen sharing
- 📋 Whiteboard collaboration
- 📋 File sharing
- 📋 Recording sessions
- 📋 Breakout rooms

---

## 📈 **Scalability Considerations**

### Current Plan (Phase 1):
- Max 10 students per room
- P2P voice (mesh topology)
- Supabase for sync

### Future Scale (Phase 2):
- 50+ students per room
- SFU (Selective Forwarding Unit) server
- Dedicated signaling server
- Load balancing

---

## 💰 **Cost Estimation**

### Free Tier (MVP):
- Supabase: Free (up to 500MB DB)
- STUN Server: Free (Google)
- WebRTC: Free (P2P)
- **Total: $0/month**

### Scaled (100+ rooms):
- Supabase: ~$25/month
- TURN Server: ~$50/month (coturn self-hosted)
- **Total: ~$75/month**

---

## 🎯 **Success Metrics**

1. **Connection Success Rate**: >95%
2. **Voice Latency**: <300ms
3. **Message Sync Time**: <100ms
4. **Concurrent Rooms**: 50+
5. **User Satisfaction**: 4.5+/5

---

*Ready to implement! Let me know when to start Phase 1.*
