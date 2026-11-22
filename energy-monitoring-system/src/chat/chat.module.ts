import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [SessionManager],
  exports: [SessionManager],
})
export class ChatModule {}
