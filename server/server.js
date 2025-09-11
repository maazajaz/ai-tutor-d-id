import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import fetch from "node-fetch";
import path from "path";
import OpenAI from "openai";
import didService from "./didService.js";
dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
const didApiKey = process.env.DID_API_KEY;

// Debug environment variables
console.log('🔧 Environment Check:');
console.log('OpenAI API Key present:', !!openaiApiKey);
console.log('D-ID API Key present:', !!didApiKey);
console.log('Environment:', process.env.NODE_ENV);
console.log('Vercel environment:', !!process.env.VERCEL);

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase payload size limit for large chat histories

// Environment-aware CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://ai-tutor-final-sepia.vercel.app",
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  res.sendFile(path.join(process.cwd(), 'test.html'));
});

app.get("/", (req, res) => {
  res.send("🎓 AI Digital Tutor API with D-ID Avatar - Ready to help students learn!");
});

app.get("/api", (req, res) => {
  res.send("🎓 AI Digital Tutor API with D-ID Avatar - Ready to help students learn!");
});

// D-ID API status check
app.get("/api/did-status", async (req, res) => {
  try {
    console.log('🔍 Checking D-ID API status...');
    
    if (!didApiKey) {
      return res.status(500).send({
        status: 'error',
        message: 'D-ID API key not configured'
      });
    }
    
    // Simple health check by attempting to create a test request
    res.send({
      status: 'working',
      message: 'D-ID API key configured',
      hasApiKey: !!didApiKey
    });
    
  } catch (error) {
    console.error('❌ D-ID API error:', error);
    res.status(500).send({ 
      status: 'error',
      error: error.message,
      statusCode: error.status || 500
    });
  }
});

