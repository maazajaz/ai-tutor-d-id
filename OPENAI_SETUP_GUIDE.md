# OpenAI Setup Guide

## Getting Your OpenAI API Key

1. **Sign up/Login to OpenAI:**
   - Visit: https://platform.openai.com/
   - Create an account or login to your existing account

2. **Generate API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the generated key (starts with `sk-`)

3. **Add to Environment:**
   - Open `backend/.env` file
   - Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY="sk-your_actual_key_here"
   ```

4. **Billing Setup:**
   - OpenAI requires billing setup to use the API
   - Add payment method at: https://platform.openai.com/account/billing
   - Consider setting usage limits to control costs

## Model Information

- **Current Model:** `gpt-3.5-turbo` (cost-effective and fast)
- **Alternative:** `gpt-4` (more capable but more expensive)
- **Cost:** ~$0.002 per 1K tokens for GPT-3.5-turbo

## Security Notes

- ⚠️ **Never commit your API key to version control**
- Keep your `.env` file secure and private
- Consider using environment variables in production
- Monitor your API usage and costs regularly

## Testing

Once you've added your API key:
1. Restart the development server: `npm run dev`
2. Test the chat functionality at http://localhost:5173
3. Check the backend console for successful OpenAI API calls

## Troubleshooting

- **"Invalid API key":** Double-check your key in the .env file
- **"Billing required":** Add payment method to your OpenAI account
- **Rate limits:** OpenAI has rate limits, especially for new accounts
