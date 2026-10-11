# ESP32 Connection to Live Server (ecostep.cebutech.digital)

## ✅ Your Backend is Already Live!

Since your backend is hosted at **ecostep.cebutech.digital**, you just need to update your ESP32 to point to the live server instead of localhost.

---

## 🎯 Simple Fix: Update ESP32 Configuration

### Step 1: Update ESP32 Code

Open `ESP32-PIEZO-INTEGRATED.ino` and change:

```cpp
// BEFORE (trying to connect to localhost):
const char* API_URL = "http://your-server-ip:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_your_api_key_here";

// AFTER (connect to live server):
const char* API_URL = "https://ecostep.cebutech.digital/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

**Important Notes:**
- ✅ Use **https://** (secure connection)
- ✅ **No port number** needed (standard HTTPS uses port 443)
- ✅ Full domain: `ecostep.cebutech.digital`
- ✅ Correct endpoint: `/api/iot/piezo/readings`

### Step 2: Update WiFi Credentials

Make sure your WiFi credentials are correct:

```cpp
const char* WIFI_SSID = "your-wifi-network-name";
const char* WIFI_PASSWORD = "your-wifi-password";
```

### Step 3: Upload to ESP32

1. Open Arduino IDE
2. Select **ESP32 Dev Module** board
3. Select correct COM port
4. Click **Upload**

---

## ⚠️ ESP32 HTTPS Requirements

The ESP32 code currently uses `HTTPClient` with `http.begin(API_URL)`. For HTTPS, you need to modify the code:

### Option A: Use HTTPS with Certificate (Recommended)

Replace `http.begin(API_URL)` with:

```cpp
#include <WiFiClientSecure.h>

// In sendPiezoReading() function, replace:
HTTPClient http;
http.begin(API_URL);

