/**
 * Pre-defined anatomy templates for complex biological diagrams
 * Each template contains SVG-like paths, shapes, and anchor points for labels
 */

export const anatomyTemplates = {
  'human-heart': {
    title: 'Human Heart - Main Components',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Main heart outline (using connected points to form heart shape)
      { type: 'path', points: [
        [400, 200], [450, 250], [500, 300], [500, 400], [450, 450], [400, 480],
        [350, 450], [300, 400], [300, 300], [350, 250], [400, 200]
      ], stroke: '#e74c3c', fill: '#ffcccb', strokeWidth: 3 },
      
      // Right Atrium (top right chamber)
      { type: 'ellipse', x: 450, y: 300, rx: 40, ry: 50, stroke: '#34495e', fill: '#ecf0f1', strokeWidth: 2 },
      { type: 'text', x: 470, y: 290, text: 'Right Atrium', size: 14, color: '#2c3e50' },
      
      // Right Ventricle (bottom right chamber)
      { type: 'ellipse', x: 450, y: 400, rx: 40, ry: 60, stroke: '#34495e', fill: '#ecf0f1', strokeWidth: 2 },
      { type: 'text', x: 470, y: 400, text: 'Right Ventricle', size: 14, color: '#2c3e50' },
      
      // Left Atrium (top left chamber)
      { type: 'ellipse', x: 350, y: 300, rx: 40, ry: 50, stroke: '#34495e', fill: '#ecf0f1', strokeWidth: 2 },
      { type: 'text', x: 270, y: 290, text: 'Left Atrium', size: 14, color: '#2c3e50' },
      
      // Left Ventricle (bottom left chamber)
      { type: 'ellipse', x: 350, y: 400, rx: 40, ry: 60, stroke: '#34495e', fill: '#ecf0f1', strokeWidth: 2 },
      { type: 'text', x: 270, y: 400, text: 'Left Ventricle', size: 14, color: '#2c3e50' },
      
      // Vena Cava (incoming blood vessel - top)
      { type: 'line', x1: 450, y1: 250, x2: 450, y2: 200, stroke: '#3498db', strokeWidth: 8 },
      { type: 'text', x: 460, y: 220, text: 'Vena Cava', size: 12, color: '#2c3e50' },
      
      // Aorta (outgoing blood vessel - top left)
      { type: 'line', x1: 350, y1: 250, x2: 350, y2: 200, stroke: '#e74c3c', strokeWidth: 8 },
      { type: 'text', x: 280, y: 220, text: 'Aorta', size: 12, color: '#2c3e50' },
      
      // Blood flow arrows - oxygenated blood (red)
      { type: 'arrow', x1: 350, y1: 350, x2: 350, y2: 380, color: '#e74c3c', strokeWidth: 3 },
      { type: 'text', x: 360, y: 365, text: 'Blood', size: 11, color: '#e74c3c' },
      
      // Blood flow arrows - deoxygenated blood (blue)
      { type: 'arrow', x1: 450, y1: 350, x2: 450, y2: 380, color: '#3498db', strokeWidth: 3 },
      { type: 'text', x: 460, y: 365, text: 'Blood', size: 11, color: '#3498db' },
    ]
  },

  'human-brain': {
    title: 'Human Brain - Main Regions',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Brain outline (large ellipse)
      { type: 'ellipse', x: 400, y: 300, rx: 180, ry: 140, stroke: '#8e44ad', fill: '#e8daef', strokeWidth: 3 },
      
      // Frontal Lobe (front top)
      { type: 'path', points: [
        [300, 250], [350, 200], [450, 200], [500, 250], [450, 280], [350, 280], [300, 250]
      ], stroke: '#3498db', fill: '#d6eaf8', strokeWidth: 2 },
      { type: 'text', x: 380, y: 240, text: 'Frontal Lobe', size: 14, color: '#1f2937' },
      
      // Parietal Lobe (back top)
      { type: 'path', points: [
        [500, 250], [550, 220], [580, 280], [550, 320], [500, 300], [500, 250]
      ], stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 2 },
      { type: 'text', x: 510, y: 270, text: 'Parietal', size: 13, color: '#1f2937' },
      { type: 'text', x: 510, y: 290, text: 'Lobe', size: 13, color: '#1f2937' },
      
      // Temporal Lobe (side)
      { type: 'path', points: [
        [300, 300], [250, 320], [240, 380], [280, 400], [350, 380], [350, 320], [300, 300]
      ], stroke: '#2ecc71', fill: '#d5f4e6', strokeWidth: 2 },
      { type: 'text', x: 260, y: 350, text: 'Temporal', size: 13, color: '#1f2937' },
      { type: 'text', x: 270, y: 370, text: 'Lobe', size: 13, color: '#1f2937' },
      
      // Occipital Lobe (back)
      { type: 'path', points: [
        [500, 300], [550, 320], [580, 360], [560, 400], [500, 400], [500, 300]
      ], stroke: '#f39c12', fill: '#fdebd0', strokeWidth: 2 },
      { type: 'text', x: 510, y: 350, text: 'Occipital', size: 13, color: '#1f2937' },
      { type: 'text', x: 520, y: 370, text: 'Lobe', size: 13, color: '#1f2937' },
      
      // Cerebellum (bottom back)
      { type: 'ellipse', x: 480, y: 430, rx: 60, ry: 40, stroke: '#9b59b6', fill: '#ebdef0', strokeWidth: 2 },
      { type: 'text', x: 440, y: 435, text: 'Cerebellum', size: 13, color: '#1f2937' },
      
      // Brain Stem (bottom center)
      { type: 'rect', x: 380, y: 430, width: 40, height: 80, stroke: '#34495e', fill: '#d5dbdb', strokeWidth: 2 },
      { type: 'text', x: 350, y: 470, text: 'Brain Stem', size: 12, color: '#1f2937' },
    ]
  },

  'digestive-system': {
    title: 'Human Digestive System',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Mouth
      { type: 'rect', x: 370, y: 50, width: 60, height: 30, stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 2 },
      { type: 'text', x: 380, y: 70, text: 'Mouth', size: 12, color: '#1f2937' },
      
      // Esophagus (tube from mouth to stomach)
      { type: 'line', x1: 400, y1: 80, x2: 380, y2: 150, stroke: '#e74c3c', strokeWidth: 6 },
      { type: 'text', x: 410, y: 115, text: 'Esophagus', size: 11, color: '#1f2937' },
      
      // Stomach (curved pouch)
      { type: 'ellipse', x: 350, y: 180, rx: 50, ry: 60, stroke: '#e67e22', fill: '#fdebd0', strokeWidth: 3 },
      { type: 'text', x: 320, y: 185, text: 'Stomach', size: 13, color: '#1f2937' },
      
      // Small Intestine (coiled path)
      { type: 'path', points: [
        [350, 240], [320, 280], [340, 320], [380, 340], [420, 320], [440, 280], [420, 240], [380, 260], [360, 300]
      ], stroke: '#f39c12', fill: 'none', strokeWidth: 12 },
      { type: 'text', x: 360, y: 290, text: 'Small', size: 12, color: '#1f2937' },
      { type: 'text', x: 360, y: 305, text: 'Intestine', size: 12, color: '#1f2937' },
      
      // Large Intestine (outer coil)
      { type: 'path', points: [
        [280, 250], [280, 350], [280, 450], [400, 480], [520, 450], [520, 350], [520, 250], [450, 220]
      ], stroke: '#c0392b', fill: 'none', strokeWidth: 18 },
      { type: 'text', x: 240, y: 350, text: 'Large Intestine', size: 12, color: '#1f2937' },
      
      // Liver (top right)
      { type: 'ellipse', x: 480, y: 160, rx: 70, ry: 50, stroke: '#8b4513', fill: '#d4a574', strokeWidth: 2 },
      { type: 'text', x: 460, y: 165, text: 'Liver', size: 13, color: '#1f2937' },
      
      // Arrows showing flow
      { type: 'arrow', x1: 400, y1: 75, x2: 385, y2: 120, color: '#34495e', strokeWidth: 2 },
      { type: 'arrow', x1: 370, y1: 210, x2: 350, y2: 235, color: '#34495e', strokeWidth: 2 },
    ]
  },

  'respiratory-system': {
    title: 'Human Respiratory System',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Nose/Mouth opening
      { type: 'rect', x: 370, y: 80, width: 60, height: 25, stroke: '#3498db', fill: '#d6eaf8', strokeWidth: 2 },
      { type: 'text', x: 375, y: 97, text: 'Nose', size: 11, color: '#1f2937' },
      
      // Trachea (windpipe)
      { type: 'line', x1: 400, y1: 105, x2: 400, y2: 200, stroke: '#34495e', strokeWidth: 10 },
      { type: 'text', x: 410, y: 150, text: 'Trachea', size: 12, color: '#1f2937' },
      
      // Bronchi (branches to lungs)
      { type: 'line', x1: 400, y1: 200, x2: 320, y2: 250, stroke: '#34495e', strokeWidth: 8 },
      { type: 'line', x1: 400, y1: 200, x2: 480, y2: 250, stroke: '#34495e', strokeWidth: 8 },
      
      // Left Lung
      { type: 'ellipse', x: 300, y: 320, rx: 70, ry: 100, stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 3 },
      { type: 'text', x: 270, y: 325, text: 'Left Lung', size: 13, color: '#1f2937' },
      
      // Right Lung
      { type: 'ellipse', x: 500, y: 320, rx: 70, ry: 100, stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 3 },
      { type: 'text', x: 470, y: 325, text: 'Right Lung', size: 13, color: '#1f2937' },
      
      // Bronchioles in lungs (small branches)
      { type: 'line', x1: 320, y1: 250, x2: 290, y2: 280, stroke: '#95a5a6', strokeWidth: 4 },
      { type: 'line', x1: 320, y1: 250, x2: 310, y2: 290, stroke: '#95a5a6', strokeWidth: 4 },
      { type: 'line', x1: 320, y1: 250, x2: 330, y2: 290, stroke: '#95a5a6', strokeWidth: 4 },
      
      { type: 'line', x1: 480, y1: 250, x2: 510, y2: 280, stroke: '#95a5a6', strokeWidth: 4 },
      { type: 'line', x1: 480, y1: 250, x2: 490, y2: 290, stroke: '#95a5a6', strokeWidth: 4 },
      { type: 'line', x1: 480, y1: 250, x2: 470, y2: 290, stroke: '#95a5a6', strokeWidth: 4 },
      
      // Diaphragm
      { type: 'path', points: [
        [220, 420], [280, 450], [340, 460], [400, 460], [460, 460], [520, 450], [580, 420]
      ], stroke: '#8e44ad', fill: 'none', strokeWidth: 4 },
      { type: 'text', x: 360, y: 475, text: 'Diaphragm', size: 12, color: '#1f2937' },
      
      // Air flow arrows
      { type: 'arrow', x1: 400, y1: 75, x2: 400, y2: 100, color: '#3498db', strokeWidth: 2 },
      { type: 'text', x: 410, y: 85, text: 'Air In', size: 10, color: '#3498db' },
    ]
  },

  'plant-cell': {
    title: 'Plant Cell Structure',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Cell Wall (outer rectangle)
      { type: 'rect', x: 200, y: 150, width: 400, height: 300, stroke: '#27ae60', fill: 'none', strokeWidth: 4 },
      { type: 'text', x: 210, y: 170, text: 'Cell Wall', size: 13, color: '#27ae60' },
      
      // Cell Membrane (inner rectangle)
      { type: 'rect', x: 220, y: 170, width: 360, height: 260, stroke: '#2ecc71', fill: '#e8f8f5', strokeWidth: 2 },
      
      // Nucleus (large circle in center-left)
      { type: 'circle', x: 350, y: 280, r: 50, stroke: '#8e44ad', fill: '#ebdef0', strokeWidth: 3 },
      { type: 'text', x: 325, y: 285, text: 'Nucleus', size: 13, color: '#1f2937' },
      
      // Nucleolus (small circle inside nucleus)
      { type: 'circle', x: 360, y: 280, r: 15, stroke: '#5b2c6f', fill: '#d2b4de', strokeWidth: 2 },
      
      // Chloroplasts (green ovals)
      { type: 'ellipse', x: 280, y: 220, rx: 25, ry: 15, stroke: '#196f3d', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'ellipse', x: 320, y: 350, rx: 25, ry: 15, stroke: '#196f3d', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'ellipse', x: 480, y: 240, rx: 25, ry: 15, stroke: '#196f3d', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'ellipse', x: 510, y: 320, rx: 25, ry: 15, stroke: '#196f3d', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'text', x: 520, y: 245, text: 'Chloroplast', size: 11, color: '#1f2937' },
      
      // Vacuole (large irregular shape - right side)
      { type: 'ellipse', x: 480, y: 300, rx: 60, ry: 80, stroke: '#3498db', fill: '#d6eaf8', strokeWidth: 2 },
      { type: 'text', x: 455, y: 305, text: 'Vacuole', size: 12, color: '#1f2937' },
      
      // Mitochondria (small bean shapes)
      { type: 'ellipse', x: 270, y: 320, rx: 20, ry: 12, stroke: '#e67e22', fill: '#fdebd0', strokeWidth: 2 },
      { type: 'ellipse', x: 420, y: 370, rx: 20, ry: 12, stroke: '#e67e22', fill: '#fdebd0', strokeWidth: 2 },
      { type: 'text', x: 240, y: 295, text: 'Mitochondria', size: 10, color: '#1f2937' },
      
      // Endoplasmic Reticulum (wavy lines around nucleus)
      { type: 'path', points: [
        [280, 250], [270, 260], [280, 270], [270, 280], [280, 290]
      ], stroke: '#95a5a6', fill: 'none', strokeWidth: 3 },
      { type: 'text', x: 240, y: 270, text: 'ER', size: 10, color: '#1f2937' },
      
      // Golgi Body (stacked curved lines)
      { type: 'path', points: [
        [440, 220], [460, 215], [480, 220]
      ], stroke: '#f39c12', fill: 'none', strokeWidth: 2 },
      { type: 'path', points: [
        [440, 225], [460, 220], [480, 225]
      ], stroke: '#f39c12', fill: 'none', strokeWidth: 2 },
      { type: 'path', points: [
        [440, 230], [460, 225], [480, 230]
      ], stroke: '#f39c12', fill: 'none', strokeWidth: 2 },
      { type: 'text', x: 430, y: 210, text: 'Golgi', size: 10, color: '#1f2937' },
    ]
  }
};

// Function to get template by keywords in user prompt
export function matchTemplate(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  const keywords = {
    'human-heart': ['heart', 'cardiac', 'atrium', 'ventricle', 'cardiovascular'],
    'human-brain': ['brain', 'cerebral', 'lobe', 'frontal', 'cerebellum', 'neural'],
    'digestive-system': ['digestive', 'stomach', 'intestine', 'digestion', 'gut', 'esophagus'],
    'respiratory-system': ['respiratory', 'lung', 'breathing', 'trachea', 'bronchi', 'respiration'],
    'plant-cell': ['plant cell', 'chloroplast', 'vacuole', 'cell wall', 'plant structure']
  };
  
  for (const [templateId, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => lowerPrompt.includes(keyword))) {
      return anatomyTemplates[templateId];
    }
  }
  
  return null; // No template match, use GPT generation
}
