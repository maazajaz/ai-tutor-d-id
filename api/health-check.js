// Simple health check endpoint to verify OpenAI configuration
export default async function handler(req, res) {
  console.log('🔍 Health Check Endpoint Hit');
  
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const keyLength = process.env.OPENAI_API_KEY?.length || 0;
  const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || 'none';
  
  console.log('OpenAI Key Present:', hasOpenAI);
  console.log('Key Length:', keyLength);
  console.log('Key Prefix:', keyPrefix);
  
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    openai: {
      configured: hasOpenAI,
      keyLength: keyLength,
      keyPrefix: keyPrefix,
      message: hasOpenAI 
        ? '✅ OpenAI API key is configured' 
        : '❌ OpenAI API key is NOT configured'
    }
  });
}
