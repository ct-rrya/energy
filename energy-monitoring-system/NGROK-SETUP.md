# Setting Up Ngrok for Facebook Messenger

## Why You Need Ngrok

Facebook's servers need to send webhooks to your application. Since your backend runs on `localhost:3000`, it's not accessible from the internet. Ngrok creates a secure tunnel from the internet to your localhost.

## Step-by-Step Setup

### 1. Install Ngrok

**Option A: Download**
- Go to https://ngrok.com/download
- Download for Windows
- Extract and run `ngrok.exe`

**Option B: Chocolatey (if installed)**
```bash
choco install ngrok
```

**Option C: npm (if preferred)**
```bash
npm install -g ngrok
```

### 2. Run Ngrok

Open a new terminal and run:
```bash
ngrok http 3000
```

You'll see output like:
```
ngrok

Session Status                online
Account                       Free
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important:** Copy the HTTPS URL (e.g., `https://abc123def.ngrok.io`)

### 3. Update Facebook Webhook

1. **Go to Facebook Developer Console:**
   - https://developers.facebook.com/apps

2. **Select your app**

3. **Go to Messenger > Settings**

4. **Update Webhook:**
   - Callback URL: `https://abc123def.ngrok.io/api/messenger/webhook`
   - Verify Token: `energy-monitoring-2026`
   - Subscription Fields: Check `messages`, `messaging_postbacks`

5. **Click "Verify and Save"**

### 4. Test the Bot

Send a message to your Facebook page:
- `help`
- `status`
- `today`

The bot should now respond! 🎉

---

## How It Works

```
Facebook → ngrok (https://abc123def.ngrok.io) → localhost:3000 → Your Backend
         ↓
    Your Backend processes the message
         ↓
    Sends response to Facebook Graph API
         ↓
    Facebook delivers message to user
```

---

## Keep Ngrok Running

**Important:** Keep the ngrok terminal window open while testing. If you close it or restart ngrok, you'll get a new URL and need to update Facebook's webhook again.

### Free vs Paid Ngrok

**Free Tier:**
- ✅ Random URL each time
- ✅ HTTPS support
- ✅ Perfect for testing
- ❌ URL changes on restart

**Paid Tier ($8/month):**
- ✅ Custom subdomain (e.g., `myapp.ngrok.io`)
- ✅ Same URL every time
- ✅ No need to update Facebook

---

## Troubleshooting

### Ngrok Says "Failed to start tunnel"
- Make sure your backend is running on port 3000
- Try `ngrok http 3000 --log=stdout`

### Facebook Says "Verification Failed"
- Make sure verify token is exactly: `energy-monitoring-2026`
- Make sure webhook URL ends with `/api/messenger/webhook`
- Make sure you're using HTTPS URL (not HTTP)

### Bot Doesn't Respond
1. **Check ngrok is running:**
   - Terminal should show connection activity

2. **Check backend logs:**
   - You should see: `[MessengerController] Webhook event received`

3. **Check Page Access Token:**
   - Make sure it's valid in `.env`
   - Verify in Facebook Developer Console

---

## Monitor Webhook Activity

**Ngrok Web Interface:**
- Open http://127.0.0.1:4040
- See all incoming webhook requests
- Debug request/response data

**Backend Logs:**
- Watch your backend terminal
- You'll see all webhook events

---

## Current Configuration

Your `.env` file has:
```
MESSENGER_PAGE_ACCESS_TOKEN=EAAPFX0byf4ABRz6X...
MESSENGER_VERIFY_TOKEN=energy-monitoring-2026
```

**Webhook Endpoint:** `/api/messenger/webhook`

---

## Alternative: Deploy to Production

If you want a permanent solution without ngrok:

1. **Free Hosting Options:**
   - Heroku: https://heroku.com
   - Railway: https://railway.app
   - Render: https://render.com

2. **Deploy your backend**

3. **Update Facebook webhook** to your production URL

4. **No ngrok needed!**

---

## Quick Test

Once ngrok is running and Facebook webhook is configured:

1. **Open Facebook Messenger**
2. **Go to your page**
3. **Send: `help`**
4. **Bot responds with command list** ✅

---

**Next Steps:** Install ngrok, run it, update Facebook webhook, and test!
