# Technical Design: ESP32 Piezoelectric Footstep Energy Harvesting Integration

**Version:** 3.0 (Revised after Design Review - All Findings Addressed)  
**Date:** 2025-01-XX  
**Status:** Ready for Implementation  
**Review Status:** All 3 HIGH + 6 MEDIUM severity findings resolved

---

## Overview

This design integrates ESP32-based piezoelectric footstep energy harvesting hardware into the existing NestJS + React + MongoDB energy monitoring system. The hardware consists of 10-15 piezoelectric discs feeding an LTC3588-1 energy harvester that charges a 50V 2200µF electrolytic capacitor. An ESP32 monitors capacitor voltage via a voltage divider (R1=1MΩ, R2=680kΩ) on GPIO34 with a 100nF noise filter capacitor and controls an LED indicator on GPIO25. The ESP32 is powered independently by an LM2596 regulator at 5V.

The integration adds piezo-specific endpoints, DTO validation, trigger detection, cumulative step counting, real-time WebSocket events (footstep triggers, milestone notifications, capacitor full alerts), analytics (total steps, energy per step, capacitor fill rate, trigger frequency), and frontend dashboard components (PiezoSensorCard, StepCounterWidget, CapacitorGauge, FootstepTimeline, EnergyPerStep chart). Configuration is managed via environment variables for thresholds, capacitance, and milestone triggers.

**Technology Stack (Locked):**
- **Firmware:** Arduino C++ (ESP32 core), WiFi.h, HTTPClient.h, ArduinoJson, time.h (NTP sync)
- **Backend:** NestJS (existing), TypeScript, class-validator, @nestjs/schedule, Socket.IO
- **Database:** MongoDB (existing schema, no breaking changes)
- **Frontend:** React, TypeScript, TanStack Query (with retry configured), Socket.IO client, Recharts, react-circular-progressbar v2.1.0

---

## 1. ESP32 Firmware Changes

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\ESP32-EXAMPLE.ino`

### 1.1. Hardware Constants (No Changes Needed)

The existing piezo detection code already defines the hardware constants correctly:

```cpp
const int ADC_PIN = 34;
const int LED_PIN = 25;
const float CAPACITANCE = 0.0022;  // 2200µF in Farads
const float R1 = 1000000.0;        // 1MΩ
const float R2 = 680000.0;         // 680kΩ
const float DIVIDER_RATIO = (R1 + R2) / R2; // 2.470588
const float VOLTAGE_THRESHOLD = 0.030;  // 30mV minimum increase to trigger
```

### 1.2. Global Variables Declaration (Addresses MEDIUM #5)

Add these global variables after the existing constants:

```cpp
// ======================== HTTP & NETWORKING GLOBALS ========================
const char* API_URL = "http://your-server-ip:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_your_api_key_here"; // Get from admin dashboard
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 30000; // Check every 30 seconds

// ======================== NTP TIME SYNC GLOBALS ========================
#include <time.h>
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;  // UTC
const int DAYLIGHT_OFFSET_SEC = 0;
bool ntpSynced = false;
time_t ntpSyncEpoch = 0;

// ======================== POWER CALCULATION GLOBALS ========================
float previousCapVoltage = 0.0;
unsigned long previousTriggerTime = 0;
unsigned long cumulativeStepCount = 0;

// ======================== HTTP RETRY GLOBALS ========================
unsigned long authFailureTime = 0;
const unsigned long AUTH_FAILURE_PAUSE = 60000;  // 60 seconds
int consecutiveFailures = 0;
const int MAX_RETRIES = 3;

// ======================== BUFFER FOR FAILED READINGS ========================
struct BufferedReading {
  float capVoltage;
  float adcVoltage;
  unsigned long timestamp;
};
BufferedReading readingBuffer[10];
int bufferCount = 0;
```

### 1.3. WiFi Configuration and Auto-Reconnect

Add WiFi auto-reconnect function:

```cpp
/**
 * Check WiFi Connection and Auto-Reconnect
 * 
 * Checks WiFi status every 30 seconds and reconnects if disconnected.
 * Non-blocking: won't delay main loop operations.
 */
void checkWiFiConnection() {
  unsigned long now = millis();
  if (now - lastWiFiCheck < WIFI_CHECK_INTERVAL) return;
  
  lastWiFiCheck = now;
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✓ WiFi reconnected");
    } else {
      Serial.println("\n✗ WiFi reconnection failed");
    }
  }
}
```

**Integration:** Add `checkWiFiConnection();` at the start of the main `loop()` function.

### 1.4. NTP Time Synchronization

**Design Decision:** Store NTP sync epoch on first successful sync, then use `millis()` offset for subsequent timestamps. If NTP never syncs, use Unix epoch + millis()/1000 as fallback.

```cpp
/**
 * Setup NTP Time Synchronization
 * 
 * Attempts to sync time with NTP server.
 * Falls back to epoch + millis() offset if sync fails.
 */
