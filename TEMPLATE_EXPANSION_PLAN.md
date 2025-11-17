# Template Expansion Plan

## Current Status
- ✅ 6 templates: Heart, Brain, Digestive, Respiratory, Plant Cell, Dog

## Priority Templates to Add (Phase 1 - Most Requested)

### Human Anatomy (8 templates)
1. **Skeletal System** - bones, joints, skull
2. **Muscular System** - major muscles
3. **Eye Structure** - cornea, retina, lens, optic nerve
4. **Ear Structure** - outer, middle, inner ear
5. **Kidney Structure** - nephron, filtering
6. **Skin Layers** - epidermis, dermis, subcutaneous
7. **Tooth Structure** - enamel, dentin, pulp, root
8. **Blood Circulation** - heart → arteries → veins

### Biology (8 templates)
9. **Animal Cell** - nucleus, mitochondria, membrane
10. **DNA Structure** - double helix, nucleotides
11. **Photosynthesis** - chloroplast, light/dark reactions
12. **Cell Division (Mitosis)** - prophase → telophase
13. **Food Chain** - producers → consumers → decomposers
14. **Ecosystem** - biotic/abiotic factors
15. **Flower Structure** - petals, stamen, pistil, sepals
16. **Leaf Structure** - veins, chloroplasts, stomata

### Animals (6 templates)
17. **Cat Anatomy** - similar to dog
18. **Fish Anatomy** - fins, gills, scales
19. **Bird Anatomy** - wings, feathers, beak
20. **Insect Anatomy** - head, thorax, abdomen, 6 legs
21. **Frog Life Cycle** - eggs → tadpole → frog
22. **Butterfly Life Cycle** - egg → caterpillar → chrysalis → butterfly

### Chemistry/Physics (5 templates)
23. **Atom Structure** - protons, neutrons, electrons
24. **Water Molecule** - H2O structure
25. **States of Matter** - solid, liquid, gas transitions
26. **Simple Circuit** - battery, wire, bulb, switch
27. **Magnet** - north/south poles, magnetic field

### Earth Science (3 templates)
28. **Rock Cycle** - igneous → sedimentary → metamorphic
29. **Weather System** - clouds, precipitation, evaporation
30. **Volcano Structure** - crater, magma chamber, vents

## Implementation Strategy

### Option A: Manual Creation (Current Approach)
- **Pros:** Perfect quality, instant rendering, zero cost
- **Cons:** Time-consuming (1 hour per template), limited coverage
- **Timeline:** 30 templates = 30 hours of work

### Option B: GPT-4 with Caching
- **Pros:** Unlimited diagrams, auto-improves over time
- **Cons:** First-time 5-10s delay, API costs
- **Implementation:**
  ```javascript
  1. User requests "show me kidney structure"
  2. Check cache/database - if exists, return instantly
  3. If not, generate with GPT-4 (5-10s)
  4. Save to database as new template
  5. Next time = instant (like manual templates)
  ```

### Option C: Hybrid (RECOMMENDED)
1. **Keep 30 hand-crafted templates** for top 80% requests
2. **Use GPT-4** for remaining 20% (rare diagrams)
3. **Auto-cache GPT-4 results** → become templates after first use
4. **Community submissions** - let users upvote best diagrams

## Next Steps

### Immediate (This Week):
- [ ] Create 5 more essential templates (eye, ear, atom, fish, butterfly)
- [ ] Standardize style across all templates (use dog/heart style)
- [ ] Add template metadata (category, difficulty, grade level)

### Short-term (Next 2 Weeks):
- [ ] Add 15 more priority templates
- [ ] Implement caching system for GPT-4 results
- [ ] Create template submission system

### Long-term (Next Month):
- [ ] Reach 50 templates
- [ ] Add template voting/rating system
- [ ] Create template editor for community contributions
- [ ] Integrate with Supabase for template storage

## Style Guidelines (All Templates)

### Colors:
- **Organs:** Browns (#8b4513), tans (#d2b48c)
- **Blood vessels:** Red (#e74c3c) for arteries, blue (#3498db) for veins
- **Cells:** Light fills (#e8f8f5, #ebdef0), dark borders
- **Labels:** Dark gray (#1f2937) for readability

### Shapes:
- **Organic:** Use ellipses, not circles
- **Structures:** Proper proportions and positioning
- **Labels:** Clear, positioned outside elements with arrows

### Animation:
- Progressive drawing (stroke-by-stroke)
- 500ms pause between major elements
- Text appears instantly (no character animation)

## Template Contribution Format

```javascript
'template-id': {
  title: 'Template Title',
  category: 'anatomy|biology|chemistry|physics|earth-science',
  difficulty: 'elementary|middle|high|college',
  keywords: ['keyword1', 'keyword2'],
  canvasSize: { width: 800, height: 600 },
  elements: [
    { type: 'ellipse', x, y, rx, ry, stroke, fill, strokeWidth },
    { type: 'text', x, y, text, size, color },
    // ... more elements
  ]
}
```

## Resources for Template Creation

### Reference Sources:
- Khan Academy diagrams
- Wikipedia medical illustrations
- Biology textbooks (check licensing)
- OpenStax open-source textbooks
- Wikimedia Commons (CC-licensed)

### Tools:
- Current canvas renderer (ellipse, path, circle, rect, line, arrow, text)
- Consider adding: bezier curves, gradients, patterns

## Success Metrics

- **Coverage:** % of diagram requests that hit templates (target: 80%)
- **Quality:** User satisfaction rating (target: 4.5/5)
- **Speed:** Average render time (target: <1s for templates, <8s for GPT-4)
- **Cost:** API costs for GPT-4 fallback (target: <$10/month)
