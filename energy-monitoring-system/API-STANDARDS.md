# API Standards & Conventions

**Energy Monitoring System API Standards**  
**Version:** 1.0  
**Last Updated:** July 17, 2026

---

## Table of Contents

1. [URL Conventions](#url-conventions)
2. [HTTP Methods](#http-methods)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Status Codes](#status-codes)
6. [Pagination](#pagination)
7. [Filtering & Sorting](#filtering--sorting)
8. [Timestamps](#timestamps)
9. [Naming Conventions](#naming-conventions)
10. [Authentication](#authentication)
11. [Versioning](#versioning)

---

## 1. URL Conventions

### Base URL Structure

```
https://api.example.com/api/{resource}/{id}/{sub-resource}
```

### Rules

#### ✅ DO
- Use **plural nouns** for resources: `/users`, `/sensors`, `/readings`
- Use **kebab-case** for multi-word resources: `/energy-readings`, `/user-preferences`
- Use **nouns**, not verbs: `/users` (not `/getUsers`)
- Use **hierarchical structure** for relationships: `/sensors/{id}/readings`
- Keep URLs **lowercase**

#### ❌ DON'T
- Use verbs in URLs: ❌ `/createUser`, `/deleteUser`
- Use camelCase: ❌ `/energyReadings`
- Use underscores: ❌ `/energy_readings`
- Use file extensions: ❌ `/users.json`
- Use trailing slashes: ❌ `/users/`

### Examples

```
✅ GET    /api/users              # List all users
✅ GET    /api/users/{id}         # Get specific user
✅ POST   /api/users              # Create user
✅ PATCH  /api/users/{id}         # Update user
✅ DELETE /api/users/{id}         # Delete user

✅ GET    /api/sensors/{id}/readings    # Get readings for a sensor
✅ POST   /api/auth/login               # Login endpoint
✅ GET    /api/analytics/daily          # Get daily analytics
```

---

## 2. HTTP Methods

Use the correct HTTP method for each operation:

| Method | Purpose | Request Body | Response Body | Idempotent |
|--------|---------|--------------|---------------|------------|
| `GET` | Retrieve resource(s) | ❌ No | ✅ Yes | ✅ Yes |
| `POST` | Create new resource | ✅ Yes | ✅ Yes | ❌ No |
| `PATCH` | Partial update | ✅ Yes | ✅ Yes | ✅ Yes |
| `PUT` | Full replacement | ✅ Yes | ✅ Yes | ✅ Yes |
| `DELETE` | Remove resource | ❌ No | ✅ Optional | ✅ Yes |

### Method Usage

#### GET - Retrieve Resources
```http
GET /api/users
GET /api/users/123
GET /api/sensors?status=active
```
- **No request body**
- Returns resource(s) or error
- Should be **safe** (no side effects)
- Should be **idempotent**

#### POST - Create Resources
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```
- **Requires request body**
- Returns created resource with ID
- Status: `201 Created`
- Location header with new resource URL

#### PATCH - Partial Update
```http
PATCH /api/users/123
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```
- **Requires request body** (only fields to update)
- Returns updated resource
- Status: `200 OK`

#### PUT - Full Replacement
```http
PUT /api/users/123
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active"
}
```
- **Requires complete resource** in body
- Replaces entire resource
- Use PATCH instead for partial updates

#### DELETE - Remove Resources
```http
DELETE /api/users/123
```
- **No request body**
- Status: `204 No Content` or `200 OK` with message
- Should be **idempotent** (deleting twice = same result)

---

## 3. Response Format

### Success Response Structure

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2026-07-17T10:30:00.000Z",
    "version": "1.0"
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ Yes | Always `true` for successful responses |
| `message` | string | ✅ Yes | Human-readable success message |
| `data` | object/array | ✅ Yes | The actual response data (can be null) |
| `meta` | object | ❌ Optional | Metadata (pagination, timestamps, etc.) |

### List Response (Collection)

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": "2",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Single Resource Response

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-07-17T10:30:00.000Z",
    "updatedAt": "2026-07-17T10:30:00.000Z"
  }
}
```

### Empty Response (No Data)

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

---

## 4. Error Handling

### Error Response Structure

All error responses follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be a valid email address",
    "age must be greater than 0"
  ],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/users"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | ✅ Yes | Always `false` for errors |
| `statusCode` | number | ✅ Yes | HTTP status code |
| `message` | string | ✅ Yes | Error summary |
| `errors` | array | ❌ Optional | Detailed validation errors |
| `timestamp` | string | ✅ Yes | ISO 8601 timestamp |
| `path` | string | ✅ Yes | Request path that caused error |

### Error Examples

#### Validation Error (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name must be longer than 3 characters",
    "email must be a valid email"
  ],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/users"
}
```

#### Not Found (404)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/users/999"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/users"
}
```

#### Forbidden (403)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You don't have permission to access this resource",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/admin/users"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/users"
}
```

---

## 5. Status Codes

Use appropriate HTTP status codes:

### Success Codes (2xx)

| Code | Name | When to Use |
|------|------|-------------|
| `200` | OK | Successful GET, PATCH, PUT, or DELETE |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE with no response body |

### Client Error Codes (4xx)

| Code | Name | When to Use |
|------|------|-------------|
| `400` | Bad Request | Validation error, malformed request |
| `401` | Unauthorized | Authentication required or failed |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists (e.g., duplicate email) |
| `422` | Unprocessable Entity | Valid syntax but semantic errors |
| `429` | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)

| Code | Name | When to Use |
|------|------|-------------|
| `500` | Internal Server Error | Unexpected server error |
| `503` | Service Unavailable | Server temporarily unavailable |

---

## 6. Pagination

Use **limit-offset** pagination for consistency:

### Request

```http
GET /api/users?page=2&limit=10
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page |

### Response

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "meta": {
    "total": 50,
    "page": 2,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### Meta Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total number of items |
| `page` | number | Current page number |
| `limit` | number | Items per page |
| `totalPages` | number | Total pages available |
| `hasNextPage` | boolean | Whether next page exists |
| `hasPreviousPage` | boolean | Whether previous page exists |

---

## 7. Filtering & Sorting

### Filtering

Use query parameters for filtering:

```http
GET /api/sensors?status=active&type=piezoelectric
GET /api/readings?minPower=100&maxPower=500
GET /api/users?role=admin&isActive=true
```

#### Filter Operators

| Operator | Format | Example |
|----------|--------|---------|
| Equals | `field=value` | `status=active` |
| Greater than | `fieldGt=value` | `powerGt=100` |
| Less than | `fieldLt=value` | `powerLt=500` |
| Range | `fieldMin=X&fieldMax=Y` | `ageMin=18&ageMax=65` |
| Contains | `fieldContains=value` | `nameContains=John` |

### Sorting

Use `sortBy` and `order` parameters:

```http
GET /api/users?sortBy=createdAt&order=desc
GET /api/readings?sortBy=power&order=asc
```

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `sortBy` | field name | `createdAt` | Field to sort by |
| `order` | `asc`, `desc` | `desc` | Sort order |

### Combined Example

```http
GET /api/readings?sensorId=123&minPower=100&sortBy=timestamp&order=desc&page=1&limit=20
```

---

## 8. Timestamps

### Format

Use **ISO 8601** format with UTC timezone:

```
2026-07-17T10:30:00.000Z
```

### Standard Fields

Every resource should have:

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | string (ISO 8601) | When resource was created |
| `updatedAt` | string (ISO 8601) | When resource was last updated |

### Example

```json
{
  "id": "123",
  "name": "Sensor A",
  "createdAt": "2026-07-17T10:00:00.000Z",
  "updatedAt": "2026-07-17T10:30:00.000Z"
}
```

### JavaScript/TypeScript

```typescript
const timestamp = new Date().toISOString();
// "2026-07-17T10:30:00.000Z"
```

---

## 9. Naming Conventions

### Database Fields (MongoDB)

Use **camelCase** for field names:

```javascript
{
  userId: "123",
  firstName: "John",
  lastName: "Doe",
  emailAddress: "john@example.com",
  createdAt: "2026-07-17T10:00:00.000Z"
}
```

### API Response Fields

Use **camelCase** consistently:

```json
{
  "userId": "123",
  "firstName": "John",
  "emailAddress": "john@example.com",
  "isActive": true
}
```

### TypeScript/JavaScript

```typescript
// Variables and functions: camelCase
const userName = 'John';
function getUserById(id: string) {}

// Classes and DTOs: PascalCase
class UserService {}
class CreateUserDto {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Files: kebab-case
// user-service.ts
// create-user.dto.ts
// user.controller.ts
```

### Booleans

Prefix with `is`, `has`, `can`:

```typescript
isActive: boolean
hasPermission: boolean
canEdit: boolean
isVerified: boolean
```

---

## 10. Authentication

### JWT Bearer Token

All authenticated requests must include JWT token:

```http
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Public Endpoints (No Auth Required)

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`

### Protected Endpoints

All other endpoints require authentication.

### Auth Error Responses

```json
// No token provided
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required"
}

// Invalid token
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token"
}

// Valid token, insufficient permissions
{
  "success": false,
  "statusCode": 403,
  "message": "You don't have permission to access this resource"
}
```

---

## 11. Versioning

### Current: No Versioning

Currently, the API does not use versioning. All endpoints are under `/api/`.

### Future: URI Versioning (If Needed)

If breaking changes are needed:

```
/api/v1/users
/api/v2/users
```

**Note:** Avoid versioning unless absolutely necessary. Use backward-compatible changes instead.

---

## Standards Checklist

When creating a new endpoint, verify:

- [ ] URL uses plural nouns and kebab-case
- [ ] Correct HTTP method used
- [ ] Response follows standard format with `success`, `message`, `data`
- [ ] Error responses follow error format
- [ ] Appropriate status code returned
- [ ] Timestamps use ISO 8601 format
- [ ] Field names use camelCase
- [ ] Pagination implemented (if list endpoint)
- [ ] Filtering/sorting supported (if applicable)
- [ ] Authentication required (unless public endpoint)
- [ ] Swagger documentation added
- [ ] DTO created with validation
- [ ] Error handling implemented

---

## Example: Complete Endpoint

### Request
```http
POST /api/sensors
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Sensor A",
  "location": "Building A - Floor 1",
  "type": "piezoelectric"
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Sensor created successfully",
  "data": {
    "id": "64f9a1b2c3d4e5f6g7h8i9j0",
    "name": "Sensor A",
    "location": "Building A - Floor 1",
    "type": "piezoelectric",
    "status": "inactive",
    "createdAt": "2026-07-17T10:30:00.000Z",
    "updatedAt": "2026-07-17T10:30:00.000Z"
  }
}
```

### Error Response (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name must be longer than 3 characters",
    "type must be one of the following values: piezoelectric, electromagnetic"
  ],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/sensors"
}
```

---

## 12. Diagnostic Endpoints

### Overview

The System Diagnostics API provides admin-only endpoints for measuring overall energy harvesting performance through standardized reference tests. These endpoints enable configuration of baseline values, recording of diagnostic tests, and historical tracking.

**Design Principle:** The system monitors OVERALL energy harvesting output through standardized reference tests. It does NOT and CANNOT monitor individual piezoelectric disc performance or identify specific defective components.

### Security

All diagnostic endpoints require:
- **JWT Authentication** (Bearer token)
- **Admin Role** (non-admin users receive 403 Forbidden)

### Rate Limiting

Rate limits are applied per endpoint to prevent API abuse:

| Endpoint | Rate Limit |
|----------|------------|
| `POST /api/diagnostics/reference` | 10 requests per 60 seconds |
| `POST /api/diagnostics/test` | 5 requests per 60 seconds |
| `GET /api/diagnostics/history` | 20 requests per 60 seconds |
| `GET /api/diagnostics/reference` | No specific limit (standard throttling) |

**Rate Limit Exceeded Response (429):**

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too Many Requests",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/test"
}
```

Response includes `Retry-After` header indicating seconds to wait.

---

### Endpoint 1: Create or Update Reference Configuration

**Purpose:** Set baseline configuration for diagnostic tests (applied weight, expected energy, tolerance). Only one configuration exists at any time (singleton pattern).

#### Request

```http
POST /api/diagnostics/reference
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "appliedWeightKg": 70,
  "expectedEnergyWh": 2.5,
  "tolerancePercent": 10
}
```

#### Request Body Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `appliedWeightKg` | number | ✅ Yes | 0.1 - 500 | Applied weight during reference test (kg) |
| `expectedEnergyWh` | number | ✅ Yes | 0.001 - 100 | Expected energy output (Wh) |
| `tolerancePercent` | number | ✅ Yes | 0 - 50 | Acceptable tolerance percentage (%) |

#### Success Response (201)

```json
{
  "success": true,
  "message": "Reference configuration saved successfully",
  "data": {
    "appliedWeightKg": 70,
    "expectedEnergyWh": 2.5,
    "tolerancePercent": 10,
    "createdBy": "admin@example.com",
    "createdAt": "2026-07-17T10:30:00.000Z",
    "updatedAt": "2026-07-17T10:30:00.000Z"
  }
}
```

#### Error Responses

**Validation Error (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Applied weight must be between 0.1 and 500 kg",
    "Tolerance must be between 0% and 50%"
  ],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/reference"
}
```

**Unauthorized (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/reference"
}
```

**Forbidden (403):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/reference"
}
```

#### WebSocket Event

After successful creation/update, the server emits a WebSocket event to all connected admin clients:

```json
{
  "event": "diagnostic:config-updated",
  "data": {
    "appliedWeightKg": 70,
    "expectedEnergyWh": 2.5,
    "tolerancePercent": 10,
    "createdBy": "admin@example.com",
    "updatedAt": "2026-07-17T10:30:00.000Z"
  }
}
```

---

### Endpoint 2: Get Current Reference Configuration

**Purpose:** Retrieve the active reference configuration. Returns null if no configuration exists.

#### Request

```http
GET /api/diagnostics/reference
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)

