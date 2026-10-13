import { Module, forwardRef } from '@nestjs/common';
import { ChatbotCoreService } from './chatbot-core.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { AiModule } from '../ai/ai.module';

/**
 * ChatbotModule
 *
 * Provides shared chatbot core logic for all channels (Messenger, Web)
 *
 * Architecture:
 * - Imports service modules (Analytics, Energy, Subscribers)
 * - Uses AiModule for Gemini/Groq AI services
 * - Exports ChatbotCoreService for use by MessengerService and ChatController
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */
@Module({
  imports: [
    AnalyticsModule,
    EnergyModule,
    SubscribersModule,
    AiModule, // Centralized AI services (Gemini with Groq fallback)
  ],
  providers: [ChatbotCoreService],
  exports: [ChatbotCoreService],
})
export class ChatbotModule {}
