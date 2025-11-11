# 🎨 Whiteboard Image Feature Setup Guide

## Overview
The whiteboard now intelligently determines whether to show a **diagram** or an **image** based on your question!

### How It Works:
- **Ask about concepts, objects, or things** → Shows relevant images
  - Example: "what does a lion look like", "show me the Eiffel Tower", "what is photosynthesis"
- **Ask about processes or steps** → Shows diagrams (flowcharts, mindmaps)
  - Example: "explain quicksort algorithm", "how does OOP work"

---

## 🖼️ Image Sources (3 Options)

### Option 1: Unsplash (Recommended - FREE ✅)
High-quality, educational photos from professional photographers.

**Setup Steps:**
1. Go to https://unsplash.com/developers
2. Sign up / Log in (free account)
3. Create a new app (any name like "AI Tutor")
4. Copy your **Access Key**
5. Add to `.env` file:
   ```env
   UNSPLASH_ACCESS_KEY=your_actual_key_here
   ```
6. **Free tier:** 50 requests/hour (perfect for learning!)

---

### Option 2: Pexels (Alternative - FREE ✅)
Another great source of free stock photos.

**Setup Steps:**
1. Go to https://www.pexels.com/api/
2. Sign up (free account)
3. Get your **API Key**
4. Add to `.env` file:
   ```env
   PEXELS_API_KEY=your_actual_key_here
   ```
5. **Free tier:** 200 requests/hour

---

### Option 3: OpenAI DALL-E 3 (AI-Generated Images - PAID 💰)
Generate custom images with AI (already configured if you have OpenAI API key).

**Cost:** ~$0.04 per image (1024x1024, standard quality)

**Note:** The system will automatically use this if:
- Unsplash/Pexels don't have good results
- `OPENAI_API_KEY` is already configured (you have this!)

---

## 🚀 Quick Start (Recommended Setup)

### For Testing (No API Key Needed)
The system will use **placeholder images** if no API keys are set. You can test right away!

### For Production (Get Free Unsplash Key)
```bash
# 1. Visit https://unsplash.com/developers
# 2. Create app → Get Access Key
# 3. Update .env file:
UNSPLASH_ACCESS_KEY=your_key_here

# 4. Restart your server
npm run dev:server
```

---

## 🎯 Usage Examples

### Images Will Show For:
```
✅ "what does a lion look like"
✅ "show me the Eiffel Tower"
✅ "what is a butterfly"
✅ "how does a volcano look"
✅ "picture of Mount Everest"
✅ "what does a cell look like"
```

### Diagrams Will Show For:
```
✅ "explain quicksort algorithm"
✅ "how does OOP work"
✅ "steps to solve quadratic equation"
✅ "show me concepts of AI"
```

---

## 🔧 How The System Chooses

1. **AI Analysis** (OpenAI GPT-3.5):
   - Analyzes your question
   - Determines if an image or diagram is better

2. **Image Sources Priority**:
   ```
   1. Unsplash (free, high-quality)
   2. Pexels (free, alternative)
   3. DALL-E 3 (AI-generated, costs money)
   4. Placeholder (if all fail)
   ```

3. **Smart Fallback**:
   - If image fetch fails → Shows diagram instead
   - Never leaves you without a visual!

---

## 📊 Current Configuration

Check your `.env` file:

```env
# Image APIs (for whiteboard visual content)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
PEXELS_API_KEY=your_pexels_api_key_here

# Already configured (will use for DALL-E):
OPENAI_API_KEY=sk-proj-...
```

---

## 🧪 Testing The Feature

1. **Start the server:**
   ```bash
   npm run dev:server
   ```

2. **Open the app:**
   ```bash
   npm run dev:client
   ```

3. **Open whiteboard** (click the whiteboard icon)

4. **Try these test questions:**
   - "what does a lion look like" → Should show image
   - "explain bubble sort" → Should show flowchart
   - "show me the Taj Mahal" → Should show image
   - "what is OOP" → Should show mindmap

---

## 💡 Pro Tips

### Get Better Images:
- Be specific: "realistic photo of African lion" vs "lion"
- Add context: "educational diagram of human heart"
- Specify style: "scientific illustration of atom"

### Save API Costs:
- Use Unsplash/Pexels (free) for most images
- Reserve DALL-E for custom visualizations
- System automatically optimizes source selection

### Attribution:
- Images show source credit automatically
- Respects photographer attribution
- Complies with licensing requirements

---

## ⚠️ Troubleshooting

### "Image fetch failed" Error:
1. Check if API keys are set in `.env`
2. Verify keys are valid (test on provider website)
3. Check rate limits (50/hour for Unsplash free tier)
4. Restart server after adding keys

### Images Not Loading:
1. Check browser console for CORS errors
2. Verify internet connection
3. Try a different image query
4. System will auto-fallback to diagram

### API Key Not Working:
1. Unsplash: Make sure to use **Access Key** (not Secret Key)
2. Pexels: Verify API key format
3. Check for typos in `.env` file
4. Restart server after changes

---

## 📈 Rate Limits

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Unsplash** | ✅ Yes | 50 requests/hour |
| **Pexels** | ✅ Yes | 200 requests/hour |
| **DALL-E 3** | ❌ Paid | $0.04 per image |

---

## 🎓 Educational Use

This feature is perfect for:
- **Visual learners** - See concepts, not just read about them
- **Science education** - View animals, plants, space objects
- **Geography** - Explore landmarks, countries, landscapes
- **Art & History** - See famous artworks, historical sites
- **Biology** - Visualize cells, organs, organisms

---

## 🔐 Security Note

**Never commit API keys to Git!**
- `.env` file is in `.gitignore` (safe ✅)
- Use environment variables in production
- Rotate keys if accidentally exposed

---

## 🚀 Next Steps

1. **Get free Unsplash key** (5 minutes): https://unsplash.com/developers
2. **Add to `.env` file**
3. **Restart server**
4. **Test with visual questions**
5. **Enjoy learning with images!** 🎉

---

## 📞 Need Help?

If you have issues:
1. Check this guide first
2. Verify all setup steps
3. Check browser console for errors
4. Review server logs
5. Try placeholder mode (no API key) first

---

**Happy Learning with Visual AI! 🎨📚**
