import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApp, App } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Firebase Service
 *
 * Manages Firebase Admin SDK for real-time data synchronization.
 * Used ONLY for pushing latest sensor reading to Firestore for dashboard real-time updates.
 *
 * Data Flow:
 * 1. ESP32 → NestJS Backend → MongoDB (permanent storage)
 * 2. NestJS Backend → Firebase Firestore (temporary cache for real-time)
 * 3. Frontend → Listens to Firestore (instant updates)
 *
 * Why Firebase?
 * - Simpler than Socket.IO (auto-reconnect, offline support)
 * - Better reliability (Google infrastructure)
 * - No WebSocket connection management
 *
 * Important:
 * - Firebase is NOT the primary database
 * - Only stores LATEST reading (1 document)
 * - MongoDB still holds all historical data
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firestore: Firestore;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize Firebase Admin SDK on module startup
   */
  async onModuleInit() {
    try {
      // Get Firebase credentials from environment
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'); // Convert escaped newlines

      // Validate required config
      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          'Firebase credentials not configured. Real-time updates disabled.',
        );
        return;
      }

      // Check if app already exists (safe for hot-reload)
      let app: App;
      try {
        app = getApp(); // Get existing app
        this.logger.log('Firebase app already initialized (reusing)');
      } catch {
        // App doesn't exist, create it
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
        });
        this.logger.log('✓ Firebase app initialized successfully');
      }

      this.firestore = getFirestore(app);
      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error.message);
      this.logger.warn('Real-time updates will be disabled');
    }
  }

  /**
   * Push Latest Reading to Firestore
   *
   * Updates the "liveReadings/latest" document with new sensor data.
   * Frontend listens to this document for instant updates.
   *
   * @param reading - Sensor reading data
   *
   * Document Structure:
   * ```
   * liveReadings/latest {
   *   voltage: 5.2,
   *   current: 0.15,
   *   power: 0.78,
   *   energy: 0.2778,
   *   stepCount: 22,
   *   frequency: 1.5,
   *   capacitorVoltage: 110,
   *   batteryPercentage: 100,
   *   timestamp: "2025-01-16T10:30:00.000Z",
   *   sensorId: "6a5a35...",
   *   sensorName: "ESP32 Step Counter",
   *   updatedAt: Firestore.Timestamp
   * }
   * ```
   *
   * Error Handling:
   * - If Firebase fails, reading still saved in MongoDB
   * - Errors logged but don't affect main flow
   * - Non-blocking (fire and forget)
   */
  async pushLatestReading(reading: {
    voltage: number;
    current: number;
    power: number;
    energy?: number;
    stepCount?: number;
    frequency?: number;
    capacitorVoltage?: number;
    batteryPercentage?: number;
    timestamp: Date;
    sensorId: string;
    sensorName?: string;
  }): Promise<void> {
    if (!this.isInitialized) {
      // Firebase not configured, skip silently
      return;
    }

    try {
      const docRef = this.firestore.collection('liveReadings').doc('latest');

      await docRef.set(
        {
          voltage: reading.voltage,
          current: reading.current,
          power: reading.power,
          energy: reading.energy ?? 0,
          stepCount: reading.stepCount ?? 0,
          frequency: reading.frequency ?? 0,
          capacitorVoltage: reading.capacitorVoltage ?? 0,
          batteryPercentage: reading.batteryPercentage ?? 100,
          timestamp: reading.timestamp.toISOString(),
          sensorId: reading.sensorId,
          sensorName: reading.sensorName ?? 'Unknown Sensor',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }, // Merge with existing data
      );

      this.logger.debug('✓ Pushed reading to Firebase');
    } catch (error) {
      // Log error but don't throw (non-critical)
      this.logger.error('Failed to push to Firebase:', error.message);
    }
  }

  /**
   * Check if Firebase is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Firestore instance (for advanced usage)
   */
  getFirestore(): Firestore | null {
    return this.isInitialized ? this.firestore : null;
  }
}
