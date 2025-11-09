/**
 * Vercel Serverless Function: Explain Solution with AI
 * Endpoint: /api/explain-solution
 */

import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export default async function handler(req, res) {
  // Set CORS headers - allow all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    res.status(200).json({ explanation });
  } catch (error) {
    console.error('❌ Error generating explanation:', error);
    res.status(500).json({ error: error.message });
  }
}