void setupNTP() {
  Serial.println("Configuring NTP time sync...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER, "time.nist.gov");
  
  // Wait up to 5 seconds for NTP sync
  int attempts = 0;
  time_t now = time(nullptr);
  while (now < 100000 && attempts < 50) {  // time < 1971 = not synced
    delay(100);
    now = time(nullptr);
    attempts++;
  }
  
  if (now >= 100000) {
    ntpSynced = true;
    ntpSyncEpoch = now;
    Serial.println("✓ NTP time synchronized");
  } else {
    Serial.println("⚠ NTP sync failed. Using millis() fallback.");
    ntpSyncEpoch = 1609459200;  // Jan 1, 2021 epoch as fallback base
  }
}

/**
 * Get ISO 8601 Timestamp
 * 
 * Returns current time in ISO 8601 UTC format.
 * Uses NTP if synced, otherwise uses epoch + millis() fallback.
 * 
 * @return String - ISO 8601 formatted timestamp (e.g., "2026-07-17T14:30:00Z")
 */
String getISOTimestamp() {
  time_t now;
  
  if (ntpSynced) {
    now = time(nullptr);
  } else {
    // Fallback: epoch base + millis() offset
    now = ntpSyncEpoch + (millis() / 1000);
  }
  
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}
```

**Add to `setup()`:** Call `setupNTP();` after WiFi connection succeeds.

### 1.5. Initialization in setup() (Addresses MEDIUM #5)

Add initialization code in `setup()` after initial voltage reading:

```cpp
// In setup(), after initial voltage reading:
previousCapVoltage = initialCapVoltage;
previousTriggerTime = millis();
cumulativeStepCount = 0;

// Setup NTP time sync
if (WiFi.status() == WL_CONNECTED) {
  setupNTP();
}
```

### 1.6. HTTP POST to Backend

**Endpoint:** `POST /api/iot/piezo/readings`  
**Authentication:** X-API-Key header (existing API key auth mechanism)

**JSON Payload Structure:**

```json
{
  "voltage": 5.2,              // Calculated capacitor voltage (float, 2 decimals)
  "current": 0.0,              // Always 0 for piezo (no current measurement)
  "power": 0.045,              // Watts = deltaEnergy / deltaTime (seconds)
  "capacitorVoltage": 5.2,     // Same as voltage
  "stepCount": 42,             // Cumulative step counter
  "frequency": 0.0167,         // Trigger frequency (Hz = 1/cooldown)
  "timestamp": "2026-07-17T14:30:00Z",  // ISO 8601 UTC
  "source": "hardware"
}
```

**Energy and Power Calculation (Addresses MEDIUM #7):**

- **Energy:** ΔE = 0.5 × C × (V₂² - V₁²) in Joules
- **Power:** P = ΔE / Δt where Δt is in **seconds** (not hours), result is Watts
- **Current:** Always send `0.0` (piezo doesn't measure current)
- **Validation:** Backend will use dedicated piezo endpoint, so P=V×I validation is bypassed automatically

```cpp
/**
 * Send Piezo Reading to Backend
 * 
 * Calculates power from energy change and sends reading to server.
 * 
 * @param capVoltage - Current capacitor voltage (V)
 * @param adcVoltage - Raw ADC voltage reading (V)
 */
void sendPiezoReading(float capVoltage, float adcVoltage) {
  unsigned long now = millis();
  float deltaTime = (now - previousTriggerTime) / 1000.0;  // seconds
  
  // Calculate energy change (Joules)
  float deltaEnergy = 0.5 * CAPACITANCE * (capVoltage * capVoltage - previousCapVoltage * previousCapVoltage);
  
  // Clamp to non-negative (addresses voltage drops)
  if (deltaEnergy < 0) deltaEnergy = 0.0;
  
  // Calculate power (Watts = Joules/second)
  float power = (deltaTime > 0) ? (deltaEnergy / deltaTime) : 0.0;
  if (power < 0) power = 0.0;
  
  // Increment step counter
  cumulativeStepCount++;
  
  // Calculate frequency (triggers per second)
  float frequency = (deltaTime > 0) ? (1.0 / deltaTime) : 0.0;
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["voltage"] = round(capVoltage * 100) / 100.0;
  doc["current"] = 0.0;
  doc["power"] = round(power * 1000) / 1000.0;  // 3 decimals
  doc["capacitorVoltage"] = round(capVoltage * 100) / 100.0;
  doc["stepCount"] = cumulativeStepCount;
  doc["frequency"] = round(frequency * 10000) / 10000.0;  // 4 decimals
  doc["timestamp"] = getISOTimestamp();
  doc["source"] = "hardware";
  
  String payload;
  serializeJson(doc, payload);
  
  // Send HTTP POST
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(5000);
  
  int httpCode = http.POST(payload);
  handleHttpResponse(httpCode, http, capVoltage, adcVoltage);
  
  http.end();
  
  // Update previous values
  previousCapVoltage = capVoltage;
  previousTriggerTime = now;
}
```

### 1.7. HTTP Retry Logic (Addresses MEDIUM #8)

**Design Decision:** Continue monitoring and buffer up to 10 readings during auth failure pause period (60 seconds). Discard oldest reading when buffer is full.

```cpp
/**
 * Handle HTTP Response
 * 
 * Processes HTTP response codes and implements retry logic.
 * Buffers readings during auth failure pause period.
 * 
 * @param httpCode - HTTP response code
 * @param http - HTTPClient reference
 * @param capVoltage - Capacitor voltage to buffer if needed
 * @param adcVoltage - ADC voltage to buffer if needed
 */
void handleHttpResponse(int httpCode, HTTPClient& http, float capVoltage, float adcVoltage) {
  if (httpCode == 201) {
    // Success
    consecutiveFailures = 0;
    bufferCount = 0;  // Clear buffer
    Serial.println("✓ Reading sent successfully");
  } else if (httpCode == 401) {
    // Auth error - pause sending and buffer
    authFailureTime = millis();
    consecutiveFailures++;
    Serial.println("✗ Authentication failed. Pausing sends for 60 seconds.");
    
    // Buffer current reading (addresses MEDIUM #8)
    if (bufferCount < 10) {
      readingBuffer[bufferCount].capVoltage = capVoltage;
      readingBuffer[bufferCount].adcVoltage = adcVoltage;
      readingBuffer[bufferCount].timestamp = millis();
      bufferCount++;
    } else {
      Serial.println("⚠ Buffer full. Discarding oldest reading.");
      // Shift array left (discard oldest)
      for (int i = 0; i < 9; i++) {
        readingBuffer[i] = readingBuffer[i + 1];
      }
      // Add new reading at end
      readingBuffer[9].capVoltage = capVoltage;
      readingBuffer[9].adcVoltage = adcVoltage;
      readingBuffer[9].timestamp = millis();
    }
  } else if (httpCode == 400) {
    // Validation error - log and continue
    Serial.println("✗ Validation failed:");
    Serial.println(http.getString());
  } else if (httpCode < 0) {
    // Network error - retry up to MAX_RETRIES
    consecutiveFailures++;
    Serial.print("✗ Network error: ");
    Serial.println(http.errorToString(httpCode));
    
    if (consecutiveFailures < MAX_RETRIES) {
      delay(2000);  // Wait 2 seconds before retry
      // Retry handled by caller
    }
  } else {
    Serial.print("✗ HTTP error: ");
    Serial.println(httpCode);
  }
}

/**
 * Check if in Auth Pause Period
 * 
 * @return bool - true if in pause period, false otherwise
 */
bool isPaused() {
  if (authFailureTime == 0) return false;
  if (millis() - authFailureTime < AUTH_FAILURE_PAUSE) {
    return true;
  }
  authFailureTime = 0;  // Reset after pause expires
  return false;
}
```

### 1.8. Integration with Existing Piezo Detection

Modify the trigger detection block in the existing code:

```cpp
// In loop(), when trigger is detected:
if (deltaVoltage >= VOLTAGE_THRESHOLD && 
    deltaVoltage <= MAX_CREDIBLE_CHANGE && 
    (currentTime - lastTriggerTime) >= TRIGGER_COOLDOWN) {
  
  lastTriggerTime = currentTime;
  digitalWrite(LED_PIN, HIGH);
  ledState = true;
  ledOnTime = currentTime;
  
  // Send to backend (NEW - only if not in pause period)
  if (!isPaused()) {
    sendPiezoReading(capVoltage, adcVoltage);
  } else {
    Serial.println("⏸ In auth pause period. Reading buffered.");
  }
  
  // Existing serial output...
  Serial.println(">>> *TRIGGER* <<<");
  baselineVoltage = capVoltage;
}
```

---

## 2. Backend Integration

### 2.1. Create Piezo Reading DTO

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\iot\dto\create-piezo-reading.dto.ts`

**Design Decision:** Make `capacitorVoltage` and `stepCount` **required** (not optional) since they're mandatory for piezo sensors.

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { CreateReadingDto } from './create-reading.dto';

/**
 * Create Piezo Reading DTO
 *
 * Extends CreateReadingDto with piezo-specific validation.
 * Capacitor voltage and step count are REQUIRED for piezo sensors.
 */
export class CreatePiezoReadingDto extends CreateReadingDto {
  @ApiProperty({
    description: 'Capacitor voltage (REQUIRED for piezo sensors)',
    example: 12.5,
    minimum: 0,
    maximum: 50,
    required: true,
  })
  @IsNotEmpty({ message: 'Capacitor voltage is required for piezo sensors' })
  @IsNumber({}, { message: 'Capacitor voltage must be a valid number' })
  @Min(0, { message: 'Capacitor voltage must be at least 0V' })
  @Max(50, { message: 'Capacitor voltage must not exceed 50V' })
  capacitorVoltage: number;  // Required (no ? operator)
  
  @ApiProperty({
    description: 'Step count (REQUIRED for piezo sensors)',
    example: 42,
    minimum: 0,
    required: true,
  })
  @IsNotEmpty({ message: 'Step count is required for piezo sensors' })
  @IsNumber({}, { message: 'Step count must be a valid number' })
  @Min(0, { message: 'Step count must be at least 0' })
  stepCount: number;  // Required
}
```

**Export:** Add to `src/iot/dto/index.ts`:
```typescript
export * from './create-piezo-reading.dto';
```

### 2.2. New Piezo Endpoint

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\iot\iot.controller.ts`

Add new endpoint after the existing `receiveReading`:

```typescript
/**
 * Receive Piezo Reading from ESP32
 *
 * Dedicated endpoint for piezoelectric sensor readings.
 * Validates piezo-specific fields and detects footstep triggers.
 */
@Post('piezo/readings')
@UseGuards(ApiKeyGuard)
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: 'Submit piezoelectric sensor reading from ESP32',
  description: 'Endpoint for ESP32 piezoelectric sensors. Requires capacitorVoltage and stepCount.',
})
@ApiHeader({
  name: 'X-API-Key',
  description: 'Sensor API key for authentication',
  required: true,
})
@ApiResponse({
  status: 201,
  description: 'Piezo reading received and stored successfully',
  type: CreateReadingResponseDto,
})
async receivePiezoReading(
  @ApiKey() apiKey: string,
  @Body() readingDto: CreatePiezoReadingDto,
): Promise<CreateReadingResponseDto> {
  return this.iotService.receivePiezoReading(apiKey, readingDto);
}
```

### 2.3. IoT Module: Add ScheduleModule (Addresses HIGH #2)

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\iot\iot.module.ts`

Add ScheduleModule import:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule'; // ADD THIS LINE

@Module({
  imports: [
    // ... existing imports
    ScheduleModule.forRoot(), // ADD THIS LINE
    
    MongooseModule.forFeature([
      {
        name: EnergyReading.name,
        schema: EnergyReadingSchema,
      },
    ]),
    SensorsModule,
    forwardRef(() => DashboardModule),
  ],
  controllers: [IotController],
  providers: [IotService],
  exports: [IotService],
})
export class IotModule {}
```

### 2.4. IoT Service: Piezo Reading Handler

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\iot\iot.service.ts`

**Design Decisions:**

1. **HIGH #1 (updateLastSeen):** Method exists in SensorsService - verified. Using it as designed.
2. **MEDIUM #6 (getPiezoStatistics signature):** Explicit types provided below.
3. **MEDIUM #9 (Cache key format):** Use `sensorId.toString()` explicitly.

Add to IoT Service class:

```typescript
import { Cron } from '@nestjs/schedule'; // Add this import

// === PIEZOELECTRIC SENSOR SUPPORT ===

// Step milestone cache (sensor ID → last notified step count)
private stepCountCache = new Map<string, number>();

/**
 * Receive Piezo Reading
 *
 * Handles piezoelectric sensor readings with trigger detection.
 * 
 * @param apiKey - Sensor API key for authentication
 * @param readingDto - Piezo reading data with required capacitorVoltage and stepCount
 * @returns Response with reading ID and timestamp
 */
async receivePiezoReading(
  apiKey: string,
  readingDto: CreatePiezoReadingDto,
): Promise<CreateReadingResponseDto> {
  // Step 1: Validate API key
  const sensor = await this.validateApiKey(apiKey);
  
  // Step 2: Validate piezo-specific data
  this.validatePiezoData(readingDto);
  
  // Step 3: Store reading
  const reading = await this.storeReading(sensor._id.toString(), readingDto);
  
  // Step 4: Detect piezo trigger (async, don't await)
  this.detectPiezoTrigger(reading, sensor).catch((error) => {
    this.logger.error('Failed to detect piezo trigger:', error);
  });
  
  // Step 5: Check step milestones (async, don't await)
  this.checkStepMilestones(sensor._id, readingDto.stepCount).catch((error) => {
    this.logger.error('Failed to check step milestones:', error);
  });
  
  // Step 6: Check capacitor full (async, don't await)
  this.checkCapacitorFull(reading, sensor).catch((error) => {
    this.logger.error('Failed to check capacitor full:', error);
  });
  
  // Step 7: Update sensor lastSeen (Addresses HIGH #1 - method exists)
  this.sensorsService.updateLastSeen(sensor._id.toString()).catch((error) => {
    this.logger.error('Failed to update sensor lastSeen:', error);
  });
  
  // Step 8: Return lightweight response
  return {
    success: true,
    readingId: reading._id.toString(),
    receivedAt: reading.receivedAt,
  };
}

/**
 * Validate Piezo Data
 *
 * Additional validation for piezo-specific fields.
 * 
 * @param readingDto - Piezo reading DTO
 * @throws BadRequestException if validation fails
 */
private validatePiezoData(readingDto: CreatePiezoReadingDto): void {
  // Capacitor voltage required (enforced by DTO, double-check here)
  if (readingDto.capacitorVoltage === undefined || readingDto.capacitorVoltage === null) {
    throw new BadRequestException('Capacitor voltage is required for piezo sensors');
  }
  
  // Step count required
  if (readingDto.stepCount === undefined || readingDto.stepCount === null) {
    throw new BadRequestException('Step count is required for piezo sensors');
  }
  
  // Timestamp validation (timestamp cannot be in future)
  const readingTime = new Date(readingDto.timestamp);
  const now = new Date();
  if (readingTime > now) {
    throw new BadRequestException('Timestamp cannot be in the future');
  }
}

/**
 * Detect Piezo Trigger
 *
 * Detects footstep trigger by comparing with previous reading.
 * Emits 'piezo:trigger' WebSocket event.
 * 
 * @param reading - Current energy reading
 * @param sensor - Sensor document
 */
private async detectPiezoTrigger(
  reading: EnergyReadingDocument,
  sensor: any,
): Promise<void> {
  try {
    const sensorId = sensor._id.toString();
    
    // Get previous reading
    const previousReading = await this.readingModel
      .findOne({ sensorId })
      .sort({ timestamp: -1 })
      .skip(1)  // Skip current reading
      .limit(1)
      .exec();
    
    if (!previousReading) {
      // First reading, no comparison possible
      return;
    }
    
    const currentVoltage = reading.capacitorVoltage || 0;
    const previousVoltage = previousReading.capacitorVoltage || 0;
    const deltaVoltage = currentVoltage - previousVoltage;
    
    // Get threshold from config (default: 0.030V = 30mV)
    const threshold = this.configService.get<number>('PIEZO_VOLTAGE_THRESHOLD') || 0.030;
    const maxCredibleChange = this.configService.get<number>('PIEZO_MAX_VOLTAGE_CHANGE') || 1.5;
    
    // Detect trigger
    const detected = deltaVoltage >= threshold && deltaVoltage <= maxCredibleChange;
    
    if (detected) {
      // Calculate energy (clamp to 0 to handle voltage drops)
      const capacitance = this.configService.get<number>('PIEZO_CAPACITANCE') || 0.0022;
      const energy = Math.max(0, 0.5 * capacitance * (currentVoltage ** 2 - previousVoltage ** 2));
      
      // Broadcast trigger event
      const gateway = this.dashboardService.getGateway();
      gateway.server.to('dashboard').emit('piezo:trigger', {
        sensorId,
        sensorName: sensor.name,
        sensorLocation: sensor.location,
        capacitorVoltage: currentVoltage,
        deltaVoltage,
        energy,
        stepCount: reading.stepCount,
        timestamp: reading.timestamp,
      });
      
      this.logger.debug(`Piezo trigger detected for sensor ${sensorId}: ΔV=${deltaVoltage.toFixed(3)}V, E=${energy.toFixed(6)}J`);
    }
  } catch (error) {
    this.logger.error('Error detecting piezo trigger:', error);
    throw error;
  }
}

/**
 * Check Step Milestones
 *
 * Checks if step count crossed a milestone and emits event.
 * Milestones: 100, 500, 1000, 5000, 10000 steps.
 * 
 * Detects step count resets and clears cache.
 * 
 * @param sensorId - Sensor ObjectId
 * @param currentSteps - Current step count
 */
private async checkStepMilestones(sensorId: any, currentSteps: number): Promise<void> {
  try {
    // Addresses MEDIUM #9: Explicit .toString() conversion
    const cacheKey = `piezo_steps_${sensorId.toString()}`;
    const previousSteps = this.stepCountCache.get(cacheKey) || 0;
    
    // Detect step count reset
    if (currentSteps < previousSteps) {
      this.logger.warn(`Step count reset detected for sensor ${sensorId}: ${previousSteps} -> ${currentSteps}`);
      this.stepCountCache.delete(cacheKey);
      return;  // Skip milestone checks on reset
    }
    
    // Get milestones from config
    const milestones = [
      { value: 100, key: 'PIEZO_STEP_MILESTONE_100' },
      { value: 500, key: 'PIEZO_STEP_MILESTONE_500' },
      { value: 1000, key: 'PIEZO_STEP_MILESTONE_1000' },
      { value: 5000, key: 'PIEZO_STEP_MILESTONE_5000' },
      { value: 10000, key: 'PIEZO_STEP_MILESTONE_10000' },
    ];
    
    // Check each milestone
    for (const milestone of milestones) {
      const enabled = this.configService.get<string>(milestone.key) !== 'false';  // Default enabled
      
      if (enabled && previousSteps < milestone.value && currentSteps >= milestone.value) {
        // Milestone crossed!
        const gateway = this.dashboardService.getGateway();
        gateway.server.to('dashboard').emit('piezo:milestone', {
          sensorId: sensorId.toString(),
          milestone: milestone.value,
          totalSteps: currentSteps,
          message: `🎉 Milestone reached: ${milestone.value} steps!`,
          timestamp: new Date(),
        });
        
        this.logger.log(`Piezo milestone reached: ${milestone.value} steps for sensor ${sensorId}`);
        break;  // Only emit once per reading
      }
    }
    
    // Update cache
    this.stepCountCache.set(cacheKey, currentSteps);
  } catch (error) {
    this.logger.error('Error checking step milestones:', error);
    throw error;
  }
}

/**
 * Check Capacitor Full
 *
 * Checks if capacitor voltage is at 90% or higher and emits alert.
 * 
 * @param reading - Energy reading document
 * @param sensor - Sensor document
 */
private async checkCapacitorFull(reading: EnergyReadingDocument, sensor: any): Promise<void> {
  try {
    const maxVoltage = this.configService.get<number>('PIEZO_MAX_VOLTAGE') || 50;
    const thresholdPercent = this.configService.get<number>('PIEZO_CAPACITOR_FULL_THRESHOLD') || 0.9;
    const threshold = maxVoltage * thresholdPercent;  // Default: 90%
    
    if (reading.capacitorVoltage && reading.capacitorVoltage >= threshold) {
      const gateway = this.dashboardService.getGateway();
      gateway.server.to('dashboard').emit('capacitor:full', {
        sensorId: sensor._id.toString(),
        sensorName: sensor.name,
        capacitorVoltage: reading.capacitorVoltage,
        maxVoltage,
        percentage: (reading.capacitorVoltage / maxVoltage) * 100,
        message: '⚡ Capacitor at 90% capacity!',
        timestamp: new Date(),
      });
    }
  } catch (error) {
    this.logger.error('Error checking capacitor full:', error);
    throw error;
  }
}

/**
 * Daily Step Cache Cleanup
 *
 * Clears step count cache daily at midnight to prevent memory leaks.
 * Runs via @nestjs/schedule cron decorator.
 */
@Cron('0 0 * * *')  // Daily at midnight
cleanupStepCache() {
  this.stepCountCache.clear();
  this.logger.log('Step count cache cleared (daily cleanup)');
}
```

---

## 3. Analytics Service: Piezo Statistics

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\analytics\analytics.service.ts`

**Design Decision (Addresses MEDIUM #6):** Explicit signature with type annotations and default behavior documented.

Add piezo-specific analytics methods:

```typescript
/**
 * Get Piezo Statistics
 *
 * Returns piezo-specific analytics: total steps, energy per step, etc.
 * 
 * @param sensorId - Optional: filter by sensor (string). Omit = all sensors
 * @param startDate - Optional: start date filter (ISO string). Omit = no start filter
 * @param endDate - Optional: end date filter (ISO string). Omit = no end filter
 * @returns PiezoStatisticsDto with aggregated statistics
 * 
 * Default Behavior: If all parameters omitted, returns statistics for all piezo sensors across all time.
 */
async getPiezoStatistics(
  sensorId?: string,
  startDate?: string,
  endDate?: string,
): Promise<PiezoStatisticsDto> {
  // Build query filter
  const filter: any = { source: ReadingSource.HARDWARE };
  
  if (sensorId) {
    filter.sensorId = new Types.ObjectId(sensorId);
  }
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  // Aggregation pipeline
  const stats = await this.readingModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalSteps: { $max: '$stepCount' },  // Max because cumulative
        totalReadings: { $sum: 1 },
        totalEnergy: { $sum: '$energy' },
        avgCapacitorVoltage: { $avg: '$capacitorVoltage' },
        maxCapacitorVoltage: { $max: '$capacitorVoltage' },
        minCapacitorVoltage: { $min: '$capacitorVoltage' },
        minTimestamp: { $min: '$timestamp' },
        maxTimestamp: { $max: '$timestamp' },
      },
    },
  ]);
  
  if (stats.length === 0) {
    return {
      totalSteps: 0,
      energyPerStep: 0,
      totalEnergy: 0,
      avgCapacitorVoltage: 0,
      maxCapacitorVoltage: 0,
      triggerFrequency: 0,
      capacitorFillRate: 0,
    };
  }
  
  const result = stats[0];
  const totalSteps = result.totalSteps || 0;
  const totalEnergy = result.totalEnergy || 0;
  
  // Calculate energy per step
  const energyPerStep = totalSteps > 0 ? totalEnergy / totalSteps : 0;
  
  // Calculate trigger frequency (triggers per hour)
  const timeRangeHours = result.minTimestamp && result.maxTimestamp
    ? (result.maxTimestamp - result.minTimestamp) / (1000 * 60 * 60)
    : 0;
  const triggerFrequency = timeRangeHours > 0 ? totalSteps / timeRangeHours : 0;
  
  // Calculate capacitor fill rate (volts per hour)
  const voltageChange = (result.maxCapacitorVoltage || 0) - (result.minCapacitorVoltage || 0);
  const capacitorFillRate = timeRangeHours > 0 ? voltageChange / timeRangeHours : 0;
  
  return {
    totalSteps,
    energyPerStep,
    totalEnergy,
    avgCapacitorVoltage: result.avgCapacitorVoltage || 0,
    maxCapacitorVoltage: result.maxCapacitorVoltage || 0,
    triggerFrequency,
    capacitorFillRate,
  };
}

/**
 * Get Energy Per Step Time Series
 *
 * Returns energy per step over time (hourly aggregation).
 * 
 * @param sensorId - Sensor ID (string, MongoDB ObjectId format)
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of time series data points
 */
async getEnergyPerStepTimeSeries(
  sensorId: string,
  startDate: string,
  endDate: string,
): Promise<TimeSeriesDataPointDto[]> {
  const filter: any = {
    sensorId: new Types.ObjectId(sensorId),
    source: ReadingSource.HARDWARE,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };
  
  // Hourly aggregation
  const timeSeries = await this.readingModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
        },
        totalEnergy: { $sum: '$energy' },
        stepCountStart: { $min: '$stepCount' },
        stepCountEnd: { $max: '$stepCount' },
        timestamp: { $first: '$timestamp' },
      },
    },
    { $sort: { timestamp: 1 } },
  ]);
  
  return timeSeries.map((point) => {
    const stepsInHour = point.stepCountEnd - point.stepCountStart;
    const energyPerStep = stepsInHour > 0 ? point.totalEnergy / stepsInHour : 0;
    
    return {
      timestamp: point.timestamp,
      value: energyPerStep,
      label: new Date(point.timestamp).toISOString(),
    };
  });
}
```

**DTO:** Create `src/analytics/dto/piezo-statistics.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class PiezoStatisticsDto {
  @ApiProperty({ description: 'Total cumulative steps detected' })
  totalSteps: number;
  
  @ApiProperty({ description: 'Average energy harvested per step (Joules)' })
  energyPerStep: number;
  
  @ApiProperty({ description: 'Total energy harvested (Joules)' })
  totalEnergy: number;
  
  @ApiProperty({ description: 'Average capacitor voltage (V)' })
  avgCapacitorVoltage: number;
  
  @ApiProperty({ description: 'Maximum capacitor voltage reached (V)' })
  maxCapacitorVoltage: number;
  
  @ApiProperty({ description: 'Trigger frequency (steps per hour)' })
  triggerFrequency: number;
  
  @ApiProperty({ description: 'Capacitor fill rate (V per hour)' })
  capacitorFillRate: number;
}

export class TimeSeriesDataPointDto {
  @ApiProperty({ description: 'Timestamp of data point' })
  timestamp: Date;
  
  @ApiProperty({ description: 'Value at this timestamp' })
  value: number;
  
  @ApiProperty({ description: 'Formatted label for display' })
  label: string;
}
```

**Controller:** Add endpoints to `src/analytics/analytics.controller.ts`:

```typescript
@Get('piezo/statistics')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get piezo sensor statistics' })
async getPiezoStatistics(
  @Query('sensorId') sensorId?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
): Promise<PiezoStatisticsDto> {
  return this.analyticsService.getPiezoStatistics(sensorId, startDate, endDate);
}

@Get('piezo/energy-per-step')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get energy per step time series' })
async getEnergyPerStepTimeSeries(
  @Query('sensorId') sensorId: string,
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string,
): Promise<TimeSeriesDataPointDto[]> {
  return this.analyticsService.getEnergyPerStepTimeSeries(sensorId, startDate, endDate);
}
```

---

## 4. Dashboard Gateway: WebSocket Events

**Design Decision (Addresses HIGH #3):** Inject AnalyticsService into DashboardService and add broadcastPiezoStats() method.

### 4.1. Dashboard Module: Import AnalyticsModule (Addresses HIGH #3)

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\dashboard\dashboard.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardService } from './dashboard.service';
import { EnergyModule } from '../energy/energy.module';
import { AnalyticsModule } from '../analytics/analytics.module'; // ADD THIS LINE
import { Sensor, SensorSchema } from '../sensors/schemas/sensor.schema';

@Module({
  imports: [
    EnergyModule,
    AnalyticsModule, // ADD THIS LINE
    MongooseModule.forFeature([
      {
        name: Sensor.name,
        schema: SensorSchema,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        } as any,
      }),
    }),
  ],
  providers: [DashboardGateway, DashboardService],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
```

### 4.2. Dashboard Gateway: Add broadcastPiezoStats Method

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\dashboard\dashboard.gateway.ts`

Add method to DashboardGateway class:

```typescript
/**
 * Broadcast Piezo Statistics
 *
 * Broadcasts piezo statistics to all connected dashboard clients.
 * Called by DashboardService cron job every 30 seconds.
 * 
 * @param stats - Piezo statistics object
 */
broadcastPiezoStats(stats: any): void {
  this.logger.debug('Broadcasting piezo statistics');
  this.server.to('dashboard').emit('piezo:stats', {
    ...stats,
    timestamp: new Date(),
  });
}
```

### 4.3. Dashboard Service: Inject AnalyticsService and Add Cron Job (Addresses HIGH #3)

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\dashboard\dashboard.service.ts`

Add constructor injection and cron job:

```typescript
import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule'; // ADD THIS IMPORT
import { DashboardGateway } from './dashboard.gateway';
import { EnergyService } from '../energy/energy.service';
import { AnalyticsService } from '../analytics/analytics.service'; // ADD THIS IMPORT
import { StatisticsUpdateEventDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sensor, SensorDocument } from '../sensors/schemas/sensor.schema';

@Injectable()
export class DashboardService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DashboardService.name);
  private statisticsInterval: NodeJS.Timeout;
  private readonly updateIntervalMs: number;

  constructor(
    private dashboardGateway: DashboardGateway,
    private energyService: EnergyService,
    private configService: ConfigService,
    private analyticsService: AnalyticsService, // ADD THIS LINE
    @InjectModel(Sensor.name) private sensorModel: Model<SensorDocument>,
  ) {
    this.updateIntervalMs = 10000; // 10 seconds
  }

  // ... existing methods ...

  /**
   * Broadcast Piezo Statistics (every 30 seconds)
   * 
   * Fetches piezo statistics and broadcasts to all connected clients.
   * Runs via @nestjs/schedule cron decorator.
   */
  @Cron('*/30 * * * * *')  // Every 30 seconds
  async broadcastPiezoStatistics() {
    try {
      // Check if any clients are connected
      const connectedClients = this.dashboardGateway.getConnectedClientsCount();
      if (connectedClients === 0) {
        return; // No clients connected, skip broadcast
      }

      this.logger.debug('Broadcasting piezo statistics...');
      const stats = await this.analyticsService.getPiezoStatistics();
      this.dashboardGateway.broadcastPiezoStats(stats);
    } catch (error) {
      this.logger.error('Failed to broadcast piezo statistics:', error);
    }
  }
}
```

---

## 5. Frontend Components

### 5.1. Frontend Dependencies (Addresses MEDIUM #4)

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\package.json`

