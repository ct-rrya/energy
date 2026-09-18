import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { io, Socket } from 'socket.io-client';

/**
 * ESP32 Data Reception Pipeline E2E Tests
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.6, 13.7
 *
 * This test suite verifies the complete ESP32 IoT data pipeline:
 * 1. POST /api/iot/readings endpoint accepts hardware data
 * 2. Data is stored with source='hardware'
 * 3. WebSocket broadcasting of real-time readings works
 * 4. Frontend can receive real-time readings
 * 5. IOT_API_KEY authentication is preserved
 *
 * Test Approach:
 * - Uses real database connection (MongoDB)
 * - Creates test sensor with valid API key
 * - Sends readings via HTTP endpoint
 * - Verifies database storage
 * - Tests WebSocket events
 * - Cleans up test data after completion
 */
describe('ESP32 Data Reception Pipeline (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let wsClient: Socket;
  let testSensorId: string;
  let testApiKey: string;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    await app.listen(0); // Random port

    // Get MongoDB connection for cleanup
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

    // Setup: Create a test sensor with API key
    await setupTestSensor();

    // Setup: Get JWT token for authenticated user
    await setupJwtToken();
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await cleanupTestData();

    // Close WebSocket if connected
    if (wsClient && wsClient.connected) {
      wsClient.disconnect();
    }

    await app.close();
  });

  /**
   * Setup: Create Test Sensor
   *
   * Creates a sensor document in the database with a test API key.
   * This simulates an ESP32 device registered in the system.
   */
  async function setupTestSensor() {
    const sensorsCollection = mongoConnection.collection('sensors');

    testApiKey = 'esp32_test_' + Math.random().toString(36).substring(2, 15);

    const testSensor = {
      name: 'Test ESP32 Sensor',
      location: 'Test Lab',
      apiKey: testApiKey,
      status: 'active',
      model: 'ESP32-WROOM-32',
      firmwareVersion: '1.0.0',
      installationDate: new Date(),
      lastSeenAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await sensorsCollection.insertOne(testSensor);
    testSensorId = result.insertedId.toString();
  }

  /**
   * Setup: Get JWT Token
   *
   * Authenticates as admin user to get JWT token for WebSocket connection.
   */
  async function setupJwtToken() {
    // Use the test JWT from .env or login
    jwtToken = process.env.JWT_TOKEN_TEST || '';

    if (!jwtToken) {
      // Login as admin to get token
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@energymonitor.com',
          password: 'Admin@2024!',
        })
        .expect(200);

      jwtToken = response.body.access_token;
    }
  }

  /**
   * Cleanup: Remove Test Data
   *
   * Removes all test sensor data and readings from the database.
   */
  async function cleanupTestData() {
    if (!mongoConnection || !testSensorId) return;

    const sensorsCollection = mongoConnection.collection('sensors');
    const readingsCollection = mongoConnection.collection('energy_readings');

    // Delete test readings
    await readingsCollection.deleteMany({ sensorId: testSensorId });

    // Delete test sensor
    await sensorsCollection.deleteOne({ apiKey: testApiKey });
  }

  /**
   * Test 1: Verify /api/iot/readings endpoint accepts ESP32 hardware data
   *
   * Validates: Requirement 13.1
   *
   * This test confirms that the endpoint:
   * - Accepts POST requests
   * - Validates API key authentication
   * - Returns 201 Created on success
   * - Returns lightweight response with reading ID
   */
  describe('POST /api/iot/readings', () => {
    it('should accept hardware data with valid API key', async () => {
      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        batteryPercentage: 85,
        temperature: 28.5,
        frequency: 50,
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', testApiKey)
        .send(readingData)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('readingId');
      expect(response.body).toHaveProperty('receivedAt');
      expect(typeof response.body.readingId).toBe('string');
      expect(response.body.readingId).toMatch(/^[0-9a-f]{24}$/); // MongoDB ObjectId format
    });

    it('should reject request without API key', async () => {
      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .send(readingData)
        .expect(401);
    });

    it('should reject request with invalid API key', async () => {
      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', 'invalid_api_key_12345')
        .send(readingData)
        .expect(401);
    });

    it('should validate reading data ranges', async () => {
      const invalidReadingData = {
        voltage: -5, // Invalid: negative voltage
        current: 0.15,
        power: 0.78,
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', testApiKey)
        .send(invalidReadingData)
        .expect(400);
    });

    it('should reject future timestamps', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        timestamp: futureDate.toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', testApiKey)
        .send(readingData)
        .expect(400);
    });
  });

  /**
   * Test 2: Verify data is stored with source='hardware'
   *
   * Validates: Requirement 13.2
   *
   * This test confirms that:
   * - Readings are stored in MongoDB
   * - The source field is set to 'hardware'
   * - All data fields are preserved correctly
   */
  describe('Data Storage with source=hardware', () => {
    it('should store reading with source=hardware in database', async () => {
      const readingData = {
        voltage: 5.5,
        current: 0.2,
        power: 1.1,
        batteryPercentage: 90,
        temperature: 27.0,
        frequency: 50,
        timestamp: new Date().toISOString(),
      };

      // Send reading via API
      const response = await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', testApiKey)
        .send(readingData)
        .expect(201);

      const readingId = response.body.readingId;

      // Query database directly to verify storage
      const readingsCollection = mongoConnection.collection('energy_readings');
      const storedReading = await readingsCollection.findOne({
        _id: readingId,
      });

      // Verify reading exists
      expect(storedReading).not.toBeNull();

      // Verify source is 'hardware'
      expect(storedReading?.source).toBe('hardware');

      // Verify all data fields
      expect(storedReading?.voltage).toBe(readingData.voltage);
      expect(storedReading?.current).toBe(readingData.current);
      expect(storedReading?.power).toBe(readingData.power);
      expect(storedReading?.batteryPercentage).toBe(
        readingData.batteryPercentage,
      );
      expect(storedReading?.temperature).toBe(readingData.temperature);
      expect(storedReading?.frequency).toBe(readingData.frequency);

      // Verify sensorId is linked
      expect(storedReading?.sensorId.toString()).toBe(testSensorId);

      // Verify timestamps
      expect(storedReading?.timestamp).toBeInstanceOf(Date);
      expect(storedReading?.receivedAt).toBeInstanceOf(Date);
    });

    it('should NOT store readings with source=mock', async () => {
      // Query database for mock data
      const readingsCollection = mongoConnection.collection('energy_readings');
      const mockReadings = await readingsCollection
        .find({ source: 'mock' })
        .toArray();

      // After demo data cleanup, there should be NO mock data
      // This test verifies the cleanup was successful
      expect(mockReadings.length).toBe(0);
    });
  });

  /**
   * Test 3: Verify WebSocket broadcasting of real-time readings
   *
   * Validates: Requirement 13.3
   *
   * This test confirms that:
   * - WebSocket connection is established successfully
   * - JWT authentication works for WebSocket
   * - Real-time reading events are broadcasted
   * - Event data structure is correct
   */
  describe('WebSocket Broadcasting', () => {
    beforeEach((done) => {
      // Connect to WebSocket server
      const serverAddress = app.getHttpServer().address();
      const port =
        typeof serverAddress === 'string' ? 3000 : serverAddress?.port || 3000;

      wsClient = io(`http://localhost:${port}/dashboard`, {
        auth: {
          token: jwtToken,
        },
        transports: ['websocket'],
      });

      wsClient.on('connect', () => {
        done();
      });

      wsClient.on('connect_error', (error) => {
        done(error);
      });
    });

    afterEach(() => {
      if (wsClient && wsClient.connected) {
        wsClient.disconnect();
      }
    });

    it('should broadcast reading:new event when ESP32 sends data', (done) => {
      const readingData = {
        voltage: 5.8,
        current: 0.25,
        power: 1.45,
        batteryPercentage: 95,
        temperature: 26.5,
        frequency: 50,
        timestamp: new Date().toISOString(),
      };

      // Listen for the reading:new event
      wsClient.on('reading:new', (data) => {
        try {
          // Verify event data structure
          expect(data).toHaveProperty('id');
          expect(data).toHaveProperty('sensorId');
          expect(data).toHaveProperty('sensorName');
          expect(data).toHaveProperty('sensorLocation');
          expect(data).toHaveProperty('voltage');
          expect(data).toHaveProperty('current');
          expect(data).toHaveProperty('power');
          expect(data).toHaveProperty('timestamp');
          expect(data).toHaveProperty('receivedAt');

          // Verify sensor data
          expect(data.sensorId).toBe(testSensorId);
          expect(data.sensorName).toBe('Test ESP32 Sensor');

          // Verify reading data
          expect(data.voltage).toBe(readingData.voltage);
          expect(data.current).toBe(readingData.current);
          expect(data.power).toBe(readingData.power);

          done();
        } catch (error) {
          done(error);
        }
      });

      // Send reading via HTTP endpoint
      // This should trigger the WebSocket broadcast
      setTimeout(() => {
        request(app.getHttpServer())
          .post('/api/iot/readings')
          .set('X-API-Key', testApiKey)
          .send(readingData)
          .expect(201)
          .catch(done);
      }, 100);
    }, 10000); // 10 second timeout

    it('should authenticate WebSocket connection with JWT', (done) => {
      // Listen for authentication confirmation
      wsClient.on('connection:authenticated', (data) => {
        try {
          expect(data).toHaveProperty('userId');
          expect(data).toHaveProperty('email');
          expect(data).toHaveProperty('role');
          expect(data).toHaveProperty('connectedAt');
          expect(data).toHaveProperty('message');
          expect(data.message).toContain('Successfully connected');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 5000);

    it('should reject WebSocket connection without JWT', (done) => {
      // Create client without auth token
      const serverAddress = app.getHttpServer().address();
      const port =
        typeof serverAddress === 'string' ? 3000 : serverAddress?.port || 3000;

      const unauthClient = io(`http://localhost:${port}/dashboard`, {
        transports: ['websocket'],
      });

      unauthClient.on('connect', () => {
        done(new Error('Client should not connect without JWT'));
      });

      unauthClient.on('error', (error) => {
        expect(error).toBeDefined();
        unauthClient.disconnect();
        done();
      });

      unauthClient.on('disconnect', () => {
        unauthClient.disconnect();
        done();
      });

      // Give it some time to attempt connection
      setTimeout(() => {
        if (!unauthClient.connected) {
          unauthClient.disconnect();
          done();
        }
      }, 2000);
    }, 5000);
  });

  /**
   * Test 4: Verify sensor lastSeenAt is updated
   *
   * Validates: Requirement 13.7
   *
   * This test confirms that:
   * - Sensor lastSeenAt timestamp is updated when readings are received
   * - The update happens asynchronously (fire-and-forget)
   */
  describe('Sensor LastSeen Update', () => {
    it('should update sensor lastSeenAt when receiving reading', async () => {
      // Get current lastSeenAt
      const sensorsCollection = mongoConnection.collection('sensors');
      const sensorBefore = await sensorsCollection.findOne({
        apiKey: testApiKey,
      });
      const lastSeenBefore = sensorBefore?.lastSeenAt;

      // Wait a moment to ensure timestamp will be different
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send reading
      const readingData = {
        voltage: 5.3,
        current: 0.18,
        power: 0.95,
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', testApiKey)
        .send(readingData)
        .expect(201);

      // Wait for async update to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get updated sensor
      const sensorAfter = await sensorsCollection.findOne({
        apiKey: testApiKey,
      });
      const lastSeenAfter = sensorAfter?.lastSeenAt;

      // Verify lastSeenAt was updated
      expect(lastSeenAfter).not.toBeNull();

      if (lastSeenBefore) {
        expect(new Date(lastSeenAfter).getTime()).toBeGreaterThan(
          new Date(lastSeenBefore).getTime(),
        );
      }
    });
  });

  /**
   * Test 5: Verify complete data pipeline integration
   *
   * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.6, 13.7
   *
   * This is an integration test that verifies the entire pipeline:
   * 1. ESP32 sends data → API endpoint
   * 2. API authenticates and validates
   * 3. Data is stored in MongoDB with source='hardware'
   * 4. WebSocket broadcasts real-time event
   * 5. Frontend receives the event
   * 6. Sensor lastSeenAt is updated
   */
  describe('Complete Pipeline Integration', () => {
    it('should handle complete ESP32 data flow from submission to frontend', (done) => {
      const readingData = {
        voltage: 6.0,
        current: 0.3,
        power: 1.8,
        batteryPercentage: 88,
        temperature: 29.0,
        frequency: 50,
        timestamp: new Date().toISOString(),
      };

      let readingId: string;
      let websocketReceived = false;
      let databaseVerified = false;

      // Step 1: Setup WebSocket listener
      const serverAddress = app.getHttpServer().address();
      const port =
        typeof serverAddress === 'string' ? 3000 : serverAddress?.port || 3000;

      const integrationClient = io(`http://localhost:${port}/dashboard`, {
        auth: { token: jwtToken },
        transports: ['websocket'],
      });

      integrationClient.on('connect', () => {
        // Step 2: Listen for broadcast
        integrationClient.on('reading:new', async (data) => {
          websocketReceived = true;

          // Verify WebSocket data
          expect(data.voltage).toBe(readingData.voltage);
          expect(data.power).toBe(readingData.power);

          // Step 4: Verify database storage
          const readingsCollection =
            mongoConnection.collection('energy_readings');
          const storedReading = await readingsCollection.findOne({
            _id: readingId,
          });

          expect(storedReading).not.toBeNull();
          expect(storedReading?.source).toBe('hardware');
          expect(storedReading?.voltage).toBe(readingData.voltage);
          databaseVerified = true;

          // Verify sensor update
          const sensorsCollection = mongoConnection.collection('sensors');
          const sensor = await sensorsCollection.findOne({
            apiKey: testApiKey,
          });
          expect(sensor?.lastSeenAt).not.toBeNull();

          // Cleanup and complete
          integrationClient.disconnect();

          // Check all validations passed
          expect(websocketReceived).toBe(true);
          expect(databaseVerified).toBe(true);
          done();
        });

        // Step 3: Send reading via API
        setTimeout(() => {
          request(app.getHttpServer())
            .post('/api/iot/readings')
            .set('X-API-Key', testApiKey)
            .send(readingData)
            .expect(201)
            .then((response) => {
              readingId = response.body.readingId;
              expect(readingId).toBeDefined();
            })
            .catch(done);
        }, 100);
      });

      integrationClient.on('connect_error', (error) => {
        integrationClient.disconnect();
        done(error);
      });
    }, 15000); // 15 second timeout for complete integration
  });

  /**
   * Test 6: Verify API key authentication is preserved
   *
   * Validates: Requirement 13.6
   *
   * This test confirms that IOT_API_KEY authentication:
   * - Is properly enforced on all IoT endpoints
   * - Uses X-API-Key header format
   * - Validates against sensors collection
   * - Rejects inactive sensors
   */
  describe('IOT_API_KEY Authentication', () => {
    it('should require X-API-Key header', async () => {
      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        timestamp: new Date().toISOString(),
      };

      // Missing header
      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .send(readingData)
        .expect(401);

      // Empty header
      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', '')
        .send(readingData)
        .expect(401);
    });

    it('should validate API key against database', async () => {
      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        timestamp: new Date().toISOString(),
      };

      // Non-existent API key
      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', 'esp32_nonexistent_key')
        .send(readingData)
        .expect(401);
    });

    it('should reject inactive sensors', async () => {
      // Create inactive sensor
      const sensorsCollection = mongoConnection.collection('sensors');
      const inactiveApiKey =
        'esp32_inactive_' + Math.random().toString(36).substring(2, 15);

      await sensorsCollection.insertOne({
        name: 'Inactive Sensor',
        location: 'Test',
        apiKey: inactiveApiKey,
        status: 'inactive', // Not active
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const readingData = {
        voltage: 5.2,
        current: 0.15,
        power: 0.78,
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/api/iot/readings')
        .set('X-API-Key', inactiveApiKey)
        .send(readingData)
        .expect(401);

      // Cleanup
      await sensorsCollection.deleteOne({ apiKey: inactiveApiKey });
    });
  });
});
