# EcoStep: Vercel (Frontend) + Render (Backend) Setup

## Your Current Setup ✅

- **Frontend:** Deployed on Vercel at `https://ecostep.cebutech.digital`
- **Backend:** Deployed on Render (Node.js)
- **Issue:** Frontend domain doesn't expose backend API

---

## The Problem

When you visit `ecostep.cebutech.digital/api/health`, you get 404 because:
- Vercel only serves your **frontend** (React/Vite app)
- Your **backend** is on Render at a different URL (like `https://ecostep-backend.onrender.com`)
- `ecostep.cebutech.digital/api/*` doesn't exist - it's just the frontend

---

## Solution: Find Your Render Backend URL

### Step 1: Get Your Render Backend URL

1. Go to https://dashboard.render.com
2. Find your EcoStep backend service
3. Copy the URL (looks like: `https://ecostep-backend.onrender.com` or similar)

### Step 2: Test Your Render Backend

**Open in browser:**
```
https://your-backend.onrender.com/api/health
```

**Should return:**
```json
{
  "status": "ok",
  "info": {...}
}
```

**If 404:** Backend not deployed correctly on Render
**If works:** Backend is working, just need to update configurations

---

## Fix for ESP32 Hardware

### Update ESP32 to Use Render Backend URL

**In `ESP32-PIEZO-INTEGRATED.ino`:**

```cpp
// BEFORE (wrong - trying to use Vercel frontend URL):
const char* API_URL = "https://ecostep.cebutech.digital/api/iot/piezo/readings";

// AFTER (correct - use Render backend URL):
const char* API_URL = "https://your-backend.onrender.com/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

**Replace `your-backend.onrender.com` with your actual Render URL!**

---

## Fix for Frontend (Web Dashboard)

Your frontend needs to know where the backend is.

### Check Frontend API Configuration

**File: `frontend/.env.local` or `frontend/.env.production`**

Should have:
```env
VITE_API_URL=https://your-backend.onrender.com
```

### Verify Frontend API Client

**File: `frontend/src/api/client.ts`**

Should use the environment variable:
```typescript
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### Redeploy Frontend to Vercel

After updating `.env.production`:
```bash
cd frontend
# Commit changes
git add .
git commit -m "Update API URL to Render backend"
git push

# Vercel will auto-deploy
```

**Or manually set in Vercel Dashboard:**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add: `VITE_API_URL` = `https://your-backend.onrender.com`
4. Redeploy

---

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        USERS                            │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
                     │               │
        ┌────────────▼─────┐    ┌───▼─────────────┐
        │   Web Browser    │    │   ESP32 Device  │
        │  (Dashboard)     │    │  (Hardware)     │
        └────────┬─────────┘    └────────┬────────┘
                 │                       │
                 │                       │
    ┌────────────▼──────────┐           │
    │  Frontend (Vercel)    │           │
    │  ecostep.cebutech     │           │
    │  .digital             │           │
    └────────────┬──────────┘           │
                 │                       │
                 │ API calls             │ API calls
                 │                       │
    ┌────────────▼───────────────────────▼──────────┐
    │  Backend (Render)                             │
    │  https://your-backend.onrender.com            │
    │                                               │
    │  Endpoints:                                   │
    │  - POST /api/iot/piezo/readings (ESP32)      │
    │  - GET  /api/energy/readings (Dashboard)     │
    │  - POST /api/chat (Chatbot)                  │
    │  - GET  /api/health (Health check)           │
    └────────────┬──────────────────────────────────┘
                 │
    ┌────────────▼──────────┐
    │  MongoDB Atlas        │
    │  (Database)           │
    └───────────────────────┘
```

---

## Configuration Checklist

### ✅ Render Backend Configuration

**Environment Variables on Render:**
```env
NODE_ENV=production
PORT=10000  # Render assigns this automatically
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
IOT_API_KEY=esp32_cab2a12ce8f418382d250980ced4a53a
GEMINI_API_KEY=your-gemini-key
RESEND_API_KEY=your-resend-key
CORS_ORIGIN=https://ecostep.cebutech.digital
FRONTEND_URL=https://ecostep.cebutech.digital
```

**Important CORS Settings:**
- Add `https://ecostep.cebutech.digital` to allowed origins
- Allow API key header: `X-API-Key`

### ✅ Vercel Frontend Configuration

**Environment Variables on Vercel:**
```env
VITE_API_URL=https://your-backend.onrender.com
```

### ✅ ESP32 Hardware Configuration

