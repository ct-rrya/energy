import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { EnergyModule } from '../energy/energy.module';
import { SensorsModule } from '../sensors/sensors.module';
import {
  EnergyReading,
  EnergyReadingSchema,
} from '../iot/schemas/energy-reading.schema';
import { Sensor, SensorSchema } from '../sensors/schemas/sensor.schema';

/**
 * Analytics Module
 *
 * Centralized service for energy analytics calculations.
 *
 * Features:
 * - Daily/Weekly/Monthly energy summaries
 * - Peak generation detection
 * - Environmental impact calculation
 * - Cost savings estimation
 * - Trend analysis
 * - Comprehensive analytics (all in one)
 * - Historical analysis with AI insights (Phase 6)
 *
 * Architecture:
 * - Uses EnergyService for database queries (don't duplicate)
 * - Adds business logic on top of raw data
 * - Single source of truth for calculations
 *
 * Consumed By:
 * - Dashboard Module (real-time charts)
 * - Messenger Bot Module (chat responses)
 * - Analytics Controller (REST API)
 * - Reports Module (PDF generation - future)
 *
 * Dependencies:
 * - EnergyModule (for database queries)
 * - EnergyReading schema (for peak detection)
 * - Sensor schema (for sensor details)
 * - MessengerModule (for AI insights via GeminiAIService)
 *
 * Exports:
 * - AnalyticsService (for Dashboard and Messenger Bot)
 *
 * REST Endpoints:
 * - GET /api/analytics/comprehensive
 * - GET /api/analytics/daily
 * - GET /api/analytics/weekly
 * - GET /api/analytics/monthly
 * - GET /api/analytics/peak
 * - GET /api/analytics/environmental
 * - GET /api/analytics/cost-savings
 * - POST /api/analytics/historical-analysis (Phase 6)
 */
@Module({
  imports: [
    // Import EnergyModule to use EnergyService
    EnergyModule,

    // Import SensorsModule to use SensorsService (Phase 6)
    SensorsModule,

    // Import MessengerModule to use GeminiAIService for historical insights (Phase 6)
    forwardRef(() => require('../messenger/messenger.module').MessengerModule),

    // Import schemas for direct queries (peak detection)
    MongooseModule.forFeature([
      {
        name: EnergyReading.name,
        schema: EnergyReadingSchema,
      },
      {
        name: Sensor.name,
        schema: SensorSchema,
      },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService], // Export for Dashboard and Messenger Bot
})
export class AnalyticsModule {}
