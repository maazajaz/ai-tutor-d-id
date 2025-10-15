# 🎯 Student Engagement Quiz System

## Overview
The AI tutor now automatically detects when students are losing focus (yawning or drowsy) and responds with interactive quizzes to re-engage them.

## How It Works

### 1. Detection System
The yawn detection hook monitors the student in real-time:
- **Yawn Detection**: When mouth opens wide (MAR > 0.6) for 3+ seconds
- **Drowsiness Detection**: When eyes close (EAR < 0.2) for 2.5+ seconds

### 2. Automatic Response
When fatigue is detected, the system:
1. ✅ Sends a clear message: **"I notice YOU are yawning"** (not the agent!)
2. ✅ Includes system instructions for the AI agent
3. ✅ Agent creates an interactive quiz question
4. ✅ Keeps it fun, short, and engaging

### 3. Agent Instructions

#### For Yawning (Mild Fatigue):
```
The system sends:
"I notice YOU are yawning a lot. Let's take a quick break! How about a fun quiz to refresh your mind?"

+ Hidden instructions for the agent:
- Acknowledge tiredness in a friendly way
- Create 1 SHORT, FUN multiple choice question
- Make it A, B, C, D format if possible
- Keep it simple (not difficult)
- Give immediate positive feedback after answer
- Ask if they want to continue or take a break
```

#### For Drowsiness (Heavy Fatigue):
```
The system sends:
"Hey! I notice YOUR eyes are getting heavy. Let's wake you up with a quick interactive question!"

+ Hidden instructions for the agent:
- Use energetic, attention-grabbing tone
- Create a SUPER QUICK, EASY question
- Keep it very short (2 options if possible)
- Use their name if known
- After answer, suggest a 5-minute stretch break
```

## Thresholds (Configurable)

Located in `src/hooks/useYawnDetection.jsx`:

```javascript
const THRESHOLDS = {
  MAR_YAWN: 0.6,              // Mouth opening ratio
  EAR_CLOSED: 0.2,             // Eye closing ratio
  YAWN_DURATION_ALERT: 3.0,    // 3 seconds of yawning → trigger
  MICROSLEEP_ALERT: 2.5,       // 2.5 seconds eyes closed → trigger
  ALERT_COOLDOWN: 180000       // 3 minutes between alerts
};
```

## Example Flow

### Student Yawning Scenario:
1. 👤 Student yawns for 3+ seconds
2. 📹 Camera detects open mouth (MAR > 0.6)
3. 🤖 Agent receives engagement prompt
4. 💬 Agent responds:
   ```
   "Hey! I see you're getting a bit tired 😊 Let's wake up your brain!
   
   🎯 Quick Quiz: What is 2 + 2?
   A) 3
   B) 4
   C) 5
   D) 6
   
   What's your answer?"
   ```
5. 👤 Student answers "B"
6. 🎉 Agent: "Perfect! 🎉 That's correct! Would you like to continue or take a break?"

### Student Drowsy Scenario:
1. 👤 Student's eyes close for 2.5+ seconds
2. 📹 Camera detects closed eyes (EAR < 0.2)
3. 🤖 Agent receives urgent engagement prompt
4. 💬 Agent responds:
   ```
   "⚠️ Hey! Wake up! 👀 
   
   ⚡ QUICK: Is water H2O or CO2?
   A) H2O
   B) CO2
   
   Come on, you got this!"
   ```
5. 👤 Student answers
6. 🎉 Agent: "Awesome! Let's take a 5-minute stretch break 🧘"

## Benefits

1. **Proactive Engagement**: Catches fatigue before student zones out completely
2. **Educational Value**: Quizzes reinforce learning while re-engaging
3. **Non-Intrusive**: Only triggers after sustained fatigue (not single yawn)
4. **Cooldown Period**: Won't spam student (3-minute minimum between alerts)
5. **Context-Aware**: Quiz questions based on current topic

## Technical Implementation

### Files Modified:
- `src/hooks/useYawnDetection.jsx` - Detection logic and messages
- `src/components/UI.jsx` - Handler functions with system instructions

### Message Format:
```javascript
const enhancedMessage = `${userFacingMessage}

[SYSTEM INSTRUCTION: ${instructionsForAgent}]`;
```

The agent receives both:
1. **User-facing message**: What the student sees
2. **System instructions**: How to format the quiz (hidden from student)

## Future Improvements

- [ ] Track quiz response time (slower = more tired)
- [ ] Adapt quiz difficulty based on student's state
- [ ] Multiple quiz formats (true/false, fill-in-blank, etc.)
- [ ] Gamification: streak counter, points system
- [ ] Analytics: track engagement patterns over time
- [ ] Integration with break timer
- [ ] Voice-based quiz for hands-free engagement

## Adjusting Sensitivity

If alerts are too frequent or too rare, adjust thresholds:

**More Sensitive (detect earlier):**
```javascript
YAWN_DURATION_ALERT: 2.0,    // 2 seconds instead of 3
MICROSLEEP_ALERT: 1.5,        // 1.5 seconds instead of 2.5
```

**Less Sensitive (only severe cases):**
```javascript
YAWN_DURATION_ALERT: 5.0,    // 5 seconds instead of 3
MICROSLEEP_ALERT: 4.0,        // 4 seconds instead of 2.5
```

## Testing

### Manual Testing:
1. **Yawn Test**: Open mouth wide for 3+ seconds
2. **Drowsiness Test**: Close eyes for 2.5+ seconds
3. **Cooldown Test**: Try triggering twice within 3 minutes (should ignore 2nd)

### Check Logs:
```javascript
console.log('😮 Yawn detected from student');
console.log('💤 Drowsiness detected from student');
console.log('⚠️ Prolonged yawning detected - user might be tired');
```

## Privacy Note

All detection happens **locally in the browser**. No images or video are sent to servers - only text messages are sent to the AI agent.
