/**
 * Script to get detailed information about a specific D-ID Agent
 * Run with: node server/checkAgent.js AGENT_ID
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const DID_API_KEY = process.env.DID_API_KEY;
const API_URL = "https://api.d-id.com";

async function getAgentDetails(agentId) {
  console.log(`🔍 Fetching details for agent: ${agentId}\n`);

  if (!DID_API_KEY) {
    console.error('❌ Error: DID_API_KEY not found in .env file');
    process.exit(1);
  }

  try {
    const response = await fetch(`${API_URL}/agents/${agentId}`, {
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const agent = await response.json();
    
    console.log('📋 Agent Details:');
    console.log('─────────────────────────────────────────');
    console.log(`Name: ${agent.preview_name || 'Unnamed'}`);
    console.log(`ID: ${agent.id}`);
    console.log(`Status: ${agent.status || 'Unknown'}`);
    console.log(`Created: ${new Date(agent.created_at).toLocaleString()}`);
    console.log(`Modified: ${new Date(agent.modified_at).toLocaleString()}`);
    console.log('─────────────────────────────────────────');
    console.log('\n📊 Configuration:');
    console.log(`Presenter Type: ${agent.presenter?.type}`);
    console.log(`Voice: ${agent.presenter?.voice?.voice_id}`);
    console.log(`LLM Model: ${agent.llm?.model || 'N/A'}`);
    console.log(`LLM Provider: ${agent.llm?.provider || 'N/A'}`);
    
    if (agent.status === 'error' || agent.status === 'failed') {
      console.log('\n❌ Agent Status: FAILED');
      console.log('This agent cannot be used for streaming.');
    } else if (agent.status === 'done' || agent.status === 'started') {
      console.log('\n✅ Agent Status: OK');
      console.log('This agent can be used for streaming!');
    } else {
      console.log(`\n⚠️ Agent Status: ${agent.status || 'Unknown'}`);
    }
    
    return agent;
    
  } catch (error) {
    console.error('❌ Error fetching agent:', error.message);
    process.exit(1);
  }
}

const agentId = process.argv[2];

if (!agentId) {
  console.log('Usage: node server/checkAgent.js AGENT_ID');
  console.log('\nExample:');
  console.log('  node server/checkAgent.js v2_agt_gL2BIsAW');
  process.exit(1);
}

getAgentDetails(agentId);
