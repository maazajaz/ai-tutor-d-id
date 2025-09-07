# Language Detection Test Cases

## Test the improved language detection

### These should be detected as ENGLISH:
- "hey whats up? help me learn python"
- "What is Python?"
- "How do I use variables?"
- "Can you teach me about functions?"
- "I want to learn programming"
- "Help me understand loops"
- "What are data types?"

### These should be detected as HINGLISH:
- "Python kya hai?"
- "Variables kaise use karte hain?"
- "Yaar, Python sikhao"
- "Main Python seekhna chahta hun"
- "Functions ke baare mein bataiye"
- "Loops kaise kaam karte hain?"
- "Data types kya hote hain?"
- "Bhai, coding sikha do"

### Edge Cases:
- "Python me variables kaise banate hain?" (Should be Hinglish - has "me", "kaise", "banate")
- "What is me in Python?" (Should be English - "me" is in English context)
- "I want to kar some programming" (Should be Hinglish - has "kar")

## Testing Instructions:
1. Send the test messages to your chat endpoint
2. Check the console output for "Detected language:" 
3. Verify the responses match the expected language
