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

IMPORTANT RULES:
1. NEVER use white (#fff or #ffffff) for text - it's invisible on white canvas!
2. Use dark colors for text: #1f2937 (dark gray), #000 (black), or matching element color
3. For cycles/processes, ALWAYS add arrows between elements to show flow
4. Add MORE details - labels, measurements, connecting lines, explanations
5. Make diagrams educational and complete, not minimal

Colors: #3b82f6(blue) #10b981(green) #f59e0b(orange) #ef4444(red) #8b5cf6(purple) #1f2937(dark)
Fills: Add "20" for 20% opacity (e.g., #3b82f620)

GOOD EXAMPLES:

Life Cycle (with arrows!):
{
  "title": "Life Cycle",
  "elements": [
    "circ:400,100,50,#3b82f6,#3b82f620",
    "txt:400,110,18,#1f2937,Birth",
    "arrow:450,120,550,200,#666,",
    "circ:600,250,50,#10b981,#10b98120",
    "txt:600,260,18,#1f2937,Childhood",
    "arrow:600,310,400,380,#666,",
    "circ:400,450,50,#f59e0b,#f59e0b20",
    "txt:400,460,18,#1f2937,Adulthood",
    "arrow:350,450,250,310,#666,",
    "circ:200,250,50,#ef4444,#ef444420",
    "txt:200,260,18,#1f2937,Elderly",
    "arrow:220,200,350,120,#666,Back to Birth",
    "txt:400,550,16,#1f2937,Continuous Cycle of Life"
  ]
}

Triangle area (detailed):
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

Water Cycle (with arrows!):
{
  "title": "Water Cycle",
  "elements": [
    "circ:150,400,40,#3b82f6,#3b82f650",
    "txt:150,410,16,#1f2937,Ocean",
    "arrow:180,370,280,250,#10b981,Evaporation",
    "circ:300,200,35,#8b5cf6,#8b5cf650",
    "txt:300,210,16,#1f2937,Clouds",
    "arrow:350,220,500,300,#3b82f6,Rain",
    "circ:550,350,40,#10b981,#10b98150",
    "txt:550,360,16,#1f2937,Land",
    "arrow:500,380,200,410,#6366f1,Runoff",
    "txt:400,500,20,#1f2937,The Continuous Water Cycle"
  ]
}

Return ONLY compact JSON. Make it DETAILED and EDUCATIONAL with proper connections!`
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
