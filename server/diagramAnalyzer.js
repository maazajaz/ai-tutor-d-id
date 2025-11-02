/**
 * Diagram Analyzer - Analyzes chat conversation and generates diagram instructions
 * Uses AI to determine what type of diagram to create and what elements to include
 */

/**
 * Analyze chat text and determine appropriate diagram type
 * @param {string} chatText - The chat conversation text
 * @returns {Promise<{diagramType: string, elements: Array}>}
 */
async function analyzeDiagram(chatText) {
  try {
    // Keywords and patterns for different diagram types
    const patterns = {
      flowchart: /\b(steps?|process|algorithm|flow|procedure|sequence|first|then|next|finally|how\s+to|explain.*steps|sorting|quicksort|mergesort|bubblesort)\b/i,
      mindmap: /\b(concept|idea|brain\s?storm|mind\s?map|central|topic|related|connection|types?\s+of|categories|show\s+me.*concepts?|what\s+is.*oop|oop|object.?oriented|ai|artificial|data.?structure|web.?dev)/i,
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
