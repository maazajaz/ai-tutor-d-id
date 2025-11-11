import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Call OpenAI to analyze the text and generate diagram data or determine if image is better
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a visual content expert for educational content. Analyze the user's question and decide the best visual representation.

CRITICAL DECISION RULES:

1. USE DALL-E IMAGE GENERATION FOR:
   - Mathematical concepts/explanations (geometry, algebra, calculus, perimeter, area, volume)
   - Scientific processes/concepts (physics, chemistry, biology diagrams)
   - Educational explanations that need custom illustration
   - Abstract concepts that need visual representation
   - "How to calculate", "explain formula", "show process", "perimeter", "theorem"
   - Return: { "diagramType": "dalle_image", "imagePrompt": "educational illustration..." }

2. USE UNSPLASH/STOCK PHOTOS FOR:
   - Real-world objects, animals, places (lion, Eiffel Tower, butterfly)
   - Natural phenomena you can photograph (sunset, volcano, ocean)
   - Landmarks, buildings, landscapes
   - People, faces, everyday objects
   - Return: { "diagramType": "image", "imageQuery": "photo of..." }

3. USE TRADITIONAL DIAGRAMS FOR:
   - Step-by-step processes/algorithms (flowcharts)
   - Concept relationships (mindmaps)
   - Data comparisons (graphs)
   - Return: { "diagramType": "flowchart|mindmap|graph", "elements": [...] }

EXAMPLES:
✅ "perimeter of rectangle" → { "diagramType": "dalle_image", "imagePrompt": "educational diagram showing rectangle with labeled sides (length and width) and perimeter formula P=2(l+w)" }
✅ "photosynthesis process" → { "diagramType": "dalle_image", "imagePrompt": "scientific diagram of photosynthesis with labeled arrows showing CO2, sunlight, and O2" }
✅ "what does a lion look like" → { "diagramType": "image", "imageQuery": "realistic photo of lion in savanna" }
✅ "steps to make coffee" → { "diagramType": "flowchart", "elements": [...] }

Response format (MUST be valid JSON):
{
  "diagramType": "dalle_image|image|flowchart|mindmap|graph",
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

    console.log('✅ Generated visual data:', {
      type: result.diagramType,
      hasElements: !!result.elements,
      hasImageQuery: !!result.imageQuery,
      hasImagePrompt: !!result.imagePrompt
    });

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
