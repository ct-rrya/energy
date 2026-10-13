import { Module } from '@nestjs/common';
import { ChatbotCoreService } from './chatbot-core.service';
import { ChatbotController } from './chatbot.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { AiModule } from '../ai/ai.module';

/**
 * ChatbotModule
 *
 * Provides shared chatbot core logic for all channels (Web, Mobile)
 *
 * Architecture:
 * - Imports service modules (Analytics, Energy)
 * - Imports AiModule for Gemini/Groq AI with automatic fallback
 * - Exports ChatbotCoreService for use by controllers
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */
@Module({
  imports: [
    AnalyticsModule,
    EnergyModule,
    AiModule, // Centralized AI service with Groq fallback
  ],
  controllers: [ChatbotController],
  providers: [ChatbotCoreService],
  exports: [ChatbotCoreService],
})
export class ChatbotModule {}
