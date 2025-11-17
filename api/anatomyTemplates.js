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
  },

  'dog-anatomy': {
    title: 'Dog Body Parts',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Head (large circle)
      { type: 'circle', x: 600, y: 250, r: 60, stroke: '#8b4513', fill: '#d2b48c', strokeWidth: 3 },
      { type: 'text', x: 600, y: 260, text: 'Head', size: 16, color: '#1f2937' },
      
      // Snout/Muzzle (ellipse extending from head)
      { type: 'ellipse', x: 660, y: 265, rx: 35, ry: 25, stroke: '#8b4513', fill: '#c9a87c', strokeWidth: 2 },
      { type: 'text', x: 660, y: 310, text: 'Snout', size: 12, color: '#1f2937' },
      
      // Ears (triangular shapes - two)
      { type: 'path', points: [[570, 200], [550, 230], [590, 230]], stroke: '#8b4513', fill: '#d2b48c', strokeWidth: 2 },
      { type: 'text', x: 550, y: 195, text: 'Ear', size: 11, color: '#1f2937' },
      
      { type: 'path', points: [[630, 200], [610, 230], [650, 230]], stroke: '#8b4513', fill: '#d2b48c', strokeWidth: 2 },
      { type: 'text', x: 630, y: 195, text: 'Ear', size: 11, color: '#1f2937' },
      
      // Eyes (small circles)
      { type: 'circle', x: 585, y: 240, r: 8, stroke: '#000', fill: '#000', strokeWidth: 1 },
      { type: 'circle', x: 615, y: 240, r: 8, stroke: '#000', fill: '#000', strokeWidth: 1 },
      
      // Nose (small triangle at end of snout)
      { type: 'path', points: [[680, 260], [690, 270], [680, 280]], stroke: '#000', fill: '#000', strokeWidth: 1 },
      
      // Neck (connecting rectangle)
      { type: 'rect', x: 520, y: 260, width: 50, height: 40, stroke: '#8b4513', fill: '#d2b48c', strokeWidth: 2 },
      { type: 'text', x: 545, y: 325, text: 'Neck', size: 12, color: '#1f2937' },
      
      // Body (large ellipse - horizontal)
      { type: 'ellipse', x: 400, y: 320, rx: 130, ry: 80, stroke: '#8b4513', fill: '#d2b48c', strokeWidth: 3 },
      { type: 'text', x: 400, y: 330, text: 'Body/Torso', size: 16, color: '#1f2937' },
      
      // Chest/Ribcage indicator
      { type: 'text', x: 460, y: 310, text: 'Chest', size: 11, color: '#654321' },
      
      // Abdomen indicator
      { type: 'text', x: 330, y: 340, text: 'Abdomen', size: 11, color: '#654321' },
      
      // Front Left Leg
      { type: 'line', x1: 470, y1: 380, x2: 470, y2: 480, stroke: '#8b4513', strokeWidth: 12 },
      { type: 'ellipse', x: 470, y: 490, rx: 15, ry: 8, stroke: '#8b4513', fill: '#654321', strokeWidth: 2 },
      { type: 'text', x: 440, y: 430, text: 'Front Leg', size: 11, color: '#1f2937' },
      { type: 'text', x: 460, y: 510, text: 'Paw', size: 10, color: '#1f2937' },
      
      // Front Right Leg
      { type: 'line', x1: 430, y1: 380, x2: 430, y2: 480, stroke: '#8b4513', strokeWidth: 12 },
      { type: 'ellipse', x: 430, y: 490, rx: 15, ry: 8, stroke: '#8b4513', fill: '#654321', strokeWidth: 2 },
      
      // Back Left Leg
      { type: 'line', x1: 330, y1: 380, x2: 320, y2: 480, stroke: '#8b4513', strokeWidth: 12 },
      { type: 'ellipse', x: 320, y: 490, rx: 15, ry: 8, stroke: '#8b4513', fill: '#654321', strokeWidth: 2 },
      { type: 'text', x: 290, y: 430, text: 'Back Leg', size: 11, color: '#1f2937' },
      
      // Back Right Leg (partially hidden)
      { type: 'line', x1: 290, y1: 380, x2: 280, y2: 480, stroke: '#8b4513', strokeWidth: 11 },
      { type: 'ellipse', x: 280, y: 490, rx: 15, ry: 8, stroke: '#8b4513', fill: '#654321', strokeWidth: 2 },
      
      // Tail (curved - using connected lines to simulate curve)
      { type: 'line', x1: 270, y1: 300, x2: 220, y2: 260, stroke: '#8b4513', strokeWidth: 10 },
      { type: 'line', x1: 220, y1: 260, x2: 200, y2: 240, stroke: '#8b4513', strokeWidth: 8 },
      { type: 'text', x: 205, y: 230, text: 'Tail', size: 12, color: '#1f2937' },
      
      // Additional labels
      { type: 'text', x: 400, y: 520, text: 'Key Parts: Head, Ears, Eyes, Nose, Neck, Body, Legs, Paws, Tail', size: 13, color: '#2c3e50' },
    ]
  },

  'eye-structure': {
    title: 'Human Eye Structure',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Eyeball (large sphere)
      { type: 'circle', x: 400, y: 300, r: 120, stroke: '#ecf0f1', fill: '#ffffff', strokeWidth: 3 },
      
      // Cornea (front transparent bulge)
      { type: 'circle', x: 480, y: 300, r: 60, stroke: '#bdc3c7', fill: 'none', strokeWidth: 2 },
      { type: 'text', x: 550, y: 280, text: 'Cornea', size: 14, color: '#1f2937' },
      { type: 'text', x: 550, y: 295, text: '(Transparent)', size: 11, color: '#7f8c8d' },
      
      // Iris (colored part)
      { type: 'circle', x: 480, y: 300, r: 35, stroke: '#3498db', fill: '#5dade2', strokeWidth: 3 },
      { type: 'text', x: 520, y: 340, text: 'Iris', size: 13, color: '#1f2937' },
      
      // Pupil (black center)
      { type: 'circle', x: 480, y: 300, r: 15, stroke: '#000', fill: '#000', strokeWidth: 1 },
      { type: 'text', x: 505, y: 305, text: 'Pupil', size: 12, color: '#1f2937' },
      
      // Lens (behind iris)
      { type: 'ellipse', x: 450, y: 300, rx: 25, ry: 40, stroke: '#95a5a6', fill: 'none', strokeWidth: 2 },
      { type: 'text', x: 430, y: 260, text: 'Lens', size: 12, color: '#1f2937' },
      
      // Retina (back inner layer)
      { type: 'path', points: [[310, 240], [290, 280], [290, 320], [310, 360]], stroke: '#e74c3c', fill: 'none', strokeWidth: 3 },
      { type: 'text', x: 250, y: 300, text: 'Retina', size: 13, color: '#1f2937' },
      
      // Optic Nerve (exiting back)
      { type: 'line', x1: 300, y1: 300, x2: 220, y2: 300, stroke: '#f39c12', strokeWidth: 12 },
      { type: 'text', x: 180, y: 305, text: 'Optic Nerve', size: 13, color: '#1f2937' },
      { type: 'text', x: 165, y: 320, text: '(To Brain)', size: 10, color: '#7f8c8d' },
      
      // Sclera label (white part)
      { type: 'text', x: 340, y: 210, text: 'Sclera (White)', size: 12, color: '#1f2937' },
      { type: 'arrow', x1: 360, y1: 220, x2: 370, y2: 250, color: '#95a5a6', label: '' },
      
      // Vitreous humor (gel inside)
      { type: 'text', x: 380, y: 340, text: 'Vitreous', size: 11, color: '#7f8c8d' },
      { type: 'text', x: 380, y: 355, text: 'Humor (Gel)', size: 11, color: '#7f8c8d' },
      
      // Muscles (simplified)
      { type: 'rect', x: 380, y: 180, width: 40, height: 15, stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 1 },
      { type: 'text', x: 400, y: 172, text: 'Eye Muscles', size: 10, color: '#1f2937' },
      
      { type: 'rect', x: 380, y: 405, width: 40, height: 15, stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 1 },
      
      // Light path arrows
      { type: 'arrow', x1: 600, y1: 300, x2: 540, y2: 300, color: '#f39c12', label: 'Light' },
      { type: 'arrow', x1: 480, y1: 300, x2: 320, y2: 300, color: '#f39c12', label: '' },
      
      // Summary
      { type: 'text', x: 400, y: 500, text: 'Light → Cornea → Pupil → Lens → Retina → Optic Nerve → Brain', size: 12, color: '#2c3e50' },
    ]
  },

  'atom-structure': {
    title: 'Atom Structure (Carbon Example)',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Nucleus (center)
      { type: 'circle', x: 400, y: 300, r: 60, stroke: '#e74c3c', fill: '#fadbd8', strokeWidth: 3 },
      { type: 'text', x: 400, y: 305, text: 'Nucleus', size: 16, color: '#1f2937' },
      
      // Protons (red circles in nucleus)
      { type: 'circle', x: 380, y: 285, r: 10, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 2 },
      { type: 'circle', x: 410, y: 285, r: 10, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 2 },
      { type: 'circle', x: 420, y: 310, r: 10, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 2 },
      { type: 'circle', x: 390, y: 315, r: 10, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 2 },
      { type: 'circle', x: 405, y: 300, r: 10, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 2 },
      { type: 'circle', x: 375, y: 305, r: 10, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 2 },
      
      // Neutrons (gray circles in nucleus)
      { type: 'circle', x: 395, y: 290, r: 10, stroke: '#7f8c8d', fill: '#95a5a6', strokeWidth: 2 },
      { type: 'circle', x: 415, y: 295, r: 10, stroke: '#7f8c8d', fill: '#95a5a6', strokeWidth: 2 },
      { type: 'circle', x: 410, y: 318, r: 10, stroke: '#7f8c8d', fill: '#95a5a6', strokeWidth: 2 },
      { type: 'circle', x: 385, y: 310, r: 10, stroke: '#7f8c8d', fill: '#95a5a6', strokeWidth: 2 },
      { type: 'circle', x: 400, y: 320, r: 10, stroke: '#7f8c8d', fill: '#95a5a6', strokeWidth: 2 },
      { type: 'circle', x: 388, y: 298, r: 10, stroke: '#7f8c8d', fill: '#95a5a6', strokeWidth: 2 },
      
      // Electron shells (orbits)
      { type: 'circle', x: 400, y: 300, r: 120, stroke: '#3498db', fill: 'none', strokeWidth: 2 },
      { type: 'circle', x: 400, y: 300, r: 180, stroke: '#3498db', fill: 'none', strokeWidth: 2 },
      
      // Electrons (blue dots on shells) - Shell 1 (2 electrons)
      { type: 'circle', x: 400, y: 180, r: 8, stroke: '#2471a3', fill: '#3498db', strokeWidth: 2 },
      { type: 'circle', x: 400, y: 420, r: 8, stroke: '#2471a3', fill: '#3498db', strokeWidth: 2 },
      
      // Shell 2 (4 electrons for carbon)
      { type: 'circle', x: 580, y: 300, r: 8, stroke: '#2471a3', fill: '#3498db', strokeWidth: 2 },
      { type: 'circle', x: 220, y: 300, r: 8, stroke: '#2471a3', fill: '#3498db', strokeWidth: 2 },
      { type: 'circle', x: 527, y: 427, r: 8, stroke: '#2471a3', fill: '#3498db', strokeWidth: 2 },
      { type: 'circle', x: 273, y: 173, r: 8, stroke: '#2471a3', fill: '#3498db', strokeWidth: 2 },
      
      // Labels
      { type: 'text', x: 460, y: 310, text: 'Proton (+)', size: 12, color: '#e74c3c' },
      { type: 'text', x: 460, y: 325, text: 'Neutron', size: 12, color: '#7f8c8d' },
      
      { type: 'text', x: 600, y: 300, text: 'Electron (-)', size: 12, color: '#3498db' },
      { type: 'arrow', x1: 595, y1: 305, x2: 585, y2: 305, color: '#3498db', label: '' },
      
      { type: 'text', x: 520, y: 200, text: 'Electron Shell 1', size: 11, color: '#2c3e50' },
      { type: 'text', x: 610, y: 260, text: 'Electron Shell 2', size: 11, color: '#2c3e50' },
      
      // Title
      { type: 'text', x: 400, y: 550, text: 'Carbon Atom: 6 Protons, 6 Neutrons, 6 Electrons', size: 13, color: '#1f2937' },
    ]
  },

  'butterfly-lifecycle': {
    title: 'Butterfly Life Cycle',
    canvasSize: { width: 800, height: 600 },
    elements: [
      // Stage 1: Egg (top)
      { type: 'ellipse', x: 400, y: 120, rx: 25, ry: 35, stroke: '#27ae60', fill: '#d5f4e6', strokeWidth: 3 },
      { type: 'text', x: 400, y: 90, text: '1. Egg', size: 16, color: '#1f2937' },
      { type: 'text', x: 400, y: 170, text: '(3-5 days)', size: 11, color: '#7f8c8d' },
      
      // Arrow to Stage 2
      { type: 'arrow', x1: 450, y1: 140, x2: 550, y2: 220, color: '#f39c12', label: '' },
      { type: 'text', x: 500, y: 170, text: 'Hatches', size: 12, color: '#e67e22' },
      
      // Stage 2: Larva/Caterpillar (right)
      { type: 'ellipse', x: 600, y: 250, rx: 80, ry: 30, stroke: '#2ecc71', fill: '#a9dfbf', strokeWidth: 3 },
      // Caterpillar segments
      { type: 'circle', x: 540, y: 250, r: 22, stroke: '#27ae60', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'circle', x: 570, y: 250, r: 24, stroke: '#27ae60', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'circle', x: 600, y: 250, r: 26, stroke: '#27ae60', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'circle', x: 630, y: 250, r: 24, stroke: '#27ae60', fill: '#a9dfbf', strokeWidth: 2 },
      { type: 'circle', x: 660, y: 250, r: 22, stroke: '#27ae60', fill: '#a9dfbf', strokeWidth: 2 },
      
      // Caterpillar face
      { type: 'circle', x: 525, y: 245, r: 3, stroke: '#000', fill: '#000', strokeWidth: 1 },
      { type: 'circle', x: 525, y: 255, r: 3, stroke: '#000', fill: '#000', strokeWidth: 1 },
      
      { type: 'text', x: 680, y: 230, text: '2. Larva', size: 16, color: '#1f2937' },
      { type: 'text', x: 680, y: 250, text: '(Caterpillar)', size: 13, color: '#1f2937' },
      { type: 'text', x: 600, y: 300, text: '(2-5 weeks)', size: 11, color: '#7f8c8d' },
      
      // Arrow to Stage 3
      { type: 'arrow', x1: 580, y1: 290, x2: 480, y2: 380, color: '#f39c12', label: '' },
      { type: 'text', x: 540, y: 340, text: 'Forms', size: 12, color: '#e67e22' },
      
      // Stage 3: Pupa/Chrysalis (bottom)
      { type: 'ellipse', x: 400, y: 430, rx: 35, ry: 55, stroke: '#8e44ad', fill: '#d7bde2', strokeWidth: 3 },
      { type: 'path', points: [[400, 375], [410, 385], [405, 400], [410, 415]], stroke: '#7d3c98', fill: 'none', strokeWidth: 2 },
      { type: 'path', points: [[400, 375], [390, 385], [395, 400], [390, 415]], stroke: '#7d3c98', fill: 'none', strokeWidth: 2 },
      
      { type: 'text', x: 400, y: 500, text: '3. Pupa (Chrysalis)', size: 16, color: '#1f2937' },
      { type: 'text', x: 400, y: 520, text: '(1-2 weeks)', size: 11, color: '#7f8c8d' },
      
      // Arrow to Stage 4
      { type: 'arrow', x1: 350, y1: 400, x2: 250, y2: 280, color: '#f39c12', label: '' },
      { type: 'text', x: 290, y: 340, text: 'Emerges', size: 12, color: '#e67e22' },
      
      // Stage 4: Adult Butterfly (left)
      // Body
      { type: 'ellipse', x: 200, y: 250, rx: 15, ry: 40, stroke: '#2c3e50', fill: '#34495e', strokeWidth: 2 },
      
      // Wings
      { type: 'ellipse', x: 150, y: 230, rx: 45, ry: 50, stroke: '#e74c3c', fill: '#f8d7da', strokeWidth: 3 },
      { type: 'ellipse', x: 250, y: 230, rx: 45, ry: 50, stroke: '#e74c3c', fill: '#f8d7da', strokeWidth: 3 },
      { type: 'ellipse', x: 160, y: 280, rx: 35, ry: 40, stroke: '#e67e22', fill: '#fdebd0', strokeWidth: 3 },
      { type: 'ellipse', x: 240, y: 280, rx: 35, ry: 40, stroke: '#e67e22', fill: '#fdebd0', strokeWidth: 3 },
      
      // Wing patterns
      { type: 'circle', x: 145, y: 220, r: 8, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 1 },
      { type: 'circle', x: 255, y: 220, r: 8, stroke: '#c0392b', fill: '#e74c3c', strokeWidth: 1 },
      
      // Antennae
      { type: 'line', x1: 198, y1: 215, x2: 188, y2: 195, stroke: '#2c3e50', strokeWidth: 2 },
      { type: 'line', x1: 202, y1: 215, x2: 212, y2: 195, stroke: '#2c3e50', strokeWidth: 2 },
      { type: 'circle', x: 188, y: 195, r: 3, stroke: '#2c3e50', fill: '#2c3e50', strokeWidth: 1 },
      { type: 'circle', x: 212, y: 195, r: 3, stroke: '#2c3e50', fill: '#2c3e50', strokeWidth: 1 },
      
      { type: 'text', x: 120, y: 200, text: '4. Adult', size: 16, color: '#1f2937' },
      { type: 'text', x: 120, y: 220, text: '(Butterfly)', size: 13, color: '#1f2937' },
      { type: 'text', x: 200, y: 340, text: '(2-4 weeks)', size: 11, color: '#7f8c8d' },
      
      // Cycle completion arrow
      { type: 'arrow', x1: 250, y1: 200, x2: 350, y2: 140, color: '#f39c12', label: '' },
      { type: 'text', x: 280, y: 150, text: 'Lays Eggs', size: 12, color: '#e67e22' },
      
      // Title
      { type: 'text', x: 400, y: 570, text: 'Complete Metamorphosis: Egg → Larva → Pupa → Adult', size: 13, color: '#2c3e50' },
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
