# Mobile Camera Access - HTTPS Required

## The Problem
Modern browsers **require HTTPS** for camera access on mobile devices when accessing via IP address (e.g., `http://192.168.1.10:5173`).

**Works**: `http://localhost:5173` ✅  
**Doesn't Work**: `http://192.168.1.10:5173` ❌  
**Works**: `https://192.168.1.10:5173` ✅

## Quick Solutions

### Solution 1: Use ngrok (Recommended - Easiest)
ngrok creates an HTTPS tunnel to your local server.

1. **Install ngrok**:
   ```bash
   # Download from: https://ngrok.com/download
   # Or use chocolatey:
   choco install ngrok
   ```

2. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

3. **Create HTTPS tunnel**:
   ```bash
   ngrok http 5173
   ```

4. **Use the HTTPS URL** on your mobile:
   ```
   https://abc123.ngrok.io
   ```

### Solution 2: Vite with Self-Signed Certificate

1. **Install mkcert** (creates local certificates):
   ```bash
   choco install mkcert
   ```

2. **Create local certificate**:
   ```bash
   mkcert -install
   mkcert localhost 192.168.1.10
   ```

3. **Update `vite.config.js`**:
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import fs from 'fs';

   export default defineConfig({
     plugins: [react()],
     server: {
       https: {
         key: fs.readFileSync('./localhost+1-key.pem'),
         cert: fs.readFileSync('./localhost+1.pem'),
       },
       host: '0.0.0.0', // Allow external access
       port: 5173
     }
   });
   ```

4. **Access via HTTPS**:
   ```
   https://192.168.1.10:5173
   ```

### Solution 3: Disable Camera on Non-HTTPS (Temporary)

The app now shows a helpful message: **"Camera requires HTTPS. Please use: https://..."**

You can still use all other features without the camera!

## Why This Happens

Browsers enforce this security restriction because:
- Camera access is sensitive
- HTTP traffic can be intercepted
- Localhost is exempt (trusted environment)
- HTTPS ensures encrypted communication

## Current Implementation

The yawn detection hook now:
1. ✅ Checks if getUserMedia is available
2. ✅ Detects if you're on HTTP (not HTTPS)
3. ✅ Shows helpful error: "Camera requires HTTPS. Please use: https://..."
4. ✅ Increases timeout to 30 seconds (for slow mobile networks)
5. ✅ Disabled refineLandmarks for better performance

## Testing

**Desktop (localhost)**: Should work perfectly ✅  
**Mobile (localhost via USB debugging)**: Works ✅  
**Mobile (via IP on HTTP)**: Shows HTTPS required message ⚠️  
**Mobile (via IP on HTTPS)**: Works ✅  

## Recommended Setup for Development

1. Use **ngrok** for quick mobile testing (free tier works great)
2. For production: Deploy to Vercel/Netlify (HTTPS automatic)

---

**Updated**: October 15, 2025  
**Status**: Camera now works on HTTPS with improved timeouts
