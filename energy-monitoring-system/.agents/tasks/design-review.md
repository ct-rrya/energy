# Design Review: ESP32 Piezoelectric Footstep Energy Harvesting Integration

**Document:** `design.md`  
**Review Date:** 2025-01-XX  
**Reviewer:** Design Review Subagent  
**Design Version:** 2.0 (Post-revision)

---

## Executive Summary

This design review examines the technical specification for integrating ESP32-based piezoelectric footstep energy harvesting into an existing NestJS + React + MongoDB energy monitoring system. The design was examined fresh without implementation context, and key claims were verified against the actual codebase.

**Verdict:** **CHANGES_REQUESTED**

**Critical Issues:** 3 HIGH severity findings  
**Moderate Issues:** 6 MEDIUM severity findings  
**Minor Issues:** 4 NIT findings

The design contains several critical gaps that must be resolved before implementation, including missing method implementations, ambiguous specifications, and unverified dependencies.

---

## HIGH Severity Findings

### HIGH #1: Unverified Method — `sensorsService.updateLastSeen()`

**Location:** Section 2.3 (IoT Service), lines calling `this.sensorsService.updateLastSeen(sensor._id.toString())`

**Problem:** The design claims to call `sensorsService.updateLastSeen()` method in multiple places (piezo reading handler, step 7). **Verification Result:** This method does NOT exist in the actual `sensors.service.ts` file. Grep search for "updateLastSeen" and "lastSeen" in `src/sensors/sensors.service.ts` returned zero matches.

**Impact:** Implementation will fail with "method does not exist" error. The existing `iot.service.ts` at line 139 also calls this method, suggesting it's been removed or never implemented.

**Fix Required:**

**Option A (Recommended):** Implement `updateLastSeen()` in `SensorsService`:

```typescript
// Add to src/sensors/sensors.service.ts
async updateLastSeen(sensorId: string): Promise<void> {
  await this.sensorModel.findByIdAndUpdate(
    sensorId,
    { lastSeenAt: new Date() },
    { new: true }
  ).exec();
}
```

**Option B:** Remove all calls to `updateLastSeen()` and document that lastSeen tracking is not implemented.

**Design must specify which option to implement.**

---

### HIGH #2: Missing Dependency — ScheduleModule Not Imported

**Location:** Section 2.3 (IoT Service), line "Add `@Cron` import from `@nestjs/schedule` and ensure `ScheduleModule` is imported in `IotModule`"

**Problem:** The design requires `@Cron` decorator for daily cache cleanup job (`cleanupStepCache()`). **Verification Result:** Grep search for "ScheduleModule" in `src/iot/iot.module.ts` returned zero matches. The module is NOT currently imported.

**Evidence:** Other parts of the codebase (notifications.service.ts, session.manager.ts) successfully use `@Cron`, confirming `@nestjs/schedule` is installed globally, but it must be imported into each module that uses it.

**Impact:** Cron job will not execute. TypeScript compilation may succeed but runtime will fail silently.

**Fix Required:** Add explicit import instruction to the design:

```typescript
// In src/iot/iot.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // ... existing imports
    ScheduleModule.forRoot(), // Add this line
  ],
  // ... rest of module
})
export class IotModule {}
```

---

### HIGH #3: Ambiguous — AnalyticsService Not Injected in DashboardService

**Location:** Section 4 (Dashboard Gateway), note "Ensure `AnalyticsService` is injected into `DashboardService`"

**Problem:** The design adds a cron job in `DashboardService` that calls `this.analyticsService.getPiezoStatistics()`. **Verification Result:** Grep search for "AnalyticsService" in `src/dashboard/dashboard.service.ts` returned zero matches. The dependency is NOT currently injected.

**Impact:** `broadcastPiezoStatistics()` method will fail with "this.analyticsService is undefined" error.

**Fix Required:** Provide explicit constructor injection code in the design:

```typescript
// In src/dashboard/dashboard.service.ts
import { AnalyticsService } from '../analytics/analytics.service';

constructor(
  private dashboardGateway: DashboardGateway,
  private energyService: EnergyService,
  private configService: ConfigService,
  @InjectModel(Sensor.name) private sensorModel: Model<SensorDocument>,
  private analyticsService: AnalyticsService, // ADD THIS LINE
) {
  // ...
}
```

