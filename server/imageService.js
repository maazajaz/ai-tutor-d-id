/**
 * Image Service - Fetch educational images from Unsplash or generate with DALL-E
 */

import fetch from 'node-fetch';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'your_unsplash_key';

/**
 * Fetch an educational image based on query
 * Tries Unsplash first (free), then falls back to DALL-E if available
 * @param {string} query - The search query for the image
 * @param {string} preferredSource - 'unsplash', 'dalle', or 'auto'
 * @returns {Promise<{imageUrl: string, source: string, attribution?: string}>}
 */
export async function fetchEducationalImage(query, preferredSource = 'auto') {
  try {
    console.log('🖼️ Fetching image for query:', query);
    
    // Try Unsplash first (it's free and has high-quality educational images)
    if (preferredSource === 'unsplash' || preferredSource === 'auto') {
      try {
        const unsplashResult = await fetchFromUnsplash(query);
        if (unsplashResult) {
          console.log('✅ Image fetched from Unsplash');
          return unsplashResult;
        }
      } catch (error) {
        console.log('⚠️ Unsplash fetch failed:', error.message);
      }
    }
    
    // Try Pexels as second option (also free)
    if (preferredSource === 'pexels' || preferredSource === 'auto') {
      try {
        const pexelsResult = await fetchFromPexels(query);
        if (pexelsResult) {
          console.log('✅ Image fetched from Pexels');
          return pexelsResult;
        }
      } catch (error) {
        console.log('⚠️ Pexels fetch failed:', error.message);
      }
    }
    
    // Fall back to DALL-E if available and requested
    if ((preferredSource === 'dalle' || preferredSource === 'auto') && openai) {
      try {
        const dalleResult = await generateWithDALLE(query);
        if (dalleResult) {
          console.log('✅ Image generated with DALL-E');
          return dalleResult;
        }
      } catch (error) {
        console.log('⚠️ DALL-E generation failed:', error.message);
      }
    }
    
    // If all else fails, return a placeholder
    console.log('⚠️ All image sources failed, using placeholder');
    return {
      imageUrl: `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(query)}`,
      source: 'placeholder',
      attribution: 'Placeholder image'
    };
    
  } catch (error) {
    console.error('❌ Error in fetchEducationalImage:', error);
    throw error;
  }
}

/**
 * Fetch image from Unsplash
 */
async function fetchFromUnsplash(query) {
  // Using Unsplash's public API (no key required for demo, but limited)
  // For production, get a free API key from https://unsplash.com/developers
  
  const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  
  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    const photo = data.results[0];
    return {
      imageUrl: photo.urls.regular,
      source: 'unsplash',
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      attributionUrl: photo.links.html
    };
  }
  
  return null;
}

/**
 * Fetch image from Pexels (free alternative to Unsplash)
 */
async function fetchFromPexels(query) {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  
  if (!PEXELS_API_KEY) {
    // Use demo mode - fetch from Pexels without API (limited)
    // For production, get free API key from https://www.pexels.com/api/
    throw new Error('Pexels API key not configured');
  }
  
  const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  
  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': PEXELS_API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.photos && data.photos.length > 0) {
    const photo = data.photos[0];
    return {
      imageUrl: photo.src.large,
      source: 'pexels',
      attribution: `Photo by ${photo.photographer} on Pexels`,
      attributionUrl: photo.url
    };
  }
  
  return null;
}

/**
 * Generate image using DALL-E 3
 */
async function generateWithDALLE(query) {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  console.log('🎨 Generating image with DALL-E for:', query);
  
  // Enhance query for educational content
  const enhancedPrompt = `Educational, detailed, realistic illustration: ${query}. High quality, clear, suitable for learning.`;
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    style: "natural"
  });
  
  if (response.data && response.data.length > 0) {
    const imageUrl = response.data[0].url;
    
    // Download the image and convert to base64 to avoid CORS issues
    const imageBuffer = await downloadImageAsBuffer(imageUrl);
    const base64Image = imageBuffer.toString('base64');
    
    return {
      imageUrl: `data:image/png;base64,${base64Image}`,
      source: 'dalle',
      attribution: 'Generated by DALL-E 3',
      revisedPrompt: response.data[0].revised_prompt
    };
  }
  
  return null;
}

/**
 * Download image as buffer to avoid CORS issues
 */
async function downloadImageAsBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Fetch from Wikipedia images (free, educational)
 */
async function fetchFromWikipedia(query) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&titles=${encodeURIComponent(query)}&origin=*`;
  
  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`Wikipedia API error: ${response.status}`);
  }
  
  const data = await response.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  
  if (pages[pageId].original) {
    return {
      imageUrl: pages[pageId].original.source,
      source: 'wikipedia',
      attribution: 'Image from Wikipedia',
      attributionUrl: `https://en.wikipedia.org/?curid=${pageId}`
    };
  }
  
  return null;
}
