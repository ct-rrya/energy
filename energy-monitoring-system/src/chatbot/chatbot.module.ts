import { Module, forwardRef } from '@nestjs/common';
import { ChatbotCoreService } from './chatbot-core.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EnergyModule } from '../energy/energy.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { MessengerModule } from '../messenger/messenger.module';

/**
 * ChatbotModule
 *
 * Provides shared chatbot core logic for all channels (Messenger, Web)
 *
 * Architecture:
 * - Imports service modules (Analytics, Energy, Subscribers)
 * - Uses forwardRef for MessengerModule to handle circular dependency
 * - Exports ChatbotCoreService for use by MessengerService and ChatController
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */
@Module({
  imports: [
    AnalyticsModule,
    EnergyModule,
    SubscribersModule,
    forwardRef(() => MessengerModule), // Circular dependency with MessengerModule
  ],
  providers: [ChatbotCoreService],
  exports: [ChatbotCoreService],
})
export class ChatbotModule {}
