/**
 * Diagram Analyzer - Analyzes chat conversation and generates diagram instructions
 * Uses AI to determine what type of diagram to create and what elements to include
 */

import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

/**
 * Analyze chat text and determine appropriate diagram type or image using AI
 * @param {string} chatText - The chat conversation text
 * @returns {Promise<{diagramType: string, elements: Array, imageQuery?: string, shouldGenerateImage?: boolean}>}
 */
async function analyzeDiagram(chatText) {
  try {
    // If OpenAI is available, use AI-powered analysis
    if (openai) {
      return await analyzeWithAI(chatText);
    }
    
    // Fallback to pattern-based analysis
    return analyzeDiagramWithPatterns(chatText);
  } catch (error) {
    console.error('Error analyzing diagram:', error);
    // Fallback to pattern-based if AI fails
    return analyzeDiagramWithPatterns(chatText);
  }
}

/**
 * Use OpenAI to intelligently analyze and generate diagram or determine if image is better
 */
async function analyzeWithAI(chatText) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "system",
      content: `You are a visual content expert for educational content. Analyze the user's question and decide the best visual representation.

CRITICAL DECISION RULES:

1. USE DALL-E IMAGE GENERATION FOR:
   - Mathematical concepts/explanations (geometry, algebra, calculus)
   - Scientific processes/concepts (physics, chemistry, biology diagrams)
   - Educational explanations that need custom illustration
   - Abstract concepts that need visual representation
   - "How to calculate", "explain formula", "show process"
   - Return: { "diagramType": "dalle_image", "imagePrompt": "educational illustration..." }

2. USE UNSPLASH/STOCK PHOTOS FOR:
   - Real-world objects, animals, places (lion, Eiffel Tower, butterfly)
   - Natural phenomena you can photograph (sunset, volcano, ocean)
   - Landmarks, buildings, landscapes
   - People, faces, everyday objects
   - Return: { "diagramType": "image", "imageQuery": "photo of..." }

3. USE TRADITIONAL DIAGRAMS FOR:
   - Step-by-step processes/algorithms (flowcharts)
   - Concept relationships (mindmaps)
   - Data comparisons (graphs)
   - Return: { "diagramType": "flowchart|mindmap|graph", "elements": [...] }

EXAMPLES:
❌ Wrong: "perimeter of square" → Unsplash photo (generic square image)
✅ Right: "perimeter of square" → DALL-E ("educational diagram showing square with labeled sides and perimeter formula P=4s")

❌ Wrong: "photosynthesis process" → Unsplash photo (plant photo)
✅ Right: "photosynthesis process" → DALL-E ("scientific diagram of photosynthesis with labeled arrows showing CO2, sunlight, and O2")

✅ Right: "what does a lion look like" → Unsplash ("realistic photo of lion in savanna")

Response format:
{
  "diagramType": "dalle_image|image|flowchart|mindmap|graph|diagram",
  "imagePrompt": "detailed DALL-E prompt (only for dalle_image)",
  "imageQuery": "search query (only for image/stock photos)",
  "elements": [
    // For traditional diagrams only
  ]
}

Return ONLY valid JSON, no markdown or explanation.`
    }, {
      role: "user",
      content: `Analyze and determine best visual for: ${chatText}`
    }],
    temperature: 0.7,
    max_tokens: 500
  });

  const result = JSON.parse(response.choices[0].message.content);
  
  // Validate the result
  if (!result.diagramType) {
    throw new Error('Invalid AI response format');
  }
  
  return result;
}

/**
 * Pattern-based fallback analysis - now includes image detection
 * @param {string} chatText - The chat conversation text
 * @returns {Promise<{diagramType: string, elements: Array, imageQuery?: string, imagePrompt?: string}>}
 */