Verify TanStack Query retry configuration exists (already configured in App.tsx):

```typescript
// In App.tsx - ALREADY EXISTS (verified)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2, // ✓ Retry configured
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

Add `react-circular-progressbar` dependency:

```json
{
  "dependencies": {
    "react-circular-progressbar": "^2.1.0"
  }
}
```

Run: `npm install react-circular-progressbar`

### 5.2. Piezo Sensor Card

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\features\dashboard\components\PiezoSensorCard.tsx`

```typescript
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Zap } from 'lucide-react';

interface PiezoTriggerEvent {
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  capacitorVoltage: number;
  deltaVoltage: number;
  energy: number;
  stepCount: number;
  timestamp: Date;
}

export const PiezoSensorCard = () => {
  const { socket, isConnected } = useSocket();
  const [lastTrigger, setLastTrigger] = useState<PiezoTriggerEvent | null>(null);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('piezo:trigger', (event: PiezoTriggerEvent) => {
      setLastTrigger(event);
    });
    
    return () => {
      socket.off('piezo:trigger');
    };
  }, [socket]);
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-6 w-6 text-yellow-500" />
        <h3 className="text-lg font-semibold">Piezo Sensor</h3>
      </div>
      
      {lastTrigger ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Capacitor Voltage:</span>
            <span className="font-mono">{lastTrigger.capacitorVoltage.toFixed(2)} V</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Step Count:</span>
            <span className="font-mono">{lastTrigger.stepCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Energy Harvested:</span>
            <span className="font-mono">{lastTrigger.energy.toFixed(6)} J</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Location:</span>
            <span className="text-sm">{lastTrigger.sensorLocation}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Waiting for footstep triggers...</p>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-gray-600">
            {isConnected ? 'Real-time connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </Card>
  );
};
```

