# Vercel Deployment Guide - Camera with HTTPS

## Why Vercel?
- ✅ Automatic HTTPS (camera will work on mobile!)
- ✅ Fast global CDN
- ✅ Free tier with good limits
- ✅ Easy environment variable management
- ✅ Automatic deployments from Git

## Pre-Deployment Checklist

### 1. Environment Variables Required
You need to set these in Vercel dashboard:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `DID_API_KEY` - Your D-ID API key

### 2. Build Configuration
Already configured in `vercel.json`:
- Frontend: Static build (Vite)
- Backend: Serverless functions (Express on Node.js)
- API routes: `/api/*` → serverless functions

## Deployment Steps

### Option A: Deploy via CLI (Fastest)

1. **Deploy to preview** (test first):
   ```bash
   vercel
   ```
   
2. **If preview works, deploy to production**:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Git (Automatic)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy with yawn detection"
   git push origin main
   ```

2. **Vercel auto-deploys** from your connected repo

## Setting Environment Variables

### Via Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your project: `ai-avatar-final`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `your-supabase-url`
   - Environments: ✅ Production, ✅ Preview

### Via CLI:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add DID_API_KEY
```

## After Deployment

### Your app will be at:
```
https://ai-avatar-final-xxxxx.vercel.app
```

### Testing on Mobile:
1. ✅ Open the Vercel URL on mobile
2. ✅ Camera permission should work (HTTPS!)
3. ✅ Yawn detection active
4. ✅ All features working

## Troubleshooting

### Build fails:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript/ESLint errors

### API not working:
- Verify environment variables are set
- Check serverless function logs in Vercel
- Ensure D-ID API key is valid

### Camera not working:
- Should work! (HTTPS automatic)
- Check browser console for specific errors
- Verify MediaPipe CDN is accessible

## Development vs Production

**Local Development** (localhost):
```bash
npm run dev
```
- Camera works on localhost (HTTP allowed)
- Hot reload enabled

**Production** (Vercel):
- Automatic HTTPS
- Optimized build
- Global CDN
- Serverless backend

---

**Next Steps:**
1. Deploy with `vercel`
2. Set environment variables
3. Test on mobile with HTTPS URL!

Ready to deploy? 🚀
