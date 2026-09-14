import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EnergyReading,
  EnergyReadingSchema,
} from './schemas/energy-reading.schema';
import { IotService } from './iot.service';
import { IotController } from './iot.controller';
import { SensorsModule } from '../sensors/sensors.module';
import { DashboardModule } from '../dashboard/dashboard.module';

/**
 * IoT Module
 *
 * Handles data ingestion from ESP32 devices.
 *
 * Responsibilities:
 * - Accept HTTP requests from ESP32
 * - Authenticate using API keys
 * - Validate sensor readings
 * - Store readings in database
 * - Update sensor health status
 * - Broadcast real-time events to dashboard
 * - Return lightweight responses
 *
 * Components:
 * - Schema: EnergyReading (MongoDB model)
 * - Service: IotService (business logic)
 * - Controller: IotController (HTTP endpoint)
 * - Guard: ApiKeyGuard (authentication)
 * - Decorator: ApiKey (parameter extraction)
 *
 * Dependencies:
 * - MongooseModule: Database operations
 * - SensorsModule: API key validation, sensor updates
 * - DashboardModule: Real-time WebSocket broadcasts
 *
 * Exports:
 * - IotService: May be used by Analytics module
 *
 * Authentication:
 * - Uses ApiKeyGuard (not JWT)
 * - API key in X-API-Key header
 * - Validates against Sensors collection
 *
 * Real-time Events:
 * - reading:new - Broadcasted when new reading stored
 * - alert:power - Broadcasted when power exceeds threshold
 * - sensor:update - Broadcasted when sensor lastSeen updated
 */
@Module({
  imports: [
    // Register EnergyReading schema with Mongoose
    MongooseModule.forFeature([
      {
        name: EnergyReading.name,
        schema: EnergyReadingSchema,
      },
    ]),

    // Import SensorsModule to access SensorsService
    // Needed for API key validation and lastSeen updates
    SensorsModule,

    // Import DashboardModule for real-time broadcasts
    // Use forwardRef to resolve circular dependency
    forwardRef(() => DashboardModule),
  ],
  controllers: [IotController],
  providers: [IotService],
  exports: [IotService], // Export for use in Analytics module
})
export class IotModule {}
