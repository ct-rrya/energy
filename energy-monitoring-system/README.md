# Smart Footstep Energy Harvesting Monitoring System

## Project Overview

An IoT-based system that monitors electrical energy harvested from piezoelectric tiles installed on walkways. The system collects data from ESP32 devices, processes analytics, provides a real-time administrator dashboard, and engages the public through a Facebook Messenger Bot.

---

## Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Passport** - Authentication middleware
- **Socket.IO** - Real-time communication
- **Swagger** - API documentation
- **Axios** - HTTP client for Messenger API

### Frontend (Coming Soon)
- React + TypeScript
- Tailwind CSS

### Hardware
- ESP32 microcontroller
- Piezoelectric sensors
- Voltage/Current sensors

---

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── config/                    # Configuration files
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── messenger.config.ts
├── common/                    # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── auth/                      # Authentication (Phase 2)
├── users/                     # User management (Phase 3)
├── sensors/                   # Sensor management (Phase 4)
├── iot/                       # IoT data ingestion (Phase 5)
├── energy/                    # Energy monitoring (Phase 6)
├── dashboard/                 # Real-time dashboard (Phase 7)
├── analytics/                 # Data analytics (Phase 8)
├── messenger/                 # Messenger bot (Phase 9)
├── subscribers/               # Subscriber management (Phase 10)
├── notifications/             # Notification service (Phase 11)
└── reports/                   # Report generation (Phase 12)
```

---

## Getting Started

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd energy-monitoring-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   copy .env.example .env
   ```

4. **Update MongoDB connection string**
   
   In `.env`, replace `MONGODB_URI` with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/energy-monitoring?retryWrites=true&w=majority
   ```

5. **Generate JWT secret**
   
   Generate a secure random string for `JWT_SECRET` in `.env`

### Running the Application

**Development mode:**
```bash
npm run start:dev
```

**Seed initial admin account:**
```bash
npm run seed
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

**Access the application:**
- API: http://localhost:3000/api
- Swagger Documentation: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/health

