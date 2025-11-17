import OpenAI from 'openai';
import { anatomyTemplates } from './anatomyTemplates.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Match template keywords
function matchAnatomyTemplate(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  const keywords = {
    'human-heart': ['heart', 'cardiac', 'atrium', 'ventricle', 'cardiovascular'],
    'human-brain': ['brain', 'cerebral', 'cortex', 'lobe', 'frontal', 'parietal', 'temporal', 'occipital'],
    'digestive-system': ['digest', 'stomach', 'intestine', 'esophagus', 'liver', 'pancreas', 'gastrointestinal'],
    'respiratory-system': ['respiratory', 'lung', 'bronchi', 'trachea', 'alveoli', 'breathing'],
    'plant-cell': ['plant cell', 'chloroplast', 'cell wall', 'vacuole', 'photosynthesis'],
    'dog-anatomy': ['dog', 'canine', 'puppy'],
    'eye-structure': ['eye', 'vision', 'retina', 'cornea', 'iris', 'lens', 'pupil', 'optic'],
    'atom-structure': ['atom', 'atomic', 'electron', 'proton', 'neutron', 'nucleus', 'orbital', 'shell'],
    'butterfly-lifecycle': ['butterfly', 'metamorphosis', 'caterpillar', 'chrysalis', 'pupa', 'lifecycle']
  };
  
  for (const [templateId, terms] of Object.entries(keywords)) {
    if (terms.some(term => lowerPrompt.includes(term))) {
      console.log(`✅ Matched template: ${templateId}`);
      return templateId;
    }
  }
  
  return null;
}

// Convert template to compact format
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
}

