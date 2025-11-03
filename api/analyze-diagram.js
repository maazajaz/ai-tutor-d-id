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

    // Call OpenAI to analyze the text and generate diagram data
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a diagram generation expert. Analyze the user's question and generate appropriate diagram data.

Rules:
1. Determine the best diagram type: flowchart, mindmap, graph, or diagram
2. Extract or generate relevant elements from the question
3. For flowcharts: Create 5-8 sequential steps
4. For mindmaps: Create a center concept and 4-7 related nodes  
5. For graphs: Create 4-6 data points with values
6. Return ONLY valid JSON, no markdown or explanation

Response format:
{
  "diagramType": "flowchart|mindmap|graph|diagram",
  "elements": [
    // For flowchart: {"text": "step description", "type": "step"}
    // For mindmap: {"text": "concept", "type": "center|node"}  
    // For graph: {"text": "label", "value": 50, "type": "bar"}
  ]
}`
        }, {
          role: "user",
          content: `Generate diagram for: ${chatText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract and parse the JSON response
    const result = JSON.parse(completion.choices[0].message.content);
    
    // Validate the response format
    if (!result.diagramType || !Array.isArray(result.elements)) {
      throw new Error('Invalid response format from OpenAI');
    }

    console.log('✅ Generated diagram data:', {
      type: result.diagramType,
      elementCount: result.elements.length
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
