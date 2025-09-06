import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import express from "express";
import { promises as fs } from "fs";
import fetch from "node-fetch";
import path from "path";
import OpenAI from "openai";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const voiceID = "MF4J4IDTRo0AxOO4dpFR"; // Adam - natural male voice

const elevenlabs = new ElevenLabsClient({
  apiKey: elevenLabsApiKey,
});

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  res.sendFile(path.join(process.cwd(), 'test.html'));
});

app.get("/voices", async (req, res) => {
  try {
    const voices = await elevenlabs.voices.getAll();
    res.send(voices);
  } catch (error) {
    console.error("Error getting voices:", error);
    res.status(500).send({ error: "Failed to get voices" });
  }
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  await execCommand(
    `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // -y to overwrite the file
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `bin\\rhubarb.exe -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

app.post("/chat", async (req, res) => {

  console.log("Received /chat request", req.body);
  const userMessage = req.body.message;
  if (!userMessage) {
    console.log("No user message provided, sending intro messages.");
    res.send({
      messages: [
        {
          text: "Namaste! Main aapka Python teacher hun. Aaj kya Python topic sikhna chahte hain?",
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "Welcome! I'm your Python tutor. What would you like to learn about Python today?",
          facialExpression: "smile",
          animation: "Talking_0",
        },
      ],
    });
    return;
  }

  // Use OpenAI for text generation
  // Python syllabus - add your topics here
  const pythonSyllabus = [
    "Introduction to Python",
    "Variables and Data Types",
    "Operators",
    "Control Flow (if, else, for, while)",
    "Functions",
    "Lists, Tuples, and Dictionaries",
    "Modules and Packages",
    "File Handling",
    "Error and Exception Handling",
    "Object-Oriented Programming",
    "Python Standard Library",
    "Working with External Libraries",
    "Basic Projects"
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
    const basePrompt = `You are a helpful and friendly Python teacher. You only teach Python and only answer questions related to the following syllabus:\n${pythonSyllabus.map((t,i)=>`${i+1}. ${t}`).join("\n")}.\n\n`;
    
    let languageInstructions = '';
    let offTopicResponse = '';
    
    if (language === 'hinglish') {
      languageInstructions = `Respond in Hinglish (Hindi-English mix). When explaining Python concepts, use Hinglish naturally - mix Hindi and English words like: "Python ek high-level programming language hai", "variables ko hum data store karne ke liye use karte hain", "function banana bahut easy hai", etc. Make it conversational and friendly.`;
      offTopicResponse = 'Sorry yaar, main sirf Python topics from syllabus teach karta hun.';
    } else {
      languageInstructions = `Respond in clear, simple English. When explaining Python concepts, use easy-to-understand English with examples. Be conversational and friendly while maintaining clarity.`;
      offTopicResponse = 'Sorry, I only teach Python topics from the syllabus.';
    }
    
    return basePrompt + languageInstructions + `\n\nIf the user asks about something outside Python or the syllabus, reply: '${offTopicResponse}'\n\nIMPORTANT: You MUST respond with ONLY a valid JSON array in this exact format:\n[{"text": "your complete response here", "facialExpression": "smile", "animation": "Talking_0"}]\n\nProvide complete, detailed explanations. Do NOT cut off mid-sentence. Always finish your thoughts completely. Include code examples when relevant.\nFacial expressions: smile, surprised, default. Animations: Talking_0, Talking_1, Idle. Maximum 3 messages.`;
  };

  const systemPrompt = createSystemPrompt(userLanguage);
  
  // Dynamic token calculation based on question complexity
  const estimateRequiredTokens = (question) => {
    const wordCount = question.split(' ').length;
    const hasCodeRequest = /code|example|syntax|write|show|create|function|class|loop|how to|explain|teach/i.test(question);
    const hasComplexTopic = /function|class|loop|algorithm|project|object|list|dictionary|file|error|exception/i.test(question);
    
    let baseTokens = 400; // Increased minimum for basic answers
    
    if (hasCodeRequest) baseTokens += 600; // Extra for code examples
    if (hasComplexTopic) baseTokens += 400; // Extra for complex explanations
    if (wordCount > 10) baseTokens += (wordCount - 10) * 30; // Scale with question length
    
    return Math.min(Math.max(baseTokens, 500), 2000); // Between 500-2000 tokens
  };
  
  const maxTokens = estimateRequiredTokens(userMessage);
  console.log(`Estimated tokens needed: ${maxTokens} for question: "${userMessage}"`);
  
  let messages = [];
  try {
    console.log("Sending request to OpenAI with user message:", userMessage);
    console.log("Detected language:", userLanguage);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    });
    
    console.log("OpenAI response:", completion.choices[0].message.content);
    
    // Try to parse JSON response, with fallback
    try {
      let parsed = JSON.parse(completion.choices[0].message.content);
      if (parsed.messages) messages = parsed.messages;
      else messages = parsed;
    } catch (parseError) {
      console.log("JSON parse failed, using fallback response:", parseError);
      // Language-aware fallback response
      const fallbackText = userLanguage === 'hinglish' 
        ? "Namaste! Main aapka Python teacher hun. Aaj kya Python topic sikhna chahte hain?"
        : "Hi! I'm your Python teacher. What Python topic would you like to learn today?";
      
      messages = [{
        text: fallbackText,
        facialExpression: "smile",
        animation: "Talking_0"
      }];
    }
    console.log("Parsed messages:", messages);
  } catch (err) {
    console.error("Error communicating with OpenAI:", err);
    return res.status(500).send({ error: "Failed to get response from OpenAI", details: err.message });
  }

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`Processing message ${i}:`, message);
    
    // generate audio file with ElevenLabs
    const fileName = `audios/message_${i}.mp3`;
    const textInput = message.text;
    
    console.log(`Generating audio with ElevenLabs for message ${i}`);
    try {
      const audioBuffer = await elevenlabs.textToSpeech.convert(voiceID, {
        text: textInput,
        model_id: "eleven_monolingual_v1",
        output_format: "mp3_44100_128",
      });
      
      // Handle the ReadableStream returned by ElevenLabs
      const chunks = [];
      const reader = audioBuffer.getReader();
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      const buffer = Buffer.concat(chunks);
      await fs.writeFile(fileName, buffer);
      console.log(`Audio generated for message ${i}: ${fileName}`);
    } catch (audioError) {
      console.error(`Error generating audio for message ${i}:`, audioError);
      message.audio = null;
      message.lipsync = null;
      continue;
    }
    
    // generate lipsync (convert mp3 to wav first)
    console.log(`Starting lip sync for message ${i}`);
    try {
      await lipSyncMessage(i);
      console.log(`Lip sync generated for message ${i}`);
      message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
    } catch (lipSyncError) {
      console.log(`Lip sync failed for message ${i}:`, lipSyncError.message);
      message.lipsync = null;
    }
    
    message.audio = await audioFileToBase64(fileName);
  }

  console.log("Sending response to client:", { messages });
  res.send({ messages });
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`🎓 AI Python Tutor listening on port ${port}`);
  console.log(`🌐 Frontend: http://localhost:5173`);
  console.log(`🤖 Backend: http://localhost:${port}`);
});
