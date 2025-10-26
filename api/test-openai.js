import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export default async function handler(req, res) {
  console.log('🧪 === OPENAI TEST ENDPOINT ===');
  
  try {
    if (!openai) {
      return res.status(500).json({ 
        success: false,
        error: 'OpenAI not configured',
        hasKey: !!process.env.OPENAI_API_KEY
      });
    }
    
    // Try a simple test call
    console.log('🧪 Making test OpenAI call...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Say 'Hello, I am working!' in exactly those words."
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });
    
    console.log('✅ OpenAI test call successful');
    console.log('Response:', JSON.stringify(completion, null, 2));
    
    return res.status(200).json({
      success: true,
      message: 'OpenAI is working correctly',
      response: completion.choices?.[0]?.message?.content || 'NO CONTENT',
      fullResponse: completion
    });
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      type: error.type
    });
  }
}