**When configuration exists:**

```json
{
  "success": true,
  "message": "Reference configuration retrieved successfully",
  "data": {
    "appliedWeightKg": 70,
    "expectedEnergyWh": 2.5,
    "tolerancePercent": 10,
    "createdBy": "admin@example.com",
    "createdAt": "2026-07-17T10:30:00.000Z",
    "updatedAt": "2026-07-17T10:30:00.000Z"
  }
}
```

**When no configuration exists:**

```json
{
  "success": true,
  "message": "No reference configuration found",
  "data": null
}
```

#### Error Responses

**Unauthorized (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/reference"
}
```

**Forbidden (403):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/reference"
}
```

---

### Endpoint 3: Record Diagnostic Test

**Purpose:** Record a diagnostic test result by comparing actual measured energy against expected baseline. The system automatically calculates difference, performance percentage, and result status.

#### Request

```http
POST /api/diagnostics/test
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actualEnergy": 2.35,
  "notes": "Morning test, 70kg load, room temperature 22°C"
}
```

#### Request Body Schema

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `actualEnergy` | number | ✅ Yes | > 0 | Actual measured energy during test (Wh) |
| `notes` | string | ❌ Optional | Max 500 chars | Optional notes about test conditions |

#### Success Response (201)

```json
{
  "success": true,
  "message": "Diagnostic test recorded successfully",
  "data": {
    "id": "64f9a1b2c3d4e5f6g7h8i9j0",
    "testDate": "2026-07-17T10:30:00.000Z",
    "performedBy": "admin@example.com",
    "actualEnergy": 2.35,
    "expectedEnergy": 2.5,
    "difference": -0.15,
    "performancePercentage": 94.0,
    "result": "Within Range",
    "referenceConfig": {
      "appliedWeightKg": 70,
      "expectedEnergyWh": 2.5,
      "tolerancePercent": 10
    },
    "notes": "Morning test, 70kg load, room temperature 22°C"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique test identifier |
| `testDate` | string (ISO 8601) | When test was performed |
| `performedBy` | string | Email of admin who recorded test |
| `actualEnergy` | number | Measured energy (Wh) |
| `expectedEnergy` | number | Expected energy from reference config (Wh) |
| `difference` | number | Calculated difference (actual - expected), 4 decimal precision |
| `performancePercentage` | number | Performance percentage ((actual/expected) × 100), 2 decimal precision |
| `result` | string | "Within Range", "Below Expected", or "Above Expected" |
| `referenceConfig` | object | Snapshot of reference config used for this test |
| `notes` | string | Optional test notes |

#### Result Determination Logic

The `result` field is calculated based on performance percentage and tolerance:

- **Within Range:** `(100 - tolerance) ≤ performancePercentage ≤ (100 + tolerance)`
- **Below Expected:** `performancePercentage < (100 - tolerance)`
- **Above Expected:** `performancePercentage > (100 + tolerance)`

Example with 10% tolerance:
- Within Range: 90% - 110%
- Below Expected: < 90%
- Above Expected: > 110%

#### Error Responses

**No Reference Configuration (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Reference configuration must be set first",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/test"
}
```

