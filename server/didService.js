// D-ID API integration utilities
import fetch from "node-fetch";

const DID_API_BASE_URL = 'https://api.d-id.com';

/**
 * Creates a new D-ID talk session
 * @param {string} text - The text to be spoken by the avatar
 * @param {string} apiKey - D-ID API key
 * @param {Object} options - Additional options for the talk request
 * @returns {Promise<Object>} - The D-ID API response
 */
export const createTalk = async (text, apiKey, options = {}) => {
  const url = `${DID_API_BASE_URL}/talks`;
  
  const payload = {
    source_url: options.source_url || "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg", // Default presenter
    script: {
      type: "text",
      input: text,
      provider: {
        type: "microsoft",
        voice_id: options.voice_id || "Sara",
        voice_config: {
          style: options.voice_style || "cheerful"
        }
      }
    },
    config: {
      fluent: true,
      pad_audio: 0.0,
      stitch: true,
      align_driver: true,
      align_expand_factor: 1.0,
      auto_match: true,
      normalization_factor: 1.0,
      sharpen: true,
      reduce_noise: true,
      ...options.config
    },
    ...options.additional_config
  };

  try {
    console.log('🎭 Creating D-ID talk with payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ D-ID API error response:', errorText);
      throw new Error(`D-ID API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ D-ID talk created successfully:', data.id);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating D-ID talk:', error);
    throw error;
  }
};

/**
 * Gets the status of a D-ID talk
 * @param {string} talkId - The ID of the talk to check
 * @param {string} apiKey - D-ID API key
 * @returns {Promise<Object>} - The talk status and details
 */
export const getTalkStatus = async (talkId, apiKey) => {
  const url = `${DID_API_BASE_URL}/talks/${talkId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D-ID API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error getting D-ID talk status:', error);
    throw error;
  }
};

/**
 * Creates a streaming session for live avatar interaction
 * @param {string} apiKey - D-ID API key
 * @param {Object} options - Session configuration options
 * @returns {Promise<Object>} - The streaming session details
 */
export const createStreamingSession = async (apiKey, options = {}) => {
  const url = `${DID_API_BASE_URL}/talks/streams`;
  
  const payload = {
    source_url: options.source_url || "https://d-id-public-bucket.s3.amazonaws.com/alice.jpg",
    ...options
  };

  try {
    console.log('🎥 Creating D-ID streaming session...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D-ID Streaming API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ D-ID streaming session created:', data.id);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating D-ID streaming session:', error);
    throw error;
  }
};

/**
 * Sends a message to an active streaming session
 * @param {string} sessionId - The streaming session ID
 * @param {string} text - The text to be spoken
 * @param {string} apiKey - D-ID API key
 * @param {Object} options - Additional streaming options
 * @returns {Promise<Object>} - The streaming response
 */
export const sendStreamingMessage = async (sessionId, text, apiKey, options = {}) => {
  const url = `${DID_API_BASE_URL}/talks/streams/${sessionId}`;
  
  const payload = {
    script: {
      type: "text",
      input: text,
      provider: {
        type: "microsoft",
        voice_id: options.voice_id || "Sara",
        voice_config: {
          style: options.voice_style || "cheerful"
        }
      }
    },
    config: {
      fluent: true,
      pad_audio: 0.0,
      ...options.config
    },
    session_id: sessionId
  };

  try {
    console.log(`🗣️ Sending message to D-ID stream ${sessionId}:`, text);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D-ID Streaming API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Message sent to D-ID stream successfully');
    return data;
    
  } catch (error) {
    console.error('❌ Error sending message to D-ID stream:', error);
    throw error;
  }
};

/**
 * Deletes a streaming session
 * @param {string} sessionId - The streaming session ID to delete
 * @param {string} apiKey - D-ID API key
 * @returns {Promise<boolean>} - Success status
 */
export const deleteStreamingSession = async (sessionId, apiKey) => {
  const url = `${DID_API_BASE_URL}/talks/streams/${sessionId}`;
  
  try {
    console.log(`🗑️ Deleting D-ID streaming session: ${sessionId}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Error deleting D-ID session: ${response.status} - ${errorText}`);
      return false;
    }

    console.log('✅ D-ID streaming session deleted successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting D-ID streaming session:', error);
    return false;
  }
};

export default {
  createTalk,
  getTalkStatus,
  createStreamingSession,
  sendStreamingMessage,
  deleteStreamingSession
};
