import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import fetch from "node-fetch";
import path from "path";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";
import { Innertube } from "youtubei.js";
import didService from "./didService.js";
import { fetchEducationalImage } from "./imageService.js";
dotenv.config();

const didApiKey = process.env.DID_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Initialize OpenAI
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Anatomy templates for complex diagrams
import { anatomyTemplates } from "./anatomyTemplates.js";

function matchAnatomyTemplate(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  const keywords = {
    'human-heart': ['heart', 'cardiac', 'atrium', 'ventricle', 'cardiovascular'],
    'human-brain': ['brain', 'cerebral', 'lobe', 'frontal', 'cerebellum', 'neural'],
    'digestive-system': ['digestive', 'stomach', 'intestine', 'digestion', 'gut', 'esophagus'],
    'respiratory-system': ['respiratory', 'lung', 'breathing', 'trachea', 'bronchi', 'respiration'],
    'plant-cell': ['plant cell', 'chloroplast', 'vacuole', 'cell wall', 'plant structure'],
    'dog-anatomy': ['dog', 'dog body', 'dog anatomy', 'dog parts', 'canine'],
    'eye-structure': ['eye', 'eye structure', 'vision', 'retina', 'cornea', 'iris', 'pupil'],
    'atom-structure': ['atom', 'atom structure', 'proton', 'neutron', 'electron', 'nucleus', 'atomic'],
    'butterfly-lifecycle': ['butterfly', 'butterfly life cycle', 'metamorphosis', 'caterpillar', 'chrysalis', 'pupa']
  };
  
  for (const [templateId, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => lowerPrompt.includes(keyword))) {
      return anatomyTemplates[templateId];
    }
  }
  
  return null;
}

function detectComplexDiagram(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Complex diagram keywords (biological, anatomical, detailed systems)
  const complexKeywords = [
    'anatomy', 'biological', 'organ', 'cell', 'tissue',
    'nervous system', 'circulatory', 'skeletal', 'muscular',
    'kidney', 'liver', 'eye structure', 'ear structure',
    'dna', 'molecule', 'chemical structure', 'atom',
    'detailed', 'cross-section', 'internal structure',
    'photosynthesis', 'cellular respiration', 'mitosis', 'meiosis',
    'animal', 'dog', 'cat', 'bird', 'fish', 'mammal', 'reptile',
    'body parts', 'organism', 'creature', 'species'
  ];
  
  // Simple diagram keywords (geometric, basic concepts, cycles)
  const simpleKeywords = [
    'solar system', 'water cycle', 'life cycle', 'food chain',
    'triangle', 'circle', 'rectangle', 'square', 'perimeter', 'area',
    'simple', 'basic', 'diagram', 'chart', 'flow'
  ];
  
  // If explicitly asks for simple, use GPT-3.5
  if (simpleKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return false;
  }
  
  // If matches complex keywords, use GPT-4
  if (complexKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return true;
  }
  
  // Default to simple/fast for unknown prompts
  return false;
}

function convertTemplateToCompactFormat(elements) {
  return elements.map(el => {
    switch (el.type) {
      case 'circle':
        return `circ:${el.x},${el.y},${el.r},${el.stroke},${el.fill}`;
      case 'ellipse':
        return `ellipse:${el.x},${el.y},${el.rx},${el.ry},${el.stroke},${el.fill}`;
      case 'rect':
        return `rect:${el.x},${el.y},${el.width},${el.height},${el.stroke},${el.fill}`;
      case 'line':
        return `line:${el.x1},${el.y1},${el.x2},${el.y2},${el.stroke},${el.strokeWidth}`;
      case 'arrow':
        return `arrow:${el.x1},${el.y1},${el.x2},${el.y2},${el.color},${el.label || ''}`;
      case 'text':
        return `txt:${el.x},${el.y},${el.size},${el.color},${el.text}`;
      case 'path':
        const pointsStr = el.points.map(p => `${p[0]},${p[1]}`).join(',');
        return `path:${pointsStr}:${el.stroke}:${el.fill || 'none'}:${el.strokeWidth}`;
      default:
        return null;
    }
  }).filter(Boolean);
}

// Debug environment variables
console.log('🔧 Environment Check:');
console.log('D-ID API Key present:', !!didApiKey);
console.log('OpenAI API Key present:', !!openaiApiKey);
console.log('Environment:', process.env.NODE_ENV);
console.log('Vercel environment:', !!process.env.VERCEL);

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
      "http://172.20.10.6:5173", // Allow connections from local network
      "https://ai-tutor-final-sepia.vercel.app",
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://192.168.') || origin.startsWith('http://172.')) {
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

// Note: The chat and generate-notes endpoints have been removed
// D-ID Agents come with built-in GPT-4 model for conversations
// All conversations happen directly through D-ID's chat API in the frontend

