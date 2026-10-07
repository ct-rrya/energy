# ESP32 Piezoelectric Footstep Energy Harvesting Integration

## Overview

This document describes the integration of ESP32-based piezoelectric footstep energy harvesting hardware into the Energy Monitoring System. The hardware captures energy from footsteps using piezoelectric discs and stores it in a capacitor, with the ESP32 monitoring voltage levels and detecting triggers.

## Hardware Specifications

### Components
- **Piezoelectric Discs**: 10-15 discs connected in parallel
- **Energy Harvester**: LTC3588-1 (connects to PZ1/PZ2 inputs)
- **Storage Capacitor**: 50V, 2200µF electrolytic capacitor
- **Voltage Divider**: R1 = 1MΩ, R2 = 680kΩ
- **Filter Capacitor**: 100nF ceramic (REQUIRED between GPIO34 and GND)
- **LED Indicator**: GPIO25
- **Power Supply**: LM2596 regulator (5V for ESP32)

### Specifications
- **Capacitance**: 0.0022F (2200µF)
- **Voltage Divider Ratio**: 2.470588
- **Detection Threshold**: 30mV (0.030V) minimum voltage increase
- **Maximum Voltage**: 50V (hardware limit)
- **ADC Resolution**: 12-bit (4095 levels)
- **ADC Samples**: 100 (averaged for noise filtering)

## Architecture

### Data Flow
```
Footstep
  ↓
Piezoelectric Discs (10-15 in parallel)
  ↓
LTC3588-1 Energy Harvester
  ↓
2200µF 50V Capacitor (energy storage)
  ↓
Voltage Divider (1MΩ / 680kΩ)
  ↓
ESP32 GPIO34 ADC (with 100nF filter)
  ↓
ESP32 WiFi → HTTP POST
  ↓
Backend API POST /api/iot/piezo/readings
  ↓
MongoDB (energy readings)
  ↓
WebSocket Broadcast (real-time events)
  ↓
Frontend Dashboard
```

### System Components

#### 1. ESP32 Firmware (`ESP32-PIEZO-INTEGRATED.ino`)
- Monitors capacitor voltage via ADC
- Detects footstep triggers (voltage increases ≥ 30mV)
- Calculates power and energy from voltage changes
- Maintains cumulative step counter
- Sends data to backend API via HTTP POST
- Handles WiFi reconnection and NTP time sync
- Implements retry logic and offline buffering

#### 2. Backend API (NestJS)
- **Endpoint**: `POST /api/iot/piezo/readings`
- **Authentication**: X-API-Key header
- **DTO**: `CreatePiezoReadingDto` (validates required piezo fields)
- **Service**: `IotService.receivePiezoReading()` (handles trigger detection)
- **Events**: Emits WebSocket events for real-time updates

#### 3. WebSocket Events
- `piezo:trigger` - Footstep detected (voltage increase detected)
- `piezo:milestone` - Step count milestone reached (100, 500, 1000, etc.)
- `capacitor:full` - Capacitor voltage ≥ 90% of maximum

#### 4. Frontend Dashboard
- Real-time piezoelectric sensor monitoring
- Capacitor voltage gauge (0-50V visualization)
- Step counter display
- Trigger detection indicators
- Energy per step calculations

## Installation & Setup

### 1. Backend Setup

#### Install Dependencies
```bash
cd energy-monitoring-system
npm install
```

#### Configure Environment Variables
Add to `.env` file:
```env
# Piezoelectric Sensor Configuration
PIEZO_VOLTAGE_THRESHOLD=0.030
PIEZO_MAX_VOLTAGE_CHANGE=1.5
PIEZO_MAX_VOLTAGE=50
PIEZO_CAPACITANCE=0.0022
PIEZO_CAPACITOR_FULL_THRESHOLD=0.9

# Step Milestones
PIEZO_STEP_MILESTONE_100=true
PIEZO_STEP_MILESTONE_500=true
PIEZO_STEP_MILESTONE_1000=true
PIEZO_STEP_MILESTONE_5000=true
PIEZO_STEP_MILESTONE_10000=true
```

#### Start Backend
```bash
npm run start:dev
```

### 2. ESP32 Firmware Setup

