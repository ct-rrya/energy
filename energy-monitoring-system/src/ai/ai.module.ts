import { Module } from '@nestjs/common';
import { GeminiAIService } from './gemini-ai.service';

/**
 * AI Module
 *
 * Standalone module for AI services with no circular dependencies.
 * Only depends on ConfigModule (automatically available globally).
 *
 * Exports:
 * - GeminiAIService: AI query processing and insights generation
 *
 * Usage:
 * Import this module in any module that needs AI capabilities:
 * - DashboardModule (for hero card insights)
 * - ReportsModule (for report analysis)
 * - AnalyticsModule (for historical analysis)
 */
@Module({
  providers: [GeminiAIService],
  exports: [GeminiAIService],
})
export class AiModule {}
