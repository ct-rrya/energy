# EcoStep Data Design & Data Dictionary Verification Report

**Document Title:** Data Design & Data Dictionary Architectural Verification & Correction Specification  
**Target System:** EcoStep — Smart Piezoelectric Footstep Kinetic Energy Monitoring System  
**Applicability:** BSIT Capstone Project Technical Documentation (Database Design & Data Dictionary)  
**Verification Date:** November 11, 2026  
**Auditor:** Senior Software Architect & Database Administrator  
**Reference Codebase:** `energy-monitoring-system/src/` (Mongoose 9 / MongoDB Atlas)  

---

## Table of Contents
1. [Executive Verdict & Summary Matrix](#1-executive-verdict--summary-matrix)
2. [Evaluation of the Conceptual Entity-Relationship Diagram (ERD)](#2-evaluation-of-the-conceptual-entity-relationship-diagram-erd)
3. [Field-by-Field Verification & Corrections per Collection](#3-field-by-field-verification--corrections-per-collection)
   - [3.1 Users Collection](#31-users-collection)
   - [3.2 Sensors Collection](#32-sensors-collection)
   - [3.3 Energy Readings Collection (`energy_readings`)](#33-energy-readings-collection-energy_readings)
   - [3.4 Reports Collection (`reports`)](#34-reports-collection-reports)
   - [3.5 Audit Logs Collection (`audit_logs`)](#35-audit-logs-collection-audit_logs)
4. [Corrected Production Data Dictionary (Ready for Capstone Defense)](#4-corrected-production-data-dictionary-ready-for-capstone-defense)
5. [Additional Active MongoDB Collections (Omitted from Initial Draft)](#5-additional-active-mongodb-collections-omitted-from-initial-draft)
   - [5.1 `milestone_targets` Collection](#51-milestone_targets-collection)
   - [5.2 `diagnostic_tests` Collection](#52-diagnostic_tests-collection)
   - [5.3 `reference_configs` Collection](#53-reference_configs-collection)
   - [5.4 `alerts` Collection](#54-alerts-collection)

---

## 1. Executive Verdict & Summary Matrix

The conceptual narrative of the **EcoStep Data Design** correctly outlines the domain entities and their high-level business associations. However, when compared against the **actual production source code** (`energy-monitoring-system/src/*/schemas/*.schema.ts`), the proposed Data Dictionary contains **several critical discrepancies**:

1. **Incorrect Field Names:** Key attributes in the draft use generic names that do not match the codebase (e.g., draft uses `fullName` instead of `name`, `sensorName` instead of `name`, `reportType` instead of `type`, and `userId` instead of `administratorId`).
2. **Incorrect Structure for Date Ranges:** Reports do not use an embedded `dateRange` object; they use two discrete top-level string fields (`startDate` and `endDate` in `YYYY-MM-DD` ISO format).
3. **Registration Timestamp Naming:** Sensors do not have a `registeredAt` field; registration uses Mongoose's automatic `createdAt` timestamp, accompanied by an explicit physical `installationDate`.
4. **Chat Query Storage Reality:** The draft discusses a `Chat Query` entity. In the actual system, **there is NO `chat_queries` collection in MongoDB**. Chat history is managed ephemerally in-memory by `SessionManager` (`Map<string, ChatSession>`) with a 30-minute rolling expiration to protect user privacy and minimize database I/O. Only administrative chatbot activity is logged under `audit_logs` (`AUDIT_ACTIONS.CHATBOT_QUERY`).
5. **Significant Omission of Core Operational Fields:** The draft omits critical production fields such as `accessCodeHash`, `isActive`, `installationDate`, `lastSeenAt`, `receivedAt`, `batteryPercentage`, `summary`, and `expiresAt` (TTL index).

### Discrepancy Summary Table

| Collection | Draft Field Name | Actual Production Schema Field | Status | Correction Required |
| :--- | :--- | :--- | :--- | :--- |
| **Users** | `fullName` | `name` | ❌ Mismatch | Rename to `name` |
| **Users** | *(missing)* | `accessCodeHash`, `isActive`, `lastLoginAt`, `lastActivityAt`, `updatedAt` | ⚠️ Incomplete | Add active production fields |
| **Sensors** | `sensorName` | `name` | ❌ Mismatch | Rename to `name` |
| **Sensors** | `registeredAt` | `createdAt` (Mongoose timestamp) + `installationDate` | ❌ Mismatch | Replace with `createdAt` and `installationDate` |
| **Sensors** | *(missing)* | `lastSeenAt`, `metadata`, `isActive`, `updatedAt` | ⚠️ Incomplete | Add active production fields |
| **Energy Readings** | *(all names correct)* | `_id`, `sensorId`, `voltage`, `current`, `power`, `energy`, `timestamp` | ✅ Verified | Add unit clarification (`energy` in mWh) |
| **Energy Readings** | *(missing)* | `receivedAt`, `batteryPercentage`, `source`, `stepCount`, `capacitorVoltage` | ⚠️ Incomplete | Add IoT telemetry metadata fields |
| **Reports** | `reportType` | `type` | ❌ Mismatch | Rename to `type` |
| **Reports** | `dateRange` (Object) | `startDate` (String) & `endDate` (String) | ❌ Mismatch | Split into discrete `startDate` and `endDate` strings |
| **Reports** | *(missing)* | `format`, `fileName`, `filePath`, `fileSize`, `generatedByName`, `summary`, `expiresAt` | ⚠️ Incomplete | Add file storage & TTL metadata |
| **Audit Logs** | `userId` | `administratorId` | ❌ Mismatch | Rename to `administratorId` |
| **Audit Logs** | *(missing)* | `administratorName`, `administratorRole`, `category`, `event`, `target`, `result`, `ipAddress` | ⚠️ Incomplete | Add security auditing fields |
| **Chat Queries** | *(Separate collection)* | **Does not exist in MongoDB** (in-memory `SessionManager`) | ❌ Architectural Misalignment | Clarify that Chat is ephemeral in-memory, not a MongoDB collection |

---

## 2. Evaluation of the Conceptual Entity-Relationship Diagram (ERD)

The narrative provided for the Conceptual ERD is evaluated below:

### 2.1 User, Sensor, Energy Reading, and Report Associations
* **Draft Statement:** *"Sensors are associated with Energy Readings... Energy Readings provide the data used for monitoring, analytics, and report generation. Users are associated with reports and recorded system activities..."*
* **Architectural Verdict: TRUE.**
  * In MongoDB, `EnergyReading` stores `sensorId` referencing `Sensor._id` ($1 : N$).
  * `Report` stores `generatedBy` referencing `User._id` ($1 : N$).
  * `AuditLog` stores `administratorId` referencing `User._id` ($1 : N$).

### 2.2 Chat Query Entity Representation
* **Draft Statement:** *"The Chat Query entity represents interactions submitted through the AI chatbot available on the public portion of the Web Dashboard. Where chatbot interactions are stored, the query and corresponding response may be associated with the relevant interaction record and timestamp."*
* **Architectural Verdict: QUALIFIED / CONCEPTUAL ONLY.**
  * **Conceptual Level:** Valid as an abstract interaction object representing public user queries and EcoGuide AI responses.
  * **Physical Database Level:** **FALSE.** There is **no persistent `chat_queries` collection** in MongoDB Atlas. The backend (`src/chat/session.manager.ts`) intentionally implements in-memory session management:
    ```typescript
    // src/chat/session.manager.ts
    private readonly sessions = new Map<string, ChatSession>();
    ```
  * Chat messages are held in Node.js RAM for a rolling window of 30 minutes (`CHAT_SESSION_TIMEOUT_MINUTES`) and purged via scheduled cron jobs. They are never written to disk or database collections, preventing database bloat and preserving visitor anonymity.
  * *Correction for Documentation:* If presenting an ERD for the **physical database implementation**, remove `Chat Query` from the MongoDB collection diagrams or explicitly label it as an `Ephemeral In-Memory Cache (RAM)`.

---

## 3. Field-by-Field Verification & Corrections per Collection

### 3.1 Users Collection
* **Schema File:** `energy-monitoring-system/src/users/schemas/user.schema.ts`
* **Collection Name:** `users`

#### Side-by-Side Verification
| Draft Field | Draft Type | Actual Code Field | Actual BSON Type | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | `_id` | `ObjectId` | ✅ **True.** Primary Key. |
| `fullName` | String | `name` | `String` | ❌ **Correction:** Codebase uses `name`, not `fullName`. |
| `email` | String | `email` | `String` | ✅ **True.** Unique, lowercased, indexed. |
| `password` | String | `password` | `String` | ✅ **True.** Bcrypt hash (`select: false`). |
| `role` | String | `role` | `String` | ✅ **True.** Enum: `'SUPER_ADMIN'`, `'SYSTEM_ADMIN'`, `'PUBLIC_USER'`. |
| `createdAt` | DateTime | `createdAt` | `Date` | ✅ **True.** Auto-generated by Mongoose timestamps. |
| *(None)* | — | `updatedAt` | `Date` | ⚠️ **Omitted:** Timestamp of record modification. |
| *(None)* | — | `isActive` | `Boolean` | ⚠️ **Omitted:** Account status flag (default `true`). |
| *(None)* | — | `lastLoginAt` | `Date` | ⚠️ **Omitted:** Optional login timestamp. |
| *(None)* | — | `lastActivityAt` | `Date` | ⚠️ **Omitted:** Inactivity timeout tracking timestamp. |
| *(None)* | — | `accessCodeHash` | `String` | ⚠️ **Omitted:** Bcrypt hash of 6-character shared workstation code. |

---

### 3.2 Sensors Collection
* **Schema File:** `energy-monitoring-system/src/sensors/schemas/sensor.schema.ts`
* **Collection Name:** `sensors`

#### Side-by-Side Verification
| Draft Field | Draft Type | Actual Code Field | Actual BSON Type | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | `_id` | `ObjectId` | ✅ **True.** Primary Key. |
| `sensorName` | String | `name` | `String` | ❌ **Correction:** Codebase uses `name`, not `sensorName`. |
| `location` | String | `location` | `String` | ✅ **True.** Physical installation area. |
| `status` | String | `status` | `String` | ✅ **True.** Enum: `'active'`, `'inactive'`, `'maintenance'`. |
| `apiKey` | String | `apiKey` | `String` | ✅ **True.** Unique token with `esp32_` prefix. |
| `registeredAt` | DateTime | `createdAt` | `Date` | ❌ **Correction:** Codebase uses standard `createdAt` for registration time, plus explicit `installationDate`. |
| *(None)* | — | `installationDate` | `Date` | ⚠️ **Omitted:** Physical deployment timestamp (default `Date.now`). |
| *(None)* | — | `lastSeenAt` | `Date` | ⚠️ **Omitted:** Timestamp of last telemetry ping (health check). |
| *(None)* | — | `isActive` | `Boolean` | ⚠️ **Omitted:** Soft-delete retention flag. |
| *(None)* | — | `metadata` | `Object` | ⚠️ **Omitted:** Hardware/firmware version attributes. |
| *(None)* | — | `updatedAt` | `Date` | ⚠️ **Omitted:** Timestamp of last record update. |

---

### 3.3 Energy Readings Collection (`energy_readings`)
* **Schema File:** `energy-monitoring-system/src/iot/schemas/energy-reading.schema.ts`
* **Collection Name:** `energy_readings`

#### Side-by-Side Verification
| Draft Field | Draft Type | Actual Code Field | Actual BSON Type | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | `_id` | `ObjectId` | ✅ **True.** Primary Key. |
| `sensorId` | ObjectId | `sensorId` | `ObjectId` | ✅ **True.** Foreign key reference to `sensors._id`. |
| `voltage` | Number | `voltage` | `Double` | ✅ **True.** Measured in Volts (V). |
| `current` | Number | `current` | `Double` | ✅ **True.** Measured in Amperes (A). |
| `power` | Number | `power` | `Double` | ✅ **True.** Instantaneous power in Watts (W). |
| `energy` | Number | `energy` | `Double` | ✅ **True.** Harvested energy in **milliwatt-hours (mWh)**. |
| `timestamp` | DateTime | `timestamp` | `Date` | ✅ **True.** Sensor measurement time (ESP32 clock). |
| *(None)* | — | `receivedAt` | `Date` | ⚠️ **Omitted:** Server reception time (used to calculate latency). |
| *(None)* | — | `batteryPercentage` | `Double` | ⚠️ **Omitted:** Storage battery state of charge (0–100%). |
| *(None)* | — | `source` | `String` | ⚠️ **Omitted:** Enum: `'hardware'` or `'mock'`. |
| *(None)* | — | `stepCount` | `Double` | ⚠️ **Omitted:** Footstep count detected on the tile. |
| *(None)* | — | `capacitorVoltage` | `Double` | ⚠️ **Omitted:** Buffer capacitor voltage level. |
| *(None)* | — | `createdAt` / `updatedAt` | `Date` | ⚠️ **Omitted:** Mongoose system timestamps. |

---

### 3.4 Reports Collection (`reports`)
* **Schema File:** `energy-monitoring-system/src/reports/schemas/report.schema.ts`
* **Collection Name:** `reports`

#### Side-by-Side Verification
| Draft Field | Draft Type | Actual Code Field | Actual BSON Type | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | `_id` | `ObjectId` | ✅ **True.** Primary Key. |
| `reportType` | String | `type` | `String` | ❌ **Correction:** Codebase uses `type`, not `reportType`. Enum: `daily`, `weekly`, `monthly`, `custom`, `energy_monitoring`, `historical_analytics`, `system_diagnostics`, `system_summary`. |
| `dateRange` | Object | `startDate` & `endDate` | `String`, `String` | ❌ **Correction:** Not an object. Stored as two distinct ISO strings: `startDate` ("YYYY-MM-DD") and `endDate` ("YYYY-MM-DD"). |
| `generatedBy` | ObjectId | `generatedBy` | `ObjectId` | ✅ **True.** Foreign key reference to `users._id`. |
| `createdAt` | DateTime | `createdAt` | `Date` | ✅ **True.** Generation timestamp. |
| *(None)* | — | `format` | `String` | ⚠️ **Omitted:** Document format: `'pdf'` or `'excel'`. |
| *(None)* | — | `fileName` | `String` | ⚠️ **Omitted:** Unique filename on filesystem. |
| *(None)* | — | `filePath` | `String` | ⚠️ **Omitted:** Relative path in `uploads/reports/`. |
| *(None)* | — | `fileSize` | `Double` | ⚠️ **Omitted:** File size in bytes. |
| *(None)* | — | `generatedByName` | `String` | ⚠️ **Omitted:** Denormalized admin name for quick reporting. |
| *(None)* | — | `summary` | `Object` | ⚠️ **Omitted:** Embedded key metrics (`totalEnergyKWh`, `avgPowerW`, `peakPowerW`, `co2AvoidedKg`, `costSavingsUSD`, `readingCount`). |
| *(None)* | — | `expiresAt` | `Date` | ⚠️ **Omitted:** Automatic 30-day TTL index deletion timestamp. |

---

### 3.5 Audit Logs Collection (`audit_logs`)
* **Schema File:** `energy-monitoring-system/src/audit/schemas/audit-log.schema.ts`
* **Collection Name:** `audit_logs`

#### Side-by-Side Verification
| Draft Field | Draft Type | Actual Code Field | Actual BSON Type | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | `_id` | `ObjectId` | ✅ **True.** Primary Key. |
| `userId` | ObjectId | `administratorId` | `ObjectId` | ❌ **Correction:** Codebase uses `administratorId`, not `userId`. |
| `action` | String | `action` | `String` | ✅ **True.** System action constant (e.g., `'LOGIN'`, `'GENERATE_REPORT'`). |
| `module` | String | `module` | `String` | ✅ **True.** Subsystem module (`'AUTH'`, `'REPORTS'`, `'MILESTONES'`, etc.). |
| `timestamp` | DateTime | `timestamp` | `Date` | ✅ **True.** Event occurrence timestamp. |
| *(None)* | — | `administratorName` | `String` | ⚠️ **Omitted:** Immutable cached admin name. |
| *(None)* | — | `administratorRole` | `String` | ⚠️ **Omitted:** Admin role at action time (`SUPER_ADMIN`, `SYSTEM_ADMIN`). |
| *(None)* | — | `category` | `String` | ⚠️ **Omitted:** Grouping category (e.g. `'Authentication'`, `'Reports'`). |
| *(None)* | — | `event` | `String` | ⚠️ **Omitted:** Human-readable action label. |
| *(None)* | — | `target` | `String` | ⚠️ **Omitted:** Affected resource ID or name. |
| *(None)* | — | `result` | `String` | ⚠️ **Omitted:** Outcome: `'SUCCESS'`, `'FAILED'`, or `'DENIED'`. |
| *(None)* | — | `ipAddress` | `String` | ⚠️ **Omitted:** Originating client IP address. |
| *(None)* | — | `userAgent` | `String` | ⚠️ **Omitted:** Client browser/platform signature. |
| *(None)* | — | `details` | `Object` | ⚠️ **Omitted:** Structured parameter/state delta snapshot. |

---

## 4. Corrected Production Data Dictionary (Ready for Capstone Defense)

Below are the corrected, complete data dictionary tables matching the actual MongoDB Atlas schemas.

### 4.1 Collection: `users`
Represents administrative user accounts with role-based access control.

| Field Name | BSON Data Type | Constraints & Key | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto | Generated | Unique MongoDB document identifier |
| `name` | String | Required, Trim | — | Full display name of the administrator |
| `email` | String | Required, Unique, Lowercase, Indexed | — | Administrator email address used for login |
| `password` | String | Required, Select: false | — | Bcrypt hash of the user password |
| `role` | String | Enum: `['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PUBLIC_USER']` | `'PUBLIC_USER'` | User authorization role |
| `isActive` | Boolean | Required | `true` | Account status flag (`false` indicates suspended) |
| `accessCodeHash` | String | Optional, Select: false | — | Bcrypt hash of the 6-character shared workstation access code |
| `lastLoginAt` | Date | Optional | `null` | Timestamp of last successful authentication |
| `lastActivityAt` | Date | Optional | `null` | Timestamp of last user activity for session timeout |
| `createdAt` | Date | Auto (Mongoose timestamps) | Current Date | Timestamp when the user account was created |
| `updatedAt` | Date | Auto (Mongoose timestamps) | Current Date | Timestamp when the account was last modified |

---

### 4.2 Collection: `sensors`
Represents registered piezoelectric tile sensor nodes (ESP32 controllers).

| Field Name | BSON Data Type | Constraints & Key | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto | Generated | Unique MongoDB document identifier |
| `name` | String | Required, Trim, Indexed | — | Human-readable name or designation for the sensor |
| `location` | String | Required, Trim | — | Physical building/floor location where the tile is installed |
| `status` | String | Required, Enum: `['active', 'inactive', 'maintenance']` | `'active'` | Operating state of the hardware sensor |
| `apiKey` | String | Required, Unique, Indexed | Generated | Secret API credential for ESP32 ingestion (`esp32_...`) |
| `installationDate` | Date | Required | `Date.now` | Date when the physical sensor tile was deployed |
| `lastSeenAt` | Date | Optional | `null` | Timestamp of most recent telemetry reading received |
| `metadata` | Object | Optional | `{}` | Hardware/firmware version details (`model`, `firmwareVersion`) |
| `isActive` | Boolean | Required, Indexed | `true` | Soft-delete status flag to preserve historical data |
| `createdAt` | Date | Auto (Mongoose timestamps) | Current Date | Timestamp when the sensor record was created |
| `updatedAt` | Date | Auto (Mongoose timestamps) | Current Date | Timestamp when the sensor record was last modified |

---

### 4.3 Collection: `energy_readings`
High-frequency time-series telemetry received from piezoelectric sensors.

| Field Name | BSON Data Type | Constraints & Key | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto | Generated | Unique MongoDB document identifier |
| `sensorId` | ObjectId | Required, Foreign Key (Ref: `sensors`), Indexed | — | Identifier of the originating sensor node |
| `voltage` | Double | Required, Min: 0 | — | Instantaneous piezoelectric voltage in Volts (V) |
| `current` | Double | Required, Min: 0 | — | Derived current in Amperes (A) |
| `power` | Double | Required, Min: 0 | — | Electrical power in Watts (W) calculated as $P = V \times I$ |
| `energy` | Double | Required, Min: 0 | `0` | Harvested energy in **milliwatt-hours (mWh)** |
| `timestamp` | Date | Required, Indexed | — | Measurement timestamp reported by the ESP32 RTC/NTP |
| `receivedAt` | Date | Required | `Date.now` | Server arrival timestamp (used for network latency check) |
| `batteryPercentage` | Double | Required, Range: [0, 100] | `100` | Battery storage state of charge percentage |
| `stepCount` | Double | Optional, Min: 0 | `0` | Cumulative footsteps registered by the tile |
| `capacitorVoltage` | Double | Optional, Range: [0, 100] | — | Energy buffer capacitor voltage in Volts (V) |
| `source` | String | Required, Enum: `['hardware', 'mock']`, Indexed | `'hardware'` | Data origin indicator |
| `createdAt` | Date | Auto (Mongoose timestamps) | Current Date | Document insertion timestamp |
| `updatedAt` | Date | Auto (Mongoose timestamps) | Current Date | Document modification timestamp |

---

### 4.4 Collection: `reports`
Metadata and file references for generated audit and energy reports.

| Field Name | BSON Data Type | Constraints & Key | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto | Generated | Unique MongoDB document identifier |
| `type` | String | Required, Enum, Indexed | — | Report category (`daily`, `weekly`, `monthly`, `custom`, `energy_monitoring`, etc.) |
| `format` | String | Required, Enum: `['pdf', 'excel']`, Indexed | — | Exported document file format |
| `fileName` | String | Required, Unique | — | Generated filename stored on the filesystem |
| `filePath` | String | Required | — | Relative path to file (`uploads/reports/...`) |
| `fileSize` | Double | Required | — | Generated file size in bytes |
| `generatedBy` | ObjectId | Required, Foreign Key (Ref: `users`), Indexed | — | User identifier of the administrator who requested the report |
| `generatedByName`| String | Required | — | Cached administrator name for immediate UI display |
| `startDate` | String | Required, Indexed | — | Start date of covered period (`YYYY-MM-DD`) |
| `endDate` | String | Required, Indexed | — | End date of covered period (`YYYY-MM-DD`) |
| `parameters` | Object | Optional | `{}` | Query filters applied during generation |
| `summary` | Object | Required | — | Key aggregated metrics (`totalEnergyKWh`, `avgPowerW`, `peakPowerW`, `co2AvoidedKg`, `costSavingsUSD`, `readingCount`) |
| `downloadCount` | Double | Required | `0` | Number of times the report was downloaded |
| `expiresAt` | Date | Required, TTL Index (expireAfterSeconds: 0) | — | Automatic purge date (30-day retention) |
| `createdAt` | Date | Auto (Mongoose timestamps) | Current Date | Timestamp when the report was generated |
| `updatedAt` | Date | Auto (Mongoose timestamps) | Current Date | Timestamp when the report record was updated |

---

### 4.5 Collection: `audit_logs`
Immutable trail of administrative and security events.

| Field Name | BSON Data Type | Constraints & Key | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key, Auto | Generated | Unique MongoDB document identifier |
| `administratorId`| ObjectId | Required, Foreign Key (Ref: `users`), Indexed | — | Identifier of the administrator performing the action |
| `administratorName`| String | Required, Indexed | — | Cached administrator name |
| `administratorRole`| String | Required, Indexed | — | Role at the time of execution (`SUPER_ADMIN`, `SYSTEM_ADMIN`) |
| `category` | String | Optional, Indexed | `'Authentication'` | Main functional grouping (`Authentication`, `Reports`, `Milestones`, `Diagnostics`) |
| `module` | String | Required, Indexed | `'Authentication'` | System module identifier (`AUTH`, `DASHBOARD`, `REPORTS`, `MILESTONES`, `SECURITY`, etc.) |
| `event` | String | Optional, Indexed | — | Human-readable event description |
| `action` | String | Required, Indexed | — | Standardized action constant (`LOGIN`, `GENERATE_REPORT`, `UPDATE_MILESTONE_TARGETS`, etc.) |
| `target` | String | Optional, Indexed | — | Affected entity identifier or descriptor |
| `targetType` | String | Optional | — | Type of target (`'user'`, `'device'`, `'report'`, `'milestone'`) |
| `details` | Object | Optional | — | Contextual metadata and before/after parameters |
| `result` | String | Required, Indexed, Enum: `['SUCCESS', 'FAILED', 'DENIED']` | — | Outcome of the action |
| `failureReason` | String | Optional | — | Error description if result is `FAILED` or `DENIED` |
| `ipAddress` | String | Optional, Indexed | — | Client IP address |
| `userAgent` | String | Optional | — | Client browser/operating system user-agent string |
| `sessionId` | String | Optional, Indexed | — | Session identifier linking sequential actions |
| `timestamp` | Date | Required, Indexed | `Date.now` | Event occurrence timestamp (immutable) |

---

## 5. Additional Active MongoDB Collections (Omitted from Initial Draft)

To ensure the thesis/capstone database documentation is 100% complete and accurate, the following active collections from the codebase should be acknowledged:

### 5.1 `milestone_targets` Collection
* **Schema File:** `energy-monitoring-system/src/milestones/schemas/milestone-target.schema.ts`
* **Purpose:** Stores baseline targets and monthly calendar configurations for footstep energy generation (in mWh), including automatic locking on Day 2 of each month.

| Field Name | BSON Data Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique document identifier (Singleton pattern) |
| `target1WeekMWh` | Double | Default weekly generation target in mWh |
| `target1MonthMWh`| Double | Default monthly generation target in mWh |
| `target3MonthsMWh`| Double | Default quarterly generation target in mWh |
| `target6MonthsMWh`| Double | Default semi-annual generation target in mWh |
| `target1YearMWh` | Double | Default annual generation target in mWh |
| `monthlyConfigurations` | Object | Map of monthly configs keyed by `"YYYY-MM"`, containing `monthlyTargetMWh`, `weeklyTargetsMWh`, `isLocked`, `deadlineDate`, and `correctionLogs` |
| `updatedBy` | String | Administrator who last modified targets |
| `createdAt` / `updatedAt` | Date | Standard Mongoose timestamps |

---

### 5.2 `diagnostic_tests` Collection
* **Schema File:** `energy-monitoring-system/src/diagnostics/schemas/diagnostic-test.schema.ts`
* **Purpose:** Stores calibration and physical health test records for piezoelectric tiles.

| Field Name | BSON Data Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique document identifier |
| `testDate` | Date | Date and time when the calibration test was executed |
| `performedBy` | String | Name of the administrator or technician executing the test |
| `actualEnergy` | Double | Measured output energy from the test step |
| `expectedEnergy` | Double | Theoretical energy output based on applied weight |
| `difference` | Double | Absolute discrepancy between actual and expected energy |
| `performancePercentage` | Double | Calculated performance efficiency ratio |
| `result` | String | Status: `'Within Range'`, `'Below Expected'`, or `'Above Expected'` |
| `referenceConfig` | Object | Calibration reference parameters (`appliedWeightKg`, `expectedEnergyWh`, `tolerancePercent`) |
| `notes` | String | Optional technician observations |
| `createdAt` / `updatedAt` | Date | Standard Mongoose timestamps |

---

### 5.3 `reference_configs` Collection
* **Schema File:** `energy-monitoring-system/src/diagnostics/schemas/reference-config.schema.ts`
* **Purpose:** Stores active baseline reference parameters used for tile diagnostic evaluations.

| Field Name | BSON Data Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique document identifier |
| `appliedWeightKg` | Double | Reference test weight applied during diagnostic calibration |
| `expectedEnergyWh` | Double | Expected baseline electrical energy generation |
| `tolerancePercent` | Double | Acceptable error margin percentage (e.g. $\pm 10\%$) |
| `updatedBy` | String | Administrator who configured the baseline |
| `createdAt` / `updatedAt` | Date | Standard Mongoose timestamps |

---

### 5.4 `alerts` Collection
* **Schema File:** `energy-monitoring-system/src/alerts/schemas/alert.schema.ts`
* **Purpose:** Stores system warnings, hardware disconnect notices, and abnormal energy fluctuations.

| Field Name | BSON Data Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique document identifier |
| `sensorId` | ObjectId | Foreign key reference to `sensors._id` |
| `type` | String | Category of alert (`OFFLINE`, `BATTERY_LOW`, `VOLTAGE_SPIKE`, etc.) |
| `severity` | String | Enum: `'INFO'`, `'WARNING'`, `'CRITICAL'` |
| `message` | String | Human-readable alert notification text |
| `isResolved` | Boolean | Status flag indicating whether the issue was resolved |
| `resolvedAt` | Date | Timestamp of resolution |
| `createdAt` / `updatedAt` | Date | Standard Mongoose timestamps |

---

## 6. Summary Recommendations for Academic Documentation

1. **Adopt Correct Field Names:** Update the capstone data dictionary tables to use `name` (Users & Sensors), `type` (Reports), `startDate`/`endDate` (Reports), and `administratorId` (Audit Logs). This avoids discrepancies during source code inspection or oral defense.
2. **Clarify the Chat Architecture:** In the Data Design chapter, state clearly that while AI Chatbot interactions are represented conceptually in user workflows, they are deliberately implemented as an **ephemeral in-memory session cache (`SessionManager`)** rather than a persistent MongoDB collection for performance, storage optimization, and user privacy.
3. **Include the Milestones & Diagnostics Collections:** Adding the `milestone_targets` and `diagnostic_tests` collections demonstrates the completeness of the system's administrative governance and hardware health monitoring capabilities.
