# 🎨 Real-Time Drawing Test Page

## How to Access

**Local Development:**
```
http://localhost:5173/?test=draw
```

**Production (Vercel):**
```
https://your-domain.vercel.app/?test=draw
```

## Features

✅ **Real-time drawing** using Rough.js (hand-drawn style)
✅ **GPT-4 powered** - converts text to drawing instructions
✅ **Sub-second rendering** - no waiting for DALL-E image generation!
✅ **6 preset examples** - quick testing
✅ **JSON output viewer** - see the AI-generated instructions
✅ **Educational diagrams** - perfect for math, science, geometry

## How It Works

1. **User enters prompt**: "area of triangle"
2. **GPT-4 generates JSON**: Drawing instructions with shapes, labels, formulas
3. **Rough.js renders instantly**: Hand-drawn style educational diagram
4. **Total time: <1 second** (vs 10-15 seconds with DALL-E)

## Example Prompts

- 📐 "Draw a triangle with base and height labeled, show area formula"
- 📏 "Draw a rectangle with length and width labeled, show perimeter formula"
- ⭕ "Draw a circle with radius labeled, show area and circumference formulas"
- 🌍 "Draw simple solar system with sun and planets"
- 🧬 "Draw water cycle with evaporation, condensation, precipitation"
- 📊 "Draw right triangle showing a² + b² = c²"

## Shapes Supported

- Triangle, Rectangle, Circle
- Lines & Arrows
- Text labels
- Arcs
- Custom colors and styling

## Next Steps

Once satisfied with the test page, we can:
1. ✅ Integrate into the main whiteboard
2. ✅ Add animation effects
3. ✅ Allow user editing/dragging of shapes
4. ✅ Save drawings to database
5. ✅ Add more complex shapes (polygons, curves)

## Advantages over DALL-E

| Feature | Rough.js | DALL-E |
|---------|----------|--------|
| Speed | <1 second | 10-15 seconds |
| Cost | Free | $0.04-0.08 per image |
| Editability | ✅ Vector | ❌ Raster |
| Consistency | ✅ Always similar | ❌ Varies |
| Educational | ✅ Clean labels | ❌ Sometimes unclear |
| Offline | ✅ Once loaded | ❌ Needs API |

---

**Ready to test!** 🚀
