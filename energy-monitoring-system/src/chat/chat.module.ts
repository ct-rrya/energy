import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { AdminChatController } from './admin-chat.controller';
import { AdminChatService } from './admin-chat.service';
import {
  AdminChatThread,
  AdminChatThreadSchema,
} from './schemas/admin-chat-thread.schema';
import { SessionManager } from './session.manager';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { PlayersModule } from '../players/players.module';

/**
 * ChatModule
 *
 * Provides public EcoGuide AI chat API and persistent Direct-to-Admin chat API.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminChatThread.name, schema: AdminChatThreadSchema },
    ]),
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
  controllers: [ChatController, AdminChatController],
  providers: [SessionManager, AdminChatService],
  exports: [SessionManager, AdminChatService],
})
export class ChatModule {}
