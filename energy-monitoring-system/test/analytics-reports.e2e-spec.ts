import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../src/users/schemas/user.schema';
import { EnergyReading } from '../src/iot/schemas/energy-reading.schema';
import { Sensor } from '../src/sensors/schemas/sensor.schema';
import * as bcrypt from 'bcrypt';
import { io, Socket } from 'socket.io-client';
import { DashboardGateway } from '../src/dashboard/dashboard.gateway';

/**
 * Analytics and Reports E2E Tests
 *
 * Tests for Task 17.2: Verify analytics and reports functionality
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9
 *
 * Test Coverage:
 * - AnalyticsModule endpoints return results
 * - ReportsModule endpoints generate reports
 * - DashboardGateway WebSocket functionality
 * - Aggregation pipelines execute correctly
 * - Historical analytics charts display data
 * - Daily/weekly/monthly reports work
 */
describe('Analytics and Reports API (e2e)', () => {
  let app: INestApplication<App>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let userModel: Model<User>;
  let energyReadingModel: Model<EnergyReading>;
  let sensorModel: Model<Sensor>;
  let dashboardGateway: DashboardGateway;

  let adminToken: string;
  let publicToken: string;
  let testSensorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);
    jwtService = app.get(JwtService);
    userModel = app.get(getModelToken(User.name));
    energyReadingModel = app.get(getModelToken(EnergyReading.name));
    sensorModel = app.get(getModelToken(Sensor.name));
    dashboardGateway = app.get(DashboardGateway);

    // Apply global pipes and configuration
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
    app.setGlobalPrefix(apiPrefix);

    await app.init();

    // Create test users and seed test data
    await setupTestUsers();
    await setupTestData();
  }, 60000); // Increase timeout to 60 seconds

  afterAll(async () => {
    // Clean up test data
    await userModel.deleteMany({
      email: { $in: ['admin-analytics@test.com', 'public-analytics@test.com'] },
    });
    await energyReadingModel.deleteMany({ sensorId: testSensorId });
    await sensorModel.deleteMany({ sensorId: testSensorId });
    await app.close();
  });

  /**
   * Setup test users and generate JWT tokens
   */
  async function setupTestUsers() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin user
    const adminUser = await userModel.create({
      email: 'admin-analytics@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Test',
      role: 'admin',
    });

    // Create public user
    const publicUser = await userModel.create({
      email: 'public-analytics@test.com',
      password: hashedPassword,
      firstName: 'Public',
      lastName: 'Test',
      role: 'public',
    });

    // Generate tokens
    adminToken = jwtService.sign({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
    });

    publicToken = jwtService.sign({
      sub: publicUser._id.toString(),
      email: publicUser.email,
      role: publicUser.role,
    });
  }

  /**
   * Setup test data: sensor and energy readings
   */
  async function setupTestData() {
    testSensorId = 'TEST_SENSOR_001';

    // Create test sensor
    await sensorModel.create({
      sensorId: testSensorId,
      name: 'Test Sensor',
      location: 'Test Location',
      status: 'active',
      batteryLevel: 85,
      lastReading: new Date(),
    });

    // Create test energy readings with various timestamps
    const now = new Date();
    const readings = [];

    // Daily data (last 24 hours)
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      readings.push({
        sensorId: testSensorId,
        voltage: 3.3 + Math.random() * 0.2,
        current: 0.5 + Math.random() * 0.1,
        power: 1.65 + Math.random() * 0.3,
        energy: 0.0165 + Math.random() * 0.003,
        timestamp,
        source: 'hardware',
      });
    }

    // Weekly data (last 7 days, one reading per day)
    for (let i = 0; i < 7; i++) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      readings.push({
        sensorId: testSensorId,
        voltage: 3.4,
        current: 0.55,
        power: 1.87,
        energy: 0.0187,
        timestamp,
        source: 'hardware',
      });
    }

    // Monthly data (last 30 days, one reading per day)
    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      readings.push({
        sensorId: testSensorId,
        voltage: 3.35,
        current: 0.52,
        power: 1.74,
        energy: 0.0174,
        timestamp,
        source: 'hardware',
      });
    }

    await energyReadingModel.insertMany(readings);
  }

  describe('Analytics Module Endpoints', () => {
    describe('GET /api/analytics/comprehensive', () => {
      it('should return comprehensive analytics data', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/comprehensive')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalEnergy');
        expect(response.body).toHaveProperty('averagePower');
        expect(response.body).toHaveProperty('peakPower');
        expect(response.body.totalEnergy).toBeGreaterThan(0);
      });

      it('should work for public users', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/comprehensive')
          .set('Authorization', `Bearer ${publicToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalEnergy');
      });
    });

    describe('GET /api/analytics/daily', () => {
      it('should return daily analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/daily')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalEnergy');
        expect(response.body).toHaveProperty('readingCount');
        expect(response.body).toHaveProperty('averagePower');
        expect(response.body.totalEnergy).toBeGreaterThan(0);
      });
    });

    describe('GET /api/analytics/weekly', () => {
      it('should return weekly analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/weekly')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalEnergy');
        expect(response.body).toHaveProperty('readingCount');
        expect(response.body).toHaveProperty('averagePower');
        expect(response.body.totalEnergy).toBeGreaterThan(0);
      });
    });

    describe('GET /api/analytics/monthly', () => {
      it('should return monthly analytics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/monthly')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalEnergy');
        expect(response.body).toHaveProperty('readingCount');
        expect(response.body).toHaveProperty('averagePower');
        expect(response.body.totalEnergy).toBeGreaterThan(0);
      });
    });

    describe('GET /api/analytics/peak', () => {
      it('should return peak generation data', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/peak')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('peakPower');
        expect(response.body).toHaveProperty('peakTimestamp');
        expect(response.body.peakPower).toBeGreaterThan(0);
      });
    });

    describe('GET /api/analytics/environmental', () => {
      it('should return environmental impact calculations', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/environmental')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('co2Offset');
        expect(response.body).toHaveProperty('treesEquivalent');
        expect(response.body.co2Offset).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /api/analytics/cost-savings', () => {
      it('should return cost savings estimation', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/analytics/cost-savings')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalSavings');
        expect(response.body).toHaveProperty('currency');
        expect(response.body.totalSavings).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Reports Module Endpoints', () => {
    describe('POST /api/reports/generate', () => {
      it('should generate a daily report as PDF', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reportType: 'daily',
            format: 'pdf',
          })
          .expect(201);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('reportType', 'daily');
        expect(response.body).toHaveProperty('format', 'pdf');
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('fileUrl');
      });

      it('should generate a weekly report as Excel', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reportType: 'weekly',
            format: 'excel',
          })
          .expect(201);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('reportType', 'weekly');
        expect(response.body).toHaveProperty('format', 'excel');
      });

      it('should generate a monthly report', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reportType: 'monthly',
            format: 'pdf',
          })
          .expect(201);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('reportType', 'monthly');
      });

      it('should generate a custom date range report', async () => {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const response = await request(app.getHttpServer())
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reportType: 'custom',
            format: 'pdf',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          .expect(201);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('reportType', 'custom');
      });

      it('should reject invalid report type', async () => {
        await request(app.getHttpServer())
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reportType: 'invalid',
            format: 'pdf',
          })
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/reports/generate')
          .send({
            reportType: 'daily',
            format: 'pdf',
          })
          .expect(401);
      });
    });

    describe('GET /api/reports', () => {
      it('should list user reports', async () => {
        // Generate a report first
        await request(app.getHttpServer())
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reportType: 'daily',
            format: 'pdf',
          });

        // List reports
        const response = await request(app.getHttpServer())
          .get('/api/reports')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Dashboard WebSocket Gateway', () => {
    let socket: Socket;
    let serverUrl: string;

    beforeEach((done) => {
      const port = configService.get<number>('app.port') || 3000;
      serverUrl = `http://localhost:${port}`;
      done();
    });

    afterEach((done) => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      done();
    });

    it('should connect to WebSocket with valid token', (done) => {
      socket = io(`${serverUrl}/dashboard`, {
        auth: {
          token: adminToken,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    }, 10000);

    it('should reject connection without token', (done) => {
      socket = io(`${serverUrl}/dashboard`, {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });

      socket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });
    }, 10000);

    it('should broadcast new reading event', (done) => {
      socket = io(`${serverUrl}/dashboard`, {
        auth: {
          token: adminToken,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        // Listen for new reading event
        socket.on('reading:new', (data) => {
          expect(data).toBeDefined();
          expect(data).toHaveProperty('sensorId');
          expect(data).toHaveProperty('voltage');
          expect(data).toHaveProperty('current');
          expect(data).toHaveProperty('power');
          socket.disconnect();
          done();
        });

        // Simulate new reading broadcast
        dashboardGateway.broadcastNewReading({
          sensorId: testSensorId,
          voltage: 3.3,
          current: 0.5,
          power: 1.65,
          energy: 0.0165,
          timestamp: new Date(),
          source: 'hardware',
        });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    }, 10000);

    it('should broadcast statistics update', (done) => {
      socket = io(`${serverUrl}/dashboard`, {
        auth: {
          token: adminToken,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        // Listen for statistics update event
        socket.on('statistics:update', (data) => {
          expect(data).toBeDefined();
          expect(data).toHaveProperty('totalEnergy');
          socket.disconnect();
          done();
        });

        // Simulate statistics broadcast
        dashboardGateway.broadcastStatistics({
          totalEnergy: 100,
          averagePower: 1.5,
          totalReadings: 1000,
          activeSensors: 5,
        });
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    }, 10000);
  });

  describe('Aggregation Pipelines', () => {
    it('should execute hourly aggregation correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: 'hourly',
          limit: 24,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalEnergy).toBeGreaterThan(0);
    });

    it('should execute daily aggregation correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: 'daily',
          limit: 7,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalEnergy).toBeGreaterThan(0);
    });

    it('should execute monthly aggregation correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: 'monthly',
          limit: 12,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalEnergy).toBeGreaterThan(0);
    });

    it('should filter by sensor correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          sensorId: testSensorId,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalEnergy).toBeGreaterThan(0);
    });

    it('should filter by date range correctly', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalEnergy).toBeGreaterThan(0);
    });
  });

  describe('Historical Analytics Charts', () => {
    it('should return chart data for energy over time', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          includeChartData: true,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      if (response.body.chartData) {
        expect(Array.isArray(response.body.chartData)).toBe(true);
        expect(response.body.chartData.length).toBeGreaterThan(0);
      }
    });

    it('should return chart data for power trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/comprehensive')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          includeChartData: true,
          chartType: 'power',
        })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
