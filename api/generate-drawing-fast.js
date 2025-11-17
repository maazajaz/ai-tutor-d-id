import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🎨 Generating drawing (compact format):', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',  // Faster than GPT-4 (1-2 sec vs 5-10 sec)
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating educational diagrams using ULTRA COMPACT notation.

Canvas: 800x600 (origin top-left)

COMPACT FORMAT (saves 80% tokens vs JSON):
- tri:x1,y1,x2,y2,x3,y3,stroke,fill           → triangle
- rect:x,y,w,h,stroke,fill                     → rectangle  
- circ:x,y,radius,stroke,fill                  → circle
- line:x1,y1,x2,y2,color,width                 → line
- arrow:x1,y1,x2,y2,color,label text           → arrow with label
- txt:x,y,size,color,text content              → text

Colors: #3b82f6(blue) #10b981(green) #f59e0b(orange) #ef4444(red) #8b5cf6(purple)
Fills: Add "20" for 20% opacity (e.g., #3b82f620)

EXAMPLES:

Triangle area:
{
  "title": "Triangle Area",
  "elements": [
    "tri:250,150,550,150,400,400,#3b82f6,#3b82f620",
    "line:250,150,550,150,#ef4444,3",
    "txt:400,130,18,#ef4444,base (b)",
    "line:400,150,400,400,#10b981,2",
    "txt:430,275,18,#10b981,height (h)",
    "txt:400,480,24,#1f2937,Area = ½ × base × height"
  ]
}

Solar system:
{
  "title": "Solar System",
  "elements": [
    "circ:400,300,60,#f59e0b,#f59e0b",
    "txt:400,310,20,#fff,Sun",
    "circ:280,300,15,#8b5cf6,#8b5cf650",
    "circ:520,300,15,#3b82f6,#3b82f650",
    "circ:340,240,12,#ef4444,#ef444450",
    "circ:460,360,12,#10b981,#10b98150"
  ]
}

Return ONLY compact JSON. Be educational and clear!`
        },
        {
          role: 'user',
          content: `Create compact drawing for: ${prompt}\n\nReturn ONLY JSON with title and elements array (compact format).`
        }
      ],
      temperature: 0.7,
      max_tokens: 800  // Much less tokens needed!
    });

    const content = completion.choices[0].message.content.trim();
    
    // Remove markdown if present
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
    }

    let drawingData;
    try {
      drawingData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ Parse error:', jsonStr);
      return res.status(500).json({ 
        error: 'Failed to parse response',
        details: parseError.message
      });
    }

    console.log('✅ Drawing generated:', drawingData.title, `(${drawingData.elements.length} elements)`);
    return res.status(200).json(drawingData);
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
}
