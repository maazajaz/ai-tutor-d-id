-- Whiteboard Storage Schema
-- This stores whiteboard content per chat session, including diagrams and manual drawings

-- Create whiteboard_sessions table
CREATE TABLE IF NOT EXISTS whiteboard_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chat_session_id)
);

-- Create whiteboard_content table (stores individual diagram/drawing entries)
CREATE TABLE IF NOT EXISTS whiteboard_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whiteboard_session_id UUID REFERENCES whiteboard_sessions(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'diagram' or 'drawing' or 'text'
  diagram_type TEXT, -- 'flowchart', 'mindmap', 'graph', etc.
  question TEXT, -- Original question that generated the diagram
  ai_response TEXT, -- AI's text explanation
  canvas_data TEXT, -- Base64 encoded canvas image data
  elements JSONB, -- Diagram elements (nodes, connections, etc.)
  position_y INTEGER, -- Y position in scrollable canvas
  height INTEGER, -- Height of this content block
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_user ON whiteboard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_chat ON whiteboard_sessions(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_content_session ON whiteboard_content(whiteboard_session_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_content_created ON whiteboard_content(created_at);

-- Enable Row Level Security
ALTER TABLE whiteboard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whiteboard_sessions
CREATE POLICY "Users can view their own whiteboard sessions"
  ON whiteboard_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own whiteboard sessions"
  ON whiteboard_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whiteboard sessions"
  ON whiteboard_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whiteboard sessions"
  ON whiteboard_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for whiteboard_content
CREATE POLICY "Users can view their own whiteboard content"
  ON whiteboard_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM whiteboard_sessions
      WHERE whiteboard_sessions.id = whiteboard_content.whiteboard_session_id
      AND whiteboard_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own whiteboard content"
  ON whiteboard_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM whiteboard_sessions
      WHERE whiteboard_sessions.id = whiteboard_content.whiteboard_session_id
      AND whiteboard_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own whiteboard content"
  ON whiteboard_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM whiteboard_sessions
      WHERE whiteboard_sessions.id = whiteboard_content.whiteboard_session_id
      AND whiteboard_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own whiteboard content"
  ON whiteboard_content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM whiteboard_sessions
      WHERE whiteboard_sessions.id = whiteboard_content.whiteboard_session_id
      AND whiteboard_sessions.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_whiteboard_sessions_updated_at
  BEFORE UPDATE ON whiteboard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whiteboard_content_updated_at
  BEFORE UPDATE ON whiteboard_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
