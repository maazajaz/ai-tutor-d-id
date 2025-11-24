import OpenAI from 'openai';
import { anatomyTemplates } from './anatomyTemplates.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function matchAnatomyTemplate(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const keywords = {
    'human-heart': ['heart', 'cardiac', 'atrium', 'ventricle', 'cardiovascular'],
    'human-brain': ['brain', 'cerebral', 'lobe', 'frontal', 'cerebellum', 'neural'],
    'digestive-system': ['digestive', 'stomach', 'intestine', 'digestion', 'gut', 'esophagus'],
    'respiratory-system': ['respiratory', 'lung', 'breathing', 'trachea', 'bronchi', 'respiration'],
    'plant-cell': ['plant cell', 'chloroplast', 'vacuole', 'cell wall', 'plant structure'],
    'dog-anatomy': ['dog', 'dog body', 'dog anatomy', 'dog parts', 'canine'],
    'eye-structure': ['eye', 'eye structure', 'vision', 'retina', 'cornea', 'iris', 'pupil'],
    'atom-structure': ['atom', 'atom structure', 'proton', 'neutron', 'electron', 'nucleus', 'atomic'],
    'butterfly-lifecycle': ['butterfly', 'butterfly life cycle', 'metamorphosis', 'caterpillar', 'chrysalis', 'pupa']
  };
  
  for (const [templateId, terms] of Object.entries(keywords)) {
    if (terms.some(term => lowerPrompt.includes(term))) {
      return anatomyTemplates[templateId];
    }
  }
  return null;
}

function convertTemplateToCompact(template) {
  let compact = '';
  for (const element of template.elements) {
    switch (element.type) {
      case 'circle':
        // Handle both 'r' and 'radius' property names
        const radius = element.r || element.radius;
        compact += `circ:${element.x},${element.y},${radius},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
      case 'ellipse':
        // rx/ry are radii, parser expects width/height (diameters)
        // Convert: width = rx * 2, height = ry * 2
        const width = (element.rx || element.width) * 2;
        const height = (element.ry || element.height) * 2;
        compact += `ell:${element.x},${element.y},${width},${height},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
      case 'line':
        compact += `line:${element.x1},${element.y1},${element.x2},${element.y2},${element.stroke || element.color}\n`;
        break;
      case 'arrow':
        compact += `arrow:${element.x1},${element.y1},${element.x2},${element.y2},${element.color}\n`;
        break;
      case 'text':
        // Parser format: txt:x,y,size,color,text (text at end to handle spaces)
        compact += `txt:${element.x},${element.y},${element.size || 12},${element.color},${element.text}\n`;
        break;
      case 'path':
        const pathCoords = element.points.map(p => `${p[0]},${p[1]}`).join(',');
        compact += `path:${pathCoords},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
      case 'rect':
        compact += `rect:${element.x},${element.y},${element.width},${element.height},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
    }
  }
  return compact;
}

function detectComplexDiagram(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  const complexKeywords = [
    'anatomy', 'biological', 'organ', 'cell', 'tissue',
    'nervous system', 'circulatory', 'skeletal', 'muscular',
    'kidney', 'liver', 'eye structure', 'ear structure',
    'dna', 'molecule', 'chemical structure', 'atom',
    'detailed', 'cross-section', 'internal structure',
    'photosynthesis', 'cellular respiration', 'mitosis', 'meiosis',
    'animal', 'dog', 'cat', 'bird', 'fish', 'mammal', 'reptile',
    'body parts', 'organism', 'creature', 'species'
  ];
  
  const simpleKeywords = [
    'solar system', 'water cycle', 'life cycle', 'food chain',
    'triangle', 'circle', 'rectangle', 'square', 'perimeter', 'area',
    'simple', 'basic', 'diagram', 'chart', 'flow'
  ];
  
  if (simpleKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return false;
  }
  
  if (complexKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return true;
  }
  
  return false;
}

