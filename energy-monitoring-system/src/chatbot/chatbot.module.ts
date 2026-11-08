import { Module } from '@nestjs/common';
import { ChatbotCoreService } from './chatbot-core.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { AiModule } from '../ai/ai.module';
import { MilestonesModule } from '../milestones/milestones.module';

/**
 * ChatbotModule
 *
 * Provides shared chatbot core logic for all channels (Messenger, Web)
 *
 * Architecture:
 * - Imports service modules (Analytics, Energy, Subscribers, Milestones)
 * - Uses AiModule for Gemini/Groq AI services
 * - Exports ChatbotCoreService for use by MessengerService and ChatController
 */
@Module({
  imports: [
    AnalyticsModule,
    EnergyModule,
    SubscribersModule,
    AiModule, // Centralized AI services (Gemini with Groq fallback)
    MilestonesModule, // EcoStep Milestones: Weekly and monthly kinetic energy goals
  ],
  providers: [ChatbotCoreService],
  exports: [ChatbotCoreService],
})
export class ChatbotModule {}
