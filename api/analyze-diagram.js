// Import required dependencies
const { Configuration, OpenAIApi } = require('openai');

// Initialize OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
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

    // Get text from request body
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

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

    // Return the diagram description
    res.status(200).json({ diagram: diagramDescription });

  } catch (error) {
    console.error('Error in diagram analysis:', error);
    
    // Check if it's an OpenAI API error
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json({
        error: 'OpenAI API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
};
