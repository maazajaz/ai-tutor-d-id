/**
 * Script to create a D-ID Agent for the AI Tutor application
 * Run with: node server/createAgent.js
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const DID_API_KEY = process.env.DID_API_KEY;
const API_URL = "https://api.d-id.com";

async function createAgent() {
  console.log('🎭 Creating D-ID Agent for AI Tutor...\n');

  if (!DID_API_KEY) {
    console.error('❌ Error: DID_API_KEY not found in .env file');
    process.exit(1);
  }

  try {
    // Create the agent
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        presenter: {
          type: 'talk',
          voice: {
            type: 'microsoft',
            voice_id: 'en-US-JennyMultilingualV2Neural', // Supports multiple languages
          },
          // Using a default D-ID presenter
          source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg',
          thumbnail: 'https://create-images-results.d-id.com/DefaultPresenters/Zivva_f/thumbnail.jpeg',
        },
        llm: {
          type: 'openai',
          provider: 'openai',
          model: 'gpt-4o-mini', // Updated model name as per D-ID requirements
          instructions: `You are an AI tutor specialized in teaching students in grades 7-8. Your role is to:

1. Explain concepts clearly and in an age-appropriate manner
2. Teach subjects including Mathematics, Science, English, Social Studies, and Computer Science
3. Support both English and Hindi/Hinglish languages naturally
4. Be patient, encouraging, and make learning fun
5. Break down complex topics into simple, digestible parts
6. Provide examples and analogies to help students understand
7. Ask follow-up questions to check understanding
8. Adapt your teaching style based on the student's responses

Always be friendly, approachable, and create a safe learning environment. If a student seems confused, try explaining in a different way or provide additional examples.`,
        },
        preview_name: 'AI Tutor - Grades 7-8',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const agentData = await response.json();
    
    console.log('✅ Agent created successfully!\n');
    console.log('📋 Agent Details:');
    console.log('─────────────────────────────────────────');
    console.log(`Agent ID: ${agentData.id}`);
    console.log(`Name: ${agentData.preview_name}`);
    console.log(`Status: ${agentData.status}`);
    console.log(`Created: ${new Date(agentData.created_at).toLocaleString()}`);
    console.log('─────────────────────────────────────────\n');
    
    console.log('📝 Next Steps:');
    console.log('1. Copy the Agent ID above');
    console.log('2. Open: src/components/DIDAgentAvatar.jsx');
    console.log('3. Find line 41: const CUSTOM_AGENT_ID = "v2_agt_IgDqbqGR";');
    console.log(`4. Replace with: const CUSTOM_AGENT_ID = "${agentData.id}";`);
    console.log('5. Open: src/components/DIDExperience.jsx');
    console.log('6. Change import from DIDTalksAvatar to DIDAgentAvatar\n');
    
    console.log('🌐 View in D-ID Studio:');
    console.log('https://studio.d-id.com/agents\n');
    
    return agentData;
    
  } catch (error) {
    console.error('❌ Error creating agent:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Tip: Check if your DID_API_KEY is correct in .env file');
    } else if (error.message.includes('403')) {
      console.log('\n💡 Tip: Your API key may not have permission to create agents');
      console.log('   Check your D-ID plan: https://www.d-id.com/pricing/api/');
    }
    
    process.exit(1);
  }
}

// Also add a function to list existing agents
async function listAgents() {
  console.log('📋 Fetching your existing agents...\n');

  try {
    const response = await fetch(`${API_URL}/agents`, {
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (data.agents && data.agents.length > 0) {
      console.log(`Found ${data.agents.length} agent(s):\n`);
      data.agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.preview_name || 'Unnamed Agent'}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Created: ${new Date(agent.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('No agents found. Create one first!\n');
    }
    
  } catch (error) {
    console.error('❌ Error listing agents:', error.message);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'list') {
  listAgents();
} else if (command === 'create' || !command) {
  createAgent();
} else {
  console.log('Usage:');
  console.log('  node server/createAgent.js create  - Create a new agent');
  console.log('  node server/createAgent.js list    - List existing agents');
}