async function analyzeDiagramWithPatterns(chatText) {
  try {
    // Check for educational/mathematical concepts that need DALL-E
    const dallePatterns = {
      dalle_image: /\b(how\s+to\s+(calculate|find|solve|compute)|explain.*formula|perimeter|area|volume|theorem|equation|proof|derive|geometric|trigonometry|calculus|physics|chemistry|biology.*process|photosynthesis|cellular|molecular|atomic|circuit|diagram.*how)\b/i,
    };
    
    // Check if it's a DALL-E educational image request
    for (const [type, pattern] of Object.entries(dallePatterns)) {
      if (pattern.test(chatText)) {
        // Extract the educational concept
        const concept = chatText.replace(/how\s+to\s+|what\s+is\s+|explain\s+/gi, '').trim();
        
        return {
          diagramType: 'dalle_image',
          imagePrompt: `Educational diagram explaining ${concept}. Clear, labeled illustration with formulas, arrows, and annotations. Professional textbook style.`,
          elements: [],
          confidence: 'high'
        };
      }
    }
    
    // Check if user is asking for visual representation of a concrete object/concept
    const imagePatterns = {
      image: /\b(what\s+(does|is|are)|show\s+me|looks?\s+like|picture\s+of|image\s+of|photo\s+of|appearance|visual)\b.*\b(lion|tiger|elephant|animal|bird|fish|plant|flower|tree|mountain|ocean|building|car|vehicle|person|face|sunset|landscape|country|city|planet|star|galaxy|dinosaur|fossil|artwork|painting|sculpture|Eiffel|Tower|monument|landmark)\b/i,
    };
    
    // Check if it's a stock photo request (real-world objects)
    for (const [type, pattern] of Object.entries(imagePatterns)) {
      if (pattern.test(chatText)) {
        // Extract the subject from the question
        const subjectMatch = chatText.match(/\b(lion|tiger|elephant|animal|bird|fish|plant|flower|tree|mountain|ocean|building|car|vehicle|person|face|sunset|landscape|country|city|planet|star|galaxy|dinosaur|fossil|artwork|painting|sculpture|Eiffel|Tower|monument|landmark|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i);
        const subject = subjectMatch ? subjectMatch[0] : 'concept';
        
        return {
          diagramType: 'image',
          imageQuery: `educational photo of ${subject}, high quality, detailed`,
          elements: [],
          confidence: 'high'
        };
      }
    }

    // Keywords and patterns for different diagram types
    const patterns = {
      flowchart: /\b(steps?|process|algorithm|flow|procedure|sequence|first|then|next|finally|how\s+to|explain.*steps|sorting|quicksort|mergesort|bubblesort)\b/i,
      mindmap: /\b(concept|idea|brain\s?storm|mind\s?map|central|topic|related|connection|types?\s+of|categories|show\s+me.*concepts?|what\s+is.*oop|oop|object.?oriented|ai|artificial|data.?structure|web.?dev)\b/i,
      graph: /\b(chart|graph|data|statistics|compare|versus|vs|numbers?|percentage|analysis|performance)\b/i,
      diagram: /\b(diagram|structure|architecture|component|system|model|design|tree|binary|hierarchy)\b/i,
      equation: /\b(equation|formula|math|calculate|solve|express|=|\+|-|\*|\/)\b/i,
    };

    // Detect diagram type based on keywords
    let diagramType = 'diagram'; // default
    let maxScore = 0;

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = chatText.match(new RegExp(pattern, 'gi'));
      if (matches && matches.length > maxScore) {
        maxScore = matches.length;
        diagramType = type;
      }
    }

    // Extract key elements from the chat
    const elements = extractElements(chatText, diagramType);

    return {
      diagramType,
      elements,
      confidence: maxScore > 0 ? 'high' : 'low'
    };
  } catch (error) {
    console.error('Error analyzing diagram:', error);
    throw error;
  }
}

/**
 * Extract key elements from chat text based on diagram type
 * @param {string} text - The text to analyze
 * @param {string} diagramType - The type of diagram
 * @returns {Array} Array of elements with text and optional value
 */
