import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sensor, SensorSchema } from './schemas/sensor.schema';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';

/**
 * Sensors Module
 * 
 * Manages sensor device registration and configuration.
 * 
 * Responsibilities:
 * - Sensor CRUD operations
 * - API key generation and management
 * - Sensor status tracking
 * - Administrative sensor management
 * 
 * Components:
 * - Schema: Sensor (MongoDB model)
 * - Service: SensorsService (business logic)
 * - Controller: SensorsController (REST API)
 * 
 * Dependencies:
 * - MongooseModule: Database operations
 * - AuthModule: JWT authentication (imported via guards)
 * 
 * Exports:
 * - SensorsService: Used by IoT module for API key validation
 * 
 * Authentication:
 * - All endpoints require JWT authentication
 * - Only administrators can manage sensors
 * - JwtAuthGuard applied at controller level
 * 
 * Future Phases:
 * - Phase 5 (IoT): Uses SensorsService for API key validation
 * - Phase 6 (Energy): Links readings to sensors
 * - Phase 7 (Dashboard): Displays sensor status
 * - Phase 8 (Analytics): Aggregates data by sensor
 */
@Module({
  imports: [
    // Register Sensor schema with Mongoose
    MongooseModule.forFeature([
      {
        name: Sensor.name,
        schema: SensorSchema,
      },
    ]),
  ],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService], // Export for use in IoT module (Phase 5)
})
export class SensorsModule {}