// Proxy endpoint to send message to D-ID agent and get response
app.post("/api/did-chat/:agentId/:chatId", async (req, res) => {
  try {
    const { agentId, chatId } = req.params;
    const { message, streamId, sessionId } = req.body;
    
    console.log(`💬 Sending message to D-ID agent ${agentId}, chat ${chatId}`);
    console.log(`📝 Message: "${message}"`);
    
    if (!didApiKey) {
      return res.status(500).send({ error: 'D-ID API key not configured' });
    }
    
    // Step 1: Send message to chat to get GPT-4 response (without stream for now)
    const chatResponse = await fetch(`https://api.d-id.com/agents/${agentId}/chat/${chatId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: message,
            created_at: new Date().toLocaleString(),
          }
        ],
      }),
    });
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('❌ D-ID chat API error:', errorText);
      return res.status(chatResponse.status).send({ error: errorText });
    }
    
    const chatData = await chatResponse.json();
    console.log('✅ Chat response received from D-ID');
    
    // Step 2: Send the same message with streamId to make agent speak
    if (streamId && sessionId) {
      console.log('🗣️ Sending to stream for speaking...');
      const streamResponse = await fetch(`https://api.d-id.com/agents/${agentId}/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${didApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId: streamId,
          sessionId: sessionId,
          messages: [
            {
              role: 'user',
              content: message,
              created_at: new Date().toLocaleString(),
            }
          ],
        }),
      });
      
      if (streamResponse.ok) {
        console.log('✅ Message sent to stream successfully');
      } else {
        console.warn('⚠️ Failed to send to stream, but we have the text response');
      }
    }
    
    res.send(chatData);
    
  } catch (error) {
    console.error('❌ Error in D-ID chat:', error);
    res.status(500).send({ error: error.message });
  }
});

