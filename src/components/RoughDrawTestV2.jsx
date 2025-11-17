import React, { useRef, useEffect, useState } from 'react';
import rough from 'roughjs';

const RoughDrawTestV2 = () => {
  const canvasRef = useRef(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drawingData, setDrawingData] = useState(null);
  const [elementsDrawn, setElementsDrawn] = useState(0);

  const presetExamples = [
    { emoji: '📐', label: 'Triangle Area', prompt: 'area of triangle formula' },
    { emoji: '📏', label: 'Rectangle Perimeter', prompt: 'rectangle perimeter formula' },
    { emoji: '⭕', label: 'Circle Area', prompt: 'circle area formula' },
    { emoji: '🌍', label: 'Solar System', prompt: 'simple solar system with sun and planets' },
    { emoji: '💧', label: 'Water Cycle', prompt: 'water cycle diagram' },
    { emoji: '📊', label: 'Pythagorean Theorem', prompt: 'pythagorean theorem visual' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.fillStyle = '#666';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 Real-Time Drawing Canvas', 400, 280);
    ctx.font = '16px sans-serif';
    ctx.fillText('Select an example or type your own prompt', 400, 320);
  }, []);

  const generateDrawing = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setDrawingData(null);
    setElementsDrawn(0);

    // Clear canvas immediately
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);
    
    // Show "Generating..." message
    ctx.fillStyle = '#666';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 Generating drawing...', 400, 300);

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
      console.log('✅ Drawing data:', data);
      setDrawingData(data);
      
      // Draw with real-time animation
      await drawWithAnimation(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
      
      // Show error on canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❌ Error: ' + err.message, 400, 300);
    } finally {
      setLoading(false);
    }
  };

  const drawWithAnimation = async (data) => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.elements) return;

    const ctx = canvas.getContext('2d');
    const rc = rough.canvas(canvas);

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);

    // Draw elements one by one with real-time animation
    for (let i = 0; i < data.elements.length; i++) {
      const el = data.elements[i];
      setElementsDrawn(i + 1);
      
      try {
        // Parse compact format: "type:params"
        const [type, ...params] = el.split(':');
        
        switch (type) {
          case 'tri': { // triangle:x1,y1,x2,y2,x3,y3,color,fill
            const [x1,y1,x2,y2,x3,y3,color,fill] = params[0].split(',');
            rc.polygon(
              [[+x1,+y1], [+x2,+y2], [+x3,+y3]],
              {
                stroke: color || '#3b82f6',
                strokeWidth: 3,
                fill: fill || 'rgba(59,130,246,0.1)',
                fillStyle: 'hachure',
                roughness: 1.2
              }
            );
            break;
          }
          
          case 'rect': { // rect:x,y,w,h,color,fill
            const [x,y,w,h,color,fill] = params[0].split(',');
            rc.rectangle(+x, +y, +w, +h, {
              stroke: color || '#10b981',
              strokeWidth: 3,
              fill: fill || 'rgba(16,185,129,0.1)',
              fillStyle: 'hachure',
              roughness: 1.2
            });
            break;
          }
          
          case 'circ': { // circ:x,y,r,color,fill
            const [x,y,r,color,fill] = params[0].split(',');
            rc.circle(+x, +y, +r * 2, {
              stroke: color || '#f59e0b',
              strokeWidth: 3,
              fill: fill || 'rgba(245,158,11,0.1)',
              fillStyle: 'hachure',
              roughness: 1.2
            });
            break;
          }
          
          case 'line': { // line:x1,y1,x2,y2,color,width
            const [x1,y1,x2,y2,color,width] = params[0].split(',');
            rc.line(+x1, +y1, +x2, +y2, {
              stroke: color || '#ef4444',
              strokeWidth: +(width || 2),
              roughness: 1.2
            });
            break;
          }
          
          case 'arrow': { // arrow:x1,y1,x2,y2,color,label
            const parts = params[0].split(',');
            const [x1,y1,x2,y2,color] = parts.slice(0, 5);
            const label = parts.slice(5).join(',');
            
            // Draw line
            rc.line(+x1, +y1, +x2, +y2, {
              stroke: color || '#8b5cf6',
              strokeWidth: 2,
              roughness: 1.2
            });
            
            // Draw arrowhead
            const angle = Math.atan2(+y2 - +y1, +x2 - +x1);
            const size = 12;
            rc.polygon([
              [+x2, +y2],
              [+x2 - size * Math.cos(angle - Math.PI/6), +y2 - size * Math.sin(angle - Math.PI/6)],
              [+x2 - size * Math.cos(angle + Math.PI/6), +y2 - size * Math.sin(angle + Math.PI/6)]
            ], {
              fill: color || '#8b5cf6',
              stroke: color || '#8b5cf6',
              fillStyle: 'solid'
            });
            
            // Draw label
            if (label) {
              ctx.fillStyle = color || '#8b5cf6';
              ctx.font = 'bold 14px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(label, (+x1 + +x2) / 2, (+y1 + +y2) / 2 - 8);
            }
            break;
          }
          
          case 'txt': { // txt:x,y,size,color,text content
            const parts = params[0].split(',');
            const [x,y,size,color] = parts.slice(0, 4);
            const text = parts.slice(4).join(',');
            
            ctx.fillStyle = color || '#1f2937';
            ctx.font = `bold ${size || 16}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(text, +x, +y);
            break;
          }
          
          default:
            console.warn('Unknown type:', type);
        }
      } catch (err) {
        console.error('Draw error:', el, err);
      }
      
      // Small delay for animation effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.fillStyle = '#666';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 Real-Time Drawing Canvas', 400, 280);
    ctx.font = '16px sans-serif';
    ctx.fillText('Select an example or type your own prompt', 400, 320);
    
    setDrawingData(null);
    setError(null);
    setElementsDrawn(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          ⚡ Real-Time Drawing Test (Optimized)
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Instant hand-drawn educational diagrams with minimal tokens
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                📝 What to Draw?
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Draw simple solar system with sun and planets"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                rows={4}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={generateDrawing}
                  disabled={loading || !prompt.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? '⚡ Drawing...' : '🎨 Draw It!'}
                </button>
                <button
                  onClick={clearCanvas}
                  className="p-3 border-2 border-gray-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all"
                  title="Clear canvas"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                💡 Quick Examples
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {presetExamples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example.prompt)}
                    className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl hover:from-purple-100 hover:to-blue-100 transition-all text-left border border-purple-200"
                  >
                    <div className="text-2xl mb-1">{example.emoji}</div>
                    <div className="text-xs font-medium text-gray-700">{example.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel - Canvas */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                🖼️ Canvas Output
              </h2>
              {elementsDrawn > 0 && (
                <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                  ✅ {elementsDrawn} elements drawn
                </div>
              )}
            </div>
            
            <div className="border-4 border-gray-200 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ maxWidth: '100%' }}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-700 font-medium">❌ Error: {error}</p>
              </div>
            )}

            {loading && (
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-blue-700 font-medium animate-pulse">
                  ⚡ Generating and drawing in real-time...
                </p>
              </div>
            )}

            {drawingData && (
              <details className="mt-4">
                <summary className="cursor-pointer p-4 bg-gray-50 rounded-xl font-medium hover:bg-gray-100 transition-all flex items-center gap-2">
                  🔍 View Drawing Instructions (Compact Format)
                </summary>
                <div className="mt-2 p-4 bg-gray-900 rounded-xl overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(drawingData, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-3 text-green-900">⚡ Optimized Features:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-bold text-green-800 mb-1">🚀 Ultra Fast</div>
              <div className="text-gray-700">Compact format uses 80% fewer tokens than JSON</div>
            </div>
            <div>
              <div className="font-bold text-blue-800 mb-1">🎬 Real-Time Animation</div>
              <div className="text-gray-700">Shapes appear one by one as they're drawn</div>
            </div>
            <div>
              <div className="font-bold text-purple-800 mb-1">🎨 Hand-Drawn Style</div>
              <div className="text-gray-700">Educational sketchy look with Rough.js</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoughDrawTestV2;
