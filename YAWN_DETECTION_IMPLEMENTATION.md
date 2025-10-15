# Yawn Detection Implementation

## Overview
Replaced the previous emotion detection system (using face-api.js) with an advanced yawn and drowsiness detection system based on the [real-time-drowsy-driving-detection](https://github.com/tyrerodr/real-time-drowsy-driving-detection) repository.

## Technology Stack
- **MediaPipe Face Mesh**: Real-time facial landmark detection (468 landmarks)
- **MAR (Mouth Aspect Ratio)**: Mathematical calculation to detect yawning
- **EAR (Eye Aspect Ratio)**: Mathematical calculation to detect eye closure/drowsiness

## Key Features

### 1. Yawn Detection
- **Method**: Calculates MAR using mouth landmarks
- **Formula**: `MAR = vertical_distance / horizontal_distance`
- **Threshold**: MAR > 0.6 indicates yawning
- **Duration Tracking**: Monitors how long a yawn lasts
- **Alert**: Triggers when yawn duration exceeds 7 seconds

### 2. Drowsiness Detection  
- **Method**: Calculates EAR for both eyes
- **Formula**: `EAR = vertical_distance / horizontal_distance`
- **Threshold**: EAR < 0.2 indicates closed eyes
- **Blink Detection**: Counts rapid eye closures
- **Microsleep Detection**: Alerts when eyes closed > 4 seconds

### 3. Smart Engagement
When detection triggers:
- **Prolonged Yawning** → "I notice you're yawning a lot. Would you like to take a break or should I explain things more clearly? 😴"
- **Microsleep/Drowsiness** → "You seem tired. Shall we take a quick break? Or would you like me to make the lesson more engaging? 💤"

## Architecture

### Files Modified
1. **`src/hooks/useYawnDetection.jsx`** (NEW)
   - MediaPipe Face Mesh integration
   - MAR/EAR calculations
   - Detection logic and thresholds
   - Stats tracking

2. **`src/components/UI.jsx`**
   - Replaced `useEmotionDetection` with `useYawnDetection`
   - Updated handlers: `handleYawnDetected`, `handleDrowsinessDetected`
   - Enhanced camera preview with real-time stats:
     - Yawns count
     - Blinks count
     - Yawn duration (live)
     - Microsleep duration (live)

### Files Deprecated
- **`src/hooks/useEmotionDetection.jsx`**: No longer used (can be removed)
- **`public/models/`**: face-api.js models no longer needed

## How It Works

### 1. Face Mesh Detection
```javascript
const faceMesh = new FaceMesh({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### 2. MAR Calculation (Mouth)
```javascript
const calculateMAR = (landmarks) => {
  const top = landmarks[MOUTH_TOP];
  const bottom = landmarks[MOUTH_BOTTOM];
  const left = landmarks[MOUTH_LEFT];
  const right = landmarks[MOUTH_RIGHT];
  
  const verticalDist = distance(top, bottom);
  const horizontalDist = distance(left, right);
  
  return verticalDist / horizontalDist;
};
```

### 3. EAR Calculation (Eyes)
```javascript
const calculateEAR = (landmarks, isLeftEye) => {
  const top = landmarks[EYE_TOP];
  const bottom = landmarks[EYE_BOTTOM];
  const left = landmarks[EYE_LEFT];
  const right = landmarks[EYE_RIGHT];
  
  const verticalDist = distance(top, bottom);
  const horizontalDist = distance(left, right);
  
  return verticalDist / horizontalDist;
};
```

### 4. Detection Logic
```javascript
// Yawn detected
if (MAR > 0.6) {
  if (!yawnInProgress) {
    yawnCount++;
    yawnStartTime = now;
  }
  yawnDuration = (now - yawnStartTime) / 1000;
  
  // Alert if yawning too long
  if (yawnDuration > 7.0) {
    sendAlert('prolonged_yawn');
  }
}

// Drowsiness detected
if (leftEAR < 0.2 && rightEAR < 0.2) {
  if (!eyesClosed) {
    blinkCount++;
    eyesClosedStart = now;
  }
  microsleepDuration = (now - eyesClosedStart) / 1000;
  
  // Alert if eyes closed too long
  if (microsleepDuration > 4.0) {
    sendAlert('microsleep');
  }
}
```

## Benefits Over Previous System

| Feature | Old (face-api.js) | New (MediaPipe) |
|---------|-------------------|-----------------|
| **Detection Type** | 7 emotions (neutral, happy, sad, etc.) | Yawning + drowsiness |
| **Use Case** | General mood tracking | Attention/fatigue monitoring |
| **Accuracy** | Moderate (requires large models) | High (468 face landmarks) |
| **Performance** | Heavy (multiple neural networks) | Fast (optimized for web) |
| **Relevance** | Generic emotions | Educational engagement |
| **Loading** | ~15MB models | CDN-based (instant) |
| **Stats Tracking** | Emotion history only | Yawns, blinks, durations |

## Configuration

### Thresholds (in `useYawnDetection.jsx`)
```javascript
const THRESHOLDS = {
  MAR_YAWN: 0.6,           // Mouth Aspect Ratio for yawn
  EAR_CLOSED: 0.2,          // Eye Aspect Ratio for closed eyes
  YAWN_DURATION_ALERT: 7.0, // Seconds before yawn alert
  MICROSLEEP_ALERT: 4.0,    // Seconds before drowsiness alert
  ALERT_COOLDOWN: 120000    // 2 minutes between alerts
};
```

### Landmark Indices
```javascript
const LANDMARKS = {
  MOUTH_TOP: 13,
  MOUTH_BOTTOM: 14,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  LEFT_EYE_LEFT: 33,
  LEFT_EYE_RIGHT: 133,
  
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  RIGHT_EYE_LEFT: 362,
  RIGHT_EYE_RIGHT: 263
};
```

## UI Display

The camera preview (bottom-left corner) now shows:
- **Live video feed** with face landmarks (optional debug overlay)
- **Yawns count**: Total yawns detected in session
- **Blinks count**: Total blinks detected
- **Yawn duration**: Real-time counter during active yawn (orange alert)
- **Microsleep duration**: Real-time counter when eyes closed (red alert)

## Dependencies Added
```json
{
  "@mediapipe/face_mesh": "^0.4.1633559619"
}
```

**Note**: Originally included `@mediapipe/camera_utils`, but removed it for better mobile compatibility. Now uses native `navigator.mediaDevices.getUserMedia()` API instead.

## Testing

1. **Yawn Detection**:
   - Open your mouth wide (simulate yawn)
   - Check console: `😮 Yawn detected!`
   - Hold for 7+ seconds
   - Should trigger: "I notice you're yawning a lot..."

2. **Drowsiness Detection**:
   - Close both eyes
   - Check console: `👁️ Blink detected`
   - Hold closed for 4+ seconds
   - Should trigger: "You seem tired. Shall we take a break?"

3. **Stats Display**:
   - Yawn/blink counters should increment
   - Duration timers should update in real-time
   - Orange/red alerts should pulse during prolonged events

## Console Logs

- `👁️ Detection metrics:` - MAR, leftEAR, rightEAR, avgEAR values
- `😮 Yawn detected!` - When yawn starts
- `😮 Yawn ended - Duration: X.XXs` - When yawn finishes
- `👁️ Blink detected` - When eyes close briefly
- `⚠️ Prolonged yawning detected` - Yawn > 7 seconds
- `⚠️ Prolonged eye closure detected` - Eyes closed > 4 seconds

## Future Enhancements

1. **Head Pose Estimation**: Detect when user looks away
2. **Attention Score**: Combine multiple metrics into engagement score
3. **Custom Alerts**: Different responses based on time of day
4. **Analytics Dashboard**: Track engagement patterns over time
5. **Calibration**: Personalized MAR/EAR thresholds per user

## Credits

Based on the excellent work by **Eng. Tyrone Eduardo Rodriguez Motato**:
- Repository: [tyrerodr/real-time-drowsy-driving-detection](https://github.com/tyrerodr/real-time-drowsy-driving-detection)
- Adapted from driver drowsiness detection to educational engagement monitoring
- Uses same MAR/EAR calculation methods with tuned thresholds

---

**Implementation Date**: October 15, 2025
**Status**: ✅ Fully Integrated