function convertTemplateToCompactFormat(elements) {
  return elements.map(el => {
    switch (el.type) {
      case 'circle':
        return `circ:${el.x},${el.y},${el.r},${el.stroke},${el.fill}`;
      case 'ellipse':
        return `ellipse:${el.x},${el.y},${el.rx},${el.ry},${el.stroke},${el.fill}`;
      case 'rect':
        return `rect:${el.x},${el.y},${el.width},${el.height},${el.stroke},${el.fill}`;
      case 'line':
        return `line:${el.x1},${el.y1},${el.x2},${el.y2},${el.stroke},${el.strokeWidth}`;
      case 'arrow':
        return `arrow:${el.x1},${el.y1},${el.x2},${el.y2},${el.color},${el.label || ''}`;
      case 'text':
        return `txt:${el.x},${el.y},${el.size},${el.color},${el.text}`;
      case 'path':
        const pointsStr = el.points.map(p => `${p[0]},${p[1]}`).join(',');
        return `path:${pointsStr}:${el.stroke}:${el.fill || 'none'}:${el.strokeWidth}`;
      default:
        return null;
    }
  }).filter(Boolean);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { chatText } = req.body;
    if (!chatText) {
      return res.status(400).json({ error: 'Chat text required' });
    }

    // Check for pre-built anatomy template first
    const anatomyTemplate = matchAnatomyTemplate(chatText);
    if (anatomyTemplate) {
      console.log('📋 Using pre-defined template:', anatomyTemplate.title);
      const compact = convertTemplateToCompact(anatomyTemplate);
      return res.status(200).json({
        diagramType: 'fast_drawing',
        drawing: compact,
        source: 'template',
        templateId: anatomyTemplate.title
      });
    }

    // No template match - generate via OpenAI
    console.log('🎨 Generating drawing via OpenAI (compact format):', chatText);

    const isComplexDiagram = detectComplexDiagram(chatText);
    const model = isComplexDiagram ? "gpt-4" : "gpt-3.5-turbo";
    const maxTokens = isComplexDiagram ? 1200 : 800;
    
    console.log(`🤖 Using ${model} (${isComplexDiagram ? 'complex' : 'simple'} diagram)`);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating DETAILED educational diagrams using ULTRA COMPACT notation.

Canvas: 800x600 (origin top-left)

COMPACT FORMAT:
- tri:x1,y1,x2,y2,x3,y3,stroke,fill           → triangle
- rect:x,y,w,h,stroke,fill                     → rectangle  
- circ:x,y,radius,stroke,fill                  → circle
- line:x1,y1,x2,y2,color,width                 → line
- arrow:x1,y1,x2,y2,color,label text           → arrow with label
- txt:x,y,size,color,text content              → text

CRITICAL LAYOUT RULES:
1. NEVER use white (#fff or #ffffff) for text - it's invisible on white canvas!
2. Use dark colors for text: #1f2937 (dark gray), #000 (black), or matching element color
3. For cycles/processes, ALWAYS add arrows between elements to show flow
4. SPACE OUT elements properly - don't overlap! Use the full 800x600 canvas
5. For solar system: place sun at center, planets spread out horizontally (NO orbit arrows needed)
6. For life cycles: arrange in circle/square pattern with good spacing and connecting arrows
7. Leave margins: keep elements at least 50px from edges
8. Keep diagrams simple and clear - avoid unnecessary decorative elements

SPACING EXAMPLES:
- Solar system: Sun at (400,300), planets at (240,300), (300,300), (360,300), (440,300), (520,300), (600,300), (670,300), (730,300) etc.
- Life cycle: corners like (200,150), (600,150), (600,450), (200,450)
- Vertical flow: top (400,100), middle (400,300), bottom (400,500)

IMPORTANT: When asked for solar system, include ALL 8 PLANETS in order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune

Colors: #3b82f6(blue) #10b981(green) #f59e0b(orange) #ef4444(red) #8b5cf6(purple) #1f2937(dark)
Fills: Add "20" for 20% opacity (e.g., #3b82f620)

Return ONLY compact JSON. Make it DETAILED and EDUCATIONAL with proper spacing and connections!
DO NOT add comments like // in the JSON - return pure JSON only.`
        },
        {
          role: 'user',
          content: `Create compact drawing for: ${chatText}\n\nReturn ONLY JSON with title and elements array (compact format).`
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    });

    const content = completion.choices[0].message.content.trim();
    
    // Remove markdown if present
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
    }
    
    // Remove JSON comments (// ...) that GPT sometimes adds
    jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');

    let drawingData;
    try {
      drawingData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ Parse error:', jsonStr);
      return res.status(500).json({ 
        error: 'Failed to parse OpenAI response',
        details: parseError.message
      });
    }

    if (!drawingData.elements || !Array.isArray(drawingData.elements)) {
      console.error('❌ Invalid response from OpenAI:', drawingData);
      return res.status(500).json({ error: 'OpenAI returned invalid format' });
    }

    console.log('✅ Drawing generated:', drawingData.title, `(${drawingData.elements.length} elements)`);
    
    // Check if we need to convert from object format to compact string format
    const needsConversion = drawingData.elements.some(el => typeof el === 'object' && el !== null);
    
    let drawing;
    if (needsConversion) {
      console.log('🔄 Converting object elements to compact format...');
      // OpenAI returned structured objects, convert the whole template at once
      drawing = convertTemplateToCompact({ elements: drawingData.elements });
    } else {
      // Elements are already strings in compact format
      console.log('✅ Elements already in compact string format');
      drawing = drawingData.elements.join('\n');
    }
    
    console.log('🔍 Final drawing (first 200 chars):', drawing.substring(0, 200));
    console.log('🔍 Drawing type:', typeof drawing);
    console.log('🔍 Drawing is string?', typeof drawing === 'string');
    
    return res.status(200).json({
      diagramType: 'fast_drawing',
      drawing: drawing,
      source: 'gpt'
    });
    
  } catch (error) {
    console.error('❌ Error in analyze-diagram:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
