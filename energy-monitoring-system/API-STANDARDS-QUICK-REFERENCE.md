# API Standards - Quick Reference

## URL Format
```
✅ /api/users
✅ /api/sensors/{id}/readings
❌ /api/getUsers
❌ /api/Users
```

## HTTP Methods
```
GET    /api/users          → List
GET    /api/users/{id}     → Get one
POST   /api/users          → Create
PATCH  /api/users/{id}     → Update
DELETE /api/users/{id}     → Delete
```

## Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

## Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": ["detail 1", "detail 2"],
  "timestamp": "2026-07-17T10:30:00.000Z",
  "path": "/api/users"
}
```

## Status Codes
```
200 - OK (GET, PATCH, DELETE)
201 - Created (POST)
400 - Bad Request (validation error)
401 - Unauthorized (not authenticated)
403 - Forbidden (not authorized)
404 - Not Found
500 - Server Error
```

## Pagination
```
GET /api/users?page=1&limit=10

Response meta:
{
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Filtering & Sorting
```
GET /api/sensors?status=active&type=piezoelectric
GET /api/readings?sortBy=power&order=desc
GET /api/users?page=1&limit=20&sortBy=createdAt&order=desc
```

## Timestamps
```
Format: ISO 8601 UTC
Example: "2026-07-17T10:30:00.000Z"

Fields:
- createdAt
- updatedAt
```

## Naming
```
URLs:          kebab-case    (/energy-readings)
Fields:        camelCase     (firstName, isActive)
Classes:       PascalCase    (UserService, CreateUserDto)
Constants:     UPPER_SNAKE   (MAX_RETRIES, API_URL)
Files:         kebab-case    (user-service.ts)
```

## Authentication
```http
Authorization: Bearer <token>

Public endpoints (no auth):
- POST /api/auth/login
- POST /api/auth/register
- GET /api/health
```

## Checklist for New Endpoints

- [ ] URL: plural nouns, kebab-case
- [ ] HTTP method correct
- [ ] Response format standard
- [ ] Status code appropriate
- [ ] ISO 8601 timestamps
- [ ] camelCase field names
- [ ] Pagination (if list)
- [ ] Authentication required
- [ ] Swagger docs
- [ ] DTO with validation
- [ ] Error handling
