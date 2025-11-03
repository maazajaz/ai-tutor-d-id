// Import required dependencies
const { Configuration, OpenAIApi } = require('openai');

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'project',
  },
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
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
    const { text } = req.body;

    if (!text) {
      console.log('❌ Missing text in request');
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log('📝 Processing text:', text);

    // Call OpenAI to analyze the text and generate diagram description
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a diagram generation expert. Analyze the given text and create a structured representation that can be converted into a Mermaid diagram. Focus on:
          1. Relationships between concepts
          2. Process flows
          3. Component hierarchies
          4. State transitions
          Output only valid Mermaid diagram syntax.`
        },
        {
          role: 'user',
          content: `Create a Mermaid diagram for this concept: ${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract the diagram description from the response
    const diagramDescription = completion.data.choices[0].message.content.trim();
    console.log('✅ Generated diagram:', diagramDescription.substring(0, 100) + '...');

    // Return the diagram description
    res.status(200).json({ diagram: diagramDescription });

  } catch (error) {
    console.error('❌ Error in diagram analysis:', error);
    
    // Detailed environment check
    console.error('🔑 Environment Check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      keyType: process.env.OPENAI_API_KEY ? 'sk-' + process.env.OPENAI_API_KEY.substring(3, 6) : 'missing',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });
    
    // Check if it's an OpenAI API error
    if (error.response) {
      const errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: {
          ...error.response.headers,
          authorization: error.response.headers?.authorization ? '[REDACTED]' : 'missing'
        }
      };
      
      console.error('🔥 OpenAI API Error:', errorDetails);
      
      // Return specific error message based on status
      if (error.response.status === 401) {
        return res.status(401).json({
          error: 'OpenAI API Authentication Error',
          message: 'Please check your API key configuration'
        });
      }
      
      res.status(error.response.status).json({
        error: 'OpenAI API error',
        details: errorDetails,
        message: error.response.statusText
      });
    } else {
      // Log non-API errors with stack trace
      console.error('💥 Non-API Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      
      res.status(500).json({
        error: 'Internal server error',
        name: error.name,
        message: error.message,
        hint: 'Check server logs for more details'
      });
    }
  }
};
