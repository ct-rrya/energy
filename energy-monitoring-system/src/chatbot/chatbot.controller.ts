import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { ChatbotCoreService, ChatbotResponse } from './chatbot-core.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * DTO for chat message requests
 */
export class ChatMessageDto {
  message: string;
  channel?: 'web' | 'mobile';
}

/**
 * ChatbotController
 *
 * REST API endpoint for EcoChat chatbot.
 * Provides natural language interaction with energy monitoring data.
 *
 * Features:
 * - AI-powered responses (Gemini with Groq fallback)
 * - Command-based queries (status, today, week, etc.)
 * - Natural language understanding
 * - Authenticated access only
 *
 * Requirements: 2.1, 2.6, 2.8, 10.1, 10.2, 10.3
 */
@Controller('chat')
@UseGuards(JwtAuthGuard) // Require authentication
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotCoreService: ChatbotCoreService) {}

  /**
   * POST /chat/message
   *
   * Send a message to the chatbot and receive a response
   *
   * @param body - Chat message DTO
   * @param user - Current authenticated user
   * @returns ChatbotResponse with text and suggestions
   */
  @Post('message')
  async sendMessage(
    @Body() body: ChatMessageDto,
    @CurrentUser() user: any,
  ): Promise<ChatbotResponse> {
    this.logger.log(`Chat message from user ${user.id}: "${body.message.substring(0, 50)}..."`);

    try {
      const response = await this.chatbotCoreService.processMessage(
        body.message,
        {
          userId: user.id,
          channel: body.channel || 'web',
          originalText: body.message,
        },
      );

      this.logger.log(`Response generated: ${response.text.substring(0, 50)}...`);
      return response;
    } catch (error) {
      this.logger.error('Error processing chat message', error.stack);
      throw error;
    }
  }
}