// Handle both /api/chat (for frontend) and /chat (for Vercel routing)
app.post(["/api/chat", "/chat"], async (req, res) => {

  console.log("Received chat request", req.body);
  const userMessage = req.body.message;
  const chatHistory = req.body.chatHistory || []; // Include chat history
  
  if (!userMessage) {
    console.log("No user message provided, sending intro messages.");
    res.send({
      messages: [
        {
          text: "Namaste! Main aapka digital teacher hun. Aaj kya subject ya topic sikhna chahte hain?",
          type: "text"
        },
        {
          text: "Welcome! I'm your digital tutor. What subject or topic would you like to learn today?",
          type: "text"
        },
      ],
    });
    return;
  }

  // Use OpenAI for text generation
  // General academic subjects for grades 7-8
  const academicSyllabus = [
    "Mathematics (Algebra, Geometry, Fractions, Decimals)",
    "Science (Physics, Chemistry, Biology basics)",
    "English (Grammar, Literature, Writing skills)",
    "Social Studies (History, Geography, Civics)",
    "Computer Science basics (Programming concepts)",
    "General Knowledge",
    "Study skills and Learning techniques",
    "Problem-solving strategies",
    "Creative writing and Communication",
    "Basic Research skills",
    "Time management and Organization",
    "Critical thinking",
    "Environmental Science"
  ];

  // Function to detect if user input contains Hindi/Hinglish
  const isHinglish = (text) => {
    // Check for common Hindi words, Devanagari script, or Hinglish patterns
    // More specific patterns to avoid false positives
    const hindiWords = /\b(hai|hain|kya|kaise|kahan|kab|kyun|yaar|bhai|dost|accha|theek|samjha|samjhi|nahi|nahin|haan|ji|banana|banate|sikho|sikhna|chahiye|chahta|chahti|seekh|padh|samjh|bol|sun|dekh|kar|karo|karte|karna|karke)\b/i;
    const devanagariScript = /[\u0900-\u097F]/;
    const romanHindiSpecific = /\b(mein|aap|humko|tumko|tumhe|hamein|wala|wali|vale|waala|waali|waale|bhailog|didilog|sunlo|dekho|bolo|karo|nahi|nahin)\b/i;
    
    // More specific Hindi connectors and particles
    const hindiConnectors = /\b(ka|ke|ki|ko|se|me|par|tak|liye|saath|bina|upar|neeche|andar|bahar)\b/gi;
    
    // Count Hindi-specific words
    const hindiMatches = (text.match(hindiWords) || []).length;
    const devanagariMatches = devanagariScript.test(text);
    const romanHindiMatches = (text.match(romanHindiSpecific) || []).length;
    const connectorMatches = (text.match(hindiConnectors) || []).length;
    
    // Calculate total words
    const totalWords = text.split(/\s+/).length;
    
    // Consider it Hinglish if:
    // 1. Has Devanagari script, OR
    // 2. Has clear Hindi words, OR  
    // 3. Has 2+ Hindi connectors in a short text, OR
    // 4. Has 30%+ Hindi-specific words in longer text
    return devanagariMatches || 
           hindiMatches > 0 || 
           romanHindiMatches > 0 ||
           (connectorMatches >= 2 && totalWords <= 8) ||
           (totalWords > 8 && (hindiMatches + connectorMatches) / totalWords > 0.3);
  };

  // Determine response language based on user input
  const userLanguage = isHinglish(userMessage) ? 'hinglish' : 'english';
  
  // Create dynamic system prompt based on detected language
  const createSystemPrompt = (language) => {
    const basePrompt = `You are an expert and comprehensive digital tutor. You can teach ANY subject and answer questions on ALL topics including but not limited to:\n${academicSyllabus.map((t,i)=>`${i+1}. ${t}`).join("\n")}\n\nAnd also: Programming (Python, JavaScript, Java, C++, etc.), Data Science, Machine Learning, Web Development, Software Engineering, Personal Development, Life Skills, Technology, Arts, Music, History, Philosophy, and more.\n\nProvide COMPLETE, DETAILED explanations. Always structure your responses with clear bullet points and numbered lists for better readability.\n\n`;
    
    let languageInstructions = '';
    
    if (language === 'hinglish') {
      languageInstructions = `Respond in Hinglish (Hindi-English mix). When explaining concepts, use simple Hinglish naturally - mix Hindi and English words like: "Programming ek interesting subject hai", "code mein hum logic use karte hain", "concepts ko step by step explain karte hain", etc. Make it conversational, friendly, and like talking to a knowledgeable friend.`;
    } else {
      languageInstructions = `Respond in clear, detailed English. Use easy-to-understand words and give comprehensive real-life examples. Be conversational, encouraging, and friendly - like a knowledgeable mentor who provides complete, thorough explanations.`;
    }
    
    return basePrompt + languageInstructions + `\n\nFORMATTING REQUIREMENTS:
• Use bullet points and numbered lists for clarity
• When providing code examples, format them clearly with proper indentation
• Structure responses with headings when appropriate
• Provide complete, detailed explanations - never cut off mid-sentence
• Include practical examples and real-world applications
• Always finish your thoughts completely
• Remember previous conversation context and build upon it
• Give personalized responses based on what the user has learned before

CODE FORMATTING:
When showing code, format it properly with clear structure:
Example:
\`\`\`python
def hello_world():
    print("Hello, World!")
    return "Success"
\`\`\`

CONTEXT AWARENESS:
- Remember what the user has asked before
- Build upon previous explanations
- Reference earlier examples when relevant
- Provide continuity in learning progression

CRITICAL: Always provide COMPLETE responses. Do NOT cut off mid-sentence or mid-explanation. Ensure your response is finished.
Always provide thorough, complete explanations. Use markdown-style formatting for better readability.`;
  };

  const systemPrompt = createSystemPrompt(userLanguage);
  
  // Dynamic token calculation based on question complexity
  const estimateRequiredTokens = (question) => {
    const wordCount = question.split(' ').length;
    const hasCodeRequest = /code|example|syntax|write|show|create|function|class|loop|how to|explain|teach/i.test(question);
    const hasComplexTopic = /function|class|loop|algorithm|project|object|list|dictionary|file|error|exception/i.test(question);
    
    let baseTokens = 1500; // Good base for complete responses
    
    if (hasCodeRequest) baseTokens += 1500; // More tokens for code examples with explanations
    if (hasComplexTopic) baseTokens += 800; // More tokens for complex explanations
    if (wordCount > 10) baseTokens += (wordCount - 10) * 40; // Scale with question length
    
    return Math.min(Math.max(baseTokens, 1500), 4000); // Between 1500-4000 tokens, respecting GPT-3.5 limit
  };
  
  const maxTokens = estimateRequiredTokens(userMessage);
  console.log(`Estimated tokens needed: ${maxTokens} for question: "${userMessage}"`);
  
  let messages = [];
  try {
    console.log("Sending request to OpenAI with user message:", userMessage);
    console.log("Detected language:", userLanguage);
    console.log("Chat history length:", chatHistory.length);
    
    // Build conversation context for OpenAI
    const conversationMessages = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add recent chat history (last 10 messages to avoid token limits)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        conversationMessages.push({ role: "user", content: msg.text });
      } else {
        conversationMessages.push({ role: "assistant", content: msg.text });
      }
    }
    
    // Add current user message
    conversationMessages.push({ role: "user", content: userMessage });
    
    console.log("Conversation context:", conversationMessages.length, "messages");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Back to 3.5-turbo for cost efficiency
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: maxTokens
    });
    
    console.log("OpenAI response:", completion.choices[0].message.content);
    console.log("Response length:", completion.choices[0].message.content.length);
    
    const responseContent = completion.choices[0].message.content;
    
    // For D-ID integration, we return simple text responses without audio processing
    if (responseContent && responseContent.trim().length > 0) {
      messages = [{
        text: responseContent.trim(),
        type: "text" // Simple text for D-ID to process
      }];
    } else {
      // Fallback for empty responses
      const fallbackText = userLanguage === 'hinglish' 
        ? "Sorry, kuch technical issue hai. Phir se try kijiye!"
        : "Sorry, there was a technical issue. Please try again!";
      
      messages = [{
        text: fallbackText,
        type: "text"
      }];
    }
    console.log("Parsed messages for D-ID:", messages);
  } catch (err) {
    console.error("Error communicating with OpenAI:", err);
    return res.status(500).send({ error: "Failed to get response from OpenAI", details: err.message });
  }

  console.log("Sending response to client:", { messages });
  res.send({ messages });
});

