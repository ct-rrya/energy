import { Module, forwardRef } from '@nestjs/common';
import { MessengerController } from './messenger.controller';
import { MessengerService } from './messenger.service';
import { GeminiAIService } from './gemini-ai.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

/**
 * Messenger Module
 *
 * Facebook Messenger Bot integration with Gemini AI.
 *
 * Architecture:
 * - NEVER accesses database directly
 * - Consumes Analytics Service for calculations
 * - Consumes Energy Service for data queries
 * - Consumes Subscribers Service for subscriptions
 * - Uses Gemini AI Service for natural language processing
 *
 * Features:
 * - Webhook verification
 * - Message handling
 * - Command parsing
 * - Natural language AI queries (via Gemini)
 * - Response formatting
 * - Facebook Graph API integration
 *
 * Commands:
 * - help - Show available commands
 * - status - Comprehensive analytics
 * - today/week/month - Time-based summaries
 * - peak - Peak generation
 * - impact - Environmental impact
 * - savings - Cost savings
 * - subscribe/unsubscribe - Notifications
 * - Natural language queries - Processed by Gemini AI
 *
 * Dependencies:
 * - AnalyticsModule (for calculations)
 * - EnergyModule (for data queries)
 * - SubscribersModule (for subscriptions)
 * - GeminiAIService (for natural language AI)
 *
 * Webhook:
 * - GET  /api/messenger/webhook - Verification
 * - POST /api/messenger/webhook - Receive events
 *
 * Configuration:
 * - MESSENGER_PAGE_ACCESS_TOKEN (env)
 * - MESSENGER_VERIFY_TOKEN (env)
 * - MESSENGER_APP_SECRET (env, future)
 * - GEMINI_API_KEY (env)
 */
@Module({
  imports: [
    AnalyticsModule, // For calculations
    EnergyModule, // For data queries
    SubscribersModule, // For subscriptions
    forwardRef(() => ChatbotModule), // Circular dependency with ChatbotModule
  ],
  controllers: [MessengerController],
  providers: [MessengerService, GeminiAIService], // Added GeminiAIService
  exports: [MessengerService, GeminiAIService], // Export GeminiAIService for ChatbotCoreService
})
export class MessengerModule {}