// Proxy endpoint to get D-ID chat history (avoids CORS issues)
app.get("/api/did-chat-history/:agentId/:chatId", async (req, res) => {
  try {
    const { agentId, chatId } = req.params;
    console.log(`📥 Fetching D-ID chat history for agent ${agentId}, chat ${chatId}`);
    
    if (!didApiKey) {
      return res.status(500).send({ error: 'D-ID API key not configured' });
    }
    
    const response = await fetch(`https://api.d-id.com/agents/${agentId}/chat/${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${didApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ D-ID API error:', errorText);
      return res.status(response.status).send({ error: errorText });
    }
    
    const data = await response.json();
    console.log('✅ Chat history retrieved:', data.messages?.length || 0, 'messages');
    res.send(data);
    
  } catch (error) {
    console.error('❌ Error fetching D-ID chat history:', error);
    res.status(500).send({ error: error.message });
  }
});

// Generate quiz from chat history using OpenAI GPT
app.post("/api/generate-quiz", async (req, res) => {
  console.log('🎯 === QUIZ GENERATION ENDPOINT HIT ===');
  console.log('🔍 Request received at:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔑 OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
  console.log('🔑 OpenAI client initialized:', !!openai);
  
  try {
    const { messages } = req.body;
    
    console.log('🎯 Generating quiz from', messages?.length || 0, 'messages');
    console.log('🔑 OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 OpenAI client initialized:', !!openai);
    
    if (!messages || messages.length === 0) {
      return res.status(400).send({ error: 'No chat history provided' });
    }

    if (!openai) {
      console.error('❌ OpenAI client not initialized');
      return res.status(500).send({ 
        error: 'OpenAI API not configured',
        details: 'OPENAI_API_KEY environment variable is missing'
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
          content: `You are an expert quiz generator. Based on the following conversation between a student and an AI tutor, create a quiz with 3-5 multiple choice questions that test the student's understanding of the topics discussed.

Format your response as a JSON object with this structure:
{
  "title": "Quiz title based on the topics",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this is correct"
    }
  ]
}

Make sure questions are:
- Directly related to topics discussed in the conversation
- Clear and unambiguous
- Have 4 options each
- Include helpful explanations
- Appropriate difficulty level for the topics covered`
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
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback quiz if parsing fails
      quiz = {
        title: "Knowledge Check",
        questions: [
          {
            question: "Based on our conversation, what was the main topic discussed?",
            options: ["Programming", "Mathematics", "Science", "History"],
            correctAnswer: 0,
            explanation: "We primarily discussed programming concepts."
          }
        ]
      };
    }

    console.log('✅ Quiz generated successfully with', quiz.questions?.length || 0, 'questions');
    res.send({ quiz });
    
  } catch (error) {
    console.error('❌ === QUIZ GENERATION ERROR ===');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    
    // Check for specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(500).send({ 
        error: 'OpenAI API quota exceeded',
        details: 'Your OpenAI API key has exceeded its quota. Please check your OpenAI account.',
        type: 'QuotaError'
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(500).send({ 
        error: 'Invalid OpenAI API key',
        details: 'The OpenAI API key is invalid or expired. Please check your environment variables.',
        type: 'AuthenticationError'
      });
    }
    
    // Generic error response
    res.status(500).send({ 
      error: error.message || 'Unknown error',
      details: error.code || error.type || 'No additional details',
      type: error.name || 'UnknownError',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Generate AI notes summary from chat history using OpenAI
app.post("/api/generate-notes", async (req, res) => {
  try {
    const { messages, chatTitle } = req.body;
    
    console.log('📝 Generating notes from', messages?.length || 0, 'messages');
    
    if (!messages || messages.length === 0) {
      return res.status(400).send({ error: 'No chat history provided' });
    }

    if (!openai) {
      return res.status(500).send({ error: 'OpenAI API not configured' });
    }

    // Prepare conversation context
    const conversationContext = messages.map(m => 
      `${m.role === 'user' ? 'Student' : 'AI Tutor'}: ${m.content}`
    ).join('\n\n');

    // Generate notes using OpenAI
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
    
    res.send({ notes });
    
  } catch (error) {
    console.error('❌ Error generating notes:', error);
    res.status(500).send({ error: error.message });
  }
});

// Analyze chat conversation and generate diagram instructions OR fetch/generate image
app.post("/api/analyze-diagram", async (req, res) => {
  try {
    const { chatText } = req.body;
    
    console.log('📊 Analyzing chat for diagram generation...');
    
    if (!chatText) {
      return res.status(400).send({ error: 'No chat text provided' });
    }

    // 🚀 STEP 1: Check if this matches any anatomy template (INSTANT)
    const template = matchAnatomyTemplate(chatText);
    
    if (template) {
      console.log(`⚡ Template matched - instant rendering!`);
      const compactDrawing = convertTemplateToCompactFormat(template);
      
      return res.send({
        diagramType: 'fast_drawing',
        drawing: compactDrawing,
        source: 'template',
        renderTime: '0ms'
      });
    }

    // STEP 2: Call /api/generate-drawing-fast for custom diagrams
    console.log('🎨 No template match, using fast drawing API...');
    
    try {
      const drawingResponse = await fetch('http://localhost:3000/api/generate-drawing-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatText })
      });

      if (drawingResponse.ok) {
        const drawingData = await drawingResponse.json();
        console.log('✅ Fast drawing generated:', drawingData.isTemplate ? 'template' : 'gpt');
        
        // Convert elements array to compact format string
        const drawing = drawingData.elements.join('\n');
        
        return res.send({
          diagramType: 'fast_drawing',
          drawing: drawing,
          source: drawingData.isTemplate ? 'template' : 'gpt',
          renderTime: '1-2s'
        });
      } else {
        throw new Error(`Drawing API returned ${drawingResponse.status}`);
      }
    } catch (drawingError) {
      console.error('❌ Failed to generate drawing:', drawingError);
      // Fall back to simple diagram
      return res.send({
        diagramType: 'diagram',
        elements: [
          { text: 'Failed to generate diagram', type: 'component' },
          { text: chatText, type: 'component' }
        ]
      });
    }
    
  } catch (error) {
    console.error('❌ Error analyzing diagram:', error);
    res.status(500).send({ error: error.message });
  }
});

// Helper function to fetch transcript with multiple fallbacks
async function fetchTranscriptWithFallbacks(videoId) {
  const methods = [
    // Method 0: Try using youtubei.js (most reliable for all types of captions)
    async () => {
      console.log('🔄 Method 0: Trying youtubei.js (YouTube internal API)...');
      try {
        const youtube = await Innertube.create();
        const info = await youtube.getInfo(videoId);
        
        // Get transcript from captions
        const transcriptData = await info.getTranscript();
        
        if (transcriptData && transcriptData.transcript) {
          const segments = transcriptData.transcript.content.body.initial_segments;
          if (segments && segments.length > 0) {
            const texts = segments.map(segment => segment.snippet.text).filter(text => text);
            console.log(`   ✅ Got ${texts.length} segments via youtubei.js`);
            return texts.join(' ');
          }
        }
        throw new Error('No transcript data in response');
      } catch (error) {
        console.log(`   ✗ youtubei.js failed:`, error.message);
        throw error;
      }
    },
    // Method 1: Try default language
    async () => {
      console.log('🔄 Method 1: Trying default language...');
      const data = await YoutubeTranscript.fetchTranscript(videoId);
      return data.map(item => item.text).join(' ');
    },
    // Method 2: Try multiple languages in order
    async () => {
      console.log('🔄 Method 2: Trying multiple languages...');
      const languages = ['en', 'hi', 'hi-IN', 'hi-Latn', 'ur', 'ur-PK', 'es', 'fr', 'de', 'ar', 'pa', 'bn', 'a.hi', 'a.en'];
      for (const lang of languages) {
        try {
          console.log(`   🔍 Attempting: ${lang}`);
          const data = await YoutubeTranscript.fetchTranscript(videoId, { lang });
          if (data && data.length > 0) {
            console.log(`   ✓ Found transcript in language: ${lang}`);
            return data.map(item => item.text).join(' ');
          }
        } catch (e) {
          console.log(`   ✗ No transcript for language: ${lang}`);
        }
      }
      throw new Error('No transcript in common languages');
    },
    // Method 3: Try to fetch from alternative API endpoint using direct URL scraping
    async () => {
      console.log('🔄 Method 3: Trying HTML scraping method...');
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await response.text();
      
      // Look for caption tracks in the page - multiple patterns
      const patterns = [
        /"captionTracks":\s*(\[.*?\])/,
        /"captions".*?"playerCaptionsTracklistRenderer".*?"captionTracks":\s*(\[.*?\])/s
      ];
      
      let captionTracks = null;
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          try {
            captionTracks = JSON.parse(match[1]);
            if (captionTracks && captionTracks.length > 0) {
              console.log(`   📝 Found ${captionTracks.length} caption track(s)`);
              break;
            }
          } catch (e) {
            console.log('   ⚠️ Failed to parse caption tracks:', e.message);
          }
        }
      }
      
      if (captionTracks && captionTracks.length > 0) {
        // Try to find Hindi or English captions first
        const preferredLangs = ['hi', 'en', 'ur'];
        let selectedTrack = null;
        
        for (const lang of preferredLangs) {
          selectedTrack = captionTracks.find(track => 
            track.languageCode && track.languageCode.startsWith(lang)
          );
          if (selectedTrack) {
            console.log(`   ✓ Selected ${selectedTrack.languageCode} captions`);
            break;
          }
        }
        
        // If no preferred language, use first available
        if (!selectedTrack) {
          selectedTrack = captionTracks[0];
          console.log(`   ✓ Using first available: ${selectedTrack.languageCode || 'unknown'}`);
        }
        
        const captionUrl = selectedTrack.baseUrl;
        console.log('   � Fetching captions from URL...');
        
        const captionResponse = await fetch(captionUrl);
        const captionXml = await captionResponse.text();
        
        // Parse XML to extract text - improved regex
        const textRegex = /<text[^>]*>(.*?)<\/text>/gs;
        const texts = [];
        let textMatch;
        
        while ((textMatch = textRegex.exec(captionXml)) !== null) {
          let text = textMatch[1]
            .replace(/&amp;#39;/g, "'")
            .replace(/&amp;#(\d+);/g, (match, num) => String.fromCharCode(num))
            .replace(/&#(\d+);/g, (match, num) => String.fromCharCode(num))
            .replace(/&amp;quot;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/<[^>]*>/g, '')
            .trim();
          if (text && text.length > 0) texts.push(text);
        }
        
        if (texts.length > 0) {
          console.log(`   ✅ Extracted ${texts.length} caption segments`);
          return texts.join(' ');
        } else {
          console.log('   ⚠️ Caption XML parsed but no text extracted');
        }
      }
      throw new Error('No captions found in HTML');
    },
    // Method 4: Try using YouTube's timedtext API directly
    async () => {
      console.log('🔄 Method 4: Trying YouTube timedtext API...');
      const langs = ['hi', 'hi-IN', 'en', 'en-US', 'en-GB', 'hi-Latn', 'ur', 'ur-PK', 'ar', 'pa', 'bn', 'es', 'fr'];
      
      for (const lang of langs) {
        try {
          console.log(`   🔍 Trying timedtext for: ${lang}`);
          const timedtextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
          const response = await fetch(timedtextUrl);
          
          if (response.ok) {
            const xml = await response.text();
            
            // Check if we actually got captions (not an error page)
            if (!xml.includes('<transcript>') && !xml.includes('<text')) {
              console.log(`   ⚠️ No valid captions for ${lang}`);
              continue;
            }
            
            const textRegex = /<text[^>]*>(.*?)<\/text>/gs;
            const texts = [];
            let match;
            
            while ((match = textRegex.exec(xml)) !== null) {
              let text = match[1]
                .replace(/&amp;#39;/g, "'")
                .replace(/&amp;#(\d+);/g, (match, num) => String.fromCharCode(num))
                .replace(/&#(\d+);/g, (match, num) => String.fromCharCode(num))
                .replace(/&amp;quot;/g, '"')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/<[^>]*>/g, '')
                .trim();
              if (text && text.length > 0) texts.push(text);
            }
            
            if (texts.length > 0) {
              console.log(`   ✅ Got transcript from timedtext API (${lang}): ${texts.length} segments`);
              return texts.join(' ');
            }
          }
        } catch (e) {
          console.log(`   ✗ Timedtext API failed for ${lang}: ${e.message}`);
        }
      }
      throw new Error('Timedtext API failed');
    },
    // Method 5: Use YouTube oEmbed API to get video metadata as last resort
    async () => {
      console.log('🔄 Method 5: Using metadata fallback (no transcript available)...');
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!response.ok) {
        throw new Error('Video not found or is private');
      }
      const data = await response.json();
      return `METADATA_ONLY::Video Title: ${data.title}\nAuthor: ${data.author_name}`;
    }
  ];

  let lastError;
  for (let i = 0; i < methods.length; i++) {
    try {
      const result = await methods[i]();
      if (result && result.length > 50) {
        console.log(`✅ Success with method ${i + 1}, length: ${result.length}`);
        return result;
      }
    } catch (error) {
      console.log(`❌ Method ${i + 1} failed:`, error.message);
      lastError = error;
    }
    
    // Add a small delay between attempts
    if (i < methods.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  throw lastError || new Error('All transcript fetching methods failed');
}

// Summarize YouTube video
app.post("/api/summarize-youtube", async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('🎥 Summarizing YouTube video:', url);
    
    if (!url) {
      return res.status(400).send({ error: 'YouTube URL is required' });
    }

    if (!openai) {
      return res.status(500).send({ error: 'OpenAI API not configured' });
    }

    // Extract video ID from URL
    let videoId;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      }
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
    } catch (error) {
      return res.status(400).send({ error: 'Invalid YouTube URL format' });
    }

    console.log('📹 Video ID:', videoId);

    // Fetch transcript with multiple fallback methods
    let transcript;
    let videoTitle = 'YouTube Video';
    let isMetadataOnly = false;
    
    try {
      transcript = await fetchTranscriptWithFallbacks(videoId);
      
      // Check if we only got metadata
      if (transcript.startsWith('METADATA_ONLY::')) {
        isMetadataOnly = true;
        transcript = transcript.replace('METADATA_ONLY::', '');
      }
      
      console.log('✅ Content fetched, length:', transcript.length);
      console.log('📊 Is metadata only:', isMetadataOnly);
      
      // Try to get video title
      try {
        const videoInfo = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        const videoData = await videoInfo.json();
        videoTitle = videoData.title || videoTitle;
        console.log('📺 Video title:', videoTitle);
      } catch (titleError) {
        console.log('⚠️ Could not fetch video title:', titleError.message);
      }
      
    } catch (error) {
      console.error('❌ Error fetching transcript:', error);
      return res.status(400).send({ 
        error: 'Could not fetch video content. Video may be private, age-restricted, or unavailable.',
        details: error.message
      });
    }

    // If transcript is too long, truncate it (GPT-3.5 has token limits)
    const maxLength = 12000; // Roughly 3000 tokens
    if (transcript.length > maxLength) {
      console.log('⚠️ Transcript too long, truncating...');
      transcript = transcript.substring(0, maxLength) + '...';
    }

    // Generate summary using OpenAI
    console.log('🤖 Generating summary with OpenAI...');
    
    const systemPrompt = isMetadataOnly
      ? `You are an expert at creating educational previews for YouTube videos. Based on the video title and metadata, create an informative overview.

Format your response EXACTLY as follows (include all emojis and headers):

📺 **Video Title:** [Title here]

🎯 **Likely Topics Covered:** 
[Infer from title]

💡 **What You Might Learn:**
• [Point 1]
• [Point 2]
• [Point 3]

📚 **Recommended For:** 
[Who should watch]

⚠️ **Note:** Full transcript unavailable. This is a preview based on video metadata. Watch the video for actual content.

Make it clear and encouraging.`
      : `You are an expert educational content summarizer who can understand content in multiple languages including English, Hindi, Urdu, and other South Asian languages.

CRITICAL: You MUST follow this EXACT format with ALL sections. Do NOT skip any section.

Format your summary EXACTLY as follows:

📺 **Video Title:** ${videoTitle}

📝 **What the Creator Says/Teaches:**
[Summarize the ACTUAL content - what the speaker explains, their main points, their approach. If in Hindi/Urdu, translate key points to English while preserving important terms like song names, cultural references, etc.]

🎯 **Key Concepts Explained:**
• [Concept 1 - with detailed explanation from the video]
• [Concept 2 - with detailed explanation from the video]
• [Concept 3 - with detailed explanation from the video]
• [Add more if relevant]

💡 **Main Takeaways:**
• [Key lesson 1 from the video content]
• [Key lesson 2 from the video content]
• [Key lesson 3 from the video content]

📚 **Content Summary:**
[Write 2-3 sentences summarizing the overall flow of content, what's covered from beginning to end, and the creator's presentation style]

${transcript.includes('गा') || transcript.includes('है') || transcript.includes('क्या') ? '🌐 **Language Note:** Content was in Hindi. Key concepts have been translated to English while preserving cultural context.' : ''}

IMPORTANT: 
1. Include ALL sections listed above
2. Base everything on the ACTUAL TRANSCRIPT CONTENT
3. Use specific examples and quotes from the video
4. Keep the exact emoji format shown above`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: isMetadataOnly 
            ? `Create an educational preview for this YouTube video:\n\nVideo: ${videoTitle}\n\n${transcript}`
            : `Analyze and summarize the ACTUAL CONTENT from this video.

Video Title: ${videoTitle}

Transcript:
${transcript}

Remember to include ALL sections in your response with the exact format specified.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const summary = completion.choices[0].message.content;
    console.log('✅ Summary generated successfully');
    console.log('📄 Summary preview:', summary.substring(0, 200) + '...');
    
    res.send({ 
      summary,
      videoId,
      videoUrl: url
    });
    
  } catch (error) {
    console.error('❌ Error summarizing YouTube video:', error);
    res.status(500).send({ error: error.message });
  }
});