**Additionally:** Verify that `DashboardModule` imports `AnalyticsModule` or that the dependency is properly provided.

---

## MEDIUM Severity Findings

### MEDIUM #4: Unspecified Behavior — Frontend TanStack Query Retry Logic

**Location:** Section 5.6 (Frontend API Service), comment "Let TanStack Query handle retry (already configured in app with 3 retries default)"

**Problem:** The design assumes TanStack Query is configured with retry logic. **Verification Result:** Grep search for "QueryClient.*retry" and "new QueryClient" in frontend code returned zero matches. No QueryClient configuration file was found.

**Risk:** If retry is not configured, API failures will not retry, contradicting the design's error handling strategy.

**Fix Required:** Provide QueryClient configuration or verify existing setup:

```typescript
// Verify this exists or add to frontend/src/main.tsx or App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

---

### MEDIUM #5: Missing Specification — ESP32 Global Variables Initialization

**Location:** Section 1.4 (HTTP POST to Backend), global variables `previousCapVoltage`, `previousTriggerTime`, `cumulativeStepCount`

**Problem:** The design introduces three new global variables but does not specify where to declare them or how to initialize them in `setup()`.

**Risk:** Variables declared inside functions will lose state between calls. Uninitialized variables will cause incorrect power/energy calculations on first reading.

**Fix Required:**

```cpp
// Add to global variables section (after existing globals)
float previousCapVoltage = 0.0;
unsigned long previousTriggerTime = 0;
unsigned long cumulativeStepCount = 0;

