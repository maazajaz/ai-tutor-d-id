import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { 
  getOrCreateWhiteboardSession, 
  loadWhiteboardContent, 
  saveWhiteboardContent,
  updateWhiteboardContent,
  deleteWhiteboardContent
} from '../services/whiteboardService';

export const Whiteboard = ({ onClose, chatSessionId = 'default', onAskQuestion, externalChatHistory = [] }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPaintModeEnabled, setIsPaintModeEnabled] = useState(false); // OFF by default for mobile scrolling
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [showToolbar, setShowToolbar] = useState(true);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // Content state - NOW ENABLED
  const [contentBlocks, setContentBlocks] = useState([]);
  const [currentContentId, setCurrentContentId] = useState(null);
  const [canvasHeight, setCanvasHeight] = useState(2000);
  
  // Input state
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Session state
  const [whiteboardSessionId, setWhiteboardSessionId] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnimatingFastDrawing, setIsAnimatingFastDrawing] = useState(false);
  
  const { chatHistory, chat, loading } = useChat();
  const { user } = useAuth();

  // Ensure we always have a canvas available (offscreen if UI canvas is hidden)
  const ensureBaseCanvas = () => {
    if (!canvasRef.current) {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 800;
      offscreenCanvas.height = Math.max(canvasHeight, 600);
      const offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenCtx.fillStyle = '#ffffff';
      offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      canvasRef.current = offscreenCanvas;
    }
    return canvasRef.current;
  };

  // Initialize whiteboard session and load content
  useEffect(() => {
    async function initWhiteboard() {
      console.log('🎯 Initializing whiteboard for chatSessionId:', chatSessionId);
      
      if (!user?.id) {
        console.log('⚠️ No user found, skipping initialization');
        setIsLoadingSession(false);
        return;
      }
      
      setIsLoadingSession(true);
      try {
        // Get or create session
        const { data: session, error } = await getOrCreateWhiteboardSession(user.id, chatSessionId);
        
        if (error) {
          console.error('❌ Error initializing whiteboard:', error);
          setIsLoadingSession(false);
          return;
        }
        
        console.log('✅ Whiteboard session:', session.id);
        setWhiteboardSessionId(session.id);
        
        // Load existing content
        const { data: content, error: loadError } = await loadWhiteboardContent(session.id);
        
        if (loadError) {
          console.error('❌ Error loading content:', loadError);
        } else if (content && content.length > 0) {
          console.log('📦 Loaded', content.length, 'content blocks:', content);
          setContentBlocks(content);
          // Calculate total height needed
          const totalHeight = content.reduce((sum, block) => sum + (block.height || 600), 0);
          setCanvasHeight(Math.max(totalHeight + 600, 2000));
          console.log('📏 Canvas height set to:', Math.max(totalHeight + 600, 2000));
        } else {
          console.log('📭 No existing content found for this session');
        }
      } catch (error) {
        console.error('❌ Error in initWhiteboard:', error);
      } finally {
        setIsLoadingSession(false);
      }
    }
    
    initWhiteboard();
  }, [user, chatSessionId]);

  // Initialize canvas with fixed size
  useEffect(() => {
    const canvas = ensureBaseCanvas();
    const ctx = canvas.getContext('2d');
    
    // Canvas is already 800x600 from JSX width/height attributes
    // Just set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);
    
    // Redraw all content blocks
    if (contentBlocks.length > 0) {
      console.log('🎨 Redrawing', contentBlocks.length, 'blocks on canvas');
      
      contentBlocks.forEach((block, index) => {
        if (block.canvas_data) {
          const img = new Image();
          
          img.onload = () => {
            try {
              const posY = block.position_y || 0;
              const height = block.height || 600;
              
              // Draw at saved position
              ctx.drawImage(img, 0, posY, 800, height);
              
              console.log(`✅ Drew block ${index + 1} at position ${posY}`);
            } catch (err) {
              console.error(`Error drawing block ${index}:`, err);
            }
          };
          
          img.onerror = () => {
            console.error(`Failed to load image for block ${index}`);
          };
          
          img.src = block.canvas_data;
        }
      });
    }
  }, [contentBlocks]);

  // Render each block on its own canvas
  useEffect(() => {
    contentBlocks.forEach((block) => {
      const canvas = document.getElementById(`canvas-${block.id}`);
      if (!canvas || !block.canvas_data) return;
      
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the saved image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log(`✅ Rendered block ${block.id} on its own canvas`);
      };
      
      img.onerror = () => {
        console.error(`Failed to load image for block ${block.id}`);
      };
      
      img.src = block.canvas_data;
    });
  }, [contentBlocks]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
        // Auto-submit after voice input
        setTimeout(() => handleAskQuestion(transcript), 100);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Warn user before closing browser/tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Get canvas coordinates
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Start drawing
  const startDrawing = (e) => {
    if (!isPaintModeEnabled) return; // Only draw if paint mode is enabled
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    setIsDrawing(true);
    setLastPosition(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  // Draw
  const draw = (e) => {
    if (!isPaintModeEnabled || !isDrawing) return; // Only draw if paint mode is enabled
    e.preventDefault();

    const pos = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPosition(pos);
  };

  // Stop drawing and mark as unsaved
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setHasUnsavedChanges(true); // Mark as unsaved when user draws
    } else {
      setIsDrawing(false);
    }
  };

  // Manual save function
  const handleSaveDrawing = async () => {
    if (!whiteboardSessionId) {
      alert('Session not initialized. Please try again.');
      return;
    }

    setIsSaving(true);

    try {
      const canvas = ensureBaseCanvas();
      const canvasData = canvas.toDataURL('image/png');

      // If there's an existing content block (from AI diagram), update it
      if (currentContentId) {
        const { error } = await updateWhiteboardContent(currentContentId, { 
          canvasData,
          canvasWidth: canvas.width  // Save canvas width for scaling
        });
        if (error) throw error;
      } else {
        // Otherwise, create a new manual drawing content block (without description)
        const newContent = {
          contentType: 'manual_drawing',
          diagramType: 'manual',
          question: '',  // Empty to hide description box
          aiResponse: '',  // Empty to hide description box
          canvasData: canvasData,
          elements: [],
          positionY: 0,
          height: canvasHeight,
          canvasWidth: canvas.width  // Save canvas width for scaling
        };

        const { data, error } = await saveWhiteboardContent(whiteboardSessionId, newContent);
        if (error) throw error;
        
        if (data) {
          setCurrentContentId(data.id);
          setContentBlocks([data]);
        }
      }

      setHasUnsavedChanges(false);
      alert('✅ Drawing saved successfully!');
      console.log('✅ Drawing saved to database');
    } catch (error) {
      console.error('Error saving drawing:', error);
      alert('❌ Failed to save drawing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // 🎨 Parse compact format drawing data
  const parseCompactFormat = (compactStr) => {
    const lines = compactStr.trim().split('\n');
    const elements = [];
    
    for (const line of lines) {
      if (!line.trim() || line.startsWith('//')) continue;
      
      const [type, ...params] = line.split(':');
      if (params.length === 0) continue;
      
      const values = params[0].split(',');
      
      switch (type.trim()) {
        case 'circ':
        case 'circle':
          elements.push({
            type: 'circle',
            x: parseFloat(values[0]),
            y: parseFloat(values[1]),
            radius: parseFloat(values[2]),
            color: values[3]?.trim() || '#000',
            fill: values[4]?.trim() || 'none'
          });
          break;
        
        case 'ell':
        case 'ellipse':
          elements.push({
            type: 'ellipse',
            x: parseFloat(values[0]),
            y: parseFloat(values[1]),
            width: parseFloat(values[2]),
            height: parseFloat(values[3]),
            color: values[4]?.trim() || '#000',
            fill: values[5]?.trim() || 'none'
          });
          break;
        
        case 'rect':
          elements.push({
            type: 'rect',
            x: parseFloat(values[0]),
            y: parseFloat(values[1]),
            width: parseFloat(values[2]),
            height: parseFloat(values[3]),
            color: values[4]?.trim() || '#000',
            fill: values[5]?.trim() || 'none'
          });
          break;
        
        case 'tri':
        case 'triangle':
          elements.push({
            type: 'triangle',
            x1: parseFloat(values[0]),
            y1: parseFloat(values[1]),
            x2: parseFloat(values[2]),
            y2: parseFloat(values[3]),
            x3: parseFloat(values[4]),
            y3: parseFloat(values[5]),
            color: values[6]?.trim() || '#000',
            fill: values[7]?.trim() || 'none'
          });
          break;
        
        case 'line':
          elements.push({
            type: 'line',
            x1: parseFloat(values[0]),
            y1: parseFloat(values[1]),
            x2: parseFloat(values[2]),
            y2: parseFloat(values[3]),
            color: values[4]?.trim() || '#000'
          });
          break;
        
        case 'arrow':
          elements.push({
            type: 'arrow',
            x1: parseFloat(values[0]),
            y1: parseFloat(values[1]),
            x2: parseFloat(values[2]),
            y2: parseFloat(values[3]),
            color: values[4]?.trim() || '#000'
          });
          break;
        
        case 'txt':
        case 'text':
          // Format: txt:x,y,size,color,text (text is everything after 4th comma)
          const textX = parseFloat(values[0]);
          const textY = parseFloat(values[1]);
          const textSize = parseInt(values[2]) || 12;
          const textColor = values[3]?.trim() || '#000';
          const textContent = values.slice(4).join(','); // Rejoin remaining parts (handles text with commas)
          
          elements.push({
            type: 'text',
            x: textX,
            y: textY,
            size: textSize,
            color: textColor,
            text: textContent
          });
          break;
        
        case 'path':
          const coords = [];
          let i = 0;
          while (i < values.length - 2) {
            coords.push({
              x: parseFloat(values[i]),
              y: parseFloat(values[i + 1])
            });
            i += 2;
          }
          elements.push({
            type: 'path',
            points: coords,
            color: values[values.length - 2]?.trim() || '#000',
            fill: values[values.length - 1]?.trim() || 'none'
          });
          break;
      }
    }
    
    return elements;
  };

  // 🎨 Animate drawing at a specific position (for whiteboard)
  // Function to render explanation text on canvas
  const renderExplanationOnCanvas = (ctx, text, y, canvasWidth, maxHeight = 200) => {
    if (!text) return 0;
    
    ctx.save();
    const padding = 20;
    const fontSize = 14;
    const lineHeight = 20;
    
    // Draw background box
    ctx.fillStyle = 'rgba(219, 234, 254, 0.95)'; // Light blue background
    ctx.strokeStyle = '#3b82f6'; // Blue border
    ctx.lineWidth = 2;
    
    // Word wrap the text
    ctx.font = `${fontSize}px Arial`;
    const maxWidth = canvasWidth - padding * 4;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // Limit lines to fit in maxHeight
    const maxLines = Math.floor((maxHeight - padding * 2) / lineHeight);
    const displayLines = lines.slice(0, maxLines);
    const boxHeight = displayLines.length * lineHeight + padding * 2 + 30; // +30 for header
    
    // Draw box
    ctx.fillRect(padding * 2, y, canvasWidth - padding * 4, boxHeight);
    ctx.strokeRect(padding * 2, y, canvasWidth - padding * 4, boxHeight);
    
    // Draw header
    ctx.fillStyle = '#1e40af'; // Dark blue
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🎭 AI Agent Explanation:', padding * 2 + 10, y + padding + 16);
    
    // Draw text lines
    ctx.fillStyle = '#1f2937'; // Dark gray
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    displayLines.forEach((line, i) => {
      ctx.fillText(line, padding * 2 + 10, y + padding + 40 + i * lineHeight);
    });
    
    ctx.restore();
    return boxHeight + padding; // Return total height used
  };

  const drawWithAnimationAtPosition = async (ctx, elements, positionY, canvasWidth, blockHeight, explanationText = null) => {
    ctx.save();
    ctx.translate(0, positionY);
    
    // Calculate bounding box of all elements to determine scaling
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(el => {
      switch (el.type) {
        case 'circle':
          minX = Math.min(minX, el.x - el.radius);
          minY = Math.min(minY, el.y - el.radius);
          maxX = Math.max(maxX, el.x + el.radius);
          maxY = Math.max(maxY, el.y + el.radius);
          break;
        case 'ellipse':
          minX = Math.min(minX, el.x - el.width / 2);
          minY = Math.min(minY, el.y - el.height / 2);
          maxX = Math.max(maxX, el.x + el.width / 2);
          maxY = Math.max(maxY, el.y + el.height / 2);
          break;
        case 'rect':
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
          break;
        case 'line':
        case 'arrow':
          minX = Math.min(minX, el.x1, el.x2);
          minY = Math.min(minY, el.y1, el.y2);
          maxX = Math.max(maxX, el.x1, el.x2);
          maxY = Math.max(maxY, el.y1, el.y2);
          break;
        case 'text':
          minX = Math.min(minX, el.x - 100); // Approximate text width
          minY = Math.min(minY, el.y - el.size);
          maxX = Math.max(maxX, el.x + 100);
          maxY = Math.max(maxY, el.y);
          break;
        case 'path':
          el.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
          break;
      }
    });
    
    // Calculate required scale to fit in canvas with padding
    // Reserve bottom 300px for explanation text
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 40;
    const availableWidth = canvasWidth - padding * 2;
    const drawingAreaHeight = 550; // Top portion for drawing (900 - 300 for explanation - 50 padding)
    const availableHeight = drawingAreaHeight - padding * 2;
    
    const scaleX = contentWidth > 0 ? availableWidth / contentWidth : 1;
    const scaleY = contentHeight > 0 ? availableHeight / contentHeight : 1;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
    
    // Calculate offset to center the content in drawing area
    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2 - minX * scale;
    const offsetY = (drawingAreaHeight - scaledHeight) / 2 - minY * scale;
    
    console.log(`📐 Scaling: content=${contentWidth}x${contentHeight}, scale=${scale.toFixed(2)}, offset=${offsetX.toFixed(0)},${offsetY.toFixed(0)}`);
    
    // Apply scaling and centering
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    for (const element of elements) {
      try {
        switch (element.type) {
          case 'circle':
            await animateCircle(ctx, element.x, element.y, element.radius, element.color, element.fill);
            break;
          
          case 'ellipse':
            await animateEllipse(ctx, element.x, element.y, element.width, element.height, element.color, element.fill);
            break;
          
          case 'rect':
          case 'triangle':
            await animateShape(ctx, element);
            break;
          
          case 'line':
            await animateLine(ctx, element.x1, element.y1, element.x2, element.y2, element.color);
            break;
          
          case 'arrow':
            await animateLine(ctx, element.x1, element.y1, element.x2, element.y2, element.color);
            const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1);
            const headlen = 10;
            await animateLine(
              ctx,
              element.x2,
              element.y2,
              element.x2 - headlen * Math.cos(angle - Math.PI / 6),
              element.y2 - headlen * Math.sin(angle - Math.PI / 6),
              element.color
            );
            await animateLine(
              ctx,
              element.x2,
              element.y2,
              element.x2 - headlen * Math.cos(angle + Math.PI / 6),
              element.y2 - headlen * Math.sin(angle + Math.PI / 6),
              element.color
            );
            break;
          
          case 'text':
            ctx.fillStyle = element.color;
            ctx.font = `${element.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(element.text, element.x, element.y);
            break;
          
          case 'path':
            await animatePath(ctx, element.points, element.color, element.fill);
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300)); // Shorter pause for whiteboard
      } catch (err) {
        console.error('Error drawing element:', err);
      }
    }
    
    ctx.restore();
    
    // Render explanation text at the bottom of canvas if provided
    if (explanationText) {
      const explanationY = 650; // Fixed position at bottom of canvas (900px height)
      const explanationHeight = renderExplanationOnCanvas(ctx, explanationText, explanationY, canvasWidth, 220);
      console.log(`📝 Rendered explanation at y=${explanationY}: ${explanationHeight}px tall`);
    }
  };

  const animateLine = async (ctx, x1, y1, x2, y2, color) => {
    const steps = 15; // Fewer steps for faster rendering in whiteboard
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentX = x1 + (x2 - x1) * progress;
      const currentY = y1 + (y2 - y1) * progress;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
      }
      
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      
      await new Promise(resolve => setTimeout(resolve, 20)); // Faster animation
    }
  };

  const animateCircle = async (ctx, x, y, radius, color, fill) => {
    const segments = 25; // Fewer segments for faster rendering
    
    if (fill && fill !== 'none') {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, angle);
      ctx.stroke();
      
      await new Promise(resolve => setTimeout(resolve, 15)); // Faster
    }
  };

  const animateEllipse = async (ctx, x, y, width, height, color, fill) => {
    const segments = 25;
    
    if (fill && fill !== 'none') {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.ellipse(x, y, width / 2, height / 2, 0, 0, angle);
      ctx.stroke();
      
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  };

  const animateShape = async (ctx, element) => {
    if (element.fill && element.fill !== 'none') {
      ctx.fillStyle = element.fill;
      ctx.beginPath();
      
      if (element.type === 'rect') {
        ctx.rect(element.x, element.y, element.width, element.height);
      } else if (element.type === 'triangle') {
        ctx.moveTo(element.x1, element.y1);
        ctx.lineTo(element.x2, element.y2);
        ctx.lineTo(element.x3, element.y3);
        ctx.closePath();
      }
      
      ctx.fill();
    }
    
    if (element.type === 'rect') {
      await animateLine(ctx, element.x, element.y, element.x + element.width, element.y, element.color);
      await animateLine(ctx, element.x + element.width, element.y, element.x + element.width, element.y + element.height, element.color);
      await animateLine(ctx, element.x + element.width, element.y + element.height, element.x, element.y + element.height, element.color);
      await animateLine(ctx, element.x, element.y + element.height, element.x, element.y, element.color);
    } else if (element.type === 'triangle') {
      await animateLine(ctx, element.x1, element.y1, element.x2, element.y2, element.color);
      await animateLine(ctx, element.x2, element.y2, element.x3, element.y3, element.color);
      await animateLine(ctx, element.x3, element.y3, element.x1, element.y1, element.color);
    }
  };

  const animatePath = async (ctx, points, color, fill) => {
    if (fill && fill !== 'none') {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
    
    for (let i = 0; i < points.length - 1; i++) {
      await animateLine(ctx, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color);
    }
  };

  // Clear only the drawing area (not saved diagrams)
  const clearCanvas = () => {
    const canvas = ensureBaseCanvas();
    const ctx = canvas.getContext('2d');
    
    // Calculate where the last diagram ends
    const lastBlock = contentBlocks[contentBlocks.length - 1];
    const clearFromY = lastBlock 
      ? (lastBlock.position_y || 0) + (lastBlock.height || 600)
      : 0;
    
    // Only clear the area after the last diagram
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, clearFromY, canvas.width, canvas.height - clearFromY);
    setHasUnsavedChanges(true); // Mark as unsaved after clearing
  };

  // Handle delete diagram with repositioning
  const handleDeleteDiagram = async (blockId) => {
    if (!window.confirm('🗑️ Delete this diagram?\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      // Find the block being deleted
      const deletedBlock = contentBlocks.find(b => b.id === blockId);
      if (!deletedBlock) return;

      const deletedHeight = (deletedBlock.height || 600) + 60; // Include gap
      const deletedPosition = deletedBlock.position_y || 0;

      // Delete from database
      const { error } = await deleteWhiteboardContent(blockId);
      
      if (error) {
        console.error('Error deleting diagram:', error);
        alert('❌ Failed to delete diagram');
        return;
      }

      // Remove from local state and reposition blocks below
      const updatedBlocks = contentBlocks
        .filter(block => block.id !== blockId)
        .map(block => {
          // If block is below the deleted one, move it up
          if ((block.position_y || 0) > deletedPosition) {
            const newPositionY = (block.position_y || 0) - deletedHeight;
            
            // Update position in database
            updateWhiteboardContent(block.id, { positionY: newPositionY });
            
            return {
              ...block,
              position_y: newPositionY
            };
          }
          return block;
        });

      setContentBlocks(updatedBlocks);
      
      // Recalculate total canvas height
      if (updatedBlocks.length > 0) {
        const lastBlock = updatedBlocks[updatedBlocks.length - 1];
        const newHeight = (lastBlock.position_y || 0) + (lastBlock.height || 600) + 600;
        setCanvasHeight(newHeight);
      } else {
        setCanvasHeight(2000); // Reset to default if no blocks
      }
      
      // Clear and redraw canvas
      const canvas = ensureBaseCanvas();
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Redraw remaining blocks at their new positions
      updatedBlocks.forEach(block => {
        if (block.canvas_data) {
          const img = new Image();
          img.onload = () => {
            const originalWidth = block.canvas_width || 1200;
            const scale = canvas.width / originalWidth;
            const scaledHeight = img.height * scale;
            ctx.drawImage(img, 0, block.position_y || 0, canvas.width, scaledHeight);
          };
          img.src = block.canvas_data;
        }
      });

      console.log('✅ Diagram deleted and remaining diagrams repositioned');
    } catch (error) {
      console.error('Error in handleDeleteDiagram:', error);
      alert('❌ Failed to delete diagram');
    }
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        '⚠️ You have unsaved changes!\n\nDo you want to save your drawing before closing?\n\nClick "OK" to save, "Cancel" to discard changes.'
      );
      
      if (confirmed) {
        handleSaveDrawing().then(() => {
          onClose();
        });
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Generate description based on diagram type and elements
  const generateDescription = (diagramType, elements, question) => {
    if (!elements || elements.length === 0) {
      return `${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} diagram`;
    }

    switch (diagramType) {
      case 'flowchart':
        // Extract text from flowchart step objects
        const stepTexts = elements.map(e => typeof e === 'object' ? e.text || e.step || String(e) : e);
        return `Step-by-step flowchart showing ${elements.length} steps: ${stepTexts.slice(0, 3).join(' → ')}${elements.length > 3 ? '...' : ''}`;
      
      case 'mindmap':
        // Extract text from mindmap concept objects
        const conceptTexts = elements.map(e => typeof e === 'object' ? e.text || e.concept || String(e) : e);
        const centralConcept = conceptTexts[0] || 'concepts';
        return `Mind map exploring ${centralConcept} with ${elements.length - 1} related concepts including ${conceptTexts.slice(1, 4).join(', ')}${elements.length > 4 ? ', and more' : ''}`;
      
      case 'graph':
        const values = elements.map(e => e.value || 0);
        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        return `Bar chart comparing ${elements.length} items. Range: ${minVal} to ${maxVal}. Showing ${elements.map(e => e.label).join(', ')}`;
      
      case 'equation':
        return `Mathematical formula: ${elements.join(' ')}`;
      
      default:
        // Handle mixed types
        const texts = elements.map(e => typeof e === 'object' ? e.text || e.label || String(e) : e);
        return `Diagram showing ${elements.length} elements: ${texts.slice(0, 3).join(', ')}${elements.length > 3 ? '...' : ''}`;
    }
  };

  // Handle asking a question and generating diagram OR fetching image
  const handleAskQuestion = async (question = userInput) => {
    if (!question.trim()) return;

    setIsGenerating(true);
    
    try {
      // 🔥 TRIGGER CHAT SIMULTANEOUSLY - Get D-ID agent response in parallel
      if (onAskQuestion && typeof onAskQuestion === 'function') {
        console.log('🎯 Triggering chat for D-ID agent response:', question);
        onAskQuestion(question);
      }

      // Analyze the question to determine diagram type, image request, or elements
      console.log('📊 Calling /api/analyze-diagram with:', question);
      const analysisResponse = await fetch('/api/analyze-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatText: `User question: ${question}` 
        })
      });

      console.log('📊 Analysis response status:', analysisResponse.status, analysisResponse.ok);

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('❌ Analysis failed:', analysisResponse.status, errorText);
        throw new Error(`Failed to analyze diagram: ${analysisResponse.status}`);
      }

      const result = await analysisResponse.json();
      console.log('✅ Analysis result:', result);
      console.log('🔍 Drawing field present?', !!result.drawing, 'DiagramType:', result.diagramType);
      
      const { diagramType, elements, imageUrl, imageSource, imageAttribution, imageAttributionUrl, imagePrompt, revisedPrompt, drawing, templateId, source } = result;
      
      // Validate we have something to render
      if (!diagramType) {
        console.error('❌ No diagramType returned from API:', result);
        throw new Error('API did not return a valid diagram type');
      }
      
      // Calculate position for new content (append below existing content)
      const lastBlock = contentBlocks[contentBlocks.length - 1];
      const positionY = lastBlock 
        ? (lastBlock.position_y || 0) + (lastBlock.height || 600) + 60  // 60px gap
        : 60; // Start 60px from top
      
      // 🚀 Handle FAST_DRAWING type - Real-time animated diagrams
      if (diagramType === 'fast_drawing' && drawing) {
        console.log(`🎨 Rendering fast drawing (${source || 'gpt'})...`);
        setIsAnimatingFastDrawing(true);
        requestAnimationFrame(() => {
          if (canvasRef.current) {
            canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        
        const blockHeight = 600;
        const canvas = ensureBaseCanvas();
        const ctx = canvas.getContext('2d');

        // Use the overlay canvas solely for the live animation so it always starts clean
        if (canvas.height !== blockHeight) {
          canvas.height = blockHeight;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Parse and animate the drawing
        try {
          const elements = parseCompactFormat(drawing);
          console.log(`✅ Parsed ${elements.length} elements, starting animation...`);

          // Render directly onto the overlay canvas so the user sees the shapes animate
          await drawWithAnimationAtPosition(
            ctx,
            elements,
            0,
            canvas.width,
            blockHeight,
            null
          );

          // Capture the rendered section for persistence
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = blockHeight;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(
            canvas,
            0,
            0,
            canvas.width,
            blockHeight,
            0,
            0,
            canvas.width,
            blockHeight
          );
          const canvasData = tempCanvas.toDataURL('image/png');

          // Wipe the overlay so it doesn't show the completed diagram after saving
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Save to database
          if (whiteboardSessionId) {
            const { data: savedContent, error } = await saveWhiteboardContent(whiteboardSessionId, {
              contentType: 'fast_drawing',
              diagramType: 'fast_drawing',
              question,
              aiResponse: `Animated diagram ${templateId ? `(${templateId} template)` : '(AI-generated)'}`,
              canvasData,
              elements: [],
              positionY,
              height: blockHeight,
              canvasWidth: canvas.width,
              drawing,
              templateId,
              source
            });

            if (error) {
              console.error('Error saving content:', error);
            } else if (savedContent) {
              setContentBlocks(prev => [...prev, savedContent]);
              setCurrentContentId(savedContent.id);
              
              // Scroll to bottom to show new diagram
              setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
              }, 100);
            }
          }
          
        } catch (parseError) {
          console.error('Failed to parse drawing:', parseError);
          alert('Failed to render diagram. Please try again.');
        } finally {
          setIsAnimatingFastDrawing(false);
        }
        
        setUserInput('');
        setIsGenerating(false);
        return;
      }
      
      // Handle IMAGE type (both DALL-E and stock photos)
      if ((diagramType === 'image' || diagramType === 'dalle_image') && imageUrl) {
        console.log(`🖼️ Displaying ${diagramType === 'dalle_image' ? 'DALL-E generated' : 'stock photo'} image:`, imageUrl);
        
        const isMobile = window.innerWidth < 768;
        
        // Always draw on canvas (both mobile and desktop) for canvas_data
        const blockHeight = isMobile ? 400 : 600; // Smaller on mobile
        const requiredHeight = positionY + blockHeight + 600;
        
        if (requiredHeight > canvasHeight) {
          setCanvasHeight(requiredHeight);
        }

        const canvas = ensureBaseCanvas();
        const ctx = canvas.getContext('2d');
        
        // Make sure canvas is tall enough
        if (canvas.height < requiredHeight) {
          const oldImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          canvas.height = requiredHeight;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.putImageData(oldImageData, 0, 0);
        }
        
        // Load and draw the image
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS
        
        img.onload = async () => {
          // Save context and translate to new position
          ctx.save();
          ctx.translate(0, positionY);
          
          // Mobile and desktop scaling
          const isMobile = window.innerWidth < 768;
          const maxImageWidth = isMobile ? canvas.width * 0.85 : canvas.width * 0.95;
          const maxImageHeight = isMobile ? blockHeight * 0.75 : blockHeight * 0.85;
          
          // Calculate scaling to fit within max dimensions while maintaining aspect ratio
          const scale = Math.min(maxImageWidth / img.width, maxImageHeight / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the image both horizontally and vertically
          const xOffset = (canvas.width - scaledWidth) / 2;
          const yOffset = (blockHeight - scaledHeight) / 2;
          
          // Draw white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, blockHeight);
          
          // Draw the image centered
          ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);
          
          // Add attribution text at bottom
          if (imageAttribution) {
            ctx.fillStyle = '#666666';
            ctx.font = isMobile ? '10px Arial' : '12px Arial'; // Smaller text on mobile
            ctx.textAlign = 'center';
            ctx.fillText(imageAttribution, canvas.width / 2, blockHeight - 10);
          }
          
          // Add attribution text at bottom
          if (imageAttribution) {
            ctx.fillStyle = '#666666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(imageAttribution, canvas.width / 2, blockHeight - 10);
          }
          
          ctx.restore();

          // Capture this section of canvas as image
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = blockHeight;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(canvas, 0, positionY, canvas.width, blockHeight, 0, 0, canvas.width, blockHeight);
          const canvasData = tempCanvas.toDataURL('image/png');

          // Save to database if session exists
          if (whiteboardSessionId) {
            const { data: savedContent, error } = await saveWhiteboardContent(whiteboardSessionId, {
              contentType: 'image',
              diagramType: diagramType === 'dalle_image' ? 'dalle_image' : 'image',
              question,
              aiResponse: diagramType === 'dalle_image' 
                ? `AI-Generated Educational Illustration${revisedPrompt ? ': ' + revisedPrompt : ''}` 
                : `${imageSource ? `Source: ${imageSource}` : ''} ${imageAttribution || 'Educational image'}`,
              canvasData,
              elements: [],
              positionY,
              height: blockHeight,
              canvasWidth: canvas.width,
              imageUrl,
              imageSource: imageSource || 'DALL-E',
              imageAttribution: imageAttribution || 'Generated by AI',
              imagePrompt: imagePrompt || revisedPrompt
            });

            if (error) {
              console.error('Error saving content:', error);
            } else if (savedContent) {
              setContentBlocks(prev => [...prev, savedContent]);
              setCurrentContentId(savedContent.id);
            }
          }
          
          // Scroll to show the image
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = positionY - 50;
            }
          }, 100);
        };
        
        img.onerror = () => {
          console.error('Failed to load image');
          alert('Failed to load image. Please try again.');
        };
        
        img.src = imageUrl;
        
        setUserInput('');
        setIsGenerating(false);
        return; // Exit early for image handling
      }
      
      // Handle DIAGRAM types (flowchart, mindmap, graph) - ONLY for diagram types
      // For image types, we already returned above, so this validation won't run
      if (!elements || !Array.isArray(elements)) {
        console.error('Invalid elements in response:', result);
        console.error('Diagram type:', diagramType);
        throw new Error(`Invalid diagram data received for type: ${diagramType}`);
      }

      // Calculate dynamic block height based on diagram type and elements
      let blockHeight = 550; // Default
      if (diagramType === 'flowchart') {
        blockHeight = Math.max(550, 100 + (elements.length * 150) + 100);
      } else if (diagramType === 'mindmap') {
        blockHeight = Math.max(600, 400 + (elements.length * 30));
      } else if (diagramType === 'graph') {
        blockHeight = 500;
      }
      blockHeight = Math.min(blockHeight, 1200);

      // Expand canvas if needed
      const requiredHeight = positionY + blockHeight + 600;
      if (requiredHeight > canvasHeight) {
        setCanvasHeight(requiredHeight);
      }

      // Get canvas and wait for it to resize
      const canvas = ensureBaseCanvas();
      const ctx = canvas.getContext('2d');
      
      // Make sure canvas is tall enough
      if (canvas.height < requiredHeight) {
        const oldImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.height = requiredHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(oldImageData, 0, 0);
      }
      
      // Save context and translate to new position
      ctx.save();
      ctx.translate(0, positionY);
      
      // Draw the diagram at the new position
      drawDiagramAtPosition(ctx, diagramType, elements, canvas.width, blockHeight);
      
      ctx.restore();

      // Capture this section of canvas as image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = blockHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, positionY, canvas.width, blockHeight, 0, 0, canvas.width, blockHeight);
      const canvasData = tempCanvas.toDataURL('image/png');

      // Generate description for the diagram
      const description = generateDescription(diagramType, elements, question);

      // Save to database if session exists (with canvas width for responsive scaling)
      if (whiteboardSessionId) {
        const { data: savedContent, error } = await saveWhiteboardContent(whiteboardSessionId, {
          contentType: 'diagram',
          diagramType,
          question,
          aiResponse: description,
          canvasData,
          elements,
          positionY,
          height: blockHeight,
          canvasWidth: canvas.width
        });

        if (error) {
          console.error('Error saving content:', error);
        } else if (savedContent) {
          setContentBlocks(prev => [...prev, savedContent]);
          setCurrentContentId(savedContent.id);
        }
      } else {
        setContentBlocks(prev => [...prev, {
          id: Date.now(),
          content_type: 'diagram',
          diagram_type: diagramType,
          question,
          ai_response: description,
          canvas_data: canvasData,
          elements,
          position_y: positionY,
          height: blockHeight,
          created_at: new Date().toISOString()
        }]);
      }
      
      // Clear input
      setUserInput('');

      // Scroll to show the top of the diagram
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = positionY - 50;
        }
      }, 100);

      // Also send the question to the main chat for the AI to respond via voice/video
      if (chat && typeof chat === 'function') {
        chat(question).catch(err => console.error('Chat error:', err));
      }
    } catch (error) {
      console.error('Failed to generate diagram:', error);
      alert('Error: Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to draw diagram at a specific position
  const drawDiagramAtPosition = (ctx, type, elements, width, height) => {
    // Validate inputs
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      console.warn('No valid elements to draw');
      return;
    }

    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = '16px Arial';

    switch (type) {
      case 'flowchart':
        drawFlowchart(ctx, elements, width, height);
        break;
      case 'mindmap':
        drawMindMap(ctx, elements, width, height);
        break;
      case 'diagram':
        drawDiagram(ctx, elements, width, height);
        break;
      case 'graph':
        drawGraph(ctx, elements, width, height);
        break;
      case 'equation':
        drawEquation(ctx, elements, width, height);
        break;
      default:
        drawSimpleVisualization(ctx, elements, width, height);
    }
  };

  // Flowchart drawing - RESPONSIVE
  const drawFlowchart = (ctx, elements, width, height) => {
    // Make box size responsive to canvas width
    const boxWidth = Math.min(180, width * 0.6); // Max 180px or 60% of width
    const boxHeight = 70;
    const spacing = 80;
    let y = 100;
    const x = width / 2 - boxWidth / 2;

    elements.forEach((element, index) => {
      // Draw box with rounded corners
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#EEF2FF';
      
      // Rounded rectangle
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + boxWidth - radius, y);
      ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
      ctx.lineTo(x + boxWidth, y + boxHeight - radius);
      ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
      ctx.lineTo(x + radius, y + boxHeight);
      ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw text with word wrapping
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontSize = Math.max(12, Math.min(14, width / 30)); // Responsive font size
      ctx.font = `${fontSize}px Arial`;
      
      // Simple word wrap
      const words = element.text.split(' ');
      let line = '';
      let lineY = y + boxHeight / 2 - 10;
      
      words.forEach((word, i) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > boxWidth - 20 && i > 0) {
          ctx.fillText(line, x + boxWidth / 2, lineY);
          line = word + ' ';
          lineY += 20;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, x + boxWidth / 2, lineY);

      // Draw arrow to next element
      if (index < elements.length - 1) {
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + boxWidth / 2, y + boxHeight);
        ctx.lineTo(x + boxWidth / 2, y + boxHeight + spacing / 2);
        ctx.stroke();
        
        // Arrow head
        ctx.fillStyle = '#6366F1';
        ctx.beginPath();
        ctx.moveTo(x + boxWidth / 2, y + boxHeight + spacing / 2);
        ctx.lineTo(x + boxWidth / 2 - 6, y + boxHeight + spacing / 2 - 12);
        ctx.lineTo(x + boxWidth / 2 + 6, y + boxHeight + spacing / 2 - 12);
        ctx.closePath();
        ctx.fill();
      }

      y += boxHeight + spacing;
    });
  };

  // Mind map drawing - RESPONSIVE
  const drawMindMap = (ctx, elements, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(220, width * 0.35); // Responsive radius
    const centerNodeSize = Math.min(60, width * 0.12); // Responsive center node
    const childNodeSize = Math.min(45, width * 0.09); // Responsive child nodes

    // Find center node or use first element
    const centerNode = elements.find(e => e.type === 'center') || elements[0];
    const childNodes = elements.filter(e => e.type !== 'center');

    // Draw center node with gradient
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerNodeSize, 0, Math.PI * 2);
    ctx.fillStyle = '#EEF2FF';
    ctx.fill();
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#1E40AF';
    const centerFontSize = Math.max(14, Math.min(18, width / 30)); // Responsive font
    ctx.font = `bold ${centerFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerNode?.text || 'Main Topic', centerX, centerY);

    // Draw connected nodes
    const nodesToDraw = childNodes.length > 0 ? childNodes : elements.slice(1);
    nodesToDraw.forEach((element, index) => {
      const angle = (Math.PI * 2 * index) / nodesToDraw.length;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw node with gradient
      ctx.beginPath();
      ctx.arc(x, y, childNodeSize, 0, Math.PI * 2);
      ctx.fillStyle = '#F5F3FF';
      ctx.fill();
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text with word wrap
      ctx.fillStyle = '#000000';
      const childFontSize = Math.max(12, Math.min(14, width / 35)); // Responsive font
      ctx.font = `${childFontSize}px Arial`;
      const words = element.text.split(' ');
      let line = '';
      let lines = [];
      
      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 70 && line !== '') {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      });
      if (line) lines.push(line.trim());
      
      // Draw lines centered
      const lineHeight = 16;
      const startY = y - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, x, startY + i * lineHeight, 80);
      });
    });
  };

  // Simple diagram
  const drawDiagram = (ctx, elements, width, height) => {
    const boxSize = 100;
    const cols = Math.ceil(Math.sqrt(elements.length));
    const spacingX = (width - boxSize * cols) / (cols + 1);
    const spacingY = 80;

    elements.forEach((element, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = spacingX + col * (boxSize + spacingX);
      const y = 100 + row * (boxSize + spacingY);

      ctx.strokeRect(x, y, boxSize, boxSize);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(element.text, x + boxSize / 2, y + boxSize / 2, boxSize - 10);
    });
  };

  // Graph drawing (bar chart style) - RESPONSIVE
  const drawGraph = (ctx, elements, width, height) => {
    const padding = Math.min(60, width * 0.1); // Responsive padding
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;
    const barSpacing = Math.max(10, width * 0.02); // Responsive spacing
    const barWidth = Math.max(20, (graphWidth / elements.length) - barSpacing); // Responsive bar width

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    elements.forEach((element, index) => {
      const value = parseFloat(element.value) || 50;
      const barHeight = (value / 100) * graphHeight;
      const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
      const y = height - padding - barHeight;

      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      const fontSize = Math.max(10, Math.min(14, width / 40)); // Responsive font
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(element.text, x + barWidth / 2, height - padding + 20, barWidth);
    });
  };

  // Equation drawing - RESPONSIVE
  const drawEquation = (ctx, elements, width, height) => {
    const fontSize = Math.max(20, Math.min(32, width / 20)); // Responsive font size
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const equation = elements.map(e => e.text).join(' ');
    ctx.fillText(equation, width / 2, height / 2, width * 0.9); // Max width 90% of canvas
  };

  // Simple visualization fallback
  const drawSimpleVisualization = (ctx, elements, width, height) => {
    if (!elements || !Array.isArray(elements)) {
      console.warn('No elements to visualize');
      return;
    }
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#000000';
    let y = 100;

    elements.forEach((element) => {
      ctx.fillText('• ' + element.text, 50, y, width - 100);
      y += 40;
    });
  };

  const shouldShowBaseCanvas = contentBlocks.length === 0 || isAnimatingFastDrawing;

  return (
    <div className="h-full w-full flex flex-col relative bg-gradient-to-br from-black via-[#130a04] to-[#2f1a00] text-amber-50">
      {/* Loading Overlay */}
      {isLoadingSession && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center text-amber-100">
            <div className="w-16 h-16 border-4 border-amber-400/70 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm tracking-wide uppercase">Loading whiteboard...</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={`p-2 lg:p-4 flex items-center gap-2 flex-wrap transition-all bg-black/60 backdrop-blur-2xl border-b border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.65)] ${showToolbar ? 'h-auto' : 'h-0 overflow-hidden'}`}>
        {/* Paint Mode Toggle */}
        <button
          onClick={() => setIsPaintModeEnabled(!isPaintModeEnabled)}
          className={`px-4 py-2 rounded-xl font-semibold tracking-wide border transition-all ${
            isPaintModeEnabled 
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg border-amber-300/50' 
              : 'bg-white/5 text-amber-100 border-white/10 hover:bg-white/10'
          }`}
          title={isPaintModeEnabled ? "Paint Mode ON (Click to turn OFF)" : "Paint Mode OFF (Click to turn ON)"}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-sm">{isPaintModeEnabled ? 'Paint ON' : 'Paint OFF'}</span>
          </div>
        </button>
        
        <div className="w-px h-8 bg-white/20"></div>
        
        {/* Tool Selection */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shadow-inner">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-xl border transition ${tool === 'pen' ? 'bg-amber-400/20 text-amber-100 border-amber-200 shadow-lg' : 'text-amber-200 border-transparent hover:bg-white/10'}`}
            title="Pen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl border transition ${tool === 'eraser' ? 'bg-amber-400/20 text-amber-100 border-amber-200 shadow-lg' : 'text-amber-200 border-transparent hover:bg-white/10'}`}
            title="Eraser"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-white/20 bg-transparent"
            title="Color"
          />
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded border-2 ${color === c ? 'border-amber-300' : 'border-white/20'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
          <span className="text-xs text-amber-100/80 px-2">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-amber-50 w-6 text-center">{lineWidth}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 ml-auto shadow-inner">
          <button
            onClick={handleSaveDrawing}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
              hasUnsavedChanges && !isSaving
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg border-amber-200'
                : 'bg-white/10 text-amber-200/60 border-white/5 cursor-not-allowed'
            }`}
            title={hasUnsavedChanges ? 'Save your drawing' : 'No unsaved changes'}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              <span>💾 Save</span>
            )}
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-sm font-semibold shadow-lg"
            title="Clear canvas"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Container - Scrollable */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-y-auto overflow-x-hidden p-4 bg-white/5 backdrop-blur-2xl border-t border-white/10 whiteboard-scroll"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Loading Indicator */}
        {isLoadingSession && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-2xl z-50">
            <div className="text-center text-amber-100">
              <div className="w-12 h-12 border-4 border-amber-400/60 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm tracking-wide uppercase">Loading whiteboard...</p>
            </div>
          </div>
        )}
        
        {/* Content Blocks - Each with its own canvas */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {contentBlocks.map((block, index) => {
            // Find matching D-ID response from externalChatHistory
            const questionText = block.question?.trim().toLowerCase();
            let didResponse = null;
            if (questionText && externalChatHistory.length > 0) {
              const userMsgIndex = externalChatHistory.findIndex(msg => 
                msg.sender === 'user' && msg.text?.trim().toLowerCase() === questionText
              );
              if (userMsgIndex !== -1 && userMsgIndex < externalChatHistory.length - 1) {
                const nextMsg = externalChatHistory[userMsgIndex + 1];
                if (nextMsg.sender === 'ai') {
                  didResponse = nextMsg.text;
                }
              }
            }
            
            return (
              <div key={block.id} className="bg-white/5 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] border border-white/10 overflow-hidden backdrop-blur-xl">
                {/* Header with Question */}
                <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span>🎨</span>
                      {block.question}
                    </h3>
                    <button
                      onClick={() => handleDeleteDiagram(block.id)}
                      className="text-black/70 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-black/10 rounded-full text-xs font-semibold">
                      {block.diagram_type === 'fast_drawing' ? '⚡ Fast Drawing' : block.diagram_type}
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(block.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* AI Explanation Section */}
                {didResponse && (
                  <div className="bg-black/40 p-4 border-b border-white/10">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">🎭</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-200 mb-2">AI Agent Explanation:</h4>
                        <p className="text-amber-50 text-sm leading-relaxed whitespace-pre-wrap">
                          {didResponse}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Canvas for this specific diagram */}
                <div className="p-4 bg-black/50 flex items-center justify-center border-t border-white/10">
                  <canvas
                    id={`canvas-${block.id}`}
                    width={800}
                    height={600}
                    className="border border-white/15 rounded-2xl bg-black/80 shadow-[0_20px_45px_rgba(0,0,0,0.5)] max-w-full h-auto"
                  />
                </div>
                
                {/* AI Response if available */}
                {block.ai_response && (
                  <div className="p-4 bg-black/40 border-t border-white/10">
                    <p className="text-sm text-amber-100/90 italic">
                      {block.ai_response}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          {/* Live/Manual Canvas positioned after existing diagrams */}
          <div
            className={`${shouldShowBaseCanvas ? 'flex' : 'hidden'} relative items-center justify-center bg-black/40 border border-white/10 rounded-2xl p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]`}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`border-2 border-white/15 rounded-2xl bg-black/80 shadow-[0_20px_45px_rgba(0,0,0,0.5)] ${isPaintModeEnabled ? 'cursor-crosshair touch-none' : 'cursor-default'}`}
              style={{ 
                touchAction: isPaintModeEnabled ? 'none' : 'auto',
                display: 'block',
                maxWidth: '100%',
                height: 'auto'
              }}
            />

            {isAnimatingFastDrawing && (
              <div className="absolute top-3 left-3 bg-black/70 text-amber-100 text-xs px-3 py-1 rounded-full border border-white/10">
                Drawing live...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar Toggle Button */}
      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className="absolute top-2 right-2 bg-black/70 border border-white/15 shadow-lg rounded-full p-2 hover:bg-black/60 transition-colors z-10 text-amber-100"
        title={showToolbar ? 'Hide toolbar' : 'Show toolbar'}
      >
        <svg className={`w-5 h-5 transition-transform ${showToolbar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Question Input Area - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl p-2 md:p-4 border-t border-white/10 z-50">
        <div className="flex items-center gap-1 md:gap-2 max-w-4xl mx-auto">
          {/* Microphone Button */}
          <button
            onClick={toggleVoiceInput}
            disabled={isGenerating || loading}
            className={`p-2 md:p-3 rounded-full transition-all shadow-lg ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
                : isGenerating || loading
                ? 'bg-white/10 text-amber-200/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isListening ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            placeholder={isListening ? '🎤 Listening...' : 'Ask a question...'}
            disabled={isGenerating || loading || isListening}
            className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-white/15 rounded-2xl bg-black/40 text-amber-50 placeholder:text-amber-200/40 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/30 disabled:bg-black/30 disabled:text-amber-200/30 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            onClick={() => handleAskQuestion()}
            disabled={!userInput.trim() || isGenerating || loading}
            className={`p-2 md:p-3 rounded-full transition-all shadow-lg ${
              !userInput.trim() || isGenerating || loading
                ? 'bg-white/10 text-amber-200/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black hover:brightness-110'
            }`}
            title="Send question"
          >
            {isGenerating || loading ? (
              <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>

        {/* Status Text */}
        {(isGenerating || loading) && (
          <div className="text-center mt-2 text-sm text-amber-200 font-medium">
            <span className="inline-flex items-center gap-2">
              <span className="animate-pulse">🤖</span>
              Analyzing and drawing diagram...
            </span>
          </div>
        )}
      </div>

      {/* Info Badge - Updated position to avoid input area */}
      {contentBlocks.length === 0 && !userInput && !isGenerating && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/70 border border-white/10 rounded-2xl px-6 py-4 text-sm text-amber-50 z-40 shadow-[0_20px_45px_rgba(0,0,0,0.6)] max-w-md backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2 text-amber-200">
            <span className="text-2xl">💡</span>
            <span className="font-bold tracking-wide">Smart Whiteboard</span>
          </div>
          <div className="space-y-2 text-xs text-amber-100">
            <div className="flex items-start gap-2">
              <span className="text-green-300">🖼️</span>
              <span>Ask about <strong>real objects</strong> → Unsplash photos!</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-300">🎨</span>
              <span>Ask <strong>how to calculate/explain</strong> → AI diagrams!</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-300">📊</span>
              <span>Ask about <strong>processes/steps</strong> → Flowcharts!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