**Validation Error (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "actualEnergy must be a positive number",
    "notes must not exceed 500 characters"
  ],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/test"
}
```

**Unauthorized (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/test"
}
```

**Forbidden (403):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/test"
}
```

#### WebSocket Event

After successful test recording, the server emits a WebSocket event to all connected admin clients:

```json
{
  "event": "diagnostic:test-completed",
  "data": {
    "id": "64f9a1b2c3d4e5f6g7h8i9j0",
    "testDate": "2026-07-17T10:30:00.000Z",
    "performedBy": "admin@example.com",
    "actualEnergy": 2.35,
    "expectedEnergy": 2.5,
    "difference": -0.15,
    "performancePercentage": 94.0,
    "result": "Within Range",
    "notes": "Morning test, 70kg load, room temperature 22°C"
  }
}
```

---

### Endpoint 4: Get Diagnostic History

**Purpose:** Retrieve paginated diagnostic test history sorted by date (newest first).

#### Request

```http
GET /api/diagnostics/history?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Query Parameters

| Parameter | Type | Default | Validation | Description |
|-----------|------|---------|------------|-------------|
| `page` | number | 1 | ≥ 1 | Page number (1-indexed) |
| `limit` | number | 20 | 1 - 100 | Items per page |

#### Success Response (200)

