import { Module } from '@nestjs/common';
import { MessengerController } from './messenger.controller';
import { MessengerService } from './messenger.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { SubscribersModule } from '../subscribers/subscribers.module';

/**
 * Messenger Module
 * 
 * Facebook Messenger Bot integration.
 * 
 * Architecture:
 * - NEVER accesses database directly
 * - Consumes Analytics Service for calculations
 * - Consumes Energy Service for data queries
 * - Consumes Subscribers Service for subscriptions
 * 
 * Features:
 * - Webhook verification
 * - Message handling
 * - Command parsing
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
 * 
 * Dependencies:
 * - AnalyticsModule (for calculations)
 * - EnergyModule (for data queries)
 * - SubscribersModule (for subscriptions)
 * 
 * Webhook:
 * - GET  /api/messenger/webhook - Verification
 * - POST /api/messenger/webhook - Receive events
 * 
 * Configuration:
 * - MESSENGER_PAGE_ACCESS_TOKEN (env)
 * - MESSENGER_VERIFY_TOKEN (env)
 * - MESSENGER_APP_SECRET (env, future)
 */
@Module({
  imports: [
    AnalyticsModule, // For calculations
    EnergyModule, // For data queries
    SubscribersModule, // For subscriptions
  ],
  controllers: [MessengerController],
  providers: [MessengerService],
  exports: [MessengerService], // Export for Notifications Module (future)
})
export class MessengerModule {}