// In setup(), after initial voltage reading:
previousCapVoltage = initialCapVoltage;
previousTriggerTime = millis();
cumulativeStepCount = 0;
```

---

### MEDIUM #6: Ambiguous Signature — `getPiezoStatistics()` Query Parameters

**Location:** Section 3 (Analytics Service), method signature `getPiezoStatistics(sensorId?, startDate?, endDate?)`

**Problem:** The parameters are optional but the design doesn't specify:
1. Default behavior when parameters are omitted (all sensors? all time?)
2. Whether `sensorId` is a string or ObjectId
3. Whether `startDate`/`endDate` are ISO strings or Date objects

**Risk:** Frontend and backend may have mismatched assumptions about parameter types and defaults.

**Fix Required:** Provide explicit signature:

```typescript
async getPiezoStatistics(
  sensorId?: string,        // Optional: filter by sensor. Omit = all sensors
  startDate?: string,       // Optional: ISO 8601 string. Omit = no start filter
  endDate?: string,         // Optional: ISO 8601 string. Omit = no end filter
): Promise<PiezoStatisticsDto>
```

And document default behavior: "If all parameters omitted, returns statistics for all piezo sensors across all time."

---

### MEDIUM #7: Unspecified — Power Validation Skip Logic

**Location:** Section 1.4 (HTTP POST), note "Backend MUST skip P=V×I validation for piezo sensors"

**Problem:** The design states backend must skip power validation for piezo, but doesn't specify HOW to detect piezo readings. The note suggests checking `source === 'hardware'` OR using dedicated piezo endpoint, but these are two different approaches.

**Verification Result:** Current `validateReadingData()` in `iot.service.ts` contains commented-out power validation code. It's unclear if this will be enabled or how to skip it for piezo.

**Risk:** If power validation is enabled globally, piezo readings (with current=0) will fail validation even though the design explicitly sends current=0.

**Fix Required:** Choose ONE approach and specify exactly where to implement it:

**Option A:** Skip validation in dedicated piezo endpoint (no changes to shared validation)

**Option B:** Modify `validateReadingData()` to accept reading type parameter:

```typescript
private validateReadingData(readingDto: CreateReadingDto, isPiezo: boolean = false): void {
  // ... existing timestamp validation

  // Power validation (skip for piezo sensors)
  if (!isPiezo) {
    const calculatedPower = readingDto.voltage * readingDto.current;
    const powerDifference = Math.abs(calculatedPower - readingDto.power);
    if (powerDifference > 1.0) {
      throw new BadRequestException('Power calculation inconsistent with V×I');
    }
  }
}
```

**Design must pick one approach and document it.**

---

### MEDIUM #8: Missing Error Handling — ESP32 Buffer Overflow

**Location:** Section 1.5 (HTTP Retry Logic), `BufferedReading readingBuffer[10]`

**Problem:** The design declares a buffer for 10 readings but doesn't specify what happens when buffer is full (11th reading arrives). The comment "Buffer current reading" has no implementation.

**Risk:** Buffer overflow could cause memory corruption or silent data loss.

**Fix Required:**

```cpp
// In handleHttpResponse, auth failure section:
if (bufferCount < 10) {
  readingBuffer[bufferCount].capVoltage = capVoltage;
  readingBuffer[bufferCount].adcVoltage = adcVoltage;
  readingBuffer[bufferCount].timestamp = millis();
  bufferCount++;
} else {
  Serial.println("⚠ Buffer full. Discarding oldest reading.");
  // Option 1: Discard oldest (shift array)
  // Option 2: Discard new reading (do nothing)
  // Design must specify
}
```

---

### MEDIUM #9: Ambiguous — Step Milestone Cache Key Format

**Location:** Section 2.3 (IoT Service), `checkStepMilestones()`, line `const cacheKey = 'piezo_steps_${sensorId}';`

**Problem:** The cache key uses template literal syntax but `sensorId` is an ObjectId (MongoDB type). The design doesn't specify whether to convert to string or use `.toString()`.

**Risk:** JavaScript will convert ObjectId to "[object Object]", causing all sensors to share the same cache entry.

**Fix Required:**

```typescript
const cacheKey = `piezo_steps_${sensorId.toString()}`;
```

Or if `sensorId` is already a string parameter, document that in the method signature.

---

## NIT Severity Findings

### NIT #1: Inconsistent Terminology — "Trigger" vs "Footstep"

**Location:** Throughout design (WebSocket event names, method names, comments)

**Issue:** The design uses "trigger" (technical term) and "footstep" (user-facing term) interchangeably. Event is named `piezo:trigger` but the method is about detecting footsteps.

**Recommendation:** Standardize terminology:
- **Internal/Technical:** "trigger" (code, methods, logs)
- **User-Facing:** "footstep" (UI labels, documentation, error messages)
- **WebSocket Event:** Keep `piezo:trigger` (technical) but add `message: "Footstep detected"` (user-facing)

---

### NIT #2: Potential Performance Issue — Milestone Check Every Reading

**Location:** Section 2.3, `checkStepMilestones()` called in `receivePiezoReading()` flow

**Issue:** Milestone checking happens synchronously for every reading. If sensor sends readings at high frequency (>1 Hz), this could add latency.

**Observation:** Milestone logic is simple (Map lookup + comparison), likely negligible overhead. But design should acknowledge this was considered.

**Recommendation:** Add note: "Performance: Milestone check is O(1) Map lookup. If >10 readings/sec become common, consider batching or async queue."

---

### NIT #3: Magic Number — Capacitor 90% Threshold

**Location:** Section 2.3, `checkCapacitorFull()`, line `const threshold = maxVoltage * 0.9;`

**Issue:** Hardcoded 90% threshold. Could be made configurable like other thresholds.

**Recommendation:** Add to `.env`:
```bash
PIEZO_CAPACITOR_FULL_THRESHOLD=0.9  # 90% of max voltage
```

Or document why 90% is a fixed hardware constraint (not configurable).

---

### NIT #4: Incomplete Documentation — WebSocket Event Payload Schema

**Location:** Section 4 (Dashboard Gateway), event payloads listed but not fully specified

**Issue:** Design shows example payloads in TypeScript interfaces but doesn't document all fields. For example, `piezo:trigger` event has `sensorLocation` but doesn't specify if this is string or nested object.

**Recommendation:** Add complete TypeScript interface definitions:

```typescript
interface PiezoTriggerEvent {
  sensorId: string;           // MongoDB ObjectId as string
  sensorName: string;         // Display name
  sensorLocation: string;     // Location description (not coordinates)
  capacitorVoltage: number;   // Volts (2 decimals)
  deltaVoltage: number;       // Volts (3 decimals)
  energy: number;             // Joules (6 decimals)
  stepCount: number;          // Integer
  timestamp: Date;            // ISO 8601 string when serialized
}
```

---

## Verified Assumptions

The following claims in the design were verified against the actual codebase and are **CORRECT**:

1. ✅ **`dashboardService.getGateway()` exists** — Found in `src/dashboard/dashboard.service.ts:202`
2. ✅ **`CreateReadingDto` has optional `capacitorVoltage` and `stepCount` fields** — Verified in `src/iot/dto/create-reading.dto.ts`
3. ✅ **`EnergyReading` schema has all required fields** — Verified in `src/iot/schemas/energy-reading.schema.ts` (stepCount, capacitorVoltage, frequency all exist as optional fields)
4. ✅ **`@Cron` decorator is available** — Confirmed by usage in `src/notifications/notifications.service.ts` and `src/chat/session.manager.ts`
5. ✅ **SocketContext exists** — Found at `frontend/src/contexts/SocketContext.tsx`
6. ✅ **Recharts is installed** — Verified in `frontend/package.json` (v3.9.2)
7. ✅ **Backward compatibility claim** — Piezo fields are optional in schema, no breaking changes to existing endpoints

---

## Unverified / Wrong Assumptions

1. ❌ **`sensorsService.updateLastSeen()` exists** — Does NOT exist (HIGH #1)
2. ❌ **`ScheduleModule` imported in IotModule** — NOT imported (HIGH #2)
3. ❌ **`AnalyticsService` injected in DashboardService** — NOT injected (HIGH #3)
4. ⚠️ **TanStack Query retry configured** — Could not verify configuration (MEDIUM #4)
5. ⚠️ **Power validation is commented out** — Currently commented, unclear if it will be enabled (MEDIUM #7)

---

## Additional Observations

### Positive Aspects

1. **Comprehensive scope** — Design covers firmware, backend, frontend, docs, and config
2. **Edge cases documented** — Section 8 lists edge cases (WiFi disconnect, NTP fail, etc.)
3. **Testing strategy included** — Section 10 provides test scenarios
4. **Implementation order** — Section 11 provides phased approach
5. **Backward compatibility** — Careful consideration of non-breaking changes

### Areas of Concern

1. **Missing method implementations** — Several assumed methods don't exist
2. **Dependency injection gaps** — Required services not injected
3. **Ambiguous specifications** — Multiple "use X or Y" cases without resolution
4. **Incomplete signatures** — Optional parameters without default behavior specified
5. **Frontend configuration** — QueryClient setup not verified

---

## Recommendations for Design Revision

1. **Resolve all HIGH findings** before implementation begins
2. **Add explicit dependency injection** code snippets for all service dependencies
3. **Remove all "use X or Y"** ambiguities by making firm design decisions
4. **Provide complete method signatures** with parameter types and default behaviors
5. **Add initialization code** for ESP32 global variables
6. **Specify error handling** for buffer overflow and edge cases
7. **Verify frontend configuration** or provide setup code

---

## Conclusion

The design is **comprehensive in scope but incomplete in specification**. The major issues are:

1. **Missing implementations** that the design assumes exist (updateLastSeen, ScheduleModule import, AnalyticsService injection)
2. **Ambiguous specifications** that could lead to mismatched implementations between firmware and backend
3. **Unverified dependencies** particularly in frontend configuration

These issues are **fixable** but must be addressed before implementation. The design shows good architectural thinking (backward compatibility, edge cases, testing), but needs **concrete, unambiguous specifications** for every component.

**Recommendation:** Address the 3 HIGH and 6 MEDIUM findings, then proceed to implementation.

---

**Review Completed:** 2025-01-XX  
**Next Step:** Design author should resolve findings and update design.md  
**Re-review Required:** Yes, after HIGH findings are resolved