export default async function handler(req, res) {
  console.log('🔍 Diagram Analysis Request Received');
  console.log('Environment Check:', {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'missing',
    nodeEnv: process.env.NODE_ENV
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Ensure request method is POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Log request details
    console.log('📝 Request Body:', req.body);
    
    // Get text from request body
    const { chatText } = req.body;

    if (!chatText) {
      console.log('❌ Missing chatText in request');
      return res.status(400).json({ error: 'Chat text is required' });
    }
    
    console.log('📝 Processing text:', chatText);

    // 🚀 STEP 1: Check if this matches any anatomy template (INSTANT)
    const templateId = matchAnatomyTemplate(chatText);
    
    if (templateId && anatomyTemplates[templateId]) {
      console.log(`⚡ Using template ${templateId} - INSTANT rendering!`);
      const template = anatomyTemplates[templateId];
      const compactDrawing = convertTemplateToCompact(template);
      
      return res.status(200).json({
        diagramType: 'fast_drawing',
        drawing: compactDrawing,
        templateId: templateId,
        source: 'template',
        renderTime: '0ms'
      });
    }

    // STEP 2: Call OpenAI to analyze the text and generate diagram data or determine if image is better
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a visual content expert for educational content. Analyze the user's question and decide the best visual representation.

CRITICAL DECISION RULES:

1. USE FAST DRAWING FOR:
   - Anatomy diagrams (already handled by template matching, but you can request custom ones)
   - Scientific diagrams that need real-time animation
   - Educational sketches, flowcharts, concept maps
   - Simple geometric diagrams
   - Return: { "diagramType": "fast_drawing", "drawingPrompt": "describe what to draw..." }

2. USE DALL-E IMAGE GENERATION FOR:
   - Complex realistic scenes that can't be drawn simply
   - Photorealistic concepts that need detailed illustration
   - Complex composite images
   - When fast_drawing would be too abstract
   - Return: { "diagramType": "dalle_image", "imagePrompt": "educational illustration..." }

3. USE UNSPLASH/STOCK PHOTOS FOR:
   - Real-world objects, animals, places (lion, Eiffel Tower, butterfly)
   - Natural phenomena you can photograph (sunset, volcano, ocean)
   - Landmarks, buildings, landscapes
   - People, faces, everyday objects
   - Return: { "diagramType": "image", "imageQuery": "photo of..." }

4. USE TRADITIONAL DIAGRAMS FOR:
   - Step-by-step processes/algorithms (flowcharts)
   - Concept relationships (mindmaps)
   - Data comparisons (graphs)
   - Return: { "diagramType": "flowchart|mindmap|graph", "elements": [...] }

PRIORITY ORDER: fast_drawing (fastest) > traditional diagrams > dalle_image > stock photos

EXAMPLES:
✅ "perimeter of rectangle" → { "diagramType": "fast_drawing", "drawingPrompt": "rectangle with labeled sides (length and width) and formula P=2(l+w)" }
✅ "photosynthesis process" → { "diagramType": "fast_drawing", "drawingPrompt": "plant with arrows showing CO2, sunlight, water input and O2 output with labels" }
✅ "solar system" → { "diagramType": "fast_drawing", "drawingPrompt": "sun in center with 8 planets in orbit (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)" }
✅ "what does a lion look like" → { "diagramType": "image", "imageQuery": "realistic photo of lion in savanna" }
✅ "complex city skyline" → { "diagramType": "dalle_image", "imagePrompt": "detailed city skyline with modern buildings" }

Response format (MUST be valid JSON):
{
  "diagramType": "fast_drawing|dalle_image|image|flowchart|mindmap|graph",
  "drawingPrompt": "detailed description (only for fast_drawing)",
  "imagePrompt": "detailed DALL-E prompt (only for dalle_image)",
  "imageQuery": "search query (only for image)",
  "elements": [...] (only for flowchart/mindmap/graph)
}`
        }, {
          role: "user",
          content: `Analyze and determine best visual for: ${chatText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract and parse the JSON response
    const result = JSON.parse(completion.choices[0].message.content);
    
    // Validate the response format
    if (!result.diagramType) {
      throw new Error('Invalid response format from OpenAI - missing diagramType');
    }
    
    // For diagrams (flowchart/mindmap/graph), elements are required
    if (['flowchart', 'mindmap', 'graph', 'diagram'].includes(result.diagramType) && !Array.isArray(result.elements)) {
      throw new Error('Invalid response format from OpenAI - missing elements for diagram');
    }
    
    // For images, imageQuery is required
    if (result.diagramType === 'image' && !result.imageQuery) {
      throw new Error('Invalid response format from OpenAI - missing imageQuery for image type');
    }
    
    // For DALL-E images, imagePrompt is required
    if (result.diagramType === 'dalle_image' && !result.imagePrompt) {
      throw new Error('Invalid response format from OpenAI - missing imagePrompt for dalle_image type');
    }
    
    // For fast drawings, drawingPrompt is required
    if (result.diagramType === 'fast_drawing' && !result.drawingPrompt) {
      throw new Error('Invalid response format from OpenAI - missing drawingPrompt for fast_drawing type');
    }

    console.log('✅ Generated visual data:', {
      type: result.diagramType,
      hasElements: !!result.elements,
      hasImageQuery: !!result.imageQuery,
      hasImagePrompt: !!result.imagePrompt,
      hasDrawingPrompt: !!result.drawingPrompt
    });

    // 🚀 Handle fast_drawing type - Call our fast drawing API
    if (result.diagramType === 'fast_drawing' && result.drawingPrompt) {
      console.log('🎨 Generating fast drawing with prompt:', result.drawingPrompt);
      
      try {
        // Call our generate-drawing-fast endpoint
        const drawingResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/generate-drawing-fast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: result.drawingPrompt })
        });

        if (drawingResponse.ok) {
          const drawingData = await drawingResponse.json();
          console.log('✅ Fast drawing generated:', drawingData.approach);
          
          result.drawing = drawingData.drawing;
          result.source = drawingData.approach || 'gpt';
          result.renderTime = drawingData.generationTime || '1-2s';
          
        } else {
          console.error('❌ Fast drawing generation failed, falling back to DALL-E');
          // Fall back to DALL-E
          result.diagramType = 'dalle_image';
          result.imagePrompt = result.drawingPrompt;
        }
      } catch (drawingError) {
        console.error('❌ Failed to generate fast drawing:', drawingError);
        // Fall back to DALL-E
        result.diagramType = 'dalle_image';
        result.imagePrompt = result.drawingPrompt;
      }
    }

    // If it's an image type, fetch/generate the actual image
    if (result.diagramType === 'dalle_image' && result.imagePrompt) {
      console.log('🎨 Generating DALL-E image with prompt:', result.imagePrompt);
      
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: result.imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        const dalleUrl = imageResponse.data[0].url;
        const revisedPrompt = imageResponse.data[0].revised_prompt;
        
        console.log('✅ DALL-E image generated:', dalleUrl);
        
        // Download and convert to base64 to avoid CORS issues
        const imageBuffer = await fetch(dalleUrl).then(res => res.arrayBuffer());
        const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
        
        result.imageUrl = base64Image;
        result.imageSource = 'DALL-E 3';
        result.imageAttribution = 'Generated by DALL-E 3';
        result.revisedPrompt = revisedPrompt;
        
      } catch (imageError) {
        console.error('❌ Failed to generate DALL-E image:', imageError);
        // Fall back to diagram type
        result.diagramType = 'flowchart';
        result.elements = [
          { type: 'process', text: 'Image generation failed', x: 400, y: 100, width: 200, height: 60 }
        ];
      }
    } else if (result.diagramType === 'image' && result.imageQuery) {
      console.log('📸 Fetching Unsplash image for:', result.imageQuery);
      
      try {
        // Call Unsplash API (you need to add UNSPLASH_ACCESS_KEY to Vercel env)
        const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
        
        if (!unsplashKey) {
          console.warn('⚠️ Unsplash API key not configured, falling back to diagram');
          result.diagramType = 'flowchart';
          result.elements = [
            { type: 'process', text: result.imageQuery, x: 400, y: 100, width: 200, height: 60 }
          ];
        } else {
          const unsplashResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(result.imageQuery)}&per_page=1&orientation=landscape`,
            {
              headers: {
                'Authorization': `Client-ID ${unsplashKey}`
              }
            }
          );

          if (unsplashResponse.ok) {
            const unsplashData = await unsplashResponse.json();
            
            if (unsplashData.results && unsplashData.results.length > 0) {
              const photo = unsplashData.results[0];
              
              // Download and convert to base64
              const imageBuffer = await fetch(photo.urls.regular).then(res => res.arrayBuffer());
              const base64Image = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`;
              
              result.imageUrl = base64Image;
              result.imageSource = 'Unsplash';
              result.imageAttribution = `Photo by ${photo.user.name} on Unsplash`;
              result.imageAttributionUrl = photo.links.html;
              
              console.log('✅ Unsplash image fetched');
            } else {
              console.warn('⚠️ No Unsplash results found');
              result.diagramType = 'flowchart';
              result.elements = [
                { type: 'process', text: result.imageQuery, x: 400, y: 100, width: 200, height: 60 }
              ];
            }
          } else {
            console.error('❌ Unsplash API error:', unsplashResponse.status);
            result.diagramType = 'flowchart';
            result.elements = [
              { type: 'process', text: result.imageQuery, x: 400, y: 100, width: 200, height: 60 }
            ];
          }
        }
      } catch (imageError) {
        console.error('❌ Failed to fetch Unsplash image:', imageError);
        result.diagramType = 'flowchart';
        result.elements = [
          { type: 'process', text: result.imageQuery, x: 400, y: 100, width: 200, height: 60 }
        ];
      }
    }

    // Return the diagram data
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in diagram analysis:', error);
    
    // Detailed environment check on error
    console.error('🔑 Environment Check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });
    
    // Handle OpenAI API errors
    if (error.name === 'OpenAIError') {
      console.error('🔥 OpenAI Error:', {
        status: error.status,
        message: error.message,
        type: error.type,
        code: error.code
      });

      // Return appropriate error response based on error type
      if (error.status === 401) {
        return res.status(401).json({
          error: 'OpenAI API Authentication Error',
          message: 'Please check your API key configuration',
          code: error.code
        });
      }

      return res.status(error.status || 500).json({
        error: 'OpenAI API Error',
        message: error.message,
        type: error.type,
        code: error.code
      });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('🔥 Invalid JSON response from OpenAI');
      return res.status(500).json({
        error: 'Invalid API Response',
        message: 'Failed to parse diagram data from OpenAI response',
        details: error.message
      });
    }

    // Handle all other errors
    console.error('💥 Unhandled Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while generating the diagram',
      details: error.message
    });
  }
};
