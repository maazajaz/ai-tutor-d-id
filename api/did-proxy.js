import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { path, method = 'GET', headers = {}, body } = req.body;
    const apiKey = process.env.VITE_DID_API_KEY || process.env.DID_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'D-ID API key not configured' });
    }

    const url = `https://api.d-id.com${path}`;
    console.log(`Proxying ${method} request to:`, url);

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
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.text();
    
    if (!response.ok) {
      console.error('D-ID API Error:', response.status, data);
      return res.status(response.status).json({ 
        error: `D-ID API Error: ${response.status}`,
        details: data 
      });
    }

    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(data);
      res.status(response.status).json(jsonData);
    } catch {
      res.status(response.status).send(data);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy server error', 
      details: error.message 
    });
  }
}
