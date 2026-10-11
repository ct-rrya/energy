# Hardware Connection Diagnosis - ESP32 to Backend

## Problem Statement

ESP32 is uploading data but getting "connection refused" errors:

```
>> Uploading to cloud...
Payload: {"voltage":1.651445627,"current":0,"power":0.000224669,"capacitorVoltage":15,"stepCount":3,"frequency":0.969932079,"timestamp":"2026-10-10T02:38:03.696Z","source":"hardware","wifiConnected":true,"bluetoothConnected":false,"batteryPercentage":100}
HTTP Error: connection refused
Retry 1/3
HTTP Error: connection refused
Retry 2/3
HTTP Error: connection refused
```

## Root Cause Analysis

### ✅ What's Working:
1. **ESP32 WiFi**: Connected successfully (`wifiConnected: true`)
2. **Sensor Data**: Reading valid data from piezo sensors
3. **JSON Payload**: Correctly formatted
4. **Timestamp**: Valid ISO format (`2026-10-10T02:38:03.696Z`)

### ❌ What's NOT Working:
1. **Backend Server NOT Running** on port 3000
   - Test shows: `TCP connect to (127.0.0.1 : 3000) failed`
   - 4 Node.js processes running, but none listening on port 3000

## Diagnosis Results

### 1. Backend Server Status: **NOT RUNNING** ❌

**Evidence:**
```powershell
# Node processes exist but not listening on port 3000
Process ID: 3128, 12480, 21168, 21720 (all running)

# Port 3000 is NOT accessible
Test-NetConnection localhost:3000 → FAILED
```

**What this means:**
The backend server needs to be started to accept connections from ESP32.

### 2. ESP32 Configuration

**From `ESP32-PIEZO-INTEGRATED.ino`:**
```cpp
const char* API_URL = "http://your-server-ip:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_your_api_key_here";
```

**Current endpoint:** POST `/api/iot/piezo/readings`
**Backend expects:** POST `/api/iot/piezo/readings` ✅ (Correct!)

**Headers required:**
- `Content-Type: application/json` ✅
- `X-API-Key: esp32_your_api_key_here` ✅

### 3. API Key Configuration

**Backend `.env` has:**
```env
IOT_API_KEY=esp32_cab2a12ce8f418382d250980ced4a53a
```

**ESP32 should have:**
```cpp
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

### 4. Expected Backend Response

**Success (201 Created):**
```json
{
  "success": true,
  "message": "Reading received successfully",
  "data": {
    "readingId": "...",
    "sensorId": "...",
    "energy": 0.0002,
    "timestamp": "2026-10-10T02:38:03.696Z"
  }
}
```

**Auth Error (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid or missing API key"
}
```

## Step-by-Step Fix

### Step 1: Start the Backend Server ⚠️ CRITICAL

**Option A: Development mode (recommended for testing)**
```bash
cd energy-monitoring-system
npm run start:dev
```

**Option B: Production mode**
```bash
cd energy-monitoring-system
npm run build
npm run start:prod
```

**Expected output:**
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api/docs
💬 Public Chat API: http://localhost:3000/api/chat
📊 Public Telemetry: http://localhost:3000/api/public/telemetry
```

### Step 2: Verify Server is Running

**Test health endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "info": {...}
}
```

### Step 3: Update ESP32 Configuration

**Find your server IP address:**

**On Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

**Update ESP32 code:**
```cpp
// ESP32-PIEZO-INTEGRATED.ino

// BEFORE:
const char* API_URL = "http://your-server-ip:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_your_api_key_here";

// AFTER (use your actual IP):
const char* API_URL = "http://192.168.1.100:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

**Important Notes:**
- ✅ Use your computer's **local network IP** (192.168.x.x or 10.x.x.x)
- ❌ **DO NOT use** `localhost` or `127.0.0.1` (ESP32 can't reach that)
- ✅ Ensure both ESP32 and computer are on **same WiFi network**

### Step 4: Update ESP32 WiFi Credentials

**In ESP32 code:**
```cpp
const char* WIFI_SSID = "your-wifi-ssid";      // Your WiFi network name
const char* WIFI_PASSWORD = "your-wifi-password";  // Your WiFi password
```

### Step 5: Upload Updated Code to ESP32

**Using Arduino IDE:**
1. Open `ESP32-PIEZO-INTEGRATED.ino`
2. Update API_URL, API_KEY, WIFI_SSID, WIFI_PASSWORD
3. Select correct board: **ESP32 Dev Module**
4. Select correct COM port
5. Click **Upload**

### Step 6: Test Connection

**Open Serial Monitor (115200 baud):**
1. Wait for WiFi connection
2. Type `Yes` and press ENTER to start monitoring
3. Trigger a footstep sensor

**Expected output:**
```
✓ WiFi connected
IP Address: 192.168.1.150
Sending to backend:
{"voltage":1.65,...}
✓ Reading sent successfully (201 Created)
Response: {"success":true,"message":"Reading received successfully"}
```

## Common Issues & Solutions

### Issue 1: "Connection Refused"

**Cause:** Backend server not running on port 3000

**Fix:**
```bash
cd energy-monitoring-system
npm run start:dev
```

### Issue 2: "Authentication Failed (401)"

**Cause:** API key mismatch between ESP32 and backend

**Check:**
```bash
# Backend .env
IOT_API_KEY=esp32_cab2a12ce8f418382d250980ced4a53a

