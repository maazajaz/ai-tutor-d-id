# Vercel Serverless Functions Fix

## Problem
The `/api/generate-quiz` and `/api/generate-notes` endpoints were returning 500 errors on Vercel because they were trying to use Express.js routing in serverless functions, which doesn't work the same way as traditional Node.js servers.

## Solution
Created dedicated serverless function files in the `api/` directory that Vercel can properly handle.

## Files Created

### 1. `api/generate-quiz.js`
- Standalone serverless function for quiz generation
- Uses OpenAI GPT-3.5-turbo
- Proper error handling and logging

### 2. `api/generate-notes.js`
- Standalone serverless function for notes generation
- Uses OpenAI GPT-3.5-turbo
- Creates formatted Markdown study notes

### 3. `api/package.json`
- Ensures OpenAI dependency is available for API functions

## Changes Made to `vercel.json`

Added specific routing for the new serverless functions:
```json
{
  "routes": [
    {
      "src": "/api/generate-quiz",
      "dest": "/api/generate-quiz.js"
    },
    {
      "src": "/api/generate-notes",
      "dest": "/api/generate-notes.js"
    },
    // ... other routes
  ]
}
```

## Deployment Steps

### 1. Verify Environment Variables in Vercel

Go to your Vercel project settings and ensure these environment variables are set:

```bash
OPENAI_API_KEY=sk-proj-... (your actual key)
NODE_ENV=production
DID_API_KEY=... (your D-ID key)
```

**IMPORTANT:** 
- Go to https://vercel.com/your-username/ai-tutor-d-id/settings/environment-variables
- Make sure `OPENAI_API_KEY` is set for **Production**, **Preview**, and **Development**
- The key should start with `sk-proj-` or `sk-`
- Click "Save" after adding/updating

### 2. Deploy to Vercel

```bash
# Commit the changes
git add .
git commit -m "Fix: Convert OpenAI endpoints to Vercel serverless functions"
git push origin main
```

Vercel will automatically deploy the changes.

### 3. Test the Endpoints

After deployment, test the endpoints:

```bash
# Test quiz generation
curl -X POST https://ai-tutor-d-id.vercel.app/api/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is JavaScript?"},
      {"role": "assistant", "content": "JavaScript is a programming language..."}
    ]
  }'

# Test notes generation
curl -X POST https://ai-tutor-d-id.vercel.app/api/generate-notes \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain arrays"},
      {"role": "assistant", "content": "Arrays are data structures..."}
    ],
    "chatTitle": "Learning Arrays"
  }'
```

### 4. Check Vercel Logs

If you still see errors:
1. Go to https://vercel.com/your-username/ai-tutor-d-id
2. Click on "Deployments" tab
3. Click on the latest deployment
4. Click "Functions" tab
5. Click on `api/generate-quiz.js` or `api/generate-notes.js`
6. View the runtime logs

## Troubleshooting

### Error: "OpenAI API not configured"
- Check that `OPENAI_API_KEY` is set in Vercel environment variables
- Ensure it's enabled for all environments (Production, Preview, Development)
- Redeploy after setting environment variables

### Error: "Invalid OpenAI API key"
- Verify your OpenAI API key is valid at https://platform.openai.com/api-keys
- Check if you have sufficient credits in your OpenAI account
- Make sure the key hasn't expired

### Error: "OpenAI API quota exceeded"
- Your OpenAI account has exceeded its usage quota
- Add credits to your OpenAI account at https://platform.openai.com/account/billing

### Error: Still getting "Unknown error"
1. Check Vercel function logs (see step 4 above)
2. Verify the OpenAI package is being installed correctly
3. Try redeploying with `vercel --prod`

## Key Differences: Express vs Serverless

### ❌ Express (doesn't work on Vercel)
```javascript
app.post("/api/generate-quiz", async (req, res) => {
  // This route won't be called in serverless
});
```

### ✅ Serverless Function (works on Vercel)
```javascript
// api/generate-quiz.js
export default async function handler(req, res) {
  // This function is called directly
}
```

## Testing Locally

To test the serverless functions locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run in development mode
vercel dev
```

This will start a local server that mimics Vercel's serverless environment.

## Notes

- Each API route is now a separate file in the `api/` directory
- Vercel automatically handles routing based on file names
- The `server/server.js` file still handles other API routes (D-ID related)
- CORS is handled within each serverless function
- Environment variables are automatically available in `process.env`