#### Hardware Assembly
1. Connect piezoelectric discs in parallel to LTC3588-1 (PZ1/PZ2)
2. Connect LTC3588-1 output to 2200µF capacitor
3. Create voltage divider: Cap+ → 1MΩ → GPIO34 → 680kΩ → GND
4. **CRITICAL**: Add 100nF ceramic capacitor between GPIO34 and GND
5. Connect LED: GPIO25 → Resistor → LED+ → LED- → GND
6. Connect LM2596 output to ESP32 5V input

#### Software Configuration
1. Open `ESP32-PIEZO-INTEGRATED.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* WIFI_SSID = "your-wifi-ssid";
   const char* WIFI_PASSWORD = "your-wifi-password";
   ```
3. Update backend URL:
   ```cpp
   const char* API_URL = "http://192.168.1.100:3000/api/iot/piezo/readings";
   ```
4. Get API key from admin dashboard:
   - Login to dashboard
   - Navigate to Sensors
   - Create new sensor → Copy API key
5. Update API key in firmware:
   ```cpp
   const char* API_KEY = "esp32_abc123...";
   ```

#### Upload Firmware
1. Install required libraries:
   - WiFi.h (built-in)
   - HTTPClient.h (built-in)
   - ArduinoJson (install from Library Manager)
2. Select board: **ESP32 Dev Module**
3. Select port: Your ESP32 COM port
4. Click Upload
5. Open Serial Monitor (115200 baud)
6. Type "Yes" and press ENTER to start monitoring

### 3. Create Sensor in Dashboard

1. Login to admin dashboard
2. Navigate to **Sensors** section
3. Click **Create Sensor**
4. Fill in details:
   - **Name**: "Piezo Tile 1"
   - **Location**: "Main Entrance"
   - **Type**: Piezoelectric (if available)
5. Click **Create**
6. Copy the generated API key
7. Update ESP32 firmware with this API key

## API Reference

### POST /api/iot/piezo/readings

Dedicated endpoint for piezoelectric sensor readings.

#### Headers
```
Content-Type: application/json
X-API-Key: esp32_your_api_key_here
```

