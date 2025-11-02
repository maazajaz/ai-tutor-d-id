import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { 
  getOrCreateWhiteboardSession, 
  loadWhiteboardContent, 
  saveWhiteboardContent,
  updateWhiteboardContent 
} from '../services/whiteboardService';

export const Whiteboard = ({ onClose, chatSessionId = 'default' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
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
  
  const { chatHistory, chat, loading } = useChat();
  const { user } = useAuth();

  // Initialize whiteboard session and load content
  useEffect(() => {
    async function initWhiteboard() {
      if (!user?.id) {
        setIsLoadingSession(false);
        return;
      }
      
      setIsLoadingSession(true);
      try {
        // Get or create session
        const { data: session, error } = await getOrCreateWhiteboardSession(user.id, chatSessionId);
        
        if (error) {
          console.error('Error initializing whiteboard:', error);
          setIsLoadingSession(false);
          return;
        }
        
        setWhiteboardSessionId(session.id);
        
        // Load existing content
        const { data: content, error: loadError } = await loadWhiteboardContent(session.id);
        
        if (loadError) {
          console.error('Error loading content:', loadError);
        } else if (content && content.length > 0) {
          setContentBlocks(content);
          // Calculate total height needed
          const totalHeight = content.reduce((sum, block) => sum + (block.height || 600), 0);
          setCanvasHeight(Math.max(totalHeight + 600, 2000));
        }
      } catch (error) {
        console.error('Error in initWhiteboard:', error);
      } finally {
        setIsLoadingSession(false);
      }
    }
    
    initWhiteboard();
  }, [user, chatSessionId]);

  // Initialize and update canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    
    // Set canvas size - width from container, height dynamic
    canvas.width = rect.width;
    canvas.height = canvasHeight;
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all content blocks
    if (contentBlocks.length > 0) {
      contentBlocks.forEach(block => {
        if (block.canvas_data) {
          // Load and draw saved image
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, block.position_y || 0);
          };
          img.src = block.canvas_data;
        }
      });
    }
  }, [canvasHeight, contentBlocks]);

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
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    setIsDrawing(true);
    setLastPosition(pos);

    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  // Draw
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const pos = getCanvasCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');

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
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const canvasData = canvas.toDataURL('image/png');

      // If there's an existing content block (from AI diagram), update it
      if (currentContentId) {
        const { error } = await updateWhiteboardContent(currentContentId, { canvasData });
        if (error) throw error;
      } else {
        // Otherwise, create a new manual drawing content block
        const newContent = {
          contentType: 'manual_drawing',
          diagramType: 'manual',
          question: 'Manual Drawing',
          aiResponse: 'Custom drawing by user',
          canvasData: canvasData,
          elements: [],
          positionY: 0,
          height: canvasHeight
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

  // Clear only the drawing area (not saved diagrams)
  const clearCanvas = () => {
    const canvas = canvasRef.current;
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

  // Handle asking a question and generating diagram
  const handleAskQuestion = async (question = userInput) => {
    if (!question.trim()) return;

    setIsGenerating(true);
    
    try {
      // Analyze the question to determine diagram type and elements
      const analysisResponse = await fetch('/api/analyze-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatText: `User question: ${question}` 
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('Analysis failed:', analysisResponse.status, errorText);
        throw new Error(`Failed to analyze diagram: ${analysisResponse.status}`);
      }

      const result = await analysisResponse.json();
      console.log('Analysis result:', result);
      
      const { diagramType, elements } = result;
      
      if (!elements || !Array.isArray(elements)) {
        console.error('Invalid elements in response:', result);
        throw new Error('Invalid diagram data received');
      }

      // Calculate position for new content (append below existing content)
      const lastBlock = contentBlocks[contentBlocks.length - 1];
      const positionY = lastBlock 
        ? (lastBlock.position_y || 0) + (lastBlock.height || 600) + 60  // 60px gap
        : 60; // Start 60px from top
      
      // Calculate dynamic block height based on diagram type and elements
      let blockHeight = 550; // Default
      if (diagramType === 'flowchart') {
        // Flowchart: 100px top padding + (70px box + 80px spacing) * steps + 100px bottom
        blockHeight = Math.max(550, 100 + (elements.length * 150) + 100);
      } else if (diagramType === 'mindmap') {
        // Mind map needs more space for radial layout
        blockHeight = Math.max(600, 400 + (elements.length * 30));
      } else if (diagramType === 'graph') {
        // Bar graph is fairly compact
        blockHeight = 500;
      }
      // Cap maximum height to prevent extremely large diagrams
      blockHeight = Math.min(blockHeight, 1200);

      // Expand canvas if needed
      const requiredHeight = positionY + blockHeight + 600;
      if (requiredHeight > canvasHeight) {
        setCanvasHeight(requiredHeight);
      }

      // Get canvas and wait for it to resize
      const canvas = canvasRef.current;
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

      // Save to database if session exists
      if (whiteboardSessionId) {
        const { data: savedContent, error } = await saveWhiteboardContent(whiteboardSessionId, {
          contentType: 'diagram',
          diagramType,
          question,
          aiResponse: description,
          canvasData,
          elements,
          positionY,
          height: blockHeight
        });

        if (error) {
          console.error('Error saving content:', error);
        } else if (savedContent) {
          // Add to local state
          setContentBlocks(prev => [...prev, savedContent]);
          setCurrentContentId(savedContent.id);
        }
      } else {
        // No session yet, just add to local state
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
          containerRef.current.scrollTop = positionY - 50; // Show diagram from top
        }
      }, 100);

      // Also send the question to the main chat for the AI to respond via voice/video
      if (chat && typeof chat === 'function') {
        chat(question).catch(err => console.error('Chat error:', err));
      }
    } catch (error) {
      console.error('Failed to generate diagram:', error);
      alert('Error: Failed to generate diagram. Please try again.');
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

  // Flowchart drawing
  const drawFlowchart = (ctx, elements, width, height) => {
    const boxWidth = 180;
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
      ctx.font = '14px Arial';
      
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

  // Mind map drawing
  const drawMindMap = (ctx, elements, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 220;

    // Find center node or use first element
    const centerNode = elements.find(e => e.type === 'center') || elements[0];
    const childNodes = elements.filter(e => e.type !== 'center');

    // Draw center node with gradient
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#EEF2FF';
    ctx.fill();
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#1E40AF';
    ctx.font = 'bold 18px Arial';
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
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fillStyle = '#F5F3FF';
      ctx.fill();
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text with word wrap
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
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

  // Graph drawing (bar chart style)
  const drawGraph = (ctx, elements, width, height) => {
    const padding = 60;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;
    const barWidth = graphWidth / elements.length - 20;

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
      const x = padding + index * (barWidth + 20) + 10;
      const y = height - padding - barHeight;

      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(element.text, x + barWidth / 2, height - padding + 20, barWidth);
    });
  };

  // Equation drawing
  const drawEquation = (ctx, elements, width, height) => {
    ctx.font = '32px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const equation = elements.map(e => e.text).join(' ');
    ctx.fillText(equation, width / 2, height / 2);
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

  return (
    <div className="h-full w-full bg-white flex flex-col relative">
      {/* Loading Overlay */}
      {isLoadingSession && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading whiteboard...</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={`bg-gradient-to-r from-purple-500 to-indigo-600 p-2 flex items-center gap-2 flex-wrap transition-all ${showToolbar ? 'h-auto' : 'h-0 overflow-hidden'}`}>
        {/* Tool Selection */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded ${tool === 'pen' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Pen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Eraser"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2 bg-white rounded-lg p-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            title="Color"
          />
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-2 bg-white rounded-lg p-1">
          <span className="text-xs text-gray-600 px-2">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-gray-600 w-6">{lineWidth}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 ml-auto">
          <button
            onClick={handleSaveDrawing}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-3 py-2 rounded text-sm font-medium transition-all ${
              hasUnsavedChanges && !isSaving
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
            title="Clear canvas"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Container - Scrollable */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-y-auto overflow-x-hidden bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair touch-none"
          style={{ 
            touchAction: 'none',
            height: `${canvasHeight}px`,
            display: 'block'
          }}
        />
        
        {/* Content Cards Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {contentBlocks.map((block, index) => (
            <div
              key={block.id}
              className="absolute left-0 right-0"
              style={{ 
                top: `${(block.position_y || 0) + (block.height || 600) + 20}px`, // Position BELOW diagram
                pointerEvents: 'auto'
              }}
            >
              <div className="max-w-4xl mx-4 md:mx-auto bg-white rounded-lg shadow-lg p-4 border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {block.diagram_type === 'flowchart' && '📊'}
                    {block.diagram_type === 'mindmap' && '🧠'}
                    {block.diagram_type === 'graph' && '📈'}
                    {block.diagram_type === 'equation' && '🔢'}
                    {!['flowchart', 'mindmap', 'graph', 'equation'].includes(block.diagram_type) && '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 break-words">
                      {block.question}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {block.ai_response}
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {block.diagram_type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(block.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this diagram?')) {
                        // TODO: Implement delete
                        console.log('Delete diagram:', block.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Delete diagram"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar Toggle Button */}
      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className="absolute top-2 right-2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
        title={showToolbar ? 'Hide toolbar' : 'Show toolbar'}
      >
        <svg className={`w-5 h-5 text-gray-600 transition-transform ${showToolbar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Question Input Area - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-4 border-t-2 border-gray-200 z-50">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Microphone Button */}
          <button
            onClick={toggleVoiceInput}
            disabled={isGenerating || loading}
            className={`p-3 rounded-full transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : isGenerating || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white shadow-lg`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            placeholder={isListening ? '🎤 Listening...' : 'Ask a question and I\'ll draw the diagram...'}
            disabled={isGenerating || loading || isListening}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-gray-800 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            onClick={() => handleAskQuestion()}
            disabled={!userInput.trim() || isGenerating || loading}
            className={`p-3 rounded-full transition-all ${
              !userInput.trim() || isGenerating || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
            } text-white shadow-lg`}
            title="Send question"
          >
            {isGenerating || loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>

        {/* Status Text */}
        {(isGenerating || loading) && (
          <div className="text-center mt-2 text-sm text-purple-600 font-medium">
            <span className="inline-flex items-center gap-2">
              <span className="animate-pulse">🤖</span>
              Analyzing and drawing diagram...
            </span>
          </div>
        )}
      </div>

      {/* Info Badge - Updated position to avoid input area */}
      {contentBlocks.length === 0 && !userInput && !isGenerating && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2 text-sm text-yellow-800 z-40">
          💡 Ask any question and I'll draw the explanation as a diagram!
        </div>
      )}
    </div>
  );
};