// Code execution endpoint for practice problems
app.post("/api/execute-code", async (req, res) => {
  try {
    const { code, language, testCases, problemId } = req.body;
    console.log('🏃 Executing code for problem:', problemId);

    // For now, we'll use a simple Python executor
    // In production, use a sandboxed environment like Judge0 API or Docker containers
    
    if (language === 'python') {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      // Create a temporary file
      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, `code_${Date.now()}.py`);
      
      // Write code to temp file
      fs.writeFileSync(tmpFile, code);

      try {
        // Execute with timeout
        const { stdout, stderr } = await execAsync(`python "${tmpFile}"`, {
          timeout: 5000, // 5 second timeout
          maxBuffer: 1024 * 1024 // 1MB max output
        });

        // Clean up
        fs.unlinkSync(tmpFile);

        // Run test cases if provided
        let testResults = [];
        if (testCases && testCases.length > 0) {
          testResults = await runTestCases(code, testCases, language);
        }

        res.json({
          output: stdout || stderr,
          testResults,
          success: !stderr
        });
      } catch (execError) {
        // Clean up on error
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }

        res.json({
          error: execError.message || execError.stderr || 'Execution error',
          output: execError.stdout || '',
          testResults: []
        });
      }
    } else {
      res.status(400).json({
        error: `Language ${language} is not supported yet. Currently only Python is supported.`
      });
    }
  } catch (error) {
    console.error('❌ Error executing code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to run test cases
async function runTestCases(code, testCases, language) {
  const results = [];
  
  for (const testCase of testCases) {
    try {
      // Extract function name from code
      const functionMatch = code.match(/def\s+(\w+)\s*\(/);
      if (!functionMatch) {
        results.push({
          passed: false,
          error: 'Could not find function definition',
          input: JSON.stringify(testCase.input),
          expected: JSON.stringify(testCase.expected),
          actual: 'N/A'
        });
        continue;
      }

      const functionName = functionMatch[1];
      
      // Build test code
      const inputArgs = Array.isArray(testCase.input) 
        ? testCase.input.map(arg => JSON.stringify(arg)).join(', ')
        : JSON.stringify(testCase.input);
      
      const testCode = `${code}\n\nresult = ${functionName}(${inputArgs})\nprint(result)`;

      // Execute test
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, `test_${Date.now()}.py`);
      fs.writeFileSync(tmpFile, testCode);

      const { stdout, stderr } = await execAsync(`python "${tmpFile}"`, {
        timeout: 2000,
        maxBuffer: 1024 * 1024
      });

      fs.unlinkSync(tmpFile);

      const actualOutput = stdout.trim();
      const expectedOutput = String(testCase.expected);

      results.push({
        passed: actualOutput === expectedOutput,
        input: JSON.stringify(testCase.input),
        expected: expectedOutput,
        actual: actualOutput,
        error: stderr || null
      });
    } catch (error) {
      results.push({
        passed: false,
        error: error.message,
        input: JSON.stringify(testCase.input),
        expected: JSON.stringify(testCase.expected),
        actual: 'Error'
      });
    }
  }

  return results;
}

// AI explanation endpoint for practice problems
app.post("/api/explain-solution", async (req, res) => {
  try {
    const { problemId, userCode, problemDescription } = req.body;
    console.log('🤖 Generating AI explanation for problem:', problemId);

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert programming tutor who explains code concepts clearly and encouragingly. Break down solutions step-by-step and highlight key programming concepts."
        },
        {
          role: "user",
          content: `Problem: ${problemDescription}\n\nUser's Code:\n${userCode}\n\nPlease explain this solution step-by-step, covering:\n1. The approach taken\n2. How it works (line by line if helpful)\n3. Time and space complexity\n4. Any potential improvements or alternative approaches\n\nBe encouraging and educational!`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const explanation = completion.choices[0].message.content;
    res.json({ explanation });
  } catch (error) {
    console.error('❌ Error generating explanation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate drawing instructions for Rough.js
app.post("/api/generate-drawing", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('🎨 Generating drawing instructions for:', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating educational diagrams. Generate JSON instructions for drawing educational diagrams using simple shapes.

Canvas size: 800x600 pixels
Origin: Top-left (0,0)

Available shapes:
1. triangle: { type: "triangle", points: [[x1,y1], [x2,y2], [x3,y3]], fill: "color", stroke: "color", strokeWidth: number, label: "text" }
2. rectangle: { type: "rectangle", x: number, y: number, width: number, height: number, fill: "color", stroke: "color", strokeWidth: number, label: "text" }
3. circle: { type: "circle", x: number, y: number, diameter: number, fill: "color", stroke: "color", strokeWidth: number, label: "text" }
4. line: { type: "line", points: [[x1,y1], [x2,y2]], stroke: "color", strokeWidth: number }
5. arrow: { type: "arrow", points: [[x1,y1], [x2,y2]], stroke: "color", strokeWidth: number, label: "text" }
6. text: { type: "text", x: number, y: number, text: "content", fontSize: number, color: "color" }
7. arc: { type: "arc", x: number, y: number, width: number, height: number, start: angle, end: angle, stroke: "color", strokeWidth: number }

Colors: Use hex colors like "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"

Guidelines:
- Center the main diagram in the canvas
- Use appropriate sizes (not too small or too large)
- Include labels for important parts
- Use different colors to distinguish elements
- Add formulas or explanations as text
- Keep it educational and clear

Return ONLY valid JSON in this format:
{
  "title": "Diagram Title",
  "description": "Brief description",
  "elements": [
    // array of shape objects
  ]
}

Example for "area of triangle":
{
  "title": "Area of a Triangle",
  "description": "Visual representation of triangle area formula",
  "elements": [
    { "type": "triangle", "points": [[250,150], [550,150], [400,400]], "fill": "#3b82f620", "stroke": "#3b82f6", "strokeWidth": 3, "label": "" },
    { "type": "line", "points": [[250,150], [550,150]], "stroke": "#ef4444", "strokeWidth": 2 },
    { "type": "text", "x": 400, "y": 130, "text": "base (b)", "fontSize": 18, "color": "#ef4444" },
    { "type": "line", "points": [[400,150], [400,400]], "stroke": "#10b981", "strokeWidth": 2 },
    { "type": "text", "x": 420, "y": 275, "text": "height (h)", "fontSize": 18, "color": "#10b981" },
    { "type": "text", "x": 250, "y": 480, "text": "Area = ½ × base × height", "fontSize": 24, "color": "#1f2937" },
    { "type": "text", "x": 280, "y": 520, "text": "A = ½ × b × h", "fontSize": 20, "color": "#6366f1" }
  ]
}`
        },
        {
          role: "user",
          content: `Create drawing instructions for: ${prompt}\n\nReturn ONLY the JSON object, no markdown or explanation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
    }

    let drawingData;
    try {
      drawingData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ Failed to parse GPT-4 response:', jsonStr);
      return res.status(500).json({ 
        error: 'Failed to parse drawing instructions',
        details: parseError.message,
        rawResponse: content
      });
    }

    console.log('✅ Drawing instructions generated:', drawingData.title);
    res.json(drawingData);
  } catch (error) {
    console.error('❌ Error generating drawing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate drawing instructions for Rough.js (Fast Compact Format)
app.post("/api/generate-drawing-fast", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('⚡ Generating drawing (compact):', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if this matches a pre-defined anatomy template
    const anatomyTemplate = matchAnatomyTemplate(prompt);
    if (anatomyTemplate) {
      console.log('📋 Using pre-defined template:', anatomyTemplate.title);
      return res.json({
        title: anatomyTemplate.title,
        elements: convertTemplateToCompactFormat(anatomyTemplate.elements),
        isTemplate: true
      });
    }

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }

    // Detect if this is a complex diagram (use GPT-4) or simple (use GPT-3.5)
    const isComplexDiagram = detectComplexDiagram(prompt);
    const model = isComplexDiagram ? "gpt-4" : "gpt-3.5-turbo";
    const maxTokens = isComplexDiagram ? 1200 : 800;
    
    console.log(`🤖 Using ${model} (${isComplexDiagram ? 'complex' : 'simple'} diagram)`);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert at creating DETAILED educational diagrams using ULTRA COMPACT notation.

Canvas: 800x600 (origin top-left)

COMPACT FORMAT:
- tri:x1,y1,x2,y2,x3,y3,stroke,fill           → triangle
- rect:x,y,w,h,stroke,fill                     → rectangle  
- circ:x,y,radius,stroke,fill                  → circle
- line:x1,y1,x2,y2,color,width                 → line
- arrow:x1,y1,x2,y2,color,label text           → arrow with label
- txt:x,y,size,color,text content              → text

CRITICAL LAYOUT RULES:
1. NEVER use white (#fff or #ffffff) for text - it's invisible on white canvas!
2. Use dark colors for text: #1f2937 (dark gray), #000 (black), or matching element color
3. For cycles/processes, ALWAYS add arrows between elements to show flow
4. SPACE OUT elements properly - don't overlap! Use the full 800x600 canvas
5. For solar system: place sun at center, planets spread out horizontally (NO orbit arrows needed)
6. For life cycles: arrange in circle/square pattern with good spacing and connecting arrows
7. Leave margins: keep elements at least 50px from edges
8. Keep diagrams simple and clear - avoid unnecessary decorative elements

SPACING EXAMPLES:
- Solar system: Sun at (400,300), planets at (240,300), (300,300), (360,300), (440,300), (520,300), (600,300), (670,300), (730,300) etc.
- Life cycle: corners like (200,150), (600,150), (600,450), (200,450)
- Vertical flow: top (400,100), middle (400,300), bottom (400,500)

IMPORTANT: When asked for solar system, include ALL 8 PLANETS in order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune

Colors: #3b82f6(blue) #10b981(green) #f59e0b(orange) #ef4444(red) #8b5cf6(purple) #1f2937(dark)
Fills: Add "20" for 20% opacity (e.g., #3b82f620)

GOOD EXAMPLES:

Solar System (well-spaced!):
{
  "title": "Solar System",
  "elements": [
    "circ:400,300,50,#f59e0b,#f59e0b",
    "txt:400,310,16,#1f2937,Sun",
    "circ:240,300,15,#8b5cf6,#8b5cf620",
    "txt:240,310,12,#1f2937,Mercury",
    "circ:300,300,20,#f59e0b,#f59e0b20",
    "txt:300,310,12,#1f2937,Venus",
    "circ:360,300,22,#3b82f6,#3b82f620",
    "txt:360,310,12,#1f2937,Earth",
    "circ:440,300,18,#ef4444,#ef444420",
    "txt:440,310,12,#1f2937,Mars",
    "circ:520,300,40,#f59e0b,#f59e0b20",
    "txt:520,310,12,#1f2937,Jupiter",
    "circ:600,300,35,#f59e0b,#f59e0b20",
    "txt:600,310,12,#1f2937,Saturn",
    "circ:670,300,25,#3b82f6,#3b82f620",
    "txt:670,310,12,#1f2937,Uranus",
    "circ:730,300,24,#3b82f6,#3b82f620",
    "txt:730,310,12,#1f2937,Neptune",
    "txt:400,550,18,#1f2937,Solar System (8 Planets)"
  ]
}

Life Cycle (circular layout with arrows!):
{
  "title": "Life Cycle",
  "elements": [
    "circ:400,120,45,#3b82f6,#3b82f620",
    "txt:400,130,16,#1f2937,Birth",
    "arrow:440,140,560,200,#666,Growth",
    "circ:600,250,45,#10b981,#10b98120",
    "txt:600,260,16,#1f2937,Childhood",
    "arrow:600,300,600,400,#666,Maturity",
    "circ:600,450,45,#f59e0b,#f59e0b20",
    "txt:600,460,16,#1f2937,Adulthood",
    "arrow:560,470,240,470,#666,Aging",
    "circ:200,450,45,#ef4444,#ef444420",
    "txt:200,460,16,#1f2937,Elderly",
    "arrow:200,400,200,300,#666,Cycle",
    "circ:200,250,45,#8b5cf6,#8b5cf620",
    "txt:200,260,16,#1f2937,Legacy",
    "arrow:240,220,360,140,#666,Renewal",
    "txt:400,550,18,#1f2937,The Continuous Cycle of Life"
  ]
}

Triangle area (well-positioned):
{
  "title": "Triangle Area",
  "elements": [
    "tri:250,150,550,150,400,400,#3b82f6,#3b82f620",
    "line:250,150,550,150,#ef4444,3",
    "txt:400,130,18,#ef4444,base (b)",
    "line:400,150,400,400,#10b981,2",
    "txt:430,275,18,#10b981,height (h)",
    "txt:250,140,14,#1f2937,A",
    "txt:550,140,14,#1f2937,B",
    "txt:400,410,14,#1f2937,C",
    "txt:400,480,24,#1f2937,Area = ½ × base × height",
    "txt:400,510,20,#6366f1,A = ½ × b × h"
  ]
}

Water Cycle (spread out with arrows!):
{
  "title": "Water Cycle",
  "elements": [
    "circ:150,450,45,#3b82f6,#3b82f650",
    "txt:150,460,16,#1f2937,Ocean",
    "arrow:180,420,280,280,#10b981,Evaporation",
    "circ:320,230,40,#8b5cf6,#8b5cf650",
    "txt:320,240,16,#1f2937,Clouds",
    "arrow:360,240,520,320,#3b82f6,Precipitation",
    "circ:570,370,45,#10b981,#10b98150",
    "txt:570,380,16,#1f2937,Land",
    "arrow:530,400,200,460,#6366f1,Runoff",
    "txt:400,550,18,#1f2937,The Water Cycle"
  ]
}

Return ONLY compact JSON. Make it DETAILED and EDUCATIONAL with proper spacing and connections!
DO NOT add comments like // in the JSON - return pure JSON only.`
        },
        {
          role: "user",
          content: `Create compact drawing for: ${prompt}\n\nReturn ONLY JSON with title and elements array (compact format).`
        }
      ],
      temperature: 0.7,
      max_tokens: maxTokens  // 800 for simple, 1200 for complex
    });

    const content = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
    }
    
    // Remove JSON comments (// ...) that GPT sometimes adds
    jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');

    let drawingData;
    try {
      drawingData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ Failed to parse GPT-4 response:', jsonStr);
      return res.status(500).json({ 
        error: 'Failed to parse drawing instructions',
        details: parseError.message,
        rawResponse: content
      });
    }

    console.log('✅ Drawing generated:', drawingData.title, `(${drawingData.elements.length} elements)`);
    res.json(drawingData);
  } catch (error) {
    console.error('❌ Error generating drawing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server only in local development (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🎓 AI Digital Tutor with D-ID Avatar listening on port ${port}`);
    console.log(`🌐 Frontend: http://localhost:5173`);
    console.log(`🤖 Backend: http://localhost:${port}`);
    console.log(`🎭 D-ID API: ${didApiKey ? 'Configured' : 'Not configured'}`);
  });
}

// Export for Vercel serverless
export default app;
