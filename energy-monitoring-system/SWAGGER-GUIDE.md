# Swagger UI Testing Guide

## 🌐 Access Swagger Documentation

**URL:** http://localhost:3000/api/docs

Make sure the server is running:
```bash
npm run start:dev
```

---

## 📚 Available Endpoints

### Authentication Endpoints

#### 1. POST /api/auth/login
**Description:** Authenticate user and receive JWT token

**Request Body:**
```json
{
  "email": "admin@energymonitor.com",
  "password": "Admin@2024!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6a5a27e01f659d63c43e445f",
      "email": "admin@energymonitor.com",
      "name": "System Administrator",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-07-17T13:16:42.181Z",
      "createdAt": "2026-07-17T13:02:24.998Z",
      "updatedAt": "2026-07-17T13:16:42.181Z"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-07-17T13:16:42.181Z"
}
```

---

### User Endpoints (Protected)

#### 2. GET /api/users/profile
**Description:** Get current authenticated user's profile

**Authentication Required:** Yes (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "6a5a27e01f659d63c43e445f",
    "email": "admin@energymonitor.com",
    "name": "System Administrator",
    "role": "admin",
    "isActive": true,
    "lastLoginAt": "2026-07-17T13:16:42.181Z",
    "createdAt": "2026-07-17T13:02:24.998Z",
    "updatedAt": "2026-07-17T13:16:42.181Z"
  },
  "timestamp": "2026-07-17T13:20:00.000Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

### Health Check Endpoints

#### 3. GET /api/health
**Description:** Comprehensive health check (database, memory, storage)

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "status": "ok",
    "info": {
      "database": { "status": "up" },
      "memory_heap": { "status": "up" },
      "memory_rss": { "status": "up" },
      "storage": { "status": "up" }
    },
    "error": {},
    "details": {
      "database": { "status": "up" },
      "memory_heap": { "status": "up" },
      "memory_rss": { "status": "up" },
      "storage": { "status": "up" }
    }
  },
  "timestamp": "2026-07-17T13:20:00.000Z"
}
```

#### 4. GET /api/health/live
**Description:** Liveness probe (is the application running?)

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "status": "ok"
  },
  "timestamp": "2026-07-17T13:20:00.000Z"
}
```

#### 5. GET /api/health/ready
**Description:** Readiness probe (is the application ready to serve traffic?)

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "status": "ok",
    "info": {
      "database": { "status": "up" }
    },
    "error": {},
    "details": {
      "database": { "status": "up" }
    }
  },
  "timestamp": "2026-07-17T13:20:00.000Z"
}
```

---

## 🔐 Testing Protected Endpoints in Swagger

### Step 1: Login and Get Token

1. Navigate to Swagger UI: http://localhost:3000/api/docs
2. Find **POST /api/auth/login** under "Authentication" section
3. Click **"Try it out"**
4. Enter credentials in the request body:
   ```json
   {
     "email": "admin@energymonitor.com",
     "password": "Admin@2024!"
   }
   ```
5. Click **"Execute"**
6. **Copy the JWT token** from the response (the long string after `"token":`)

### Step 2: Authorize Swagger with Token

1. Look for the **"Authorize"** button at the top of the Swagger UI (🔓 icon)
2. Click the **"Authorize"** button
3. In the popup, enter: `Bearer <your-token>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Click **"Authorize"**
5. Close the authorization popup

### Step 3: Test Protected Endpoints

1. Find **GET /api/users/profile** under "Users" section
2. Click **"Try it out"**
3. Click **"Execute"**
4. You should see your profile data in the response
5. Notice the lock icon (🔒) is now closed, indicating authentication

---

## 🧪 Test Scenarios

### Scenario 1: Successful Login
**Steps:**
1. POST /api/auth/login with correct credentials
2. Verify status 200 OK
3. Verify token is returned
4. Verify user data is returned

**Expected Result:** ✅ JWT token and user profile

