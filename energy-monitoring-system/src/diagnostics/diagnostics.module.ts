import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReferenceConfig,
  ReferenceConfigSchema,
} from './schemas/reference-config.schema';
import {
  DiagnosticTest,
  DiagnosticTestSchema,
} from './schemas/diagnostic-test.schema';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsController } from './diagnostics.controller';
import { DashboardModule } from '../dashboard/dashboard.module';

/**
 * DiagnosticsModule
 *
 * Provides admin-only system diagnostic capabilities for measuring
 * overall energy harvesting performance through standardized reference tests.
 *
 * Features:
 * - Reference configuration management (baseline values)
 * - Diagnostic test recording and comparison
 * - Historical tracking of test results
 * - Separation from normal telemetry data
 * - WebSocket event broadcasting for real-time UI updates
 *
 * Security:
 * - JWT authentication required (JwtAuthGuard)
 * - Admin role required (RolesGuard)
 * - Rate limiting applied per endpoint
 *
 * Dependencies:
 * - DashboardModule: For WebSocket event broadcasting
 * - MongooseModule: For database schemas (ReferenceConfig, DiagnosticTest)
 *
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.7, 16.8, 15.4, 15.5
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReferenceConfig.name, schema: ReferenceConfigSchema },
      { name: DiagnosticTest.name, schema: DiagnosticTestSchema },
    ]),
    DashboardModule, // For DashboardGateway WebSocket broadcasting
  ],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
