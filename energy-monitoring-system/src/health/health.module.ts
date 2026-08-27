import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health Module
 * 
 * Provides health check endpoints for monitoring system health.
 * This module is essential for production deployments where
 * load balancers and orchestration tools need to know if the
 * service is healthy and ready to accept traffic.
 */
@Module({
  imports: [MongooseModule, ConfigModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService], // Export for use in other modules if needed
})
export class HealthModule {}
