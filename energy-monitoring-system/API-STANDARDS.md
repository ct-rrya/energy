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

## Conclusion

These standards ensure:
- ✅ **Consistency** across all endpoints
- ✅ **Predictability** for frontend developers
- ✅ **Maintainability** for the team
- ✅ **Industry compliance** with REST best practices
- ✅ **Clear documentation** for API consumers

**All developers must follow these standards when implementing new features.**

---

**Document Version:** 1.0  
**Last Updated:** July 17, 2026  
**Next Review:** Before Phase 2 implementation