---

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`

Interactive API documentation with all endpoints, request/response schemas, and the ability to test endpoints directly from the browser.

---

## API Standards

This project follows strict REST API standards for consistency and maintainability.

**📚 Full Documentation:** [API-STANDARDS.md](./API-STANDARDS.md)  
**⚡ Quick Reference:** [API-STANDARDS-QUICK-REFERENCE.md](./API-STANDARDS-QUICK-REFERENCE.md)

### Key Standards

- **URLs:** Plural nouns, kebab-case (`/api/users`, `/api/energy-readings`)
- **Methods:** GET (retrieve), POST (create), PATCH (update), DELETE (remove)
- **Response Format:** Standardized with `success`, `message`, `data` fields
- **Status Codes:** Appropriate HTTP status codes for each scenario
- **Timestamps:** ISO 8601 UTC format
- **Naming:** camelCase for fields, PascalCase for classes
- **Pagination:** limit-offset with meta information
- **Authentication:** JWT Bearer tokens

**All developers must follow these standards when implementing new features.**

---

## Development Roadmap

### ✅ Phase 1: Project Initialization (COMPLETED)
- [x] NestJS project setup
- [x] Dependencies installation
- [x] MongoDB configuration
- [x] Environment variables
- [x] Swagger documentation
- [x] Global validation
- [x] Error handling
- [x] Folder structure
- [x] Health check endpoints

### ✅ Phase 2: Authentication Module (COMPLETED)
- [x] User schema with bcrypt
- [x] Authentication DTOs
- [x] Users service (database operations)
- [x] Auth service (login logic, JWT generation)
- [x] JWT strategy and guard
- [x] CurrentUser decorator
- [x] Login endpoint (POST /api/auth/login)
- [x] Profile endpoint (GET /api/users/profile)
- [x] Admin seed script
- [x] Comprehensive testing
- [x] Swagger documentation

**📄 See:** [PHASE-2-SUMMARY.md](./PHASE-2-SUMMARY.md) for complete details

### ✅ Phase 3: Sensor Management Module (COMPLETED)
- [x] Sensor schema with MongoDB
- [x] API key generation for ESP32
- [x] Create sensor endpoint
- [x] List sensors endpoint
- [x] Get sensor details endpoint
- [x] Update sensor endpoint
- [x] Delete sensor endpoint (soft delete)
- [x] Regenerate API key endpoint
- [x] JWT authentication (admin only)
- [x] Swagger documentation
- [x] Comprehensive testing

**📄 See:** [PHASE-3-SENSORS-SUMMARY.md](./PHASE-3-SENSORS-SUMMARY.md) for complete details

### ✅ Phase 5: IoT Data Ingestion Module (COMPLETED)
- [x] Energy Reading schema with MongoDB
- [x] API key authentication guard
- [x] ESP32 data validation (DTO + Service)
- [x] Reading storage in database
- [x] Sensor lastSeenAt updates
- [x] Lightweight ESP32 responses
- [x] Comprehensive testing
- [x] ESP32 integration guide
- [x] Swagger documentation

**📄 See:** [PHASE-5-IOT-SUMMARY.md](./PHASE-5-IOT-SUMMARY.md) for complete details

### 📋 Phase 6: Energy Monitoring Module
- [ ] Energy data aggregation
- [ ] Real-time metrics calculation
- [ ] Historical data retrieval

### 📋 Phase 7: Dashboard Module
- [ ] Socket.IO gateway
- [ ] Real-time data broadcasting
- [ ] Client connection management

### 📋 Phase 8: Analytics Module
- [ ] Daily/weekly/monthly aggregations
- [ ] Peak time analysis
- [ ] Environmental impact calculation

### 📋 Phase 9: Messenger Module
- [ ] Messenger webhook setup
- [ ] Message processing
- [ ] Bot response handling

### 📋 Phase 10: Subscribers Module
- [ ] Subscription management
- [ ] User preferences
- [ ] Subscriber storage

### 📋 Phase 11: Notifications Module
- [ ] Alert triggering
- [ ] Scheduled reports
- [ ] Notification delivery

### 📋 Phase 12: Reports Module
- [ ] Report generation
- [ ] Data export
- [ ] Scheduled reports

### 📋 Phase 13: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

### 📋 Phase 14: Deployment
- [ ] Docker setup
- [ ] Production configuration
- [ ] Deployment documentation

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRATION` | JWT token expiration | `7d` |
| `ADMIN_NAME` | Initial admin name | `System Administrator` |
| `ADMIN_EMAIL` | Initial admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Initial admin password | `SecurePass123!` |
| `MESSENGER_PAGE_ACCESS_TOKEN` | Facebook page token | `EAAxxxxx...` |
| `IOT_API_KEY` | ESP32 authentication key | `your-iot-key` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3001` |

---

## Features

### For Administrators
- 🔐 Secure authentication
- 📊 Real-time dashboard
- 📈 Energy analytics
- 📝 Sensor management
- 👥 Subscriber management
- 📄 Report generation

### For Public Users (via Messenger Bot)
- 📱 Subscribe to updates
- ⚡ View current energy production
- 📊 Request daily statistics
- 🌱 View environmental impact
- 🔔 Receive notifications

---

## Development Principles

This project follows:
- **Clean Architecture**
- **SOLID Principles**
- **Feature-based modular structure**
- **RESTful API standards**
- **Type safety with TypeScript**
- **Comprehensive validation**
- **Proper error handling**
- **Security best practices**

---

## Contributing

This is an undergraduate capstone project. Development follows a structured phase-by-phase approach.

---

## License

This project is for educational purposes as part of an undergraduate capstone project.

---

## Author

Undergraduate Capstone Project - Smart Footstep Energy Harvesting System

---

## Next Steps

**Ready to proceed to Phase 7: Dashboard Module (Real-time Socket.IO)**

Phase 5 (IoT Data Ingestion) has been completed successfully! The system can now:
- ✅ Receive energy readings from ESP32 devices
- ✅ Authenticate using API keys
- ✅ Validate sensor data (ranges, timestamps)
- ✅ Store readings in MongoDB
- ✅ Update sensor health (lastSeenAt)
- ✅ Return lightweight responses to ESP32

The complete ESP32 → MongoDB data pipeline is working!

**To test IoT module:**
1. Start server: `npm run start:dev`
2. Test complete flow: `node test-iot.js`
3. Explore API: http://localhost:3000/api/docs
4. Check IoT endpoint: POST /api/iot/readings