```json
{
  "success": true,
  "message": "Diagnostic history retrieved successfully",
  "data": {
    "tests": [
      {
        "id": "64f9a1b2c3d4e5f6g7h8i9j0",
        "testDate": "2026-07-17T10:30:00.000Z",
        "performedBy": "admin@example.com",
        "actualEnergy": 2.35,
        "expectedEnergy": 2.5,
        "difference": -0.15,
        "performancePercentage": 94.0,
        "result": "Within Range",
        "referenceConfig": {
          "appliedWeightKg": 70,
          "expectedEnergyWh": 2.5,
          "tolerancePercent": 10
        },
        "notes": "Morning test, 70kg load, room temperature 22°C"
      },
      {
        "id": "64f9a1b2c3d4e5f6g7h8i9j1",
        "testDate": "2026-07-16T14:00:00.000Z",
        "performedBy": "admin2@example.com",
        "actualEnergy": 2.1,
        "expectedEnergy": 2.5,
        "difference": -0.4,
        "performancePercentage": 84.0,
        "result": "Below Expected",
        "referenceConfig": {
          "appliedWeightKg": 70,
          "expectedEnergyWh": 2.5,
          "tolerancePercent": 10
        },
        "notes": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### Empty History Response (200)

```json
{
  "success": true,
  "message": "No diagnostic tests found",
  "data": {
    "tests": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

#### Error Responses

**Invalid Pagination (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "page must be greater than or equal to 1",
    "limit must be between 1 and 100"
  ],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/history"
}
```

**Unauthorized (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/history"
}
```

**Forbidden (403):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Admin access required",
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/diagnostics/history"
}
```

---

### Swagger/OpenAPI Integration

All diagnostic endpoints are documented in Swagger UI with:

- **API Tag:** `Diagnostics`
- **Security Scheme:** Bearer JWT authentication
- **Request/Response Schemas:** Fully typed DTOs with validation rules
- **Example Responses:** Success and error cases
- **Rate Limit Information:** Documented in operation descriptions

**Access Swagger UI:**
```
http://localhost:3000/api
```

Navigate to the **Diagnostics** section to view interactive API documentation and test endpoints.

---

### Frontend Integration Examples

#### TypeScript API Service

```typescript
// frontend/src/api/services/diagnostics.service.ts
import { api } from '../api.config';
import type {
  ReferenceConfig,
  DiagnosticTest,
  DiagnosticHistoryResponse,
  CreateReferenceConfigRequest,
  RecordDiagnosticTestRequest,
} from '../types/diagnostic.types';