**In Arduino code:**
```cpp
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";
const char* API_URL = "https://your-backend.onrender.com/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

---

## Testing Steps

### 1. Test Render Backend

```bash
# Health check
curl https://your-backend.onrender.com/api/health

# Should return: {"status":"ok",...}
```

### 2. Test ESP32 Endpoint

```bash
curl -X POST https://your-backend.onrender.com/api/iot/piezo/readings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: esp32_cab2a12ce8f418382d250980ced4a53a" \
  -d '{
    "voltage": 1.65,
    "current": 0,
    "power": 0.0002,
    "capacitorVoltage": 15,
    "stepCount": 3,
    "frequency": 0.97,
    "timestamp": "2026-10-10T10:00:00.000Z",
    "source": "hardware"
  }'

# Should return: {"success":true,"message":"Reading received successfully",...}
```

### 3. Test Frontend API Connection

Open browser console on `https://ecostep.cebutech.digital` and check:
- Network tab for API calls
- Should see requests to `your-backend.onrender.com`
- Not localhost or relative URLs

### 4. Test ESP32 Hardware

Upload updated code with Render URL and check Serial Monitor for:
```
✓ WiFi connected
Sending to backend:
✓ Reading sent successfully (201 Created)
```

---

## Common Issues & Fixes

### Issue 1: CORS Error in Browser

**Symptom:** Browser console shows CORS error when calling backend

**Fix:** Update backend CORS settings

**In Render environment variables:**
```env
CORS_ORIGIN=https://ecostep.cebutech.digital
```

**Or in code (`src/main.ts`):**
```typescript
app.enableCors({
  origin: ['https://ecostep.cebutech.digital', 'http://localhost:5173'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
});
```

### Issue 2: ESP32 Gets 401 Unauthorized

**Cause:** API key mismatch

**Check Render environment variables:**
```env
IOT_API_KEY=esp32_cab2a12ce8f418382d250980ced4a53a
```

**ESP32 code must match exactly:**
```cpp
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

### Issue 3: Render Backend Sleeps (Spins Down)

**Symptom:** First request takes 30+ seconds, then works fine

**Cause:** Render free tier spins down after inactivity

**Solutions:**
1. **Upgrade to paid plan** ($7/month) - keeps service always on
2. **Use cron job** to ping backend every 14 minutes
3. **Accept the delay** - free tier limitation

**Add health check pinger (free):**
- Use https://uptimerobot.com
- Ping `https://your-backend.onrender.com/api/health` every 5 minutes
- Keeps service awake

### Issue 4: ESP32 Certificate Error

**Symptom:** ESP32 shows "SSL handshake failed"

**Fix:** Use `setInsecure()` in ESP32 code:

```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure client;
client.setInsecure();  // Skip certificate validation
HTTPClient http;
http.begin(client, API_URL);
```

### Issue 5: Frontend Shows "Network Error"

**Cause:** Frontend trying to call wrong API URL

**Check browser Network tab:**
- Should call `https://your-backend.onrender.com/api/*`
- If calling `https://ecostep.cebutech.digital/api/*` → Wrong URL
- If calling `http://localhost:3000/api/*` → Environment variable not set

**Fix:**
1. Set `VITE_API_URL` in Vercel environment variables
2. Redeploy frontend on Vercel

---

## Optional: Custom Domain for Backend

**If you want backend at `api.ecostep.cebutech.digital`:**

1. **In Render Dashboard:**
   - Go to your backend service → Settings
   - Custom Domains → Add domain: `api.ecostep.cebutech.digital`

2. **In your DNS provider (Vercel DNS or domain registrar):**
   - Add CNAME record:
     - Name: `api`
     - Value: `your-backend.onrender.com`

3. **Update all configurations to use:**
   - ESP32: `https://api.ecostep.cebutech.digital/api/iot/piezo/readings`
   - Frontend: `VITE_API_URL=https://api.ecostep.cebutech.digital`

---

## Summary

### What You Need to Do:

1. **Find your Render backend URL** (from Render dashboard)
2. **Test it works:** `https://your-backend.onrender.com/api/health`
3. **Update ESP32 code** with Render URL
4. **Update frontend** environment variable in Vercel
5. **Upload ESP32 code** and test hardware connection
6. **Check CORS** settings if frontend has issues

### URLs You'll Use:

- **Frontend (Vercel):** `https://ecostep.cebutech.digital` (for users)
- **Backend (Render):** `https://your-backend.onrender.com` (for API calls)
- **ESP32:** Points to Render backend URL
- **Frontend API calls:** Point to Render backend URL

**The key is: Everything (ESP32 + Frontend) must call the Render backend, NOT the Vercel frontend URL!**