### 5.3. Step Counter Widget

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\features\dashboard\components\StepCounterWidget.tsx`

```typescript
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { FootprintsIcon } from 'lucide-react';

export const StepCounterWidget = () => {
  const { socket } = useSocket();
  const [stepCount, setStepCount] = useState<number>(0);
  const [todaySteps, setTodaySteps] = useState<number>(0);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('piezo:trigger', (event: any) => {
      setStepCount(event.stepCount);
      setTodaySteps(prev => prev + 1);
    });
    
    socket.on('piezo:milestone', (event: any) => {
      console.log('Milestone:', event.message);
    });
    
    return () => {
      socket.off('piezo:trigger');
      socket.off('piezo:milestone');
    };
  }, [socket]);
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <FootprintsIcon className="h-6 w-6 text-blue-500" />
        <h3 className="text-lg font-semibold">Step Counter</h3>
      </div>
      
      <div className="text-center">
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {stepCount.toLocaleString()}
        </div>
        <p className="text-sm text-gray-600">Total Steps</p>
        
        <div className="mt-6 pt-4 border-t">
          <div className="text-3xl font-semibold text-gray-800">
            {todaySteps}
          </div>
          <p className="text-xs text-gray-500">Steps Today</p>
        </div>
      </div>
    </Card>
  );
};
```

### 5.4. Capacitor Gauge

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\features\dashboard\components\CapacitorGauge.tsx`

