# ngrok Setup Instructions

## Step 1: Get Your Free Auth Token

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (it's free!)
3. Copy your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

## Step 2: Configure ngrok

Run this command in PowerShell (replace YOUR_TOKEN_HERE with your actual token):

```powershell
npx ngrok config add-authtoken YOUR_TOKEN_HERE
```

## Step 3: Start Your Dev Server

Make sure your dev server is running:

```powershell
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.10:5173/
```

## Step 4: Start ngrok Tunnel

Open a NEW PowerShell terminal and run:

```powershell
npx ngrok http 5173
```

You'll see output like:
```
Session Status                online
Account                       your-email (Plan: Free)
Forwarding                    https://abc123.ngrok.io -> http://localhost:5173
```

## Step 5: Access on Mobile

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and open it on your mobile device!

The camera should now work because it's using HTTPS! 📱✨

## Tips

- Keep both terminals open (dev server + ngrok)
- The free ngrok URL changes each time you restart
- You get 1 free static domain with a verified email
- No need to restart your dev server when restarting ngrok

## Troubleshooting

**"tunnel not found"**: Your auth token isn't configured correctly
**"502 Bad Gateway"**: Your dev server (npm run dev) isn't running
**Camera still not working**: Check browser console for errors

---

After setup, come back and I'll help you test! 🚀
