// Test endpoint to debug the generate-notes issue
export default async function handler(req, res) {
  console.log('🧪 === DEBUG ENDPOINT ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { messages } = req.body;
  
  // Show what we're receiving
  const debug = {
    timestamp: new Date().toISOString(),
    messagesReceived: messages?.length || 0,
    messages: messages?.map((m, i) => ({
      index: i,
      role: m.role,
      contentLength: m.content?.length || 0,
      contentPreview: m.content?.substring(0, 100) || 'EMPTY'
    })),
    environment: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'none',
      nodeEnv: process.env.NODE_ENV
    }
  };
  
  return res.status(200).json(debug);
}
