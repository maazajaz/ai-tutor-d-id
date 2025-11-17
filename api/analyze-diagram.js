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
        compact += `circ:${element.x},${element.y},${element.radius},${element.color},${element.fill || 'none'}\n`;
        break;
      case 'ellipse':
        compact += `ell:${element.x},${element.y},${element.width},${element.height},${element.color},${element.fill || 'none'}\n`;
        break;
      case 'line':
        compact += `line:${element.x1},${element.y1},${element.x2},${element.y2},${element.color}\n`;
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

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/generate-drawing-fast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: chatText })
    });

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({
        diagramType: 'fast_drawing',
        drawing: data.drawing,
        source: data.approach
      });
    }
    
    throw new Error('Drawing API failed');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
