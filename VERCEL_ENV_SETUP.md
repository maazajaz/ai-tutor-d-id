# Vercel Environment Variables Setup

## Required Environment Variables

To make the Quiz Generator and other OpenAI features work on Vercel, you need to add these environment variables in your Vercel dashboard:

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `ai-tutor-d-id`

2. **Navigate to Settings**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add the following variables:**

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `OPENAI_API_KEY` | `sk-proj-...` (Your OpenAI API key from .env file) | Production, Preview, Development |
   | `DID_API_KEY` | `...` (Your D-ID API key from .env file) | Production, Preview, Development |
   | `VITE_DID_API_KEY` | `...` (Same as DID_API_KEY) | Production, Preview, Development |
   | `VITE_SUPABASE_URL` | `https://...` (Your Supabase URL from .env file) | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` (Your Supabase anon key from .env file) | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (Your Supabase service role key from .env file) | Production, Preview, Development |
   | `NODE_ENV` | `production` | Production only |
   | `CORS_ORIGIN` | `https://ai-tutor-d-id.vercel.app` | Production, Preview, Development |

   **⚠️ IMPORTANT**: Copy the actual values from your local `.env` file. Don't use the placeholders above!

4. **Click "Save"** for each variable

5. **Redeploy your application**
   - Go to "Deployments" tab
   - Click on the latest deployment
   - Click "Redeploy" button

## Verification

After redeploying, check the Vercel function logs:
1. Go to your deployment
2. Click "Functions" tab
3. Look for logs from `/api/generate-quiz`
4. You should see: `🔑 OpenAI API key exists: true`

## Troubleshooting

If the quiz still doesn't work:

1. **Check the logs** in Vercel dashboard under "Functions" tab
2. **Verify API key** is correctly copied (no extra spaces)
3. **Make sure** you selected all environments (Production, Preview, Development)
4. **Redeploy** after adding environment variables

## Security Note

⚠️ **IMPORTANT**: These API keys are sensitive. Make sure to:
- Never commit `.env` file to git
- Rotate keys periodically
- Monitor API usage
- Set up billing alerts
