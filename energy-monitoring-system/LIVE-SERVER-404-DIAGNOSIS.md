# Live Server 404 Error Diagnosis

## Problem: 404 Page Not Found

When accessing `ecostep.cebutech.digital/api/health`, you're getting a **404 Page Not Found** error.

---

## Root Cause Analysis

### ✅ Your Backend Code is Correct

The health endpoint **IS defined** in your code:
- **File:** `src/health/health.controller.ts`
- **Route:** `@Controller('health')`
- **Endpoint:** `@Get()` → `/api/health`

### ❌ The Issue: Server Configuration

The 404 error means one of these is happening:

1. **Backend not deployed to live server**
2. **Wrong build/deployment on server**
3. **Server routing misconfigured** (not forwarding `/api/*` to backend)
4. **Backend running on different port** (server expecting port 3000 but using different port)
5. **API prefix not configured** on live server
6. **Reverse proxy issue** (Nginx/Apache not forwarding to Node.js)

---

## Possible Scenarios & Solutions

### Scenario 1: Backend Not Running on Server ⚠️ MOST LIKELY

**Diagnosis:**
The live server may only have the **frontend** deployed, not the backend.

**Check:**
```bash
# SSH into your server
ssh user@your-server

# Check if Node.js backend is running
pm2 list
# OR
ps aux | grep node
# OR
netstat -tulpn | grep :3000
```

**Fix:**
Deploy your backend to the server:
```bash
# On server:
cd /path/to/energy-monitoring-system
npm install
npm run build
pm2 start dist/main.js --name ecostep-backend
# OR
npm run start:prod
```

---

### Scenario 2: Reverse Proxy Not Configured

**Diagnosis:**
Your domain `ecostep.cebutech.digital` may only be serving the frontend (React app), and not forwarding `/api/*` requests to the backend.

**Typical Setup:**
- Frontend: Served by Nginx at `https://ecostep.cebutech.digital/`
- Backend: Running on `localhost:3000` but not exposed

**Fix (Nginx Configuration):**

