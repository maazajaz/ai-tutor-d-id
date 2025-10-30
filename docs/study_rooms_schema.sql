-- Study Rooms Table
CREATE TABLE IF NOT EXISTS study_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(10) UNIQUE NOT NULL, -- Short shareable code like "ABC123"
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Collaborative Study Session',
  chat_session_id VARCHAR(255), -- Match chat_sessions.id type (VARCHAR, not UUID)
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  settings JSONB DEFAULT '{"voiceEnabled": true, "allowChat": true, "maxDuration": 7200}'::jsonb
);

-- Room Participants Table
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT true,
  peer_id TEXT, -- WebRTC peer ID
  audio_enabled BOOLEAN DEFAULT true,
  is_host BOOLEAN DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- WebRTC Signaling Table (for peer discovery)
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_rooms_room_code ON study_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_study_rooms_host ON study_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_active ON study_rooms(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_online ON room_participants(room_id, is_online);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_room ON webrtc_signals(room_id, processed);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_user ON webrtc_signals(to_user_id, processed);

-- Row Level Security (RLS) Policies
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Study Rooms Policies
-- Allow users to view rooms they host or any active room (for joining)
CREATE POLICY "Users can view study rooms"
  ON study_rooms FOR SELECT
  USING (
    is_active = true AND host_user_id = auth.uid()
  );

-- Allow viewing room by code when joining (separate policy for public access)
CREATE POLICY "Users can view active rooms by code"
  ON study_rooms FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create their own study rooms"
  ON study_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their own study rooms"
  ON study_rooms FOR UPDATE
  USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can delete their own study rooms"
  ON study_rooms FOR DELETE
  USING (auth.uid() = host_user_id);

-- Room Participants Policies
CREATE POLICY "Users can view participants in rooms they're in"
  ON room_participants FOR SELECT
  USING (
    -- Allow viewing if user is the participant themselves
    auth.uid() = user_id
    OR
    -- Or if user is the host of the room
    EXISTS (
      SELECT 1 FROM study_rooms 
      WHERE id = room_id AND host_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms as participants"
  ON room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record"
  ON room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- WebRTC Signals Policies
CREATE POLICY "Users can view signals sent to them"
  ON webrtc_signals FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can send signals"
  ON webrtc_signals FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can mark their signals as processed"
  ON webrtc_signals FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  UPDATE study_rooms 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Mark participants as offline in expired rooms
  UPDATE room_participants 
  SET is_online = false, left_at = NOW()
  WHERE room_id IN (
    SELECT id FROM study_rooms WHERE is_active = false
  ) AND is_online = true;
END;
$$ LANGUAGE plpgsql;

-- Note: Realtime subscriptions will work via Supabase Realtime channels
-- No need to configure publications when Replication is not available
-- The app uses supabase.channel() which works without explicit publication setup

-- Comments for documentation
COMMENT ON TABLE study_rooms IS 'Stores collaborative study room sessions with voice chat';
COMMENT ON TABLE room_participants IS 'Tracks users participating in study rooms';
COMMENT ON TABLE webrtc_signals IS 'Handles WebRTC signaling for P2P voice connections';
COMMENT ON COLUMN study_rooms.room_code IS 'Short shareable code like ABC123 for easy sharing';
COMMENT ON COLUMN study_rooms.settings IS 'JSON settings for room configuration';