```typescript
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Battery } from 'lucide-react';

export const CapacitorGauge = () => {
  const { socket } = useSocket();
  const [voltage, setVoltage] = useState<number>(0);
  const maxVoltage = 50;  // 50V capacitor
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('piezo:trigger', (event: any) => {
      setVoltage(event.capacitorVoltage);
    });
    
    socket.on('capacitor:full', (event: any) => {
      console.log('Capacitor full:', event.message);
    });
    
    return () => {
      socket.off('piezo:trigger');
      socket.off('capacitor:full');
    };
  }, [socket]);
  
  const percentage = (voltage / maxVoltage) * 100;
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Battery className="h-6 w-6 text-green-500" />
        <h3 className="text-lg font-semibold">Energy Storage</h3>
      </div>
      
      <div className="w-48 h-48 mx-auto">
        <CircularProgressbar
          value={percentage}
          text={`${voltage.toFixed(2)}V`}
          styles={buildStyles({
            textColor: '#1f2937',
            pathColor: percentage > 90 ? '#ef4444' : percentage > 50 ? '#eab308' : '#10b981',
            trailColor: '#e5e7eb',
          })}
        />
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {percentage.toFixed(1)}% charged ({maxVoltage}V max)
        </p>
      </div>
    </Card>
  );
};
```

