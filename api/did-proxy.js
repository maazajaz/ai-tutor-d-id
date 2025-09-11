import fetch from 'node-fetch';

import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('🚀 Proxy function called:', req.method, req.url);
  console.log('📝 Request headers:', req.headers);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return res.status(200).end();
  }

  // Add a simple health check
  if (req.method === 'GET') {
    console.log('✅ Health check request');
    return res.status(200).json({ 
      status: 'OK', 
      message: 'D-ID Proxy is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    });
  }

  try {
    console.log('📦 Request body:', req.body);
    const { path, method = 'GET', headers = {}, body } = req.body || {};
    const apiKey = process.env.VITE_DID_API_KEY || process.env.DID_API_KEY;
    
    console.log('🔑 API Key present:', !!apiKey);
    console.log('🎯 Target path:', path);
    console.log('📝 HTTP method:', method);
    
    if (!apiKey) {
      console.error('❌ D-ID API key not configured');
      return res.status(500).json({ error: 'D-ID API key not configured' });
    }

    if (!path) {
      console.error('❌ No path provided');
      return res.status(400).json({ error: 'Path is required' });
    }

    const url = `https://api.d-id.com${path}`;
    console.log(`🔄 Proxying ${method} request to:`, url);

    const fetchOptions = {
      method: method,
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
    };

    // Only add body for non-GET requests
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
      console.log('📤 Request body:', fetchOptions.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.text();
    
    console.log(`📥 D-ID API Response: ${response.status}`);
    
    if (!response.ok) {
      console.error('❌ D-ID API Error:', response.status, data);
      return res.status(response.status).json({ 
        error: `D-ID API Error: ${response.status}`,
        details: data 
      });
    }

    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Returning JSON response');
      res.status(response.status).json(jsonData);
    } catch {
      console.log('✅ Returning text response');
      res.status(response.status).send(data);
    }

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      details: error.message 
    });
  }
}
