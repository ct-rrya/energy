import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnergyController } from './energy.controller';
import { EnergyService } from './energy.service';
import {
  EnergyReading,
  EnergyReadingSchema,
} from '../iot/schemas/energy-reading.schema';

/**
 * Energy Module
 * 
 * Provides energy data query and analytics capabilities.
 * 
 * Responsibilities:
 * - Query energy readings
 * - Aggregate energy statistics
 * - Filter by sensor, date, range
 * - Calculate today's totals
 * - Provide recent readings
 * 
 * Does NOT:
 * - Store readings (IoT module handles this)
 * - Authenticate ESP32 (IoT module handles this)
 * - Emit real-time events (Dashboard module handles this)
 * 
 * Dependencies:
 * - IoT Module's EnergyReading schema (shared)
 * - Auth Module's JWT Guard (authentication)
 * - MongoDB for queries
 * 
 * Database:
 * - Uses energy_readings collection
 * - Requires indexes for optimal performance
 * - Read-only operations (no writes)
 * 
 * Performance:
 * - All queries use indexes
 * - Aggregation pipelines optimized
 * - Result sets limited to prevent memory issues
 * - Consider caching for frequently requested data
 */
@Module({
  imports: [
    // Import EnergyReading schema from IoT module
    // This allows EnergyService to query the energy_readings collection
    MongooseModule.forFeature([
      {
        name: EnergyReading.name,
        schema: EnergyReadingSchema,
      },
    ]),
  ],
  controllers: [EnergyController],
  providers: [EnergyService],
  exports: [EnergyService], // Export for Dashboard module (future)
})
export class EnergyModule {}