export const diagnosticsService = {
  // Get current reference configuration
  getReferenceConfig: async (): Promise<ReferenceConfig | null> => {
    const response = await api.get('/diagnostics/reference');
    return response.data.data;
  },

  // Create or update reference configuration
  createOrUpdateReferenceConfig: async (
    data: CreateReferenceConfigRequest,
  ): Promise<ReferenceConfig> => {
    const response = await api.post('/diagnostics/reference', data);
    return response.data.data;
  },

  // Record diagnostic test
  recordDiagnosticTest: async (
    data: RecordDiagnosticTestRequest,
  ): Promise<DiagnosticTest> => {
    const response = await api.post('/diagnostics/test', data);
    return response.data.data;
  },

  // Get diagnostic history
  getDiagnosticHistory: async (
    page = 1,
    limit = 20,
  ): Promise<DiagnosticHistoryResponse> => {
    const response = await api.get('/diagnostics/history', {
      params: { page, limit },
    });
    return response.data.data;
  },
};
```

#### React Query Hooks

```typescript
// frontend/src/hooks/useDiagnostics.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diagnosticsService } from '../api/services/diagnostics.service';

export const useReferenceConfig = () => {
  return useQuery({
    queryKey: ['referenceConfig'],
    queryFn: diagnosticsService.getReferenceConfig,
  });
};

