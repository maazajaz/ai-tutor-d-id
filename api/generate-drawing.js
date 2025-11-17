import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  console.log('🎨 Drawing Generation Request Received');

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('📝 Generating drawing for:', prompt);

    // Call OpenAI to generate drawing instructions
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating educational diagrams using simple geometric shapes.
          
Your task is to convert text descriptions into drawing instructions for a canvas.

AVAILABLE SHAPES:
- triangle: { type: "triangle", points: [[x1,y1], [x2,y2], [x3,y3]], color: "#000000", strokeWidth: 2, fill: "transparent" }
- rectangle: { type: "rectangle", x: 100, y: 100, width: 200, height: 150, color: "#000000", strokeWidth: 2, fill: "transparent" }
- circle: { type: "circle", x: 400, y: 300, radius: 50, color: "#000000", strokeWidth: 2, fill: "transparent" }
- line: { type: "line", x1: 100, y1: 100, x2: 200, y2: 200, color: "#000000", strokeWidth: 2 }
- arrow: { type: "arrow", x1: 100, y1: 100, x2: 200, y2: 200, color: "#000000", strokeWidth: 2 }
- text: { type: "text", text: "Label", x: 150, y: 120, fontSize: 16, color: "#000000", align: "center" }
- arc: { type: "arc", x: 200, y: 200, width: 100, height: 100, start: 0, stop: Math.PI, closed: false }

CANVAS SIZE: 800x600 pixels

GUIDELINES:
1. Keep diagrams centered and well-spaced
2. Use appropriate colors (#000000 for main, #0066CC for highlights, #CC0000 for emphasis)
3. Add clear labels with text elements
4. For math concepts, show formulas and measurements
5. Make diagrams educational and easy to understand
6. Use arrows to show relationships or flow
7. Use hachure fills sparingly for emphasis

EXAMPLE - "area of triangle":
{
  "title": "Triangle Area Formula",
  "description": "A triangle showing base, height, and area calculation",
  "elements": [
    { "type": "triangle", "points": [[200,400], [600,400], [400,150]], "color": "#0066CC", "strokeWidth": 3 },
    { "type": "line", "x1": 200, "y1": 400, "x2": 600, "y2": 400, "color": "#CC0000", "strokeWidth": 2 },
    { "type": "text", "text": "base (b)", "x": 400, "y": 430, "fontSize": 18, "color": "#CC0000", "align": "center" },
    { "type": "line", "x1": 400, "y1": 400, "x2": 400, "y2": 150, "color": "#009900", "strokeWidth": 2 },
    { "type": "text", "text": "height (h)", "x": 420, "y": 275, "fontSize": 18, "color": "#009900", "align": "left" },
    { "type": "text", "text": "Area = ½ × base × height", "x": 400, "y": 500, "fontSize": 20, "color": "#000000", "align": "center" },
    { "type": "text", "text": "A = ½bh", "x": 400, "y": 530, "fontSize": 24, "color": "#0066CC", "align": "center" }
  ]
}

Return ONLY valid JSON with the structure above. No markdown, no explanation.`
        },
        {
          role: "user",
          content: `Create a drawing for: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    if (!result.elements || !Array.isArray(result.elements)) {
      throw new Error('Invalid response format - missing elements array');
    }

    console.log('✅ Generated', result.elements.length, 'elements');

    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error generating drawing:', error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'Failed to parse AI response',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to generate drawing',
      details: error.message
    });
  }
}
