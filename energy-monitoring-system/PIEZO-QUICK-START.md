# ESP32 Piezoelectric Integration - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Backend Setup

```bash
# Navigate to project
cd energy-monitoring-system

# Add piezo configuration to .env
cat >> .env << EOF
# Piezoelectric Configuration
PIEZO_VOLTAGE_THRESHOLD=0.030
PIEZO_MAX_VOLTAGE_CHANGE=1.5
PIEZO_MAX_VOLTAGE=50
PIEZO_CAPACITANCE=0.0022
PIEZO_CAPACITOR_FULL_THRESHOLD=0.9
PIEZO_STEP_MILESTONE_100=true
PIEZO_STEP_MILESTONE_500=true
PIEZO_STEP_MILESTONE_1000=true
EOF

# Start backend
npm run start:dev
```

Backend will be running at `http://localhost:3000`

### 2. Create Sensor via Admin Dashboard

1. Open browser: `http://localhost:5173` (or your frontend port)
2. Login as admin
3. Navigate to **Sensors**
4. Click **Create Sensor**
5. Fill in:
   - Name: `Piezo Tile 1`
   - Location: `Main Entrance`
6. Click **Create**
7. **COPY THE API KEY** (you'll need it for ESP32)

### 3. Configure ESP32

1. Open `ESP32-PIEZO-INTEGRATED.ino` in Arduino IDE
2. Update line 28-30:
   ```cpp
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASSWORD = "YourWiFiPassword";
   ```
3. Update line 31 (replace with your computer's IP):
   ```cpp
   const char* API_URL = "http://192.168.1.100:3000/api/iot/piezo/readings";
   ```
   
   **Find your IP:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)

4. Update line 32 (paste API key from step 2.7):
   ```cpp
   const char* API_KEY = "esp32_abc123...";  // PASTE HERE
   ```

5. **Upload to ESP32**:
   - Connect ESP32 via USB
   - Select Board: **ESP32 Dev Module**
   - Select Port: Your ESP32 COM port
   - Click **Upload** ⬆️

6. **Open Serial Monitor**:
   - Baud rate: **115200**
   - Type `Yes` and press ENTER

## ✅ Testing

### Test 1: Manual API Test (Without Hardware)

```bash
curl -X POST http://localhost:3000/api/iot/piezo/readings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "voltage": 12.5,
    "current": 0.0,
    "power": 0.045,
    "capacitorVoltage": 12.5,
    "stepCount": 1,
    "frequency": 0.0167,
    "timestamp": "2026-10-07T14:30:00Z",
    "source": "hardware"
  }'
```

Expected response:
```json
{
  "success": true,
  "readingId": "...",
  "receivedAt": "2026-10-07T14:30:01.234Z"
}
```

### Test 2: ESP32 Serial Monitor

After uploading and starting, you should see:
```
========================================
ESP32 Piezo Detection - Backend Integration
========================================
Connecting to WiFi...
✓ WiFi connected
IP Address: 192.168.1.50
✓ NTP time synchronized
Current time: 2026-10-07 14:30:00 UTC

System Configuration:
  Capacitance: 0.0022 F (2200 uF)
  Divider Ratio: 2.471
  Detection Threshold: 30.0 mV
  ADC Samples Averaged: 100
  API URL: http://192.168.1.100:3000/api/iot/piezo/readings

Initial Cap Voltage: 0.150 V, Stored Energy: 0.000025 J

Type 'Yes' and press ENTER to start
```

Type `Yes` and press ENTER. When you trigger the piezo (step on it):

```
>>> 12450   0.0520  12.85   0.000182    35.20   0.000165    *TRIGGER* <<<

Sending to backend:
{"voltage":12.85,"current":0.0,"power":0.045,"capacitorVoltage":12.85,"stepCount":1,"frequency":0.0167,"timestamp":"2026-10-07T14:30:00Z","source":"hardware"}
✓ Reading sent successfully (201 Created)
Response: {"success":true,"readingId":"6a5a40f1e7b0307577942940","receivedAt":"2026-10-07T14:30:01.234Z"}
```

### Test 3: WebSocket Events

Open browser console (F12) on your dashboard:

```javascript
// Listen for piezo events
socket.on('piezo:trigger', (data) => {
  console.log('Footstep detected!', data);
});

socket.on('piezo:milestone', (data) => {
  console.log('Milestone reached!', data);
});

socket.on('capacitor:full', (data) => {
  console.log('Capacitor full!', data);
});
```

## 🔧 Troubleshooting

### ESP32 Won't Connect to WiFi
```
✗ WiFi connection failed
⚠ Will operate in offline mode with buffering
```

**Solutions:**
1. Check SSID and password (case-sensitive!)
2. Verify router is 2.4GHz (ESP32 doesn't support 5GHz)
3. Move ESP32 closer to router
4. Check router firewall settings

### Authentication Failed (401)
```
✗ Authentication failed (401). Pausing sends for 60 seconds.
⚠ Check API_KEY configuration!
```

**Solutions:**
1. Verify API key is correct (copy-paste from dashboard)
2. Check sensor status is "Active" in dashboard
3. Recreate sensor and get new API key
4. Check for extra spaces or newlines in API_KEY

### Network Error
```
✗ Network error: Connection refused
```

**Solutions:**
1. Check backend is running (`npm run start:dev`)
2. Verify correct IP address in API_URL
3. Check firewall allows port 3000
4. Try `http://localhost:3000` if ESP32 is USB-connected to same PC

### Bad Readings (Large Voltage Jumps)
```
⚠ BAD_READ (1500mV jump!)
⚠ CONNECTION PROBLEM! Check divider wiring and 100nF filter capacitor.
```

**Solutions:**
1. **CRITICAL**: Install 100nF ceramic capacitor between GPIO34 and GND
2. Check voltage divider resistors (1MΩ and 680kΩ)
3. Verify ADC pin connection (GPIO34)
4. Check grounding

## 📊 Expected Values

### Typical Readings

| Measurement | Typical Range | Example |
|-------------|---------------|---------|
| Capacitor Voltage | 0-20V | 12.5V |
| Power | 0-0.5W | 0.045W |
| Energy per Step | 0-0.5J | 0.172J |
| Step Count | 0+ | 42 |
| Trigger Frequency | 0-2 Hz | 0.0167Hz |

### Capacitor Energy by Voltage

| Voltage | Energy (J) | Percentage |
|---------|----------|------------|
| 5V      | 0.0275J  | 10% |
| 10V     | 0.110J   | 20% |
| 15V     | 0.2475J  | 30% |
| 25V     | 0.6875J  | 50% |
| 45V     | 2.2275J  | 90% (full alert) |
| 50V     | 2.75J    | 100% (max) |

## 🎯 Next Steps

1. **Monitor Dashboard**: Check real-time readings in frontend
2. **Test Milestones**: Generate 100+ steps to see milestone events
3. **Analyze Data**: Review analytics for energy per step
4. **Optimize Placement**: Test different tile locations
5. **Scale Up**: Add more piezoelectric sensors

## 📚 Full Documentation

See `PIEZOELECTRIC-INTEGRATION.md` for:
- Complete hardware specifications
- Detailed API reference
- WebSocket event schemas
- Calculation formulas
- Advanced troubleshooting
- Performance tuning
- Security considerations

## 🆘 Need Help?

1. Check Serial Monitor output (115200 baud)
2. Review backend logs (`npm run start:dev`)
3. Verify all configuration matches this guide
4. Check PIEZOELECTRIC-INTEGRATION.md for advanced topics
5. Review hardware connections

---

**Quick Reference**:
- Backend Port: `3000`
- Frontend Port: `5173` (typical Vite dev server)
- Baud Rate: `115200`
- ADC Pin: `GPIO34`
- LED Pin: `GPIO25`
- Capacitance: `2200µF (0.0022F)`
- Threshold: `30mV (0.030V)`
