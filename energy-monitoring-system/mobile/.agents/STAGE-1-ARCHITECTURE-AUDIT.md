# Stage 1: Backend Architecture Audit Report
**EcoStep Mobile - Phase 3 Implementation**

**Generated:** 2026-10-12  
**Project:** Energy Monitoring System (EcoStep)  
**Mobile App:** React Native (Expo SDK 57)  
**Backend:** NestJS  

---

## Executive Summary

This audit documents the complete backend architecture for Phase 3 implementation. The system uses:
- **REST API** for data queries (MongoDB primary database)
- **Socket.IO WebSocket** for real-time dashboard events (`/dashboard` namespace)
- **Firebase Firestore** for latest-reading cache (`liveReadings/latest` document)

**Key Finding:** Backend has comprehensive REST APIs, active Socket.IO gateway, and Firebase service. Mobile app should prioritize REST + Firebase Firestore listener for live data (simpler than Socket.IO on mobile).

---

## 1. Energy Data Endpoints (Primary API)

### Base Path: `/api/energy`
**Authentication:** JWT required (except `/recent` - public)

| Endpoint | Method | Auth | Description | Response Fields |
|----------|--------|------|-------------|----------------|
| `/today` | GET | ✓ | Today's total energy | `energymWh`, `startTime`, `endTime` |
| `/range` | GET | ✓ | Energy in date range | Query: `startDate`, `endDate` |
| `/recent` | GET | ✗ | Recent readings (public) | Query: `limit` (default: 10) |
| `/readings` | GET | ✓ | Readings in range | Query: `startDate`, `endDate`, `limit` |
| `/by-sensors` | GET | ✓ | Today's energy by sensor | Array of sensor aggregates |
| `/statistics` | GET | ✓ | System statistics | Total sensors, active count, etc. |
| `/sensor/:id/today` | GET | ✓ | Sensor today energy | Sensor-specific total |
| `/sensor/:id/range` | GET | ✓ | Sensor date range | Query: `startDate`, `endDate` |
| `/sensor/:id/recent` | GET | ✓ | Sensor recent readings | Query: `limit` |

**Reading Fields (EnergyReadingResponseDto):**
```typescript
{
  id: string;
  sensorId: string;
  voltage: number;        // V
  current: number;        // A
  power: number;          // W
  energy: number;         // Wh
  timestamp: Date;        // ESP32 time
  receivedAt: Date;       // Server time
  stepCount?: number;     // Optional
  capacitorVoltage?: number; // Optional
  frequency?: number;     // Optional (Hz)
}
```

---

## 2. Dashboard Endpoints

### Base Path: `/api/dashboard`
**Authentication:** Public (no JWT required)

| Endpoint | Method | Description | Use Case |
|----------|--------|-------------|----------|
| `/metrics` | GET | Dashboard summary with AI insights | Main dashboard screen |
| `/alerts` | GET | Dashboard alerts (placeholder) | Alert notifications |

**Metrics Response:**
- Current power
- Today's energy
- Active sensors count
- System health
- AI-generated insights (via Gemini)

---

## 3. Analytics Endpoints

### Base Path: `/api/analytics`
**Authentication:** Public (no JWT required)

| Endpoint | Method | Description | Query Parameters |
|----------|--------|-------------|------------------|
| `/dashboard` | GET | Dashboard analytics summary | None |
| `/comprehensive` | GET | All analytics in one response | None |
| `/daily` | GET | Daily energy summary | `date` (YYYY-MM-DD, optional) |
| `/weekly` | GET | Weekly summary (Mon-Sun) | `weekStart` (YYYY-MM-DD, optional) |
| `/monthly` | GET | Monthly summary | `year`, `month` (optional) |
| `/peak` | GET | Peak power reading | `startDate`, `endDate` (optional) |
| `/environmental` | GET | CO2 avoided, trees equivalent | `energymWh` (required) |
| `/cost-savings` | GET | Cost savings projections | `energymWh`, `periodDays`, `electricityRate` |
| `/time-series` | GET | Chart data with granularity | See AnalyticsQueryDto |
| `/battery-history` | GET | Battery % over time | AnalyticsQueryDto |
| `/voltage-history` | GET | Voltage over time | AnalyticsQueryDto |
| `/steps-history` | GET | Step count over time | AnalyticsQueryDto |
| `/historical-analysis` | POST | AI-powered analysis | `period` (7/30/90 days), optional dates |