# ESP32 code should match:
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

### Issue 3: ESP32 Can't Connect to WiFi

**Symptoms:**
```
Connecting to WiFi...
..................
✗ WiFi connection failed
```

**Fixes:**
1. Verify WIFI_SSID and WIFI_PASSWORD are correct
2. Check WiFi signal strength near ESP32
3. Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
4. Try resetting ESP32 (press EN/RST button)

### Issue 4: "Host Not Found" or "DNS Failed"

**Cause:** Using hostname instead of IP address

**Fix:** Use IP address directly:
```cpp
// ❌ DON'T USE:
const char* API_URL = "http://my-computer-name:3000/api/iot/piezo/readings";

// ✅ USE IP ADDRESS:
const char* API_URL = "http://192.168.1.100:3000/api/iot/piezo/readings";
```

### Issue 5: Firewall Blocking Connection

**Windows Firewall may block incoming connections**

**Fix:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" and check both Private and Public
4. If not listed, click "Allow another app" and browse to Node.js

**Alternative: Create firewall rule for port 3000:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Node.js Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Issue 6: Wrong Network Interface

**If computer has multiple network interfaces (WiFi + Ethernet)**

**Check which IP is correct:**
```powershell
ipconfig /all
# Look for the adapter ESP32 is connected to
```

**Test from another device on same network:**
```bash
# From phone or another computer
curl http://192.168.1.100:3000/api/health
```

## Network Verification Checklist

Before testing ESP32 connection:

- [ ] Backend server running on port 3000
  - Run: `npm run start:dev`
  - Check: `http://localhost:3000/api/health`

- [ ] Server accessible from network
  - Find IP: `ipconfig` (look for IPv4 Address)
  - Test: `curl http://YOUR_IP:3000/api/health`

- [ ] ESP32 on same WiFi network
  - ESP32 should show IP like `192.168.1.x`
  - Should be same subnet as server

- [ ] ESP32 code updated with:
  - [ ] Correct WiFi SSID/password
  - [ ] Correct server IP address
  - [ ] Correct API key from `.env`

- [ ] Firewall allows port 3000
  - Windows Firewall → Allow Node.js
  - Or disable temporarily for testing

## Testing Workflow

### 1. Test Backend Locally
```bash
cd energy-monitoring-system
npm run start:dev

# In another terminal:
curl http://localhost:3000/api/health
```

### 2. Test Backend from Network
```bash
# Find your IP
ipconfig

# Test from another device (phone/computer):
curl http://YOUR_IP:3000/api/health
```

### 3. Test ESP32 → Backend
```
1. Upload code to ESP32
2. Open Serial Monitor
3. Type "Yes" to start
4. Trigger sensor
5. Check backend logs for incoming request
```

### 4. Monitor Backend Logs

**Watch for incoming requests:**
```bash
cd energy-monitoring-system
npm run start:dev

# You should see:
# POST /api/iot/piezo/readings +Xms
# [IoT] Received piezo reading from sensor...
```

## What Your Payload Looks Like

**ESP32 sends:**
```json
{
  "voltage": 1.651445627,
  "current": 0,
  "power": 0.000224669,
  "capacitorVoltage": 15,
  "stepCount": 3,
  "frequency": 0.969932079,
  "timestamp": "2026-10-10T02:38:03.696Z",
  "source": "hardware",
  "wifiConnected": true,
  "bluetoothConnected": false,
  "batteryPercentage": 100
}
```

**Backend expects (minimum):**
- ✅ `voltage` (number) - Required
- ✅ `current` (number) - Required
- ✅ `power` (number) - Required
- ✅ `capacitorVoltage` (number) - Required for piezo endpoint
- ✅ `stepCount` (number) - Required for piezo endpoint
- ✅ `timestamp` (ISO string) - Required
- ✅ `source` = "hardware" - Required

**Your payload is correct!** ✅

## Summary

### Root Cause: **Backend Server Not Running** ❌

### Fix Priority:

**1. START BACKEND SERVER** (CRITICAL)
```bash
cd energy-monitoring-system
npm run start:dev
```

**2. UPDATE ESP32 CODE** (REQUIRED)
```cpp
const char* API_URL = "http://YOUR_IP:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
const char* WIFI_SSID = "your-wifi-name";
const char* WIFI_PASSWORD = "your-wifi-password";
```

**3. VERIFY NETWORK** (IMPORTANT)
- Computer and ESP32 on same WiFi
- Firewall allows port 3000
- Server IP is correct

**4. TEST CONNECTION**
- Check Serial Monitor for "✓ Reading sent successfully"
- Check backend logs for "POST /api/iot/piezo/readings"

### Expected Result:

```
ESP32 Serial Monitor:
✓ WiFi connected
IP Address: 192.168.1.150
>>> *TRIGGER* <<<
Sending to backend:
✓ Reading sent successfully (201 Created)

Backend Terminal:
POST /api/iot/piezo/readings 201 123ms
[IoT] Received piezo reading from sensor ESP32_PIEZO_001
[Dashboard] Broadcasting footstep trigger event
```

---

**Next Step:** Start the backend server and update ESP32 configuration!
