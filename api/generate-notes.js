import OpenAI from "openai";

// Initialize OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export default async function handler(req, res) {
  console.log('📝 === NOTES GENERATION SERVERLESS FUNCTION ===');
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request received at:', new Date().toISOString());
  console.log('🔑 OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
  console.log('🔑 OpenAI client initialized:', !!openai);
  console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, chatTitle } = req.body;
    
    console.log('📝 Generating notes from', messages?.length || 0, 'messages');
    console.log('📝 Chat title:', chatTitle);
    
    if (!messages || messages.length === 0) {
      console.error('❌ No messages provided');
      return res.status(400).json({ error: 'No chat history provided' });
    }

    if (!openai) {
      console.error('❌ OpenAI client not initialized');
      console.error('❌ API Key present:', !!process.env.OPENAI_API_KEY);
      console.error('❌ API Key length:', process.env.OPENAI_API_KEY?.length || 0);
      
      return res.status(500).json({ 
        error: 'OpenAI API not configured',
        details: 'OPENAI_API_KEY environment variable is missing or invalid',
        hasKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0
      });
    }

    // Prepare conversation context
    const conversationContext = messages.map(m => 
      `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`
    ).join('\n\n');
    
    console.log('📋 Conversation context length:', conversationContext.length);

    // Generate notes using OpenAI
    console.log('🤖 Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert note-taker for students. Create comprehensive, well-structured notes from the following conversation between a student and an AI tutor.

Format the notes in Markdown with:
- A clear title
- Session overview with key statistics
- Main topics covered
- Key concepts explained (in bullet points)
- Important code examples (if any, in code blocks)
- Key takeaways
- Suggested next steps for learning

Make the notes clear, concise, and easy to review for studying.`
        },
        {
          role: "user",
          content: `Create study notes from this learning session:\n\n${conversationContext}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const notes = completion.choices[0].message.content;
    console.log('✅ Notes generated successfully');
    console.log('📝 Notes length:', notes?.length || 0);
    console.log('📝 Notes preview:', notes?.substring(0, 200) || 'NO CONTENT');
    
    // Validate notes content
    if (!notes || notes.trim().length === 0) {
      console.error('⚠️ OpenAI returned empty notes');
      return res.status(500).json({ 
        error: 'Generated notes are empty',
        details: 'OpenAI API returned an empty response',
        rawResponse: completion
      });
    }
    
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .json({ notes });
    
  } catch (error) {
    console.error('❌ === NOTES GENERATION ERROR ===');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error stack:', error.stack);
    
    // Check for specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(500).json({ 
        error: 'OpenAI API quota exceeded',
        details: 'Your OpenAI API key has exceeded its quota.',
        type: 'QuotaError'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ 
        error: 'Invalid OpenAI API key',
        details: 'The OpenAI API key is invalid or expired.',
        type: 'AuthenticationError'
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Unknown error',
      details: error.code || error.type || 'No additional details',
      type: error.name || 'UnknownError',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      hasOpenAI: !!openai,
      hasApiKey: !!process.env.OPENAI_API_KEY
    });
  }
}
