# Hardware Testing Quick Start Guide

**System Status:** Ready for ESP32 Integration  
**Database:** Clean (admin only)  
**Mock Data:** Removed  

---

## 🚀 3-Step Setup

### 1. Clean & Verify System

```bash
# Step 1: Clean database
node clean-database.js

# Step 2: Verify everything is clean
node verify-clean-system.js

# Step 3: Start application
npm run start:dev
```

**Expected output:**
```
✅ System is CLEAN and ready for hardware testing!
✅ Application starts without errors
✅ MongoDB connected
✅ WebSocket server running
```

---

### 2. Access Dashboard

```bash
# Open browser
http://localhost:5173

# Login credentials
Email: admin@energymonitor.com
Password: Admin@2024!
```

**Expected behavior:**
- ✅ Dashboard shows empty state
- ✅ "No data available yet" message
- ✅ All metrics show zero

---

### 3. Create First Sensor

**Via Dashboard:**
1. Navigate to "Sensors" page
2. Click "Create Sensor"
3. Fill in:
   - Name: `ESP32-001`
   - Location: `Your location`
   - Model: `ESP32-WROOM-32`
4. Save sensor
5. **Copy the API Key** (Important!)

**Via API:**
```bash
curl -X POST http://localhost:3000/api/sensors \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ESP32-001",
    "location": "Main Building",
    "model": "ESP32-WROOM-32",
    "description": "Piezoelectric energy sensor"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6a5a451b01651f0ed0a2abc9",
    "name": "ESP32-001",
    "apiKey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "status": "active"
  }
}
```

**⚠️ Save the API key - you'll need it for ESP32!**

---

## 🔌 Configure ESP32

### Arduino Code Setup

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API configuration
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/iot/readings";
const char* apiKey = "YOUR_SENSOR_API_KEY"; // From step 3

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Prepare sensor data
    String jsonData = "{";
    jsonData += "\"voltage\":" + String(readVoltage()) + ",";
    jsonData += "\"current\":" + String(readCurrent()) + ",";
    jsonData += "\"power\":" + String(readPower()) + ",";
    jsonData += "\"batteryPercentage\":" + String(readBattery()) + ",";
    jsonData += "\"temperature\":" + String(readTemperature()) + ",";
    jsonData += "\"frequency\":" + String(readFrequency()) + ",";
    jsonData += "\"timestamp\":\"" + getTimestamp() + "\"";
    jsonData += "}";
    
    // Send to server
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);
    
    int httpCode = http.POST(jsonData);
    
    if (httpCode == 201) {
      Serial.println("✅ Reading sent successfully!");
    } else {
      Serial.println("❌ Error: " + String(httpCode));
    }
    
    http.end();
  }
  
  delay(60000); // Send every minute
}

// Implement these functions based on your sensors
float readVoltage() { return 5.2; }
float readCurrent() { return 0.15; }
float readPower() { return 0.78; }
int readBattery() { return 95; }
float readTemperature() { return 28.5; }
float readFrequency() { return 55.2; }
String getTimestamp() { return "2025-01-20T10:30:00.000Z"; }
```

---

## ✅ First Reading Test

### Manual Test (Before Hardware)

```bash
curl -X POST http://localhost:3000/api/iot/readings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_SENSOR_API_KEY" \
  -d '{
    "voltage": 5.2,
    "current": 0.15,
    "power": 0.78,
    "batteryPercentage": 95,
    "temperature": 28.5,
    "frequency": 55.2,
    "timestamp": "2025-01-20T10:30:00.000Z"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Reading received successfully",
  "data": {
    "id": "...",
    "power": 0.78,
    "energy": 0.00001,
    "timestamp": "2025-01-20T10:30:00.000Z"
  }
}
```

---

## 📊 Verify Real-Time Updates

### 1. Dashboard
- Open dashboard in browser
- Watch for automatic updates
- Metrics should change from 0 to actual values
- Charts should populate

### 2. Messenger Bot
```
User: status

