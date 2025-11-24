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
    // Handle compact string format: { txt: "x,y,size,color,text", circ: "...", arrow: "..." }
    // Process ALL properties in the element, not just the first one
    let processed = false;
    
    if (element.txt && typeof element.txt === 'string') {
      compact += `txt:${element.txt}\n`;
      processed = true;
    }
    if (element.tri && typeof element.tri === 'string') {
      compact += `tri:${element.tri}\n`;
      processed = true;
    }
    if ((element.circ || element.circle) && typeof (element.circ || element.circle) === 'string') {
      compact += `circ:${element.circ || element.circle}\n`;
      processed = true;
    }
    if (element.line && typeof element.line === 'string') {
      compact += `line:${element.line}\n`;
      processed = true;
    }
    if (element.arrow && typeof element.arrow === 'string') {
      compact += `arrow:${element.arrow}\n`;
      processed = true;
    }
    if (element.rect && typeof element.rect === 'string') {
      compact += `rect:${element.rect}\n`;
      processed = true;
    }
    if ((element.ell || element.ellipse) && typeof (element.ell || element.ellipse) === 'string') {
      compact += `ell:${element.ell || element.ellipse}\n`;
      processed = true;
    }
    
    // If we processed string properties, continue to next element
    if (processed) continue;
    
    // Handle array-based format: { txt: [x, y, size, color, text] }
    if (element.txt && Array.isArray(element.txt)) {
      const [x, y, size, color, text] = element.txt;
      compact += `txt:${x},${y},${size},${color},${text}\n`;
      continue;
    }
    if (element.tri && Array.isArray(element.tri)) {
      const [x1, y1, x2, y2, x3, y3, stroke, fill] = element.tri;
      compact += `tri:${x1},${y1},${x2},${y2},${x3},${y3},${stroke},${fill}\n`;
      continue;
    }
    if ((element.circ || element.circle) && Array.isArray(element.circ || element.circle)) {
      const arr = element.circ || element.circle;
      const [x, y, r, stroke, fill] = arr;
      compact += `circ:${x},${y},${r},${stroke},${fill}\n`;
      continue;
    }
    if (element.line && Array.isArray(element.line)) {
      const [x1, y1, x2, y2, color] = element.line;
      compact += `line:${x1},${y1},${x2},${y2},${color}\n`;
      continue;
    }
    if (element.arrow && Array.isArray(element.arrow)) {
      const [x1, y1, x2, y2, color] = element.arrow;
      compact += `arrow:${x1},${y1},${x2},${y2},${color}\n`;
      continue;
    }
    if (element.rect && Array.isArray(element.rect)) {
      const [x, y, w, h, stroke, fill] = element.rect;
      compact += `rect:${x},${y},${w},${h},${stroke},${fill}\n`;
      continue;
    }
    if ((element.ell || element.ellipse) && Array.isArray(element.ell || element.ellipse)) {
      const arr = element.ell || element.ellipse;
      const [x, y, w, h, stroke, fill] = arr;
      compact += `ell:${x},${y},${w},${h},${stroke},${fill}\n`;
      continue;
    }
    
    // Fallback to old object-based format
    const elementType = element.type?.toLowerCase();
    
    switch (elementType) {
      case 'circle':
      case 'circ':
        // Handle both 'r' and 'radius' property names
        const radius = element.r || element.radius;
        compact += `circ:${element.x},${element.y},${radius},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
      case 'ellipse':
      case 'ell':
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
      case 'txt':
        // Parser format: txt:x,y,size,color,text (text at end to handle spaces)
        compact += `txt:${element.x},${element.y},${element.size || 12},${element.color},${element.text}\n`;
        break;
      case 'path':
        const pathCoords = element.points.map(p => `${p[0]},${p[1]}`).join(',');
        compact += `path:${pathCoords},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
      case 'rect':
      case 'rectangle':
        compact += `rect:${element.x},${element.y},${element.width},${element.height},${element.stroke || element.color},${element.fill || 'none'}\n`;
        break;
      default:
        console.warn('⚠️ Unknown element type:', elementType, 'Element:', element);
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
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured in environment variables');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

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
          content: `You are an expert at creating ACCURATE educational diagrams using ULTRA COMPACT notation.

Canvas: 800x600 (origin top-left)

COMPACT FORMAT - Each element object can have MULTIPLE shapes:
{
  "circ": "x,y,radius,stroke,fill",
  "txt": "x,y,size,color,text",
  "arrow": "x1,y1,x2,y2,color,label"
}

Available shapes:
- circ:x,y,radius,stroke,fill                  → circle
- rect:x,y,w,h,stroke,fill                     → rectangle  
- tri:x1,y1,x2,y2,x3,y3,stroke,fill           → triangle
- line:x1,y1,x2,y2,color                       → line
- arrow:x1,y1,x2,y2,color,label text           → arrow with label
- txt:x,y,size,color,text content              → text

CRITICAL DIAGRAM RULES:

1. **ACCURATE CONTENT**: Show the CORRECT scientific/educational information
   - Human evolution: Primates → Australopithecus → Homo Habilis → Homo Erectus → Homo Sapiens (with proper timeline/flow)
   - Solar system: Sun (center) → 8 planets in CORRECT ORDER with relative sizes
   - Cell structure: Show REAL organelles (nucleus, mitochondria, etc.)
   - Water cycle: Evaporation → Condensation → Precipitation → Collection (proper cycle)

2. **LOGICAL LAYOUT**:
   - Timeline/Evolution: LEFT to RIGHT or TOP to BOTTOM with arrows showing progression
   - Cycles: Circular arrangement with arrows forming a complete loop
   - Hierarchies: Tree structure with parent at top, children below
   - Comparisons: Side-by-side with clear labels

3. **PROPER SPACING**:
   - Leave 80-100px between major elements
   - Keep 50px margins from canvas edges
   - Use full 800x600 canvas - spread elements out!
   - Text BELOW circles (y + radius + 20)

4. **COLOR & VISIBILITY**:
   - NEVER use white text (#fff) - invisible on white canvas!
   - Text color: #1f2937 (dark gray) or #000 (black)
   - Different colors for different stages/types
   - Fills: use "20" suffix for 20% opacity (e.g., #3b82f620)

5. **CONNECTIONS**:
   - Use arrows to show flow/progression/relationships
   - Arrow labels should explain the transition
   - Make cause-effect relationships clear

EXAMPLE - Human Evolution (LEFT to RIGHT):
[
  { "circ": "150,300,30,#1f2937,#3b82f620", "txt": "150,340,14,#1f2937,Primates" },
  { "arrow": "180,300,270,300,#1f2937,Evolution" },
  { "circ": "300,300,30,#1f2937,#10b98120", "txt": "300,340,14,#1f2937,Australopithecus" },
  { "arrow": "330,300,420,300,#1f2937,2-4 million years" },
  { "circ": "450,300,30,#1f2937,#f59e0b20", "txt": "450,340,14,#1f2937,Homo Habilis" },
  { "arrow": "480,300,570,300,#1f2937,Tool use" },
  { "circ": "600,300,30,#1f2937,#ef444420", "txt": "600,340,14,#1f2937,Homo Sapiens" }
]

Colors: #3b82f6(blue) #10b981(green) #f59e0b(orange) #ef4444(red) #8b5cf6(purple) #1f2937(dark)

Return ONLY valid JSON. NO comments, NO markdown, just pure JSON with title and elements array!`
        },
        {
          role: 'user',
          content: `Create an ACCURATE, EDUCATIONAL diagram for: ${chatText}\n\nShow the correct information with logical layout and clear connections. Return ONLY JSON.`
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
    
    // Log first few elements to debug
    console.log('🔍 First 3 elements:', JSON.stringify(drawingData.elements.slice(0, 3), null, 2));
    console.log('🔍 Element types:', drawingData.elements.slice(0, 3).map(el => typeof el));
    
    // Process elements - they might be strings or objects
    const processedElements = drawingData.elements.map((el, idx) => {
      console.log(`🔧 Processing element ${idx}:`, typeof el, el);
      
      // If it's already a string in compact format, use it directly
      if (typeof el === 'string') {
        console.log(`✅ Element ${idx} is string:`, el);
        return el;
      }
      
      // If it's an object, try to convert it
      if (typeof el === 'object' && el !== null) {
        console.log(`🔄 Converting element ${idx}:`, JSON.stringify(el));
        const converted = convertTemplateToCompact({ elements: [el] });
        console.log(`🔄 Conversion result ${idx}:`, converted);
        if (converted && converted.trim().length > 0) {
          console.log(`✅ Element ${idx} converted:`, converted.trim());
          return converted.trim();
        }
        console.warn(`⚠️ Failed to convert element ${idx}:`, el);
        return null;
      }
      
      console.warn(`⚠️ Element ${idx} is neither string nor object:`, typeof el);
      return null;
    }).filter(Boolean);
    
    console.log('✅ Processed', processedElements.length, 'elements out of', drawingData.elements.length);
    
    const drawing = processedElements.join('\n');
    
    if (!drawing || drawing.trim().length === 0) {
      console.error('❌ No valid elements! Original:', JSON.stringify(drawingData.elements, null, 2));
      return res.status(500).json({ error: 'Failed to generate valid drawing data' });
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
