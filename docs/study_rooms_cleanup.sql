-- Clean up existing tables and policies
-- Run this FIRST if you already ran the schema

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view active study rooms they're invited to" ON study_rooms;
DROP POLICY IF EXISTS "Users can view active study rooms" ON study_rooms;
DROP POLICY IF EXISTS "Users can view study rooms" ON study_rooms;
DROP POLICY IF EXISTS "Users can view active rooms by code" ON study_rooms;
DROP POLICY IF EXISTS "Users can create their own study rooms" ON study_rooms;
DROP POLICY IF EXISTS "Hosts can update their own study rooms" ON study_rooms;
DROP POLICY IF EXISTS "Hosts can delete their own study rooms" ON study_rooms;

DROP POLICY IF EXISTS "Users can view participants in rooms they're in" ON room_participants;
DROP POLICY IF EXISTS "Users can join rooms as participants" ON room_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON room_participants;

DROP POLICY IF EXISTS "Users can view signals sent to them" ON webrtc_signals;
DROP POLICY IF EXISTS "Users can send signals" ON webrtc_signals;
DROP POLICY IF EXISTS "Users can mark their signals as processed" ON webrtc_signals;

-- Drop tables (this will cascade delete all data)
DROP TABLE IF EXISTS webrtc_signals CASCADE;
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS study_rooms CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_room_code();
DROP FUNCTION IF EXISTS cleanup_expired_rooms();

-- Now you can run the study_rooms_schema.sql again
