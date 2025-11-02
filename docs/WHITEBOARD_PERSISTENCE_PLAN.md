# Whiteboard Persistence Implementation Plan

## Overview
Implement persistent, scrollable whiteboard with per-chat storage in Supabase.

## Features to Implement

### 1. Database Schema ✅
**Status**: SQL schema created in `docs/whiteboard_schema.sql`

Tables:
- `whiteboard_sessions` - Links user + chat_session_id
- `whiteboard_content` - Stores individual diagram/drawing blocks

Run this SQL in Supabase SQL Editor to create tables.

### 2. Whiteboard Service ✅  
**Status**: Service created in `src/services/whiteboardService.js`

Functions:
- `getOrCreateWhiteboardSession()` - Initialize session
- `loadWhiteboardContent()` - Load saved diagrams
- `saveWhiteboardContent()` - Save new diagram
- `updateWhiteboardContent()` - Update after manual edits
- `deleteWhiteboardContent()` - Delete diagram
- `clearWhiteboardSession()` - Clear all

### 3. Whiteboard Component Refactor ⏳
**Status**: IN PROGRESS - File needs major refactor

#### Key Changes Needed:

**A. State Management**
```javascript
// Add these new state variables:
const [contentBlocks, setContentBlocks] = useState([]); // Array of saved diagrams
const [canvasHeight, setCanvasHeight] = useState(2000); // Dynamic, grows as content adds
const [whiteboardSessionId, setWhiteboardSessionId] = useState(null);
const containerRef = useRef(null); // For scrolling

const { user } = useAuth(); // Need user ID for database
```

**B. Initialize Session on Mount**
```javascript
useEffect(() => {
  async function initWhiteboard() {
    if (!user?.id) return;
    
    const sessionId = chatSessionId || 'default';
    const { data: session } = await getOrCreateWhiteboardSession(user.id, sessionId);
    setWhiteboardSessionId(session.id);
    
    // Load existing content
    const { data: content } = await loadWhiteboardContent(session.id);
    if (content) {
      setContentBlocks(content);
      // Calculate total height
      const totalHeight = content.reduce((sum, block) => sum + block.height, 0);
      setCanvasHeight(Math.max(totalHeight + 400, 2000));
    }
  }
  
  initWhiteboard();
}, [user, chatSessionId]);
```

**C. Redraw Content on Load**
```javascript
useEffect(() => {
  if (contentBlocks.length === 0) return;
  
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  // Clear
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Redraw each block
  contentBlocks.forEach(block => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, block.position_y);
    };
    img.src = block.canvas_data;
  });
}, [contentBlocks]);
```

**D. Update handleAskQuestion to Append (Not Clear)**
```javascript
const handleAskQuestion = async (question) => {
  // ... analyze diagram ...
  
  // Calculate position BELOW existing content
  const lastBlock = contentBlocks[contentBlocks.length - 1];
  const positionY = lastBlock 
    ? lastBlock.position_y + lastBlock.height + 60  // 60px gap
    : 60;
  
  const blockHeight = 650;
  
  // Expand canvas if needed
  const requiredHeight = positionY + blockHeight + 400;
  if (requiredHeight > canvasHeight) {
    setCanvasHeight(requiredHeight);
  }
  
  // Draw at new position
  ctx.save();
  ctx.translate(0, positionY);
  drawDiagram(ctx, diagramType, elements, canvas.width, blockHeight);
  ctx.restore();
  
  // Capture this section only
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = blockHeight;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(canvas, 0, positionY, canvas.width, blockHeight, 0, 0, canvas.width, blockHeight);
  const canvasData = tempCanvas.toDataURL('image/png');
  
  // Save to database
  const { data } = await saveWhiteboardContent(whiteboardSessionId, {
    contentType: 'diagram',
    diagramType,
    question,
    aiResponse: `Diagram showing ${diagramType}`,
    canvasData,
    elements,
    positionY,
    height: blockHeight
  });
  
  // Add to state
  setContentBlocks(prev => [...prev, data]);
  
  // Scroll to it
  containerRef.current.scrollTop = positionY - 100;
};
```

**E. Auto-Save Manual Edits**
```javascript
const stopDrawing = () => {
  if (isDrawing && whiteboardSessionId) {
    setIsDrawing(false);
    // Save after 2 seconds of inactivity
    setTimeout(async () => {
      const canvas = canvasRef.current;
      const canvasData = canvas.toDataURL('image/png');
      
      // Update the most recent content block
      const lastBlock = contentBlocks[contentBlocks.length - 1];
      if (lastBlock) {
        await updateWhiteboardContent(lastBlock.id, { canvasData });
      }
    }, 2000);
  } else {
    setIsDrawing(false);
  }
};
```

**F. Add Content Cards UI**

Instead of just canvas, render content blocks with text:

```javascript
return (
  <div className="h-full w-full flex flex-col">
    {/* Toolbar */}
    
    {/* Scrollable Content Area */}
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50">
      <canvas 
        ref={canvasRef}
        className="w-full"
        style={{ height: `${canvasHeight}px` }}
      />
      
      {/* Overlay content cards */}
      {contentBlocks.map((block, index) => (
        <div 
          key={block.id}
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${block.position_y + block.height + 10}px` }}
        >
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 pointer-events-auto">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📊</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {block.question}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {block.ai_response}
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                    {block.diagram_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(block.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteContent(block.id)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Input Area at Bottom */}
  </div>
);
```

### 4. Update UI.jsx to Pass chatSessionId

```javascript
// In UI.jsx where Whiteboard is rendered:
<Whiteboard 
  onClose={() => setShowWhiteboard(false)}
  chatSessionId={currentChatId} // Pass current chat ID
/>
```

### 5. Testing Checklist

- [ ] Run SQL schema in Supabase
- [ ] Test session creation for new user
- [ ] Test loading existing whiteboard
- [ ] Ask multiple questions - verify they stack vertically
- [ ] Draw manually - verify auto-save after 2 seconds
- [ ] Refresh page - verify content persists
- [ ] Switch between chats - verify different whiteboards
- [ ] Delete a diagram - verify it's removed
- [ ] Test scrolling through long whiteboard

## Benefits

1. ✅ **Persistent** - Content survives page refresh
2. ✅ **Scrollable** - Like Google Docs, unlimited length
3. ✅ **Per-Chat** - Each conversation has its own whiteboard
4. ✅ **Manual Edits Saved** - Drawing on top of diagrams is saved
5. ✅ **Text + Diagram** - Each diagram has explanation card
6. ✅ **User-Scoped** - RLS ensures users only see their own content

## File Changes Summary

**New Files:**
- `docs/whiteboard_schema.sql` ✅
- `src/services/whiteboardService.js` ✅

**Modified Files:**
- `src/components/Whiteboard.jsx` - Major refactor needed
- `src/components/UI.jsx` - Pass chatSessionId prop

**Database:**
- Run `whiteboard_schema.sql` in Supabase SQL Editor

## Next Steps

1. **Restore Whiteboard.jsx** from backup if needed
2. **Implement changes gradually**:
   - First: Add session initialization
   - Second: Add content loading
   - Third: Update handleAskQuestion to append
   - Fourth: Add content cards UI
   - Fifth: Implement auto-save
3. **Test each step** before moving to next
4. **Run SQL schema** in Supabase when ready to test

## Notes

The current Whiteboard.jsx got corrupted during refactoring. A backup was created at `Whiteboard.jsx.backup`. 

**Recommended approach**: Start fresh with the backup, then add features one at a time, testing after each addition.
