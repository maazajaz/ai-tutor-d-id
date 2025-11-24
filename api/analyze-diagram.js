import { anatomyTemplates } from './anatomyTemplates.js';

function matchAnatomyTemplate(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  const keywords = {
    'human-heart': ['heart', 'cardiac'],
    'human-brain': ['brain', 'cerebral'],
    'digestive-system': ['digest', 'stomach'],
    'respiratory-system': ['respiratory', 'lung'],
    'plant-cell': ['plant cell', 'chloroplast'],
    'dog-anatomy': ['dog', 'canine'],
    'eye-structure': ['eye', 'vision', 'retina'],
    'atom-structure': ['atom', 'electron'],
    'butterfly-lifecycle': ['butterfly', 'metamorphosis']
  };
  
  for (const [templateId, terms] of Object.entries(keywords)) {
    if (terms.some(term => lowerPrompt.includes(term))) {
      return templateId;
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

    const templateId = matchAnatomyTemplate(chatText);
    if (templateId && anatomyTemplates[templateId]) {
      const compact = convertTemplateToCompact(anatomyTemplates[templateId]);
      return res.status(200).json({
        diagramType: 'fast_drawing',
        drawing: compact,
        source: 'template'
      });
    }

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`;
    let response;
    try {
      response = await fetch(`${baseUrl}/api/generate-drawing-fast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatText })
      });
    } catch (fetchErr) {
      console.error('❌ Fetch to drawing API failed:', fetchErr);
      throw new Error(`Failed to contact drawing API: ${fetchErr.message}`);
    }

    if (response.ok) {
      const data = await response.json();
      
      // Check if elements array exists
      if (!data.elements || !Array.isArray(data.elements)) {
        console.error('Invalid response from drawing API:', data);
        throw new Error('Drawing API returned invalid format');
      }
      
      // Convert elements array to compact format string
      const drawing = data.elements.join('\n');
      return res.status(200).json({
        diagramType: 'fast_drawing',
        drawing: drawing,
        source: data.isTemplate ? 'template' : 'gpt'
      });
    }

    // Non-OK response: include status and body to help diagnose Vercel-only failures
    let respText = '';
    try {
      respText = await response.text();
    } catch (err) {
      respText = `<unable to read response body: ${err.message}>`;
    }
    console.error('❌ Drawing API returned non-OK:', response.status, respText);
    throw new Error(`Drawing API failed: ${response.status} ${respText}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