Create/edit `/etc/nginx/sites-available/ecostep.cebutech.digital`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ecostep.cebutech.digital;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ecostep.cebutech.digital;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/ecostep.cebutech.digital/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ecostep.cebutech.digital/privkey.pem;

    # Backend API - Forward /api/* to Node.js backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-API-Key' always;
    }

    # Frontend - Serve React app
    location / {
        root /var/www/ecostep/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Apply configuration:**
```bash
sudo ln -s /etc/nginx/sites-available/ecostep.cebutech.digital /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Scenario 3: Wrong Deployment Build

**Diagnosis:**
Server may have old code or wrong build deployed.

**Check:**
```bash
# SSH into server
cd /path/to/energy-monitoring-system

# Check if dist folder exists
ls -la dist/

# Check if health controller is in build
find dist -name "health.controller.js"
```

**Fix:**
```bash
# Rebuild backend
npm run build

# Restart server
pm2 restart ecostep-backend
# OR
npm run start:prod
```

---

### Scenario 4: API Prefix Mismatch

**Diagnosis:**
Your code sets API prefix to `"api"` but server may be configured differently.

**Check in `src/main.ts`:**
```typescript
const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
app.setGlobalPrefix(apiPrefix);
```

**Check `.env` on server:**
```env
API_PREFIX=api  # Should be "api" not "v1" or something else
```

**Fix:**
Ensure server `.env` has:
```env
API_PREFIX=api
```

---

### Scenario 5: Port Conflict

**Diagnosis:**
Backend may be running on different port than expected.

**Check server logs:**
```bash
pm2 logs ecostep-backend
# Look for: "Application is running on: http://localhost:XXXX"
```

**Fix:**
Ensure server `.env` has:
```env
PORT=3000
```

And Nginx proxies to correct port:
```nginx
location /api {
    proxy_pass http://localhost:3000;  # Match backend port
}
```

---

## Quick Diagnostic Steps

### Step 1: Check What's Actually Running on Server

**If you have SSH access:**
```bash
# Check if Node.js backend is running
pm2 list
ps aux | grep node

# Check if port 3000 is listening
sudo netstat -tulpn | grep :3000
# OR
sudo ss -tulpn | grep :3000

# Check server logs
pm2 logs ecostep-backend --lines 50
```

### Step 2: Test Backend Locally on Server

**SSH into server and test:**
```bash
# Test health endpoint locally
curl http://localhost:3000/api/health

# Expected: {"status":"ok",...}
# If this works, it's a reverse proxy issue
# If this fails, backend is not running
```

### Step 3: Check Nginx Configuration

```bash
# Check if Nginx is forwarding /api requests
sudo nginx -T | grep -A 20 "location /api"

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Step 4: Check DNS and SSL

```bash
# Check if domain resolves correctly
nslookup ecostep.cebutech.digital

# Check SSL certificate
openssl s_client -connect ecostep.cebutech.digital:443 -servername ecostep.cebutech.digital
```

---

## Temporary Workaround: Use Backend Directly

**If reverse proxy is the issue, you can temporarily use backend directly:**

### Option A: Expose Backend on Different Port

**Update ESP32 to use backend port directly:**
```cpp
const char* API_URL = "http://ecostep.cebutech.digital:3000/api/iot/piezo/readings";
```

**⚠️ Requires:**
- Backend running on port 3000
- Port 3000 open in firewall
- Not recommended for production (no HTTPS, exposed port)

### Option B: Use Server IP Directly

**Find server IP:**
```bash
nslookup ecostep.cebutech.digital
# Result: 123.456.789.0
```

**Update ESP32:**
```cpp
const char* API_URL = "http://123.456.789.0:3000/api/iot/piezo/readings";
```

---

## Most Likely Solution

Based on the 404 error, **most likely scenario is #1 or #2**:

### Quick Fix Checklist:

1. **SSH into your server**
2. **Check if backend is running:**
   ```bash
   pm2 list
   ```
3. **If not running, start it:**
   ```bash
   cd /path/to/energy-monitoring-system
   npm install
   npm run build
   pm2 start dist/main.js --name ecostep-backend --env production
   ```
4. **Test locally on server:**
   ```bash
   curl http://localhost:3000/api/health
   ```
5. **If that works, configure Nginx** (see Scenario 2 above)
6. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```
7. **Test from outside:**
   ```bash
   curl https://ecostep.cebutech.digital/api/health
   ```

---

## Expected Results After Fix

**Browser test:**
```
https://ecostep.cebutech.digital/api/health
```

**Should return:**
```json
{
  "status": "healthy",
  "info": {
    "database": {"status": "up"},
    "memory": {...},
    "uptime": 12345
  }
}
```

**Not:**
```
404 Page Not Found
```

---

## Questions to Answer

To help diagnose further, answer these:

1. **Do you have SSH access to the server?**
2. **What hosting provider are you using?** (AWS, DigitalOcean, Vercel, etc.)
3. **Did you deploy the backend or just the frontend?**
4. **Is there a reverse proxy (Nginx/Apache) configured?**
5. **Can you run commands on the server?**

---

## Common Hosting Scenarios

### If using Vercel/Netlify (Frontend-only hosting):
These platforms **only host static sites (frontend)**. You need to:
- Deploy backend separately (Heroku, Railway, AWS, DigitalOcean)
- Update ESP32 to use separate backend URL

### If using DigitalOcean Droplet / AWS EC2:
You have full control. Follow Scenario 1 and 2 above.

### If using Heroku / Railway / Render:
Backend should auto-deploy. Check deployment logs.

### If using cPanel / Shared Hosting:
May not support Node.js backend. Need VPS/dedicated server.

---

## Summary

**The 404 error means the backend API is not accessible at `ecostep.cebutech.digital/api/health`.**

**Most likely causes:**
1. Backend not deployed/running on server
2. Reverse proxy (Nginx) not configured to forward `/api/*` to backend
3. Backend running on wrong port

**Next steps:**
1. Check if backend is running on server
2. Test backend locally on server
3. Configure Nginx to proxy `/api/*` requests
4. Ensure ports and configurations match

**Once backend is accessible, ESP32 will be able to connect!**
