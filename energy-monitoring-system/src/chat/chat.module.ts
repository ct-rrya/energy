import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { SessionManager } from './session.manager';
import { ChatbotModule } from '../chatbot/chatbot.module';

/**
 * ChatModule
 *
 * Provides public chat API for web interface
 *
 * Requirements: 5.1, 5.2, 7.1, 7.2
 */
@Module({
  imports: [
    ChatbotModule, // For ChatbotCoreService
    // ThrottlerModule will be configured at app level
  ],
  controllers: [ChatController],
  providers: [SessionManager],
  exports: [SessionManager],
})
export class ChatModule {}