Bot: 📊 Energy System Status
     
     🌞 Today
     Energy Generated: 0.001 kWh  ← Real value!
     Average Power: 0.78 W        ← Real value!
     Peak Power: 0.78 W          ← Real value!
     
     [continues with real data...]
```

### 3. MongoDB
```bash
# Connect to MongoDB
mongo "YOUR_MONGODB_URI"

# Check readings
use energy-monitoring
db.energyreadings.find().pretty()

# Should show 1 document with your reading data
```

---

## 🔍 Troubleshooting

### Problem: ESP32 can't connect to WiFi

**Check:**
- SSID and password correct
- WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Network allows device connections

### Problem: POST request fails (401 Unauthorized)

**Check:**
- API key is correct
- X-API-Key header is included
- Sensor status is "active" not "inactive"

### Problem: POST request fails (400 Bad Request)

**Check:**
- All required fields included (voltage, current, power, timestamp)
- Values within valid ranges
- Timestamp in ISO 8601 format
- JSON format is valid

### Problem: Dashboard not updating

**Check:**
- Browser console for errors
- WebSocket connection established
- Backend logs for broadcast messages
- Refresh browser

### Problem: Messenger bot still shows zeros

**Check:**
- Reading was successfully stored in database
- Analytics service is running
- MongoDB connection active
- Try sending another reading

---

## 📱 Messenger Bot Commands

Test these after first reading:

```
status   - Complete system overview
today    - Today's energy summary
energy   - Current energy status
battery  - Battery information
week     - This week's summary
month    - This month's summary
peak     - Peak generation record
impact   - Environmental impact
savings  - Cost savings analysis
```

---

## 🎯 Success Indicators

After sending first reading, you should see:

✅ **Dashboard:**
- Metrics updated (not zero anymore)
- Charts showing data points
- WebSocket status: Connected
- Last reading timestamp

✅ **Messenger Bot:**
- Status shows real values
- Today's energy > 0 kWh
- Peak power recorded
- Trend analysis available

✅ **Database:**
- 1 document in energyreadings
- Sensor lastSeenAt updated
- All fields populated correctly

✅ **API Response:**
- 201 Created status
- Reading ID returned
- No error messages

---

## 📋 Continuous Monitoring

### Normal Operation

**Every minute:**
- ESP32 collects sensor data
- POST to /api/iot/readings
- Reading stored in database
- WebSocket broadcasts to dashboard
- Dashboard updates automatically

**Dashboard shows:**
- Real-time power generation
- Cumulative energy today
- Battery level
- Temperature
- Recent readings chart

**Messenger bot provides:**
- Current status on demand
- Daily summaries
- Weekly/monthly analytics
- Environmental impact
- Cost savings

---

## 🚀 Production Deployment

When ready for production:

1. **Update .env:**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...  # Production DB
   PORT=3000
   CORS_ORIGIN=https://your-domain.com
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Start:**
   ```bash
   npm run start:prod
   ```

4. **Monitor:**
   - Check logs for errors
   - Monitor reading ingestion rate
   - Track sensor uptime
   - Review analytics accuracy

---

## ℹ️ Important Notes

### Data Retention
- All readings stored permanently
- No automatic data deletion
- Manually archive old data if needed

### Backup Strategy
- Backup MongoDB regularly
- Export critical sensor configurations
- Document API keys securely

### Security
- Keep API keys secret
- Use HTTPS in production
- Secure MongoDB connection
- Regular security audits

### Scaling
- Current setup handles 1-10 sensors
- For 10+ sensors, consider optimization
- Monitor database size growth
- Review WebSocket connection limits

---

## 📞 Need Help?

**Check logs:**
```bash
# Backend logs
npm run start:dev  # Shows all logs in console

# MongoDB logs
Check MongoDB Atlas dashboard or local logs
```

**Common Issues:**
- [HARDWARE-READINESS-COMPLETE.md](./HARDWARE-READINESS-COMPLETE.md) - Full documentation
- [PRODUCTION-DEPLOYMENT-CHECKLIST.md](./PRODUCTION-DEPLOYMENT-CHECKLIST.md) - Deployment guide

---

**System is ready! Connect your ESP32 and start monitoring! 🚀**
