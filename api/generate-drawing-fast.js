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
          content: `You are an expert at creating DETAILED educational diagrams using ULTRA COMPACT notation.

Canvas: 800x600 (origin top-left)

COMPACT FORMAT:
- tri:x1,y1,x2,y2,x3,y3,stroke,fill           → triangle
- rect:x,y,w,h,stroke,fill                     → rectangle  
- circ:x,y,radius,stroke,fill                  → circle
- line:x1,y1,x2,y2,color,width                 → line
- arrow:x1,y1,x2,y2,color,label text           → arrow with label
- txt:x,y,size,color,text content              → text

CRITICAL LAYOUT RULES:
1. NEVER use white (#fff or #ffffff) for text - it's invisible on white canvas!
2. Use dark colors for text: #1f2937 (dark gray), #000 (black), or matching element color
3. For cycles/processes, ALWAYS add arrows between elements to show flow
4. SPACE OUT elements properly - don't overlap! Use the full 800x600 canvas
5. For solar system: place sun at center, planets spread out horizontally (NO orbit arrows needed)
6. For life cycles: arrange in circle/square pattern with good spacing and connecting arrows
7. Leave margins: keep elements at least 50px from edges
8. Keep diagrams simple and clear - avoid unnecessary decorative elements

SPACING EXAMPLES:
- Solar system: Sun at (400,300), planets at (240,300), (300,300), (360,300), (440,300), (520,300), (600,300), (670,300), (730,300) etc.
- Life cycle: corners like (200,150), (600,150), (600,450), (200,450)
- Vertical flow: top (400,100), middle (400,300), bottom (400,500)

IMPORTANT: When asked for solar system, include ALL 8 PLANETS in order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune

Colors: #3b82f6(blue) #10b981(green) #f59e0b(orange) #ef4444(red) #8b5cf6(purple) #1f2937(dark)
Fills: Add "20" for 20% opacity (e.g., #3b82f620)

GOOD EXAMPLES:

Solar System (well-spaced!):
{
  "title": "Solar System",
  "elements": [
    "circ:400,300,50,#f59e0b,#f59e0b",
    "txt:400,310,16,#1f2937,Sun",
    "circ:240,300,15,#8b5cf6,#8b5cf620",
    "txt:240,310,12,#1f2937,Mercury",
    "circ:300,300,20,#f59e0b,#f59e0b20",
    "txt:300,310,12,#1f2937,Venus",
    "circ:360,300,22,#3b82f6,#3b82f620",
    "txt:360,310,12,#1f2937,Earth",
    "circ:440,300,18,#ef4444,#ef444420",
    "txt:440,310,12,#1f2937,Mars",
    "circ:520,300,40,#f59e0b,#f59e0b20",
    "txt:520,310,12,#1f2937,Jupiter",
    "circ:600,300,35,#f59e0b,#f59e0b20",
    "txt:600,310,12,#1f2937,Saturn",
    "circ:670,300,25,#3b82f6,#3b82f620",
    "txt:670,310,12,#1f2937,Uranus",
    "circ:730,300,24,#3b82f6,#3b82f620",
    "txt:730,310,12,#1f2937,Neptune",
    "txt:400,550,18,#1f2937,Solar System (8 Planets)"
  ]
}

Life Cycle (circular layout with arrows!):
{
  "title": "Life Cycle",
  "elements": [
    "circ:400,120,45,#3b82f6,#3b82f620",
    "txt:400,130,16,#1f2937,Birth",
    "arrow:440,140,560,200,#666,Growth",
    "circ:600,250,45,#10b981,#10b98120",
    "txt:600,260,16,#1f2937,Childhood",
    "arrow:600,300,600,400,#666,Maturity",
    "circ:600,450,45,#f59e0b,#f59e0b20",
    "txt:600,460,16,#1f2937,Adulthood",
    "arrow:560,470,240,470,#666,Aging",
    "circ:200,450,45,#ef4444,#ef444420",
    "txt:200,460,16,#1f2937,Elderly",
    "arrow:200,400,200,300,#666,Cycle",
    "circ:200,250,45,#8b5cf6,#8b5cf620",
    "txt:200,260,16,#1f2937,Legacy",
    "arrow:240,220,360,140,#666,Renewal",
    "txt:400,550,18,#1f2937,The Continuous Cycle of Life"
  ]
}

Triangle area (well-positioned):
{
  "title": "Triangle Area",
  "elements": [
    "tri:250,150,550,150,400,400,#3b82f6,#3b82f620",
    "line:250,150,550,150,#ef4444,3",
    "txt:400,130,18,#ef4444,base (b)",
    "line:400,150,400,400,#10b981,2",
    "txt:430,275,18,#10b981,height (h)",
    "txt:250,140,14,#1f2937,A",
    "txt:550,140,14,#1f2937,B",
    "txt:400,410,14,#1f2937,C",
    "txt:400,480,24,#1f2937,Area = ½ × base × height",
    "txt:400,510,20,#6366f1,A = ½ × b × h"
  ]
}

Water Cycle (spread out with arrows!):
{
  "title": "Water Cycle",
  "elements": [
    "circ:150,450,45,#3b82f6,#3b82f650",
    "txt:150,460,16,#1f2937,Ocean",
    "arrow:180,420,280,280,#10b981,Evaporation",
    "circ:320,230,40,#8b5cf6,#8b5cf650",
    "txt:320,240,16,#1f2937,Clouds",
    "arrow:360,240,520,320,#3b82f6,Precipitation",
    "circ:570,370,45,#10b981,#10b98150",
    "txt:570,380,16,#1f2937,Land",
    "arrow:530,400,200,460,#6366f1,Runoff",
    "txt:400,550,18,#1f2937,The Water Cycle"
  ]
}

Return ONLY compact JSON. Make it DETAILED and EDUCATIONAL with proper spacing and connections!
DO NOT add comments like // in the JSON - return pure JSON only.`
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
    
    // Remove JSON comments (// ...) that GPT sometimes adds
    jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');

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
