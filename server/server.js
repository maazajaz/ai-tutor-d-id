import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import fetch from "node-fetch";
import path from "path";
import didService from "./didService.js";
dotenv.config();

const didApiKey = process.env.DID_API_KEY;

// Debug environment variables
console.log('🔧 Environment Check:');
console.log('D-ID API Key present:', !!didApiKey);
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

app.listen(port, () => {
  console.log(`🎓 AI Digital Tutor with D-ID Avatar listening on port ${port}`);
  console.log(`🌐 Frontend: http://localhost:5173`);
  console.log(`🤖 Backend: http://localhost:${port}`);
  console.log(`🎭 D-ID API: ${didApiKey ? 'Configured' : 'Not configured'}`);
});