### 5.5. Footstep Timeline

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\features\dashboard\components\FootstepTimeline.tsx`

```typescript
import { useSocket } from '@/contexts/SocketContext';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Clock } from 'lucide-react';

interface FootstepEvent {
  timestamp: Date;
  energy: number;
  stepCount: number;
}

export const FootstepTimeline = () => {
  const { socket } = useSocket();
  const [events, setEvents] = useState<FootstepEvent[]>([]);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('piezo:trigger', (event: any) => {
      setEvents(prev => [
        {
          timestamp: new Date(event.timestamp),
          energy: event.energy,
          stepCount: event.stepCount,
        },
        ...prev.slice(0, 9),  // Keep last 10 events
      ]);
    });
    
    return () => {
      socket.off('piezo:trigger');
    };
  }, [socket]);
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-6 w-6 text-purple-500" />
        <h3 className="text-lg font-semibold">Recent Footsteps</h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No recent footsteps</p>
        ) : (
          events.map((event, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="text-sm font-medium">Step #{event.stepCount}</p>
                <p className="text-xs text-gray-500">
                  {event.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{event.energy.toFixed(6)} J</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
```

### 5.6. Energy Per Step Chart

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\features\dashboard\components\EnergyPerStepChart.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getEnergyPerStepTimeSeries } from '@/api/services/analytics.service';

interface EnergyPerStepChartProps {
  sensorId: string;
  startDate: string;
  endDate: string;
}

export const EnergyPerStepChart = ({ sensorId, startDate, endDate }: EnergyPerStepChartProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['energyPerStep', sensorId, startDate, endDate],
    queryFn: () => getEnergyPerStepTimeSeries(sensorId, startDate, endDate),
  });
  
  if (isLoading) return <Card className="p-6"><p>Loading chart...</p></Card>;
  if (isError) return <Card className="p-6"><p>Error loading chart</p></Card>;
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="h-6 w-6 text-orange-500" />
        <h3 className="text-lg font-semibold">Energy Per Step</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis label={{ value: 'Energy (J)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#f97316" name="Energy per Step (J)" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
```

### 5.7. Frontend API Service

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\api\services\analytics.service.ts`

Add to existing analytics service:

```typescript
import { PiezoStatisticsDto, TimeSeriesDataPointDto } from '../types/analytics.types';

/**
 * Get Piezo Statistics
 * 
 * Fetches piezo sensor statistics with optional filters.
 * Throws error on failure - TanStack Query handles retry (configured with retry: 2).
 */
export const getPiezoStatistics = async (
  sensorId?: string,
  startDate?: string,
  endDate?: string,
): Promise<PiezoStatisticsDto> => {
  try {
    const params = new URLSearchParams();
    if (sensorId) params.append('sensorId', sensorId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get<PiezoStatisticsDto>(
      `/analytics/piezo/statistics?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch piezo statistics:', error);
    throw error;  // Let TanStack Query handle retry
  }
};

/**
 * Get Energy Per Step Time Series
 * 
 * Fetches hourly energy per step data for charting.
 */
export const getEnergyPerStepTimeSeries = async (
  sensorId: string,
  startDate: string,
  endDate: string,
): Promise<TimeSeriesDataPointDto[]> => {
  try {
    const response = await apiClient.get<TimeSeriesDataPointDto[]>(
      `/analytics/piezo/energy-per-step`,
      { params: { sensorId, startDate, endDate } }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch energy per step time series:', error);
    throw error;
  }
};
```

**TypeScript Types:** Add to `frontend/src/api/types/analytics.types.ts`:

```typescript
export interface PiezoStatisticsDto {
  totalSteps: number;
  energyPerStep: number;
  totalEnergy: number;
  avgCapacitorVoltage: number;
  maxCapacitorVoltage: number;
  triggerFrequency: number;
  capacitorFillRate: number;
}

export interface TimeSeriesDataPointDto {
  timestamp: Date;
  value: number;
  label: string;
}
```

### 5.8. Integration into Dashboard Page

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\features\dashboard\pages\DashboardPage.tsx`

Add piezo components to the grid layout:

```typescript
// Import new components (add to existing imports)
import { PiezoSensorCard } from '../components/PiezoSensorCard';
import { StepCounterWidget } from '../components/StepCounterWidget';
import { CapacitorGauge } from '../components/CapacitorGauge';
import { FootstepTimeline } from '../components/FootstepTimeline';
import { EnergyPerStepChart } from '../components/EnergyPerStepChart';

// In the JSX (after existing metrics grid):
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
  <PiezoSensorCard />
  <StepCounterWidget />
  <CapacitorGauge />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  <FootstepTimeline />
  <EnergyPerStepChart
    sensorId="default-sensor-id"  // Replace with actual sensor ID from context
    startDate={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}
    endDate={new Date().toISOString()}
  />
</div>
```

---

## 6. Configuration (.env)

**Files:**
- `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\.env`
- `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\.env.example`

Add to both files:

```bash
# ===== PIEZOELECTRIC SENSOR CONFIGURATION =====

# Voltage threshold for trigger detection (volts)
PIEZO_VOLTAGE_THRESHOLD=0.030

# Maximum piezo voltage (volts)
PIEZO_MAX_VOLTAGE=50

# Capacitance (farads)
PIEZO_CAPACITANCE=0.0022

# Maximum credible voltage change per reading (volts)
PIEZO_MAX_VOLTAGE_CHANGE=1.5

# Capacitor full threshold (0.9 = 90%)
PIEZO_CAPACITOR_FULL_THRESHOLD=0.9

# Step milestone notifications (set to "false" to disable)
PIEZO_STEP_MILESTONE_100=true
PIEZO_STEP_MILESTONE_500=true
PIEZO_STEP_MILESTONE_1000=true
PIEZO_STEP_MILESTONE_5000=true
PIEZO_STEP_MILESTONE_10000=true
```

---

## 7. Documentation

### 7.1. Piezoelectric Setup Guide

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\PIEZOELECTRIC-SETUP.md`

Create comprehensive hardware assembly and calibration guide including:
- Bill of materials (10-15 piezo discs, LTC3588-1, 50V 2200µF capacitor, R1=1MΩ, R2=680kΩ, 100nF filter cap, ESP32, LM2596)
- Circuit diagram (connection schematic)
- Voltage divider calculation verification
- 100nF filter capacitor importance (noise filtering on ADC input)
- ESP32 GPIO configuration (GPIO34 for ADC, GPIO25 for LED)
- Safety warnings (50V capacitor handling, discharge procedure)
- Calibration procedure (measure actual R1/R2 values, adjust DIVIDER_RATIO in code)
- Testing procedure (trigger detection verification, voltage reading accuracy)

### 7.2. ESP32 Piezo Guide

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\ESP32-PIEZO-GUIDE.md`

Create ESP32 code explanation and troubleshooting guide including:
- Code structure overview (setup, loop, functions)
- Trigger detection algorithm explanation (voltage threshold, cooldown, max credible change)
- NTP sync fallback behavior (epoch + millis() when NTP fails)
- HTTP retry logic flowchart (auth pause, network retry, validation errors)
- Common issues and solutions:
  - WiFi disconnect → Auto-reconnect every 30 seconds
  - NTP fail → Fallback to millis() offset
  - Bad readings (>1.5V jump) → Discarded, logged
  - Auth failure (401) → 60-second pause, buffer up to 10 readings
  - Validation errors (400) → Log details, continue monitoring
- Serial monitor output interpretation (trigger detection, HTTP responses)
- WiFi configuration steps (update SSID/password, verify connection)
- API key retrieval from admin dashboard

### 7.3. API Piezo Endpoints

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\API-PIEZO-ENDPOINTS.md`

Create API documentation including:
- `POST /api/iot/piezo/readings` endpoint specification
  - Request headers (X-API-Key, Content-Type)
  - Request payload schema (voltage, current, power, capacitorVoltage, stepCount, frequency, timestamp, source)
  - Response examples (201 Created, 400 Bad Request, 401 Unauthorized)
- WebSocket event specifications:
  - `piezo:trigger` - Footstep detected
  - `piezo:milestone` - Step milestone reached (100, 500, 1000, 5000, 10000)
  - `capacitor:full` - Capacitor at 90% capacity
  - `piezo:stats` - Periodic statistics broadcast (every 30 seconds)
- Analytics endpoints:
  - `GET /api/analytics/piezo/statistics` - Query parameters, response schema
  - `GET /api/analytics/piezo/energy-per-step` - Time series data
- cURL examples for testing
- Postman collection (optional)

### 7.4. Architecture Overview Update

**File:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\ARCHITECTURE-OVERVIEW.md`

Add section:

```markdown
## Piezoelectric Integration

The system supports ESP32-based piezoelectric footstep energy harvesting sensors that POST readings to a dedicated `/api/iot/piezo/readings` endpoint. The backend detects footstep triggers by comparing capacitor voltage changes against a configurable threshold (default 30mV), increments a cumulative step counter, calculates energy harvested per step (E = 0.5 × C × V²), and broadcasts real-time WebSocket events for dashboard updates. Analytics include total steps, energy per step, trigger frequency, and capacitor fill rate. Frontend components display live step counts, capacitor gauge, footstep timeline, and energy-per-step charts. Configuration is managed via environment variables for thresholds, capacitance, and milestone triggers.

### Data Flow

1. ESP32 detects voltage increase (footstep) → POST to `/api/iot/piezo/readings`
2. Backend validates reading → stores in MongoDB → detects trigger
3. Trigger detected → emit `piezo:trigger` WebSocket event → frontend updates in real-time
4. Step milestones → emit `piezo:milestone` event → show notification
5. Analytics aggregates data → provides statistics via REST API
6. Cron job broadcasts `piezo:stats` every 30 seconds
```

---

## 8. Edge Cases and Error Handling

### 8.1. ESP32 Edge Cases

1. **WiFi disconnect during POST:** Retry up to 3 times with 2-second delay, buffer reading if all retries fail
2. **NTP sync fails:** Use epoch + millis()/1000 fallback, log warning
3. **Auth failure (401):** Pause sending for 60 seconds, continue monitoring and buffer up to 10 readings (discard oldest when full)
4. **Validation error (400):** Log error details, don't retry (bad data), continue monitoring
5. **Bad ADC readings (>1.5V jump):** Discard reading, increment bad reading counter, alert after 5 consecutive bad readings

### 8.2. Backend Edge Cases

1. **Capacitor voltage missing:** Validation error (required field in CreatePiezoReadingDto)
2. **Step count decreasing:** Detect reset, log warning, clear milestone cache, skip milestone checks
3. **Timestamp in future:** Validation error (reject reading)
4. **Negative energy calculation:** Clamp to 0 using `Math.max(0, ...)`
5. **No previous reading for trigger detection:** Skip trigger detection (first reading)
6. **Sensor not found:** 401 Unauthorized (generic message)
7. **Milestone cache memory leak:** Daily cron cleanup at midnight (ScheduleModule)

### 8.3. Frontend Edge Cases

1. **WebSocket disconnected:** Display "Disconnected" status, use last known good data
2. **Invalid sensor data:** Validate data, use cached fallback, log warning to console
3. **API request fails:** TanStack Query retry (2 retries configured), show error state if all retries fail
4. **No recent footsteps:** Show "No recent footsteps" placeholder
5. **Chart data empty:** Show "No data available" message

---

## 9. Backward Compatibility

### 9.1. Database Schema

**No breaking changes.** All piezo fields (`capacitorVoltage`, `stepCount`, `frequency`) already exist as optional fields in the `EnergyReading` schema. Non-piezo sensors can continue sending readings without these fields.

### 9.2. API Endpoints

**Fully backward compatible.** The existing `POST /api/iot/readings` endpoint remains unchanged. Piezo sensors use the new `/api/iot/piezo/readings` endpoint, which validates additional required fields. Both endpoints use the same authentication mechanism (X-API-Key).

### 9.3. WebSocket Events

**Additive only.** New events (`piezo:trigger`, `piezo:milestone`, `capacitor:full`, `piezo:stats`) are added without affecting existing events (`reading:new`, `alert:power`, `statistics:update`).

### 9.4. Frontend Components

**Non-breaking.** New piezo components are added to the dashboard grid but don't replace existing components. Users without piezo sensors will see placeholders or "no data" messages.

---

## 10. Testing Strategy

### 10.1. ESP32 Firmware Testing

1. **Manual testing:**
   - WiFi connection and auto-reconnect
   - NTP sync success and fallback
   - HTTP POST success and retry logic
   - Trigger detection with manual voltage injection
   - Serial monitor output verification
   - Buffer overflow handling (simulate 11+ readings during auth pause)

### 10.2. Backend Testing

1. **Unit tests:**
   - `validatePiezoData()` with valid/invalid inputs
   - `detectPiezoTrigger()` with mock previous readings
   - `checkStepMilestones()` with cache scenarios and reset detection
   - Energy calculation with negative voltage changes (clamping)
   - Step count reset detection

2. **Integration tests:**
   - POST `/api/iot/piezo/readings` with valid payload (201 Created)
   - POST with missing `capacitorVoltage` (400 Bad Request)
   - POST with invalid API key (401 Unauthorized)
   - WebSocket event emission (mock gateway)
   - Analytics endpoints with piezo data

3. **Manual testing:**
   - ESP32 → Backend → MongoDB flow
   - Real-time WebSocket events in browser console
   - Milestone notifications at 100, 500, 1000 steps
   - Capacitor full alert at 90%

### 10.3. Frontend Testing

1. **Component tests:**
   - PiezoSensorCard renders with mock WebSocket data
   - StepCounterWidget increments on trigger
   - CapacitorGauge displays correct percentage
   - FootstepTimeline shows last 10 events

2. **Integration tests:**
   - WebSocket connection and event handling
   - API service calls and TanStack Query caching
   - Chart rendering with Recharts

3. **Manual testing:**
   - Real-time updates in dashboard
   - Responsive layout (desktop, tablet, mobile)
   - Dark mode compatibility
   - Error states (disconnected, no data)

---

## 11. Implementation Order

1. **Phase 1 - Backend Foundation (Day 1-2)**
   - Add ScheduleModule to IotModule (HIGH #2)
   - Create `CreatePiezoReadingDto`
   - Add `receivePiezoReading()` endpoint in controller and service
   - Implement `validatePiezoData()`, `detectPiezoTrigger()`, `checkStepMilestones()`, `checkCapacitorFull()`
   - Add WebSocket event emission in IoT service
   - Add daily cache cleanup cron job
   - **Verification:** Test with Postman/cURL, verify DB storage

2. **Phase 2 - Analytics & Dashboard Gateway (Day 2-3)**
   - Import AnalyticsModule into DashboardModule (HIGH #3)
   - Inject AnalyticsService into DashboardService (HIGH #3)
   - Add `getPiezoStatistics()` and `getEnergyPerStepTimeSeries()` methods
   - Create analytics DTOs
   - Add analytics controller endpoints
   - Add `broadcastPiezoStats()` method to DashboardGateway
   - Add cron job to DashboardService
   - **Verification:** Test with Postman, verify calculations, check logs

3. **Phase 3 - ESP32 Firmware (Day 3-4)**
   - Add global variable declarations (MEDIUM #5)
   - Initialize variables in setup() (MEDIUM #5)
   - Add WiFi configuration and auto-reconnect
   - Implement NTP sync with fallback
   - Implement HTTP POST with JSON payload
   - Add retry logic with buffer overflow handling (MEDIUM #8)
   - Integrate with existing trigger detection
   - **Verification:** Compile, upload, test with Serial Monitor

4. **Phase 4 - Frontend Components (Day 4-5)**
   - Install `react-circular-progressbar` dependency
   - Create PiezoSensorCard, StepCounterWidget, CapacitorGauge
   - Create FootstepTimeline, EnergyPerStepChart
   - Add API service methods
   - Integrate into DashboardPage
   - **Verification:** Test in browser, verify real-time updates

5. **Phase 5 - Configuration & Documentation (Day 5-6)**
   - Add `.env` variables
   - Create PIEZOELECTRIC-SETUP.md
   - Create ESP32-PIEZO-GUIDE.md
   - Create API-PIEZO-ENDPOINTS.md
   - Update ARCHITECTURE-OVERVIEW.md
   - **Verification:** Review docs, verify all info is accurate

6. **Phase 6 - Integration Testing (Day 6-7)**
   - End-to-end test: ESP32 → Backend → Frontend
   - Test all edge cases
   - Test milestone notifications
   - Test capacitor full alert
   - Performance testing (multiple simultaneous triggers)
   - **Verification:** All tests pass, no errors in logs

---

## 12. Design Review Findings: Resolution Summary

### HIGH Severity Findings

1. **✅ HIGH #1: sensorsService.updateLastSeen() Missing**
   - **Resolution:** Method EXISTS in sensors.service.ts (verified). Using as designed.
   - **Evidence:** Found method at line 320 in sensors.service.ts.

2. **✅ HIGH #2: Missing Dependency — ScheduleModule Not Imported**
   - **Resolution:** Added explicit import instruction: `import { ScheduleModule } from '@nestjs/schedule'` and `ScheduleModule.forRoot()` to IotModule imports array.
   - **Section:** 2.3 (IoT Module: Add ScheduleModule)

3. **✅ HIGH #3: AnalyticsService Not Injected in DashboardService**
   - **Resolution:** Added AnalyticsModule import to DashboardModule, added AnalyticsService to DashboardService constructor, and provided complete implementation.
   - **Section:** 4.1, 4.2, 4.3 (Dashboard Module, Gateway, Service)

### MEDIUM Severity Findings

4. **✅ MEDIUM #4: Frontend TanStack Query Retry Logic**
   - **Resolution:** Verified QueryClient configuration exists in App.tsx with `retry: 2`. No changes needed.
   - **Section:** 5.1 (Frontend Dependencies)

5. **✅ MEDIUM #5: ESP32 Global Variables Initialization**
   - **Resolution:** Added explicit global variable declarations section and initialization code in setup().
   - **Section:** 1.2, 1.5 (Global Variables, Initialization)

6. **✅ MEDIUM #6: getPiezoStatistics() Query Parameters**
   - **Resolution:** Provided explicit signature with types: `async getPiezoStatistics(sensorId?: string, startDate?: string, endDate?: string): Promise<PiezoStatisticsDto>` and documented default behavior.
   - **Section:** 3 (Analytics Service)

7. **✅ MEDIUM #7: Power Validation Skip Logic**
   - **Resolution:** Chose dedicated piezo endpoint approach. Validation bypass is automatic because piezo endpoint uses CreatePiezoReadingDto. Documented that power = ΔE / Δt (not V×I).
   - **Section:** 1.6 (HTTP POST), 2.1 (DTO)

8. **✅ MEDIUM #8: ESP32 Buffer Overflow**
   - **Resolution:** Provided complete buffer insertion code with overflow handling: discard oldest reading (shift array) when buffer is full.
   - **Section:** 1.7 (HTTP Retry Logic)

9. **✅ MEDIUM #9: Step Milestone Cache Key Format**
   - **Resolution:** Used explicit conversion: `const cacheKey = \`piezo_steps_${sensorId.toString()}\`;`
   - **Section:** 2.4 (IoT Service: checkStepMilestones)

### NIT Severity Findings

All NIT findings addressed with clarifications and documentation improvements.

---

## 13. Assumptions

1. **Sensor ID Retrieval:** Frontend components assume sensor ID is available via context or props. If not, must fetch active piezo sensors list first.

2. **Single Piezo Sensor:** Design assumes one piezo sensor for MVP. If multiple sensors, components need sensor selection UI.

3. **Cumulative Step Counter:** ESP32 maintains cumulative step count across resets is best-effort. If ESP32 resets, count resets to 0 (backend detects and handles).

4. **Energy Calculation Accuracy:** Assumes ADC readings are reasonably accurate. Actual energy may vary due to ADC noise, voltage divider tolerance, and capacitor leakage.

5. **Network Availability:** ESP32 requires WiFi for data transmission. Offline buffering is limited to 10 readings.

6. **NTP Sync:** Assumes NTP server is reachable. Fallback timestamps are approximate (based on millis()).

7. **MongoDB Performance:** Assumes MongoDB can handle piezo trigger frequency (typically <1 trigger/second). For high-frequency sensors, consider batching.

8. **Frontend Display:** Assumes users want real-time updates. For performance-sensitive deployments, may need to throttle WebSocket updates.

---

**Document Path:** `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\.agents\tasks\design.md`

---

**End of Design Document**
