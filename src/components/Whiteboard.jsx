import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';

export const Whiteboard = ({ onClose }) => {
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
  
  // Input state
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const { chatHistory, chat, loading } = useChat();
  
  // TODO: Add these for persistence feature (see WHITEBOARD_PERSISTENCE_PLAN.md)
  // const { user } = useAuth();
  // const [contentBlocks, setContentBlocks] = useState([]);
  // const [currentContentId, setCurrentContentId] = useState(null);
  // const [canvasHeight, setCanvasHeight] = useState(2000);
  // const [whiteboardSessionId, setWhiteboardSessionId] = useState(null);
  // const [isLoading, setIsLoading] = useState(true);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    
    // Set canvas size to match container
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Resize handler
    const handleResize = () => {
      const newRect = canvas.parentElement.getBoundingClientRect();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = newRect.width;
      canvas.height = newRect.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);
    // TODO: Add auto-save here when persistence is implemented
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setAiResponse('');
    setShowResponse(false);
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

  // Handle asking a question and generating diagram
  const handleAskQuestion = async (question = userInput) => {
    if (!question.trim()) return;

    setIsGenerating(true);
    setShowResponse(true);
    
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

      // Set a simple response message
      setAiResponse(`Drawing ${diagramType} for: "${question}"`);

      // TODO: Implement persistent diagram stacking (see WHITEBOARD_PERSISTENCE_PLAN.md)
      // For now, clear and draw new diagram
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the diagram
      drawDiagramAtPosition(ctx, diagramType, elements, canvas.width, canvas.height);
      
      // Clear input
      setUserInput('');

      // Also send the question to the main chat for the AI to respond via voice/video
      if (chat && typeof chat === 'function') {
        chat(question).catch(err => console.error('Chat error:', err));
      }
    } catch (error) {
      console.error('Failed to generate diagram:', error);
      setAiResponse('Error: Failed to generate diagram. Please try again.');
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
            onClick={clearCanvas}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
            title="Clear canvas"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
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

      {/* AI Response Overlay */}
      {showResponse && aiResponse && (
        <div className="absolute top-16 left-4 right-4 bg-white shadow-2xl rounded-xl p-4 border-2 border-purple-500 max-w-md z-20 animate-fade-in">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="font-semibold text-purple-700">AI Explanation</span>
            </div>
            <button
              onClick={() => setShowResponse(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
            {aiResponse}
          </div>
        </div>
      )}

      {/* Question Input Area - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-4 border-t-2 border-gray-200 z-10">
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
      {!showResponse && chatHistory.length === 0 && !userInput && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2 text-sm text-yellow-800 z-5">
          💡 Ask any question and I'll draw the explanation as a diagram!
        </div>
      )}
    </div>
  );
};
