import React, { useRef, useEffect, useState } from 'react';
import rough from 'roughjs';

const RoughDrawTest = () => {
  const canvasRef = useRef(null);
  const [prompt, setPrompt] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState(null);
  const [drawingInstructions, setDrawingInstructions] = useState(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw welcome text
    ctx.fillStyle = '#666666';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 Real-Time Drawing Test', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '14px Arial';
    ctx.fillText('Type a math concept or shape below to test', canvas.width / 2, canvas.height / 2 + 10);
  }, []);

  // Draw based on instructions
  const drawWithRough = (instructions) => {
    const canvas = canvasRef.current;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      instructions.elements.forEach((element) => {
        switch (element.type) {
          case 'triangle':
            rc.polygon(element.points, {
              stroke: element.color || '#000000',
              strokeWidth: element.strokeWidth || 2,
              fill: element.fill || 'transparent',
              fillStyle: 'hachure',
            });
            break;

          case 'rectangle':
            rc.rectangle(element.x, element.y, element.width, element.height, {
              stroke: element.color || '#000000',
              strokeWidth: element.strokeWidth || 2,
              fill: element.fill || 'transparent',
              fillStyle: 'hachure',
            });
            break;

          case 'circle':
            rc.circle(element.x, element.y, element.radius * 2, {
              stroke: element.color || '#000000',
              strokeWidth: element.strokeWidth || 2,
              fill: element.fill || 'transparent',
              fillStyle: 'hachure',
            });
            break;

          case 'line':
            rc.line(element.x1, element.y1, element.x2, element.y2, {
              stroke: element.color || '#000000',
              strokeWidth: element.strokeWidth || 2,
            });
            break;

          case 'arrow':
            // Draw line
            rc.line(element.x1, element.y1, element.x2, element.y2, {
              stroke: element.color || '#000000',
              strokeWidth: element.strokeWidth || 2,
            });
            // Draw arrowhead
            const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1);
            const arrowSize = 15;
            rc.line(
              element.x2,
              element.y2,
              element.x2 - arrowSize * Math.cos(angle - Math.PI / 6),
              element.y2 - arrowSize * Math.sin(angle - Math.PI / 6),
              { stroke: element.color || '#000000', strokeWidth: element.strokeWidth || 2 }
            );
            rc.line(
              element.x2,
              element.y2,
              element.x2 - arrowSize * Math.cos(angle + Math.PI / 6),
              element.y2 - arrowSize * Math.sin(angle + Math.PI / 6),
              { stroke: element.color || '#000000', strokeWidth: element.strokeWidth || 2 }
            );
            break;

          case 'text':
            ctx.fillStyle = element.color || '#000000';
            ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
            ctx.textAlign = element.align || 'left';
            ctx.fillText(element.text, element.x, element.y);
            break;

          case 'arc':
            rc.arc(
              element.x,
              element.y,
              element.width,
              element.height,
              element.start,
              element.stop,
              element.closed || false,
              {
                stroke: element.color || '#000000',
                strokeWidth: element.strokeWidth || 2,
              }
            );
            break;

          default:
            console.warn('Unknown element type:', element.type);
        }
      });

      console.log('✅ Drawing complete:', instructions.elements.length, 'elements');
    } catch (err) {
      console.error('❌ Drawing error:', err);
      setError(`Drawing error: ${err.message}`);
    }
  };

  // Generate drawing with AI
  const generateDrawing = async () => {
    if (!prompt.trim()) return;

    setIsDrawing(true);
    setError(null);
    setDrawingInstructions(null);

    try {
      const response = await fetch('/api/generate-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎨 Drawing instructions received:', data);

      setDrawingInstructions(data);
      drawWithRough(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setIsDrawing(false);
    }
  };

  // Preset examples
  const examples = [
    { label: '📐 Triangle Area', prompt: 'Draw a triangle with base and height labeled, show area formula' },
    { label: '📏 Rectangle Perimeter', prompt: 'Draw a rectangle with length and width labeled, show perimeter formula' },
    { label: '⭕ Circle Area', prompt: 'Draw a circle with radius labeled, show area and circumference formulas' },
    { label: '🌍 Solar System', prompt: 'Draw simple solar system with sun and planets' },
    { label: '🧬 Water Cycle', prompt: 'Draw water cycle with evaporation, condensation, precipitation' },
    { label: '📊 Pythagorean Theorem', prompt: 'Draw right triangle showing a² + b² = c²' },
  ];

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawingInstructions(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎨 Real-Time Drawing Test
          </h1>
          <p className="text-gray-600">
            Powered by Rough.js + GPT-4 • Instant Educational Diagrams
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Input */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📝 What to Draw?
              </h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'area of triangle with labels' or 'solar system diagram'"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                rows={4}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={generateDrawing}
                  disabled={isDrawing || !prompt.trim()}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                    isDrawing || !prompt.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg'
                  }`}
                >
                  {isDrawing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Drawing...
                    </span>
                  ) : (
                    '🎨 Draw It!'
                  )}
                </button>
                <button
                  onClick={clearCanvas}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Examples */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                💡 Quick Examples
              </h3>
              <div className="space-y-2">
                {examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example.prompt)}
                    className="w-full text-left px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-lg transition-colors text-sm"
                  >
                    <span className="font-medium">{example.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                ⚡ Why This is Fast
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ No image generation (0.5s vs 15s)</li>
                <li>✅ Hand-drawn educational style</li>
                <li>✅ Editable & scalable vectors</li>
                <li>✅ Works offline once loaded</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  🖼️ Canvas Output
                </h3>
                {drawingInstructions && (
                  <span className="text-sm text-green-600 font-medium">
                    ✅ {drawingInstructions.elements?.length || 0} elements drawn
                  </span>
                )}
              </div>

              {/* Canvas */}
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  style={{ maxWidth: '800px', display: 'block', margin: '0 auto' }}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">
                    <strong>❌ Error:</strong> {error}
                  </p>
                </div>
              )}

              {/* JSON Output (Debug) */}
              {drawingInstructions && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                    🔍 View Drawing Instructions (JSON)
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(drawingInstructions, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoughDrawTest;
