import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { EnergyModule } from '../energy/energy.module';

/**
 * PublicModule
 *
 * Provides public API endpoints (telemetry, etc.)
 *
 * Requirements: 11.1, 11.2, 11.10
 */
@Module({
  imports: [
    EnergyModule, // For accessing EnergyService to get telemetry data
    // CacheModule configuration at app level
  ],
  controllers: [PublicController],
})
export class PublicModule {}