// Generate AI notes from chat conversation
app.post(["/api/generate-notes", "/generate-notes"], async (req, res) => {
  try {
    const { messages, chatTitle } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).send({ error: "No messages provided" });
    }

    console.log('🤖 Generating notes for chat:', chatTitle);

    const notesPrompt = `
You are an AI assistant that creates concise, helpful study notes from educational conversations. 

Based on the following conversation between a student and an AI tutor, create comprehensive study notes that:
1. Summarize key concepts discussed
2. List important formulas, definitions, or facts mentioned
3. Highlight main learning objectives
4. Include any examples or problem-solving steps
5. Suggest areas for further study

Chat Title: ${chatTitle}

Conversation:
${messages.map(msg => `${msg.role === 'user' ? 'Student' : 'AI Tutor'}: ${msg.content}`).join('\n')}

Please provide the study notes in a clear, organized format using markdown. Focus on educational value and make it useful for review and study purposes.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create clear, concise, and well-organized study notes from conversations."
        },
        {
          role: "user",
          content: notesPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const notes = completion.choices[0].message.content;
    console.log('✅ AI notes generated successfully');

    res.send({ notes });
  } catch (error) {
    console.error("❌ Error generating notes:", error);
    res.status(500).send({ error: "Failed to generate notes" });
  }
});

app.listen(port, () => {
  console.log(`🎓 AI Digital Tutor with D-ID Avatar listening on port ${port}`);
  console.log(`🌐 Frontend: http://localhost:5173`);
  console.log(`🤖 Backend: http://localhost:${port}`);
  console.log(`🎭 D-ID API: ${didApiKey ? 'Configured' : 'Not configured'}`);
});