### Scenario 2: Invalid Credentials
**Steps:**
1. POST /api/auth/login with wrong password
2. Verify status 401 Unauthorized
3. Verify error message: "Invalid email or password"

**Expected Result:** ✅ Error response, no token

### Scenario 3: Missing Email
**Steps:**
1. POST /api/auth/login with empty email
2. Verify status 400 Bad Request
3. Verify validation error for email field

**Expected Result:** ✅ Validation error

### Scenario 4: Get Profile with Valid Token
**Steps:**
1. Login and copy token
2. Authorize Swagger with token
3. GET /api/users/profile
4. Verify status 200 OK
5. Verify profile data matches login response

**Expected Result:** ✅ User profile data

### Scenario 5: Get Profile without Token
**Steps:**
1. Make sure you're NOT authorized in Swagger (click Authorize → Logout)
2. GET /api/users/profile
3. Verify status 401 Unauthorized

**Expected Result:** ✅ Unauthorized error

### Scenario 6: Get Profile with Invalid Token
**Steps:**
1. Authorize Swagger with: `Bearer invalid-token-string`
2. GET /api/users/profile
3. Verify status 401 Unauthorized

**Expected Result:** ✅ Unauthorized error

---

## 📊 Response Structure

All successful responses follow this structure:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2026-07-17T13:20:00.000Z"
}
```

All error responses follow this structure:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errors": [ ... ],  // Optional: validation errors
  "timestamp": "2026-07-17T13:20:00.000Z"
}
```

---

## 🔍 Tips for Using Swagger UI

### 1. Swagger Features
- **Try it out**: Test endpoints directly from the browser
- **Schemas**: View request/response data structures
- **Authorize**: Store JWT token for protected endpoints
- **Examples**: See example requests and responses
- **Curl**: Copy curl commands for terminal testing

### 2. JWT Token Expiration
- Tokens expire after 7 days (configurable)
- If you get 401 errors, your token may have expired
- Simply login again to get a fresh token

### 3. Testing Tips
- Test public endpoints first (login, health)
- Then test protected endpoints (profile)
- Use the "Authorize" button for convenience
- Check response status codes
- Verify response data structure
- Test error scenarios (invalid data, missing auth)

### 4. Common Issues

**Issue:** "Unauthorized" error on protected endpoints
**Solution:** Make sure you clicked "Authorize" and entered the token

**Issue:** "Invalid email or password"
**Solution:** Run `npm run seed` to create the admin account

**Issue:** Connection error
**Solution:** Make sure the server is running (`npm run start:dev`)

---

## 🎯 Quick Start Testing

### Option 1: Swagger UI (Recommended for Beginners)
1. Start server: `npm run start:dev`
2. Open: http://localhost:3000/api/docs
3. Test endpoints visually

### Option 2: Test Scripts (Automated)
```bash
# Test login endpoint
node test-login.js

# Test complete auth flow
node test-auth-flow.js

# Run all verification tests
node verify-auth.js
```

### Option 3: Curl Commands (Advanced)
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@energymonitor.com","password":"Admin@2024!"}'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## 📖 Additional Resources

- **API Standards:** See `API-STANDARDS.md`
- **Phase 2 Summary:** See `PHASE-2-SUMMARY.md`
- **Project README:** See `README.md`

---

## ✅ Verification Checklist

Before moving to the next phase, verify:
- [ ] Swagger UI loads successfully
- [ ] Login endpoint returns JWT token
- [ ] Profile endpoint works with valid token
- [ ] Profile endpoint rejects invalid token
- [ ] Profile endpoint rejects missing token
- [ ] Health endpoints return status information
- [ ] All responses follow standardized format
- [ ] Validation errors are clear and helpful
- [ ] Swagger "Authorize" feature works
- [ ] All endpoints documented with examples

---

**Happy Testing! 🎉**

If you encounter any issues, check that:
1. The server is running
2. MongoDB connection is working
3. Admin account is seeded
4. Environment variables are configured correctly
