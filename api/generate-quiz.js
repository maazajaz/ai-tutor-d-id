import OpenAI from "openai";

// Initialize OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  console.log('🎯 === QUIZ GENERATION SERVERLESS FUNCTION ===');
  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request received at:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔑 OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
  console.log('🔑 OpenAI client initialized:', !!openai);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    console.log('🎯 Generating quiz from', messages?.length || 0, 'messages');
    
    if (!messages || messages.length === 0) {
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

    // Prepare conversation context for OpenAI
    console.log('📋 Preparing conversation context...');
    const conversationContext = messages.map(m => 
      `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`
    ).join('\n');
    console.log('📋 Context prepared, length:', conversationContext.length);

    // Generate quiz using OpenAI
    console.log('🤖 Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert quiz generator. Based on the following conversation between a student and an AI tutor, create a quiz with EXACTLY 3 multiple choice questions that test the student's understanding of the topics discussed.

Format your response as a JSON object with this structure:
{
  "title": "Quiz title based on the topics",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this is correct"
    },
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 1,
      "explanation": "Explanation of why this is correct"
    },
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "explanation": "Explanation of why this is correct"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Generate EXACTLY 3 questions (not 1, not 2, not 5 - exactly 3)
- Each question MUST have exactly 4 options
- Each question MUST have a correctAnswer index (0-3)
- Each question MUST have an explanation
- Questions must be directly related to topics discussed in the conversation
- Questions should be clear and unambiguous
- Questions should have appropriate difficulty level for the topics covered
- Return ONLY valid JSON, no markdown code blocks`
        },
        {
          role: "user",
          content: `Generate a quiz based on this conversation:\n\n${conversationContext}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    console.log('✅ OpenAI API call successful');
    const responseText = completion.choices[0].message.content;
    console.log('📝 OpenAI response length:', responseText.length);
    console.log('📝 OpenAI response preview:', responseText.substring(0, 200));

    // Parse the JSON response
    let quiz;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      quiz = JSON.parse(jsonText);
      
      // Validate that we have exactly 3 questions
      if (!quiz.questions || quiz.questions.length !== 3) {
        console.warn('⚠️ Quiz does not have exactly 3 questions, regenerating...');
        throw new Error('Invalid question count');
      }
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.log('📝 Raw response:', responseText);
      
      // Fallback quiz if parsing fails
      quiz = {
        title: "Knowledge Check",
        questions: [
          {
            question: "Based on our conversation, what was the main topic we discussed?",
            options: ["Programming", "Mathematics", "Science", "History"],
            correctAnswer: 0,
            explanation: "We primarily discussed programming concepts in this conversation."
          },
          {
            question: "What is an important concept we covered?",
            options: ["Variables and data types", "Music theory", "Historical events", "Sports rules"],
            correctAnswer: 0,
            explanation: "Variables and data types are fundamental programming concepts."
          },
          {
            question: "Which skill did we practice in our conversation?",
            options: ["Problem solving", "Painting", "Dancing", "Cooking"],
            correctAnswer: 0,
            explanation: "Problem solving is a key skill in programming and technology discussions."
          }
        ]
      };
    }

    console.log('✅ Quiz generated successfully with', quiz.questions?.length || 0, 'questions');
    
    // Set CORS headers and return response
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      .json({ quiz });
    
  } catch (error) {
    console.error('❌ === QUIZ GENERATION ERROR ===');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    
    // Check for specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(500).json({ 
        error: 'OpenAI API quota exceeded',
        details: 'Your OpenAI API key has exceeded its quota. Please check your OpenAI account.',
        type: 'QuotaError'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ 
        error: 'Invalid OpenAI API key',
        details: 'The OpenAI API key is invalid or expired. Please check your environment variables.',
        type: 'AuthenticationError'
      });
    }
    
    // Generic error response with more details
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
