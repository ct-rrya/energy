# Troubleshooting Guide

## Issue: "An unexpected error occurred" on Login

### Solution Steps:

### 1. ✅ Start the Backend Server

**Open a new terminal and run:**

```bash
cd c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system
npm run start:dev
```

**Wait for:**
```
[Nest] LOG [NestApplication] Nest application successfully started
```

**Verify backend is running:**
- Open browser: http://localhost:3000/api/health
- Should see: `{"success":true,"message":"Health check successful",...}`

---

### 2. ✅ Verify Admin Account Exists

**In backend terminal, run:**

```bash
npm run seed
```

**Expected output:**
```
Admin user created successfully!
Email: admin@energymonitor.com
```

---

### 3. ✅ Use Correct Credentials

Based on your `.env` file:

**Email:** `admin@energymonitor.com`
**Password:** `Admin@2024!`

⚠️ **Important:** Password is case-sensitive!

---

### 4. ✅ Check Frontend is Running

```bash
cd frontend
npm run dev
```

**Should show:**
```
VITE ready in XXXms
Local: http://localhost:5173/
```

---

### 5. ✅ Clear Browser Cache

Sometimes old data causes issues:

1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh page (F5)

---

## Common Error Messages

### "Cannot connect to server"

**Cause:** Backend not running
**Solution:** Start backend with `npm run start:dev`

### "Invalid email or password"

**Cause:** Wrong credentials or admin not seeded
**Solution:** 
- Verify email: `admin@energymonitor.com`
- Verify password: `Admin@2024!`
- Run `npm run seed` if needed

### "Network error"

**Cause:** CORS or backend not accessible
**Solution:** 
- Check backend is at http://localhost:3000
- Check no firewall blocking
- Check CORS_ORIGIN in backend `.env`

---

## Debug Checklist

Run through this checklist:

- [ ] Backend server is running (check http://localhost:3000/api/health)
- [ ] Frontend server is running (check http://localhost:5173)
- [ ] Admin account seeded (run `npm run seed`)
- [ ] Using correct email: `admin@energymonitor.com`
- [ ] Using correct password: `Admin@2024!`
- [ ] Browser DevTools shows no CORS errors
- [ ] MongoDB connection is working (check backend logs)

---

## Still Not Working?

### Check Backend Logs

Look for errors in the backend terminal:

**MongoDB Connection Error:**
```
[Nest] ERROR Unable to connect to MongoDB
```
**Solution:** Check MONGODB_URI in backend `.env`

**JWT Error:**
```
[Nest] ERROR JWT validation failed
```
**Solution:** Check JWT_SECRET in backend `.env`

---

### Check Frontend Console

Open browser DevTools (F12) → Console tab

**Look for:**
- Network errors (red)
- Failed API calls
- JavaScript errors

**Common issues:**
- `Failed to fetch` → Backend not running
- `CORS error` → CORS misconfiguration
- `401 Unauthorized` → Wrong credentials

---

### Check Network Tab

DevTools → Network tab → Try to login

**POST /api/auth/login should show:**
- Status: 200 (success)
- Response: `{ "success": true, "data": { "token": "...", "user": {...} } }`

**If Status: 401:**
- Wrong credentials

**If Status: 500:**
- Backend error (check backend logs)

**If Status: (failed):**
- Backend not running

---

## Quick Test Script

Create a file `test-backend.js` in backend root:

```javascript
const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@energymonitor.com',
      password: 'Admin@2024!'
    });
    console.log('✅ Login successful!');
    console.log('Token:', response.data.data.token.substring(0, 20) + '...');
    console.log('User:', response.data.data.user.name);
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
```

**Run:**
```bash
node test-backend.js
```

---

## Reset Everything

If all else fails, reset everything:

```bash
# Stop all servers (Ctrl+C)

# Backend: Clear and reinstall
cd c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system
rm -rf node_modules
npm install
npm run seed

# Frontend: Clear and reinstall
cd frontend
rm -rf node_modules dist
npm install
npm run build

# Restart
# Terminal 1: Backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## Contact Developer

If issues persist, provide:
1. Backend terminal output (last 50 lines)
2. Frontend browser console errors
3. Network tab screenshot of failed login request
4. Steps you've already tried

---

**Last Updated:** Phase 3 Implementation
