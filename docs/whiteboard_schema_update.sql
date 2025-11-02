-- Add canvas_width column to whiteboard_content table for responsive scaling
-- This allows diagrams created on different screen sizes to scale properly

ALTER TABLE whiteboard_content 
ADD COLUMN IF NOT EXISTS canvas_width INTEGER DEFAULT 1200;

-- Update existing records to have a default canvas width
UPDATE whiteboard_content 
SET canvas_width = 1200 
WHERE canvas_width IS NULL;

-- Add comment
COMMENT ON COLUMN whiteboard_content.canvas_width IS 'Original canvas width when diagram was created, used for responsive scaling';