#### Request Body
```json
{
  "voltage": 12.50,
  "current": 0.0,
  "power": 0.045,
  "capacitorVoltage": 12.50,
  "stepCount": 42,
  "frequency": 0.0167,
  "timestamp": "2026-10-07T14:30:00Z",
  "source": "hardware"
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `voltage` | number | Yes | Capacitor voltage (0-50V) |
| `current` | number | Yes | Always 0.0 for piezo sensors |
| `power` | number | Yes | Calculated power in watts |
| `capacitorVoltage` | number | Yes | Same as voltage (explicit) |
| `stepCount` | number | Yes | Cumulative step counter |
| `frequency` | number | No | Trigger frequency in Hz |
| `timestamp` | string | Yes | ISO 8601 UTC timestamp |
| `source` | string | No | "hardware" (default) |

#### Response (201 Created)
```json
{
  "success": true,
  "readingId": "6a5a40f1e7b0307577942940",
  "receivedAt": "2026-10-07T14:30:01.234Z"
}
```

#### Error Responses

**401 Unauthorized** - Invalid API key
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**400 Bad Request** - Validation error
```json
{
  "statusCode": 400,
  "message": [
    "Capacitor voltage is required for piezo sensors",
    "Step count must be at least 0"
  ],
  "error": "Bad Request"
}
```

## WebSocket Events

### piezo:trigger
Emitted when footstep trigger is detected (voltage increase ≥ threshold).

```javascript
{
  sensorId: "6a5a35213fe6213bf029d100",
  sensorName: "Piezo Tile 1",
  sensorLocation: "Main Entrance",
  capacitorVoltage: 12.5,
  deltaVoltage: 0.035,
  energy: 0.000172,
  stepCount: 42,
  timestamp: "2026-10-07T14:30:00.000Z"
}
```

### piezo:milestone
Emitted when step count milestone is reached.

```javascript
{
  sensorId: "6a5a35213fe6213bf029d100",
  milestone: 100,
  totalSteps: 100,
  message: "🎉 Milestone reached: 100 steps!",
  timestamp: "2026-10-07T15:00:00.000Z"
}
```

### capacitor:full
Emitted when capacitor reaches 90% capacity.

```javascript
{
  sensorId: "6a5a35213fe6213bf029d100",
  sensorName: "Piezo Tile 1",
  capacitorVoltage: 45.0,
  maxVoltage: 50,
  percentage: 90,
  message: "⚡ Capacitor at 90% capacity!",
  timestamp: "2026-10-07T15:30:00.000Z"
}
```

## Calculations

### Energy Stored in Capacitor
```
E = 0.5 × C × V²
```
Where:
- E = Energy (Joules)
- C = Capacitance (0.0022 F)
- V = Voltage (volts)

Example: At 12.5V
```
E = 0.5 × 0.0022 × 12.5² = 0.172 J
```

### Power Calculation
```
P = ΔE / Δt
```
Where:
- P = Power (Watts)
- ΔE = Energy change (Joules)
- Δt = Time interval (seconds)

### Energy Per Step
```
Energy/Step = Total Energy / Total Steps
```

## Troubleshooting

### ESP32 Issues

#### WiFi Connection Failed
- Check SSID and password
- Verify router is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength
- Verify firewall allows ESP32 connection

#### Authentication Failed (401)
- Verify API key is correct
- Check sensor is active in dashboard
- Ensure API key copied without extra spaces
- Create new sensor and get fresh API key

#### Bad Readings (Large Voltage Jumps)
- Check 100nF filter capacitor is installed
- Verify voltage divider resistor values
- Check ADC pin connection (GPIO34)
- Ensure proper grounding

#### NTP Sync Failed
- Check internet connection
- Verify NTP ports (123) not blocked
- System will fallback to millis() offset
- Readings will still work with fallback time

### Backend Issues

#### Readings Not Appearing
- Check backend is running (`npm run start:dev`)
- Verify correct API URL in ESP32 code
- Check MongoDB connection
- Review backend logs for errors

#### WebSocket Events Not Received
- Verify client connected to Socket.IO
- Check `dashboard` room subscription
- Verify JWT authentication for WebSocket
- Check browser console for errors

## Performance Considerations

### ESP32 Performance
- ADC sampling: 100 samples @ 50µs = 5ms per reading
- Monitoring interval: 150ms
- Trigger cooldown: 1000ms (prevents duplicate triggers)
- WiFi check interval: 30 seconds
- Buffer capacity: 10 readings (auth failure fallback)

### Backend Performance
- Trigger detection: O(1) database query
- Milestone checking: O(1) Map lookup
- Step cache cleanup: Daily cron job at midnight
- WebSocket broadcast: Non-blocking async

### Network Considerations
- HTTP request size: ~400 bytes
- Response size: ~150 bytes
- Typical latency: 50-200ms (local network)
- Retry strategy: 3 attempts with 2-second delay
- Auth failure pause: 60 seconds

## Security

### ESP32 Security
- API key in firmware (consider OTA for updates)
- HTTPS recommended for production (requires certificate)
- WiFi credentials in plaintext (consider secure storage)

### Backend Security
- API key authentication required
- JWT auth for admin endpoints
- Rate limiting recommended (not implemented)
- Input validation via class-validator

## Future Enhancements

### Potential Improvements
1. **OTA Updates**: Over-the-air firmware updates
2. **HTTPS**: Secure communication with certificates
3. **Battery Backup**: Continue operation during power loss
4. **Multiple Sensors**: Support sensor arrays
5. **Edge Analytics**: Process data on ESP32 before sending
6. **Predictive Maintenance**: Detect sensor degradation
7. **Energy Optimization**: Sleep modes between triggers
8. **Cloud Sync**: Backup data to cloud storage

## References

### Hardware Datasheets
- [LTC3588-1 Datasheet](https://www.analog.com/en/products/ltc3588-1.html)
- [ESP32 Technical Reference](https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf)
- [Piezoelectric Disc Specifications](manufacturer_datasheet.pdf)

### Software Libraries
- [ArduinoJson](https://arduinojson.org/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs: `npm run start:dev`
3. Review ESP32 serial output (115200 baud)
4. Check GitHub issues (if applicable)
5. Contact system administrator

## License

This integration is part of the Energy Monitoring System project.
See main project LICENSE file for details.

---

**Last Updated**: October 7, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