function extractElements(text, diagramType) {
  const elements = [];

  switch (diagramType) {
    case 'flowchart':
      // Check if it's a known algorithm
      if (/quicksort|quick\s+sort/i.test(text)) {
        elements.push(
          { text: 'Choose pivot element', type: 'step' },
          { text: 'Partition array around pivot', type: 'step' },
          { text: 'Elements < pivot go left', type: 'step' },
          { text: 'Elements > pivot go right', type: 'step' },
          { text: 'Recursively sort left partition', type: 'step' },
          { text: 'Recursively sort right partition', type: 'step' },
          { text: 'Combine sorted partitions', type: 'step' }
        );
        return elements;
      }
      
      if (/mergesort|merge\s+sort/i.test(text)) {
        elements.push(
          { text: 'Divide array into two halves', type: 'step' },
          { text: 'Recursively sort left half', type: 'step' },
          { text: 'Recursively sort right half', type: 'step' },
          { text: 'Merge sorted halves', type: 'step' },
          { text: 'Compare elements from both halves', type: 'step' },
          { text: 'Place smaller element first', type: 'step' },
          { text: 'Repeat until all merged', type: 'step' }
        );
        return elements;
      }
      
      if (/bubblesort|bubble\s+sort/i.test(text)) {
        elements.push(
          { text: 'Start at beginning of array', type: 'step' },
          { text: 'Compare adjacent elements', type: 'step' },
          { text: 'Swap if left > right', type: 'step' },
          { text: 'Move to next pair', type: 'step' },
          { text: 'Repeat until end of array', type: 'step' },
          { text: 'Largest element bubbled to end', type: 'step' },
          { text: 'Repeat for remaining elements', type: 'step' }
        );
        return elements;
      }
      
      // Extract steps from numbered lists or sequences
      const stepPatterns = [
        /(?:step\s*)?(\d+)[:.)\s]+([^.?\n]+)/gi,
        /(?:first|then|next|finally|after that)[,:\s]+([^.?\n]+)/gi,
      ];
      
      stepPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const stepText = match[2] || match[1];
          if (stepText && stepText.length < 100) {
            elements.push({
              text: stepText.trim(),
              type: 'step'
            });
          }
        }
      });

      // If no steps found, extract sentences
      if (elements.length === 0) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        sentences.slice(0, 5).forEach(sentence => {
          elements.push({
            text: sentence.trim().substring(0, 80),
            type: 'step'
          });
        });
      }
      break;

    case 'mindmap':
      // Check for known topics first
      if (/\boop\b|object.?oriented/i.test(text)) {
        // OOP concepts
        return [
          { text: 'OOP', type: 'center' },
          { text: 'Encapsulation', type: 'node' },
          { text: 'Inheritance', type: 'node' },
          { text: 'Polymorphism', type: 'node' },
          { text: 'Abstraction', type: 'node' },
          { text: 'Classes & Objects', type: 'node' },
          { text: 'Data Hiding', type: 'node' }
        ];
      } else if (/\bai\b|artificial.intelligence/i.test(text)) {
        return [
          { text: 'AI', type: 'center' },
          { text: 'Machine Learning', type: 'node' },
          { text: 'Neural Networks', type: 'node' },
          { text: 'Natural Language', type: 'node' },
          { text: 'Computer Vision', type: 'node' },
          { text: 'Robotics', type: 'node' }
        ];
      } else if (/\bweb.?dev|web.?development/i.test(text)) {
        return [
          { text: 'Web Dev', type: 'center' },
          { text: 'HTML/CSS', type: 'node' },
          { text: 'JavaScript', type: 'node' },
          { text: 'Backend', type: 'node' },
          { text: 'Databases', type: 'node' },
          { text: 'APIs', type: 'node' }
        ];
      } else if (/\bdata.?structure/i.test(text)) {
        return [
          { text: 'Data Structures', type: 'center' },
          { text: 'Arrays', type: 'node' },
          { text: 'Linked Lists', type: 'node' },
          { text: 'Trees', type: 'node' },
          { text: 'Graphs', type: 'node' },
          { text: 'Hash Tables', type: 'node' }
        ];
      }
      
      // Extract key concepts (nouns and noun phrases)
      const concepts = extractKeyPhrases(text);
      concepts.slice(0, 8).forEach(concept => {
        elements.push({
          text: concept,
          type: 'node'
        });
      });
      break;

    case 'graph':
      // Try to extract numerical data
      const numberPattern = /([a-zA-Z\s]+)[:=\s]+(\d+(?:\.\d+)?)\s*%?/g;
      let numMatch;
      while ((numMatch = numberPattern.exec(text)) !== null) {
        elements.push({
          text: numMatch[1].trim(),
          value: numMatch[2],
          type: 'bar'
        });
      }

      // If no numbers found, create sample data from key terms
      if (elements.length === 0) {
        const terms = extractKeyPhrases(text).slice(0, 5);
        terms.forEach((term, index) => {
          elements.push({
            text: term,
            value: (index + 1) * 20, // Sample values
            type: 'bar'
          });
        });
      }
      break;

    case 'equation':
      // Extract mathematical expressions
      const mathPattern = /([^.!?]*(?:[+\-*/=^]|\\frac|\\sum|\\int)[^.!?]*)/g;
      const mathMatches = text.match(mathPattern) || [];
      mathMatches.slice(0, 3).forEach(expr => {
        elements.push({
          text: expr.trim(),
          type: 'expression'
        });
      });

      // If no equations found, extract formulas from text
      if (elements.length === 0) {
        const formulaPattern = /([a-zA-Z]\s*=\s*[^.!?\n]+)/g;
        const formulas = text.match(formulaPattern) || [];
        formulas.slice(0, 3).forEach(formula => {
          elements.push({
            text: formula.trim(),
            type: 'formula'
          });
        });
      }
      break;

    case 'diagram':
    default:
      // Extract key components/items
      const items = extractKeyPhrases(text);
      items.slice(0, 6).forEach(item => {
        elements.push({
          text: item,
          type: 'component'
        });
      });
      break;
  }

  // Ensure we have at least some elements
  if (elements.length === 0) {
    elements.push({
      text: 'No specific structure detected',
      type: 'default'
    });
    elements.push({
      text: 'Drawing from conversation',
      type: 'default'
    });
  }

  return elements;
}

/**
 * Extract key phrases from text (simple implementation)
 * @param {string} text - The text to analyze
 * @returns {Array<string>} Array of key phrases
 */
function extractKeyPhrases(text) {
  // Remove common words
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

  // Split into words and filter
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top phrases
  const sorted = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  return sorted.slice(0, 10);
}

export { analyzeDiagram };
