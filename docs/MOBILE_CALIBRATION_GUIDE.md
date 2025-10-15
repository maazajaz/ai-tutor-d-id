# 📱 Mobile Camera Calibration Guide

## Problem
Mobile cameras are typically held at **chest/table level** pointing **upward** at the face, while desktop webcams are at **eye level** pointing **straight**. This creates different facial landmark ratios.

## Solution
We've adjusted the thresholds and added **live metrics display** to help you see what's happening!

---

## 🎯 Current Thresholds (Mobile-Optimized)

```javascript
MAR_YAWN: 0.5       // Was 0.6 (lowered for mobile angles)
EAR_CLOSED: 0.15    // Was 0.2 (lowered for mobile angles)
YAWN_DURATION_ALERT: 3.0s
MICROSLEEP_ALERT: 3.5s  // Was 2.5s (increased to reduce false positives)
```

---

## 📊 Understanding the Live Metrics

When you open the app on mobile, you'll see a **camera preview** in the bottom left with:

### **MAR (Mouth Aspect Ratio)**
- **What it is**: Vertical distance ÷ Horizontal distance of mouth
- **Normal talking**: 0.2 - 0.4
- **Yawning**: **> 0.5** ⚠️ (orange color)
- **Trigger**: If > 0.5 for 3+ seconds → Quiz engagement

### **EAR (Eye Aspect Ratio)**
- **What it is**: Vertical distance ÷ Horizontal distance of eyes  
- **Eyes open**: 0.2 - 0.3
- **Eyes closed**: **< 0.15** ⚠️ (red color)
- **Trigger**: If < 0.15 for 3.5+ seconds → Wake up quiz

---

## 🔧 How to Calibrate on Your Mobile

### Step 1: Check Live Values
1. Open the app on your phone
2. Look at the camera preview (bottom left)
3. You'll see:
   ```
   😮 Yawns: 0
   👁️ Blinks: 0
   MAR: 0.25  (green = normal)
   EAR: 0.22  (green = normal)
   ```

### Step 2: Test Normal State
- **Sit normally** with your phone at comfortable angle
- **MAR should be**: 0.15 - 0.35 (green)
- **EAR should be**: 0.18 - 0.28 (green)
- If values are way off, adjust phone angle

### Step 3: Test Yawning
- **Open your mouth wide** (like a yawn)
- **MAR should jump to**: 0.5+ (turns orange/red)
- **Watch the counter**: "😮 Yawns: 1"
- **Hold for 3+ seconds**: You'll see "⚠️ Yawn: 3.2s"
- **Agent should respond** with quiz after 3s

### Step 4: Test Eye Closure
- **Close your eyes**
- **EAR should drop to**: < 0.15 (turns red)
- **Watch the counter**: "👁️ Blinks: 1"
- **Keep closed for 3.5+ seconds**: "💤 Eyes: 3.8s"
- **Agent should wake you up** with urgent quiz

---

## 🎥 Optimal Phone Position

```
     [Phone Camera]
          ↑
          |
      30-45° angle
          |
    [Your Face]
```

**Best Setup:**
- 📱 Phone propped on desk/stand
- 📏 About 12-18 inches (30-45 cm) from face
- 📐 Camera slightly **below** eye level (pointing up)
- 💡 Good lighting (face well-lit, not backlit)
- 🪞 Camera facing you (front-facing camera)

**Avoid:**
- ❌ Holding phone in hand (shaky)
- ❌ Camera too close (< 8 inches)
- ❌ Camera pointing down from above
- ❌ Dark room or backlighting
- ❌ Side angle (face not centered)

---

## 🐛 Troubleshooting

### "MAR always orange even when mouth closed"
**Problem**: Camera angle too low or too close  
**Solution**: 
- Move phone farther away (18+ inches)
- Angle camera more upward
- Check console logs for actual MAR values

### "EAR always red even with eyes open"
**Problem**: Lighting too dark or camera angle extreme  
**Solution**:
- Turn on more lights (face needs to be bright)
- Adjust camera to be more straight-on
- Check if you're squinting (try opening eyes wider)

### "Yawning not detected on mobile"
**Problem**: MAR threshold might be too high for your phone angle  
**Solution**:
- Check live MAR value when yawning
- If it's around 0.45-0.48, you're close!
- Yawn **wider** and **longer** (3+ seconds)
- Try adjusting phone angle slightly

### "False drowsiness alerts (not actually drowsy)"
**Problem**: Mobile camera angle makes eyes look more closed  
**Solution**:
- Check live EAR value when alert triggers
- If EAR is around 0.16-0.18 when alert fires, angle is too low
- **Raise phone higher** (more eye-level)
- Open eyes wider naturally

---

## 🔍 Debug Mode (Console Logs)

Open your mobile browser's console (if possible) to see detailed logs:

```javascript
👁️ Detection metrics: {
  MAR: 0.285,
  'MAR > threshold?': '❌',
  avgEAR: 0.223,
  'Eyes closed?': '❌',
  thresholds: 'MAR>0.5, EAR<0.15'
}
```

**How to access console on mobile:**
- **Android Chrome**: Use Remote Debugging via USB
- **iOS Safari**: Use Web Inspector on Mac
- **Easy way**: Use desktop browser first to verify thresholds work

---

## ⚙️ Advanced: Manual Threshold Adjustment

If you need custom thresholds for your specific setup, edit:

**File**: `src/hooks/useYawnDetection.jsx`

```javascript
const THRESHOLDS = {
  MAR_YAWN: 0.45,          // Lower = more sensitive to yawns
  EAR_CLOSED: 0.12,        // Lower = more sensitive to eye closure
  YAWN_DURATION_ALERT: 2.5, // Shorter = faster alerts
  MICROSLEEP_ALERT: 4.0,    // Longer = fewer false positives
};
```

**Rules:**
- **MAR_YAWN**: 0.4-0.6 (mobile usually needs lower)
- **EAR_CLOSED**: 0.10-0.20 (depends on lighting)
- **Durations**: Balance between responsiveness and false alerts

---

## 📈 Typical Values by Device

| Device | Normal MAR | Yawn MAR | Normal EAR | Closed EAR |
|--------|-----------|----------|------------|------------|
| Desktop Webcam | 0.20-0.30 | 0.60-0.80 | 0.20-0.30 | 0.05-0.15 |
| Mobile Front Camera | 0.25-0.35 | 0.45-0.65 | 0.18-0.25 | 0.10-0.18 |
| Tablet | 0.22-0.32 | 0.50-0.70 | 0.19-0.27 | 0.08-0.16 |

**Note**: These are approximate! Your actual values depend on:
- Camera quality
- Lighting conditions
- Face position
- Camera angle
- Distance from camera

---

## ✅ Success Indicators

You've calibrated correctly when:
- ✅ **MAR is green** (< 0.5) during normal talking
- ✅ **MAR turns orange** (> 0.5) when you yawn
- ✅ **EAR is green** (> 0.15) with eyes open
- ✅ **EAR turns red** (< 0.15) with eyes closed
- ✅ **Yawn counter** increments when you yawn
- ✅ **Blink counter** increments when you blink
- ✅ **No false alerts** during normal activity
- ✅ **Quiz triggers** after 3s of sustained yawning

---

## 🆘 Still Having Issues?

1. **Take a screenshot** of the camera preview showing the live metrics
2. **Note the values** you see during normal/yawning/eyes closed states
3. **Check console logs** for detailed detection metrics
4. **Try desktop first** to verify the feature works
5. **Adjust phone position** before adjusting code

Remember: The live MAR/EAR display is your friend! Use it to understand what the system is seeing.
