import { useState, useRef, useEffect } from 'react';
import { anatomyTemplates } from '../utils/anatomyTemplates';
import logo from '../assets/logo_white.svg';

export const VisualWhiteboard = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [drawingData, setDrawingData] = useState(null);
  const canvasRef = useRef(null);

  // Template list with metadata
  const templates = [
    { id: 'human-heart', name: 'Human Heart', icon: '❤️', description: 'Heart anatomy with chambers' },
    { id: 'human-brain', name: 'Human Brain', icon: '🧠', description: 'Brain lobes and structure' },
    { id: 'digestive-system', name: 'Digestive System', icon: '🫁', description: 'Complete digestive tract' },
    { id: 'respiratory-system', name: 'Respiratory System', icon: '🫁', description: 'Lungs and airways' },
    { id: 'plant-cell', name: 'Plant Cell', icon: '🌱', description: 'Cell structure with organelles' },
    { id: 'dog-anatomy', name: 'Dog Anatomy', icon: '🐕', description: 'Dog body structure' },
    { id: 'eye-structure', name: 'Eye Structure', icon: '👁️', description: 'Human eye anatomy' },
    { id: 'atom-structure', name: 'Atom Structure', icon: '⚛️', description: 'Atomic model with electrons' },
    { id: 'butterfly-lifecycle', name: 'Butterfly Lifecycle', icon: '🦋', description: 'Metamorphosis stages' }
  ];

  // Parse compact format drawing data
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
          const textContent = values.slice(4).join(','); // Rejoin remaining parts
          
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

  // Animate line drawing
  const animateLine = async (ctx, x1, y1, x2, y2, color) => {
    const steps = 25;
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
      
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  };

  // Animate circle drawing
  const animateCircle = async (ctx, x, y, radius, color, fill) => {
    const segments = 40;
    
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
      
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };

  // Animate ellipse drawing
  const animateEllipse = async (ctx, x, y, width, height, color, fill) => {
    const segments = 40;
    
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
      
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };

  // Animate shape drawing (rect, triangle)
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
      // Draw rectangle edges one by one
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

  // Animate path drawing
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

  // Main animation function
  const drawWithAnimation = async (elements) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
            // Draw arrowhead
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
        
        // Pause between elements
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('Error drawing element:', err);
      }
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (templateId) => {
    setSelectedTemplate(templateId);
    setError('');
    setIsGenerating(true);
    
    try {
      const template = anatomyTemplates[templateId];
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Convert template to compact format
      const compactData = convertTemplateToCompact(template);
      setDrawingData(compactData);
      
      // Parse and animate
      const elements = parseCompactFormat(compactData);
      await drawWithAnimation(elements);
      
      setIsGenerating(false);
    } catch (err) {
      console.error('Template error:', err);
      setError(err.message);
      setIsGenerating(false);
    }
  };

  // Convert template to compact format
  const convertTemplateToCompact = (template) => {
    let compact = '';
    
    for (const element of template.elements) {
      switch (element.type) {
        case 'circle':
          compact += `circ:${element.x},${element.y},${element.radius},${element.color},${element.fill || 'none'}\n`;
          break;
        case 'ellipse':
          compact += `ell:${element.x},${element.y},${element.width},${element.height},${element.color},${element.fill || 'none'}\n`;
          break;
        case 'rect':
          compact += `rect:${element.x},${element.y},${element.width},${element.height},${element.color},${element.fill || 'none'}\n`;
          break;
        case 'triangle':
          compact += `tri:${element.x1},${element.y1},${element.x2},${element.y2},${element.x3},${element.y3},${element.color},${element.fill || 'none'}\n`;
          break;
        case 'line':
          compact += `line:${element.x1},${element.y1},${element.x2},${element.y2},${element.color}\n`;
          break;
        case 'arrow':
          compact += `arrow:${element.x1},${element.y1},${element.x2},${element.y2},${element.color}\n`;
          break;
        case 'text':
          compact += `txt:${element.x},${element.y},${element.text},${element.color},${element.size || 12}\n`;
          break;
        case 'path':
          const pathCoords = element.points.map(p => `${p.x},${p.y}`).join(',');
          compact += `path:${pathCoords},${element.color},${element.fill || 'none'}\n`;
          break;
      }
    }
    
    return compact;
  };

  // Handle custom prompt
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a diagram description');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setSelectedTemplate(null);
    
    try {
      const response = await fetch('/api/generate-drawing-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.drawing) {
        throw new Error('No drawing data received');
      }
      
      setDrawingData(data.drawing);
      
      // Parse and animate
      const elements = parseCompactFormat(data.drawing);
      await drawWithAnimation(elements);
      
      setIsGenerating(false);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message);
      setIsGenerating(false);
    }
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDrawingData(null);
    setSelectedTemplate(null);
    setPrompt('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Sharda Informatics" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Visual Whiteboard</h1>
                <p className="text-sm text-blue-100">Informatics360.ai - AI-Powered Diagrams</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">Create real-time animated diagrams with AI</p>
          
          <button
            onClick={handleClear}
            disabled={!drawingData}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Template Gallery */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Templates (Instant)</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template.id)}
                disabled={isGenerating}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={template.description}
              >
                <div className="text-3xl mb-1">{template.icon}</div>
                <div className="text-xs font-medium text-gray-700 text-center">
                  {template.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">✏️ Custom Diagram</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe the diagram you want... (e.g., 'solar system with 8 planets')"
              disabled={isGenerating}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? '⏳ Drawing...' : '🎨 Draw It!'}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">🖼️ Canvas</h2>
            {isGenerating && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Drawing in real-time...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border-2 border-gray-300 rounded-lg bg-white shadow-inner"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