// With:
WiFiClientSecure client;
client.setInsecure();  // Skip certificate validation (for testing)
HTTPClient http;
http.begin(client, API_URL);
```

### Option B: Use HTTP (Not Recommended for Production)

If your server also accepts HTTP (not just HTTPS):

```cpp
const char* API_URL = "http://ecostep.cebutech.digital/api/iot/piezo/readings";
```

**Note:** HTTP is not secure and should only be used for testing.

---

## 🧪 Test Live Server Connection

### Test 1: Check if Server is Accessible

```bash
curl https://ecostep.cebutech.digital/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "info": {...}
}
```

### Test 2: Test Piezo Endpoint from Your Computer

```bash
curl -X POST https://ecostep.cebutech.digital/api/iot/piezo/readings \
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
```

**Expected response (201 Created):**
```json
{
  "success": true,
  "message": "Reading received successfully",
  "data": {...}
}
```

---

## 📋 Complete ESP32 Configuration for Live Server

Here's the complete configuration section for your ESP32:

```cpp
/*
 * ESP32 Piezoelectric Footstep Energy Harvesting System
 * Backend: ecostep.cebutech.digital
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>  // Required for HTTPS
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ======================== CONFIGURATION ========================
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";
const char* API_URL = "https://ecostep.cebutech.digital/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";

// ... rest of your code ...

// ======================== MODIFIED sendPiezoReading() ========================
void sendPiezoReading(float capVoltage, float adcVoltage) {
  // ... existing energy calculation code ...
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["voltage"] = round(capVoltage * 100) / 100.0;
  doc["current"] = 0.0;
  doc["power"] = round(power * 1000) / 1000.0;
  doc["capacitorVoltage"] = round(capVoltage * 100) / 100.0;
  doc["stepCount"] = cumulativeStepCount;
  doc["frequency"] = round(frequency * 10000) / 10000.0;
  doc["timestamp"] = getISOTimestamp();
  doc["source"] = "hardware";
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.println("Sending to live server:");
  Serial.println(payload);
  
  // HTTPS Connection (Modified for live server)
  WiFiClientSecure client;
  client.setInsecure();  // Skip certificate validation
  
  HTTPClient http;
  http.begin(client, API_URL);  // Use client for HTTPS
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(10000);  // Increased timeout for internet connection
  
  int httpCode = http.POST(payload);
  handleHttpResponse(httpCode, http, capVoltage, adcVoltage);
  
  http.end();
  
  previousCapVoltage = capVoltage;
  previousTriggerTime = millis();
}
```

---

## 🔧 Troubleshooting Live Server Connection

### Issue: "Connection Refused" or "Connection Failed"

**Possible causes:**
1. **Server is down** - Check if https://ecostep.cebutech.digital is accessible
2. **Firewall blocking ESP32** - Server firewall may block IoT device requests
3. **Wrong endpoint** - Verify `/api/iot/piezo/readings` is correct
4. **SSL/TLS issue** - ESP32 can't validate certificate

**Fixes:**
- Check server status in browser: https://ecostep.cebutech.digital/api/health
- Ensure server allows requests from any IP (not just localhost)
- Verify API endpoint exists: `/api/iot/piezo/readings`
- Use `client.setInsecure()` to skip certificate validation

### Issue: "SSL Handshake Failed"

**Cause:** HTTPS certificate issues

**Fix:** Use `setInsecure()` to skip validation:
```cpp
WiFiClientSecure client;
client.setInsecure();  // Allow any certificate
```

### Issue: "Timeout" (10+ seconds)

**Cause:** Slow internet connection or server overload

**Fixes:**
- Increase timeout: `http.setTimeout(15000);`
- Check ESP32 internet speed
- Verify server response time

### Issue: "Authentication Failed (401)"

**Cause:** API key mismatch

**Check server .env:**
```env
IOT_API_KEY=esp32_cab2a12ce8f418382d250980ced4a53a
```

**ESP32 must use same key:**
```cpp
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";
```

### Issue: "Host Not Found" or "DNS Failed"

**Cause:** DNS resolution problem

**Fixes:**
- Check WiFi DNS settings
- Try restarting ESP32
- Verify domain is accessible: `ping ecostep.cebutech.digital`

---

## 🌐 Server Configuration Checklist

Make sure your live server has:

- [ ] **Backend running** and accessible at https://ecostep.cebutech.digital
- [ ] **API endpoint** `/api/iot/piezo/readings` enabled
- [ ] **CORS configured** to accept requests from any origin (for IoT devices)
- [ ] **Firewall allows** incoming POST requests
- [ ] **API key authentication** working
- [ ] **HTTPS certificate** valid (or server accepts HTTP)

### Check CORS Configuration

In your backend `src/main.ts`, ensure CORS allows IoT devices:

```typescript
app.enableCors({
  origin: '*',  // Allow all origins (for IoT devices)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-API-Key'],
  credentials: true,
});
```

**Or specifically allow IoT requests:**

```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like IoT devices)
    if (!origin) return callback(null, true);
    
    // Allow your frontend domains
    const allowedOrigins = [
      'http://localhost:5173',
      'https://ecostep.cebutech.digital'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);  // Allow all for now
    }
  },
  credentials: true,
});
```

---

## ✅ Expected Result

**ESP32 Serial Monitor:**
```
✓ WiFi connected
IP Address: 192.168.1.150
Current time: 2026-10-10 10:30:15 UTC
>>> *TRIGGER* <<<
Sending to live server:
{"voltage":1.65,"current":0,"power":0.0002,...}
✓ Reading sent successfully (201 Created)
Response: {"success":true,"message":"Reading received successfully"}
```

**Live Server Logs:**
```
POST /api/iot/piezo/readings 201 234ms
[IoT] Received piezo reading from sensor ESP32_PIEZO_001
[Dashboard] Broadcasting footstep trigger event
```

**Dashboard (https://ecostep.cebutech.digital):**
- Real-time energy data updates
- Footstep counter increments
- Trigger events appear

---

## 📝 Summary

### Configuration Changes Needed:

**ESP32 Code:**
```cpp
#include <WiFiClientSecure.h>  // Add this

const char* API_URL = "https://ecostep.cebutech.digital/api/iot/piezo/readings";
const char* API_KEY = "esp32_cab2a12ce8f418382d250980ced4a53a";

// In sendPiezoReading():
WiFiClientSecure client;
client.setInsecure();
HTTPClient http;
http.begin(client, API_URL);  // Modified for HTTPS
```

**No backend changes needed** - your live server should already be configured!

---

## 🚀 Quick Start

1. **Test live server** from browser:
   ```
   https://ecostep.cebutech.digital/api/health
   ```

2. **Update ESP32 code** with live server URL

3. **Add HTTPS support** with `WiFiClientSecure`

4. **Upload to ESP32** and test

5. **Monitor Serial output** for "✓ Reading sent successfully"

6. **Check dashboard** for real-time updates

**Your ESP32 will now send data directly to your live production server!** 🎉