**AnalyticsQueryDto:**
```typescript
{
  metric: 'power' | 'voltage' | 'current' | 'battery' | 'energy';
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
  source?: 'all' | 'sensor' | 'system';
  sensorId?: string;  // If source = 'sensor'
}
```

**Response Types:**
- `DailyEnergySummaryDto`: totalEnergymWh, peakPowerW, avgPowerW, readingsCount, date
- `WeeklyEnergySummaryDto`: totalEnergymWh, dailyBreakdown[], weekStart, weekEnd
- `MonthlyEnergySummaryDto`: totalEnergymWh, dailyAvg, peakDay, year, month
- `TimeSeriesDto`: dataPoints[], summary, period, granularity
- `HistoricalAnalysisResponseDto`: insights (AI text), metrics, generatedAt

---

## 4. Alerts Management

### Base Path: `/api/alerts`
**Authentication:** JWT required (all endpoints)

| Endpoint | Method | Description | Body/Params |
|----------|--------|-------------|-------------|
| `/` | GET | Query alerts with filters | AlertQueryDto |
| `/stats` | GET | Alert statistics | None |
| `/:id` | GET | Get alert by ID | Param: `id` |
| `/:id/acknowledge` | POST | Acknowledge alert | Param: `id` |
| `/:id/resolve` | POST | Resolve alert | Param: `id` |

**Alert Types:**
- `battery_low`, `battery_critical`
- `sensor_offline`, `sensor_online`
- `voltage_threshold`, `current_threshold`
- `energy_milestone`
- `system_error`, `database_connection`, `device_communication`

**Alert Severities:** `info`, `warning`, `critical`  
**Alert Statuses:** `active`, `acknowledged`, `resolved`

**AlertQueryDto:**
```typescript
{
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: AlertType;
  sensorId?: string;
  startDate?: string;  // ISO 8601
  endDate?: string;
  search?: string;     // Title/description
  page?: number;       // Default: 1
  limit?: number;      // Default: 20, max: 100
  sortBy?: string;     // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc';  // Default: 'desc'
}
```

---

## 5. Sensors Management

