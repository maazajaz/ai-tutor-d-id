// Simple D-ID API proxy for Vercel
export default async function handler(req, res) {
  console.log('🚀 D-ID Proxy called:', req.method);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'OK', 
      message: 'D-ID Proxy working',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { path, method = 'GET', headers = {}, body } = req.body || {};
    const apiKey = process.env.VITE_DID_API_KEY || process.env.DID_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing' });
    }

    if (!path) {
      return res.status(400).json({ error: 'Path required' });
    }

    const url = `https://api.d-id.com${path}`;
    console.log('📡 Proxying to:', url);

    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
    });

    const data = await response.text();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `D-ID Error: ${response.status}`,
        details: data 
      });
    }

    try {
      res.status(response.status).json(JSON.parse(data));
    } catch {
      res.status(response.status).send(data);
    }

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}