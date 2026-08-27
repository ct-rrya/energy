# Production Deployment Checklist

This checklist ensures your energy monitoring system is properly configured and ready for production deployment with real ESP32 sensors.

---

## ✅ Pre-Deployment Verification

### 1. Environment Configuration

Check `.env` file has production values:

```bash
# Required Settings
☐ NODE_ENV=production
☐ PORT=3000
☐ MONGODB_URI=<your-production-mongodb-uri>
☐ JWT_SECRET=<strong-random-secret>
☐ ADMIN_EMAIL=<your-admin-email>
☐ ADMIN_PASSWORD=<strong-password>
☐ MESSENGER_PAGE_ACCESS_TOKEN=<your-token>
☐ USE_MOCK_DATA=false

# Verify Credentials
☐ MongoDB connection string is correct
☐ JWT secret is strong and unique
☐ Admin password is secure
☐ Messenger tokens are from production app
```

### 2. Database Setup

```bash
# Create admin account
☐ Run: npm run seed
☐ Verify admin can login
☐ Check MongoDB collections are empty (no fake data)
```

### 3. Build Verification

```bash
# Test compilation
☐ Run: npm run build
☐ No TypeScript errors
☐ No missing imports
☐ dist/ folder created successfully
```

### 4. Application Health Check

```bash
# Start application
☐ Run: npm run start:dev (or start:prod)
☐ Application starts without errors
☐ MongoDB connection successful
☐ WebSocket server initialized
☐ All modules loaded correctly
```

```bash
# Test health endpoints
☐ GET http://localhost:3000/api/health → Status 200
☐ GET http://localhost:3000/api/health/db → MongoDB healthy
☐ GET http://localhost:3000/api → API info displayed
```

### 5. Authentication Test

```bash
# Test login
☐ POST http://localhost:3000/api/auth/login
☐ Login with admin credentials succeeds
☐ JWT token received
☐ Token is valid
```

### 6. Frontend Configuration

Check `frontend/.env.local`:

```bash
☐ VITE_API_BASE_URL=http://localhost:3000/api
☐ VITE_WS_URL=ws://localhost:3000
```

```bash
# Build frontend
☐ cd frontend
☐ npm run build
☐ No build errors
☐ dist/ folder created
```

### 7. Empty State Verification

With no sensor data, verify:

```bash
# Dashboard
☐ Navigate to dashboard
☐ Shows empty state message (not errors)
☐ All components load properly
☐ Navigation works

# API Endpoints
☐ GET /api/iot/readings → Returns { data: [], total: 0 }
☐ GET /api/dashboard/metrics → Returns zeros
☐ GET /api/analytics/comprehensive → Returns empty analytics
☐ GET /api/sensors → Returns { data: [] }

# Messenger Bot
☐ Send "help" → Receives command list
☐ Send "status" → Receives status (with zero data)
☐ Send "battery" → Receives "no data" message
☐ All commands respond appropriately
```

---

## 🔌 Hardware Integration

### 8. First Sensor Registration

```bash
# Create sensor via API
☐ POST /api/sensors (create sensor)
☐ Note the sensor ID and API key
☐ Verify sensor appears in dashboard
```

### 9. ESP32 Configuration

```cpp
// In your ESP32 code
☐ Set WiFi credentials
☐ Set API_URL = "http://your-server:3000/api/iot/readings"
☐ Set API_KEY = "<sensor-api-key>"
☐ Set SENSOR_ID (optional, use apiKey instead)
```

### 10. First Reading Test

```bash
# ESP32 sends first reading
☐ ESP32 connects to WiFi
☐ ESP32 sends POST request
☐ Server receives reading (check logs)
☐ Reading stored in MongoDB
☐ Dashboard updates in real-time
☐ Messenger bot shows current data
```

---

## 📊 Production Monitoring

### 11. System Monitoring

```bash
# Monitor logs
☐ Application logs show no errors
☐ Reading ingestion successful
☐ WebSocket broadcasts working
☐ Messenger bot responding

# Monitor database
☐ energy_readings collection growing
☐ sensors collection has active sensors
☐ No fake/mock data in collections
```

### 12. Real-Time Features

```bash
# WebSocket functionality
☐ Dashboard receives live updates
☐ New readings appear immediately
☐ Alerts trigger correctly
☐ Statistics update in real-time
```

### 13. Messenger Bot

```bash
# Test with real data
☐ "status" shows actual readings
☐ "today" shows real energy data
☐ "battery" shows sensor battery level
☐ Notifications work (if subscribed)
```

### 14. Reports & Analytics

```bash
# Generate reports
☐ Daily summary generates correctly
☐ Weekly summary includes real data
☐ Monthly reports accurate
☐ PDF export works
☐ CSV export works
```

---

## 🚀 Deployment Commands

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Admin Account Creation
```bash
npm run seed
```

---

## 🔒 Security Checklist

```bash
☐ JWT_SECRET is strong and unique
☐ ADMIN_PASSWORD is complex
☐ Messenger tokens are secure
☐ CORS_ORIGIN configured correctly
☐ MongoDB has authentication enabled
☐ API keys are generated securely
☐ .env file not committed to git
☐ SSL/TLS enabled for production
```

---

## 📝 Post-Deployment Tasks

### 1. Documentation

```bash
☐ Document sensor registration process
☐ Document API key management
☐ Create user guide for dashboard
☐ Create messenger bot command reference
```

### 2. Backup Strategy

```bash
☐ Set up MongoDB backups
☐ Configure backup schedule
☐ Test restore process
☐ Document recovery procedures
```

### 3. Monitoring Setup

```bash
☐ Set up application monitoring
☐ Configure alert notifications
☐ Monitor sensor uptime
☐ Track API response times
```

---

## 🐛 Troubleshooting

### Common Issues

**Application won't start:**
- Check MongoDB connection string
- Verify all env variables are set
- Check port 3000 is available

**Dashboard shows errors:**
- Verify backend is running
- Check CORS configuration
- Verify WebSocket connection

**Messenger bot not responding:**
- Check webhook configuration
- Verify page access token
- Check Facebook App settings

**Sensor readings not appearing:**
- Verify sensor API key
- Check ESP32 logs
- Verify POST request format
- Check server logs for errors

**Empty data in analytics:**
- Wait for first reading
- Check database has readings
- Verify date range in queries

---

## ✅ Final Verification

Before going live:

```bash
☐ All tests passing
☐ No console errors
☐ All features working
☐ Documentation complete
☐ Backups configured
☐ Monitoring active
☐ Team trained
☐ Support contacts ready
```

---

## 📞 Support Resources

- **Backend Logs:** Check console output or log files
- **Database:** MongoDB Atlas dashboard or local MongoDB
- **API Documentation:** http://localhost:3000/api (Swagger)
- **Messenger:** Facebook Developer Console

---

**Status:** System is production-ready and waiting for hardware sensors! 🎉