export const useCreateReferenceConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: diagnosticsService.createOrUpdateReferenceConfig,
    onSuccess: () => {
      queryClient.invalidateQueries(['referenceConfig']);
    },
  });
};

export const useRecordDiagnosticTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: diagnosticsService.recordDiagnosticTest,
    onSuccess: () => {
      queryClient.invalidateQueries(['diagnosticHistory']);
    },
  });
};

export const useDiagnosticHistory = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['diagnosticHistory', page, limit],
    queryFn: () => diagnosticsService.getDiagnosticHistory(page, limit),
  });
};
```

#### WebSocket Event Listeners

```typescript
// frontend/src/hooks/useWebSocketEvents.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../api/socket';

export const useDiagnosticWebSocketEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for reference config updates
    socket.on('diagnostic:config-updated', () => {
      queryClient.invalidateQueries(['referenceConfig']);
    });

    // Listen for test completions
    socket.on('diagnostic:test-completed', () => {
      queryClient.invalidateQueries(['diagnosticHistory']);
    });

    return () => {
      socket.off('diagnostic:config-updated');
      socket.off('diagnostic:test-completed');
    };
  }, [queryClient]);
};
```

---

### Best Practices

1. **Always check for reference configuration** before allowing users to record tests
2. **Handle rate limit errors gracefully** with retry logic and user feedback
3. **Use WebSocket events** to keep UI synchronized across admin sessions
4. **Display result status with color coding:**
   - 🟢 Green: "Within Range"
   - 🟡 Yellow: "Above Expected"
   - 🔴 Red: "Below Expected"
5. **Include notes field** for context about test conditions
6. **Implement pagination** for history to handle large datasets efficiently
7. **Cache API responses** using React Query or similar to reduce server load

---

## Conclusion

These standards ensure:
- ✅ **Consistency** across all endpoints
- ✅ **Predictability** for frontend developers
- ✅ **Maintainability** for the team
- ✅ **Industry compliance** with REST best practices
- ✅ **Clear documentation** for API consumers

**All developers must follow these standards when implementing new features.**

---

**Document Version:** 1.1  
**Last Updated:** July 17, 2026  
**Next Review:** Before Phase 2 implementation
