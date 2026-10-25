import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { SessionManager } from './session.manager';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { PlayersModule } from '../players/players.module';

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
    PlayersModule, // For OptionalPlayerSessionGuard
    // ThrottlerModule will be configured at app level
  ],
  controllers: [ChatController],
  providers: [SessionManager],
  exports: [SessionManager],
})
export class ChatModule {}