### Base Path: `/api/sensors`
**Authentication:** JWT required (admin only)

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/` | GET | List all active sensors | SensorResponseDto[] |
| `/:id` | GET | Get sensor details | SensorResponseDto |
| `/` | POST | Create sensor + API key | SensorWithApiKeyResponseDto |
| `/:id` | PATCH | Update sensor | SensorResponseDto |
| `/:id` | DELETE | Soft delete sensor | SensorResponseDto |
| `/:id/regenerate-key` | POST | Regenerate API key | SensorWithApiKeyResponseDto |

**SensorResponseDto:**
```typescript
{
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  installationDate?: Date;
  lastSeenAt?: Date;
  metadata?: {
    hardwareVersion?: string;
    firmwareVersion?: string;
    notes?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  // apiKey excluded for security
}
```

---

## 6. Real-Time Architecture

### Option A: Firebase Firestore (RECOMMENDED for Mobile)

**Backend Service:** `src/firebase/firebase.service.ts`

**Firebase Admin Setup:**
- Service account authentication (backend only)
- Writes to Firestore: `liveReadings/latest` document
- Called after every sensor reading stored in MongoDB

**Firestore Document Structure:**
```javascript
// Path: liveReadings/latest
{
  voltage: 5.2,             // V
  current: 0.15,            // A
  power: 0.78,              // W
  energy: 0.2778,           // Wh
  stepCount: 22,
  frequency: 1.5,           // Hz
  capacitorVoltage: 110,    // V
  batteryPercentage: 100,   // %
  timestamp: "2025-01-16T10:30:00.000Z",  // ISO 8601
  sensorId: "6a5a35...",
  sensorName: "ESP32 Step Counter",
  updatedAt: Firestore.Timestamp  // Server timestamp
}
```

**Frontend Firebase Client:** `frontend/src/lib/firebase.ts`
- Uses Firebase Client SDK (v9+)
- Read-only access to `liveReadings/latest`
- Real-time listener via `onSnapshot()`

**Mobile Integration:**
1. Install: `expo install @react-native-firebase/app @react-native-firebase/firestore`
2. Use Firebase config from `.env` (same as web)
3. Subscribe: `firestore().collection('liveReadings').doc('latest').onSnapshot()`

**Advantages for Mobile:**
- Automatic reconnection
- Offline support
- No manual WebSocket connection management
- Battle-tested on React Native
- Same code pattern as web frontend

---

### Option B: Socket.IO WebSocket

**Backend Gateway:** `src/dashboard/dashboard.gateway.ts`

**Namespace:** `/dashboard`  
**Authentication:** JWT token in handshake auth or authorization header

**Connection Flow:**
1. Client connects: `io('http://localhost:3000/dashboard', { auth: { token: jwt } })`
2. Server validates JWT
3. Client joins `dashboard` room
4. Server emits `connection:authenticated` event
5. Client receives real-time broadcasts

**Socket.IO Events (Server → Client):**

| Event | Description | Payload |
|-------|-------------|---------|
| `connection:authenticated` | Auth success | `{ userId, email, role, connectedAt }` |
| `reading:new` | New energy reading | `NewReadingEventDto` |
| `sensor:update` | Sensor status changed | `SensorUpdateEventDto` |
| `sensor:online` | Sensor came online | `{ sensorId, sensorName, sensorLocation, timestamp }` |
| `sensor:offline` | Sensor went offline | `{ sensorId, sensorName, sensorLocation, lastSeenAt, timestamp }` |
| `statistics:update` | System stats updated | `StatisticsUpdateEventDto` |
| `alert:power` | Power threshold exceeded | `PowerAlertEventDto` |
| `alert:created` | New alert created | Alert object |
| `alert:acknowledged` | Alert acknowledged | Alert object |
| `alert:resolved` | Alert resolved | Alert object |
| `error` | Authentication failed | `{ message, code }` |

**Client → Server Events:**

| Event | Description | Response |
|-------|-------------|----------|
| `statistics:request` | Request current stats | `{ acknowledged: true }` |

**Mobile Integration:**
1. Install: `npm install socket.io-client`
2. Connect with JWT from expo-secure-store
3. Handle reconnection logic manually
4. Manage connection lifecycle (connect/disconnect on screen focus)

**Challenges for Mobile:**
- Manual reconnection on app background/foreground
- Battery drain from persistent WebSocket
- No built-in offline support
- React Native compatibility concerns

---

## 7. Notification Infrastructure

**Backend Service:** `src/notifications/notifications.service.ts`

**Event-Driven Notifications:**
- `sendEnergyMilestone()` - Energy milestone reached
- `sendBatteryAlert()` - Battery low/critical
- `sendSensorOnline()` - Sensor came online
- `sendSensorOffline()` - Sensor went offline
- `sendSystemAlert()` - System errors
- `sendDailySummary()` - Daily digest
- `sendWeeklySummary()` - Weekly digest

**Broadcast Methods:**
- `broadcastMessage()` - Send to all subscribers
- `getNotificationLogs()` - Query notification history
- `getNotificationStats()` - Notification statistics

**Integration Points:**
- Alerts service triggers notifications
- Socket.IO gateway broadcasts to connected clients
- Notification logs stored in database

---

## 8. Frontend Patterns (Web)

### Frontend Services (Reusable Patterns)

**Energy Service:** `frontend/src/api/services/energy.service.ts`
```typescript
// Pattern: GET /api/energy/recent?limit=10
const getRecentReadings = async (limit = 10) => {
  const response = await axios.get('/api/energy/recent', {
    params: { limit }
  });
  return response.data;
};

// Pattern: GET latest reading
const getLatestReading = async () => {
  const readings = await getRecentReadings(1);
  return readings[0] || null;
};
```

**Dashboard Service:** `frontend/src/api/services/dashboard.service.ts`
```typescript
// Pattern: GET /api/dashboard/metrics
const getMetrics = async () => {
  const response = await axios.get('/api/dashboard/metrics');
  return response.data;
};

// Pattern: GET /api/dashboard/alerts
const getAlerts = async () => {
  const response = await axios.get('/api/dashboard/alerts');
  return response.data;
};
```

**Firebase Client:** `frontend/src/lib/firebase.ts`
- Initializes Firebase Client SDK
- Exports `db` (Firestore instance)
- Uses environment variables from `.env`

**Reusable Patterns for Mobile:**
1. Create `mobile/src/api/services/` directory
2. Reuse axios client from `mobile/src/api/client.ts` (Phase 2 complete)
3. Add energy, dashboard, analytics, alerts services
4. Use same request/response DTOs

---

## 9. Mobile Dependencies (Already Installed)

**Current packages (from `mobile/package.json`):**
```json
{
  "expo": "~57.0.0",
  "axios": "^1.20.0",
  "expo-secure-store": "~57.0.4",  // JWT storage (Phase 2)
  "expo-router": "~57.0.26",        // Navigation (Phase 1)
  "react-native": "0.86.3"
}
```

**Required for Phase 3:**
- `@react-native-firebase/app` - Firebase core
- `@react-native-firebase/firestore` - Firestore real-time
- `@tanstack/react-query` - Data fetching (optional but recommended)
- `react-native-chart-kit` or `victory-native` - Charts
- `date-fns` - Date formatting

**Optional:**
- `socket.io-client` - If choosing Socket.IO over Firebase
- `expo-notifications` - Push notifications (Stage 6)

---

## 10. Data Flow Summary

### New Energy Reading Flow:
1. **ESP32** → POST `/api/iot/data` (with API key)
2. **NestJS Backend:**
   - Validates sensor API key
   - Stores reading in **MongoDB** (permanent)
   - Pushes to **Firebase Firestore** `liveReadings/latest` (cache)
   - Broadcasts via **Socket.IO** `reading:new` event
3. **Web Frontend:**
   - Listens to Firebase `onSnapshot()` OR Socket.IO event
   - Updates dashboard UI in real-time
4. **Mobile App (Planned):**
   - Listens to Firebase Firestore (recommended)
   - OR connects to Socket.IO (alternative)
   - Updates live dashboard screen

### Historical Data Flow:
1. **Mobile App** → GET `/api/energy/range?startDate=X&endDate=Y`
2. **Backend** → Query MongoDB aggregation
3. **Response** → Array of readings with totals
4. **Mobile App** → Render charts

### Analytics Flow:
1. **Mobile App** → GET `/api/analytics/comprehensive`
2. **Backend:**
   - Aggregates MongoDB data
   - Calculates metrics
   - Generates AI insights (Gemini)
3. **Response** → Complete analytics package
4. **Mobile App** → Display cards, charts, trends

---

## 11. Authentication & Authorization

**Token Type:** JWT (JSON Web Token)  
**Storage:** expo-secure-store (hardware-backed) - **Phase 2 Complete**  
**Headers:** `Authorization: Bearer <token>`

**Protected Endpoints:**
- `/api/energy/*` (except `/recent`)
- `/api/alerts/*`
- `/api/sensors/*` (admin only)

**Public Endpoints:**
- `/api/dashboard/*`
- `/api/analytics/*`
- `/api/energy/recent`

**Role-Based Access:**
- `SUPER_ADMIN` - Full system access
- `SYSTEM_ADMIN` - Monitoring and alerts
- `PUBLIC_USER` - Dashboard view only

**Mobile Implementation (Phase 2 Complete):**
- `mobile/src/api/client.ts` - Axios with JWT interceptors
- `mobile/src/contexts/AuthContext.tsx` - Global auth state
- `mobile/src/utils/secureStorage.ts` - Secure token management

---

## 12. API Response Conventions

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format",
    "details": [ ... ]
  },
  "statusCode": 400
}
```

**Pagination Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 13. Recommendations for Phase 3

### Stage 2: Mobile API Integration
1. **Priority 1:** Energy endpoints (`/today`, `/recent`, `/readings`)
2. **Priority 2:** Dashboard metrics (`/dashboard/metrics`)
3. **Priority 3:** Analytics summary (`/analytics/comprehensive`)
4. Create service layer: `mobile/src/api/services/`
5. Reuse existing axios client with JWT

### Stage 3: Live Energy Dashboard
1. Create dashboard screens using energy services
2. Display real-time metrics (power, energy, voltage, current)
3. Show sensor status and system health
4. Implement pull-to-refresh

### Stage 4: Real-Time Updates
**Recommended:** Firebase Firestore
- Simpler mobile integration
- Better offline support
- Proven React Native compatibility
- Reuses web frontend pattern

**Alternative:** Socket.IO (if Firebase unavailable)
- More complex connection management
- Manual reconnection logic
- Battery optimization needed

### Stage 5: Analytics and Historical Data
1. Implement chart components (react-native-chart-kit)
2. Fetch time-series data (`/analytics/time-series`)
3. Display daily/weekly/monthly summaries
4. Show environmental impact and cost savings

### Stage 6: Alerts and Notifications
1. Fetch alerts (`/api/alerts`)
2. Display alert list with filtering
3. Implement acknowledge/resolve actions
4. Badge notifications for unread alerts

### Stage 7: Role-Based Feature Access
1. Hide admin-only features (sensor management, alert resolution)
2. Show appropriate navigation based on role
3. Graceful degradation for public users

### Stage 8: Testing and Verification
1. Test all endpoints with mobile client
2. Verify real-time data updates
3. Test offline behavior
4. Validate JWT expiration handling

---

## 14. Backend Source Files Reference

### Controllers (REST API):
- `src/energy/energy.controller.ts` - Energy data endpoints
- `src/dashboard/dashboard.controller.ts` - Dashboard endpoints
- `src/analytics/analytics.controller.ts` - Analytics endpoints
- `src/alerts/alerts.controller.ts` - Alerts management
- `src/sensors/sensors.controller.ts` - Sensor management

### Real-Time:
- `src/dashboard/dashboard.gateway.ts` - Socket.IO gateway
- `src/firebase/firebase.service.ts` - Firebase Firestore sync

### Services:
- `src/notifications/notifications.service.ts` - Notification system

### DTOs (Data Transfer Objects):
- `src/energy/dto/` - Energy DTOs
- `src/dashboard/dto/` - Dashboard DTOs
- `src/analytics/dto/` - Analytics DTOs
- `src/alerts/dto/` - Alert DTOs
- `src/sensors/dto/` - Sensor DTOs

### Schemas (Database):
- `src/alerts/schemas/alert.schema.ts` - Alert model

### Frontend (Web - Reference):
- `frontend/src/api/services/energy.service.ts`
- `frontend/src/api/services/dashboard.service.ts`
- `frontend/src/lib/firebase.ts`

---

## 15. Next Steps

✅ **Stage 1 Complete:** Backend architecture documented

**Stage 2:** Mobile API Integration
- Create mobile API service layer
- Implement data fetching with React Query (optional)
- Test all endpoints from mobile app

**Stage 3:** Live Energy Dashboard
- Build dashboard UI components
- Display real-time energy metrics
- Implement data refresh

**Stage 4:** Real-Time Updates
- Choose Firebase vs Socket.IO
- Install dependencies
- Implement live data listener

**Stage 5:** Analytics and Historical Data
- Install charting library
- Build analytics screens
- Fetch and display time-series data

**Stage 6:** Alerts and Notifications
- Build alerts list screen
- Implement filtering and sorting
- Add acknowledge/resolve actions

**Stage 7:** Role-Based Feature Access
- Implement feature guards
- Conditional UI rendering
- Navigation restrictions

**Stage 8:** Testing and Verification
- Manual testing checklist
- API integration tests
- Real-time functionality verification

**Stage 9:** Final Report
- Implementation summary
- Testing results
- Deployment checklist

---

## Appendix A: Environment Variables

**Backend (.env):**
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=ecostep-xxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@ecostep-xxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://ecostep-xxxx.firebaseio.com

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001
```

**Frontend Web (.env):**
```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=ecostep-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ecostep-xxxx
VITE_FIREBASE_STORAGE_BUCKET=ecostep-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

**Mobile App (.env):**
```bash
API_BASE_URL=http://10.0.2.2:3000  # Android emulator
# API_BASE_URL=http://localhost:3000  # iOS simulator
# API_BASE_URL=https://api.ecostep.com  # Production

# Firebase (same as web frontend)
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=ecostep-xxxx.firebaseapp.com
FIREBASE_PROJECT_ID=ecostep-xxxx
FIREBASE_STORAGE_BUCKET=ecostep-xxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Appendix B: TypeScript Interfaces (Mobile)

**Mobile Type Definitions (to be created):**

```typescript
// mobile/src/types/energy.ts
export interface EnergyReading {
  id: string;
  sensorId: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  timestamp: Date;
  receivedAt: Date;
  stepCount?: number;
  capacitorVoltage?: number;
  frequency?: number;
}

export interface DashboardMetrics {
  currentPower: number;
  todayEnergy: number;
  activeSensors: number;
  systemHealth: 'good' | 'warning' | 'critical';
  insights?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  sensorId?: string;
  sensorName?: string;
  metadata?: any;
  createdAt: Date;
}

export enum AlertType {
  BATTERY_LOW = 'battery_low',
  SENSOR_OFFLINE = 'sensor_offline',
  // ... etc
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved'
}
```

---

**End of Stage 1 Audit Report**

This comprehensive audit provides all necessary backend information for implementing Phase 3 mobile features. Proceed to Stage 2 after review and approval.
