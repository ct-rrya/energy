import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Logger,
  UseGuards,
  Ip,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatbotCoreService } from '../chatbot/chatbot-core.service';
import { SessionManager } from './session.manager';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

/**
 * ChatController
 *
 * Handles public chat API requests from the web interface
 *
 * Features:
 * - Rate limiting (10 requests per minute per IP)
 * - Input validation (max 2000 characters)
 * - Session management for conversation context
 * - Error handling with user-friendly messages
 *
 * Requirements: 5.1, 5.2, 5.6, 5.7, 5.11, 5.12, 8.4, 13.5
 */
@ApiTags('Public Chat')
@Controller('chat')
@UseGuards(RateLimitGuard)
@Throttle({ chat: { limit: 20, ttl: 60000 } }) // Increased to 20 messages per minute for natural conversation flow
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatbotCore: ChatbotCoreService,
    private readonly sessionManager: SessionManager,
  ) {}

  /**
   * POST /api/chat
   * Process chat message from web interface
   *
   * Error Handling:
   * - 400: Validation errors (empty message, too long, invalid sessionId)
   * - 429: Rate limit exceeded
   * - 500: Internal server error (generic message, no details exposed)
   *
   * Requirements: 5.1, 5.2, 5.6, 5.7, 5.8, 5.9, 5.10, 8.5, 8.6, 9.6, 9.7, 9.8
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({
    summary: 'Send chat message',
    description:
      '**Process a chat message from the web interface and return a bot response.**\n\n' +
      '### Features\n' +
      '- Session-based conversation context (multi-turn conversations)\n' +
      '- Rate limited to 10 requests per minute per IP\n' +
      '- Message validation (max 2000 characters)\n' +
      '- AI-powered natural language processing\n' +
      '- Command-based system queries\n\n' +
      '### Available Commands\n' +
      '- `status` - Comprehensive system overview\n' +
      '- `energy` - Current energy generation\n' +
      "- `today` - Today's energy summary\n" +
      "- `week` - This week's summary\n" +
      "- `month` - This month's summary\n" +
      '- `peak` - Peak generation this month\n' +
      '- `impact` - Environmental impact (CO₂ avoided)\n' +
      '- `savings` - Cost savings analysis\n' +
      '- `help` - Show all available commands\n' +
      '- `about` - About EcoStep\n\n' +
      '### Natural Language Queries\n' +
      'You can also ask questions in plain English:\n' +
      '- "How much energy was generated today?"\n' +
      '- "What is the current power output?"\n' +
      '- "Show me this week\'s statistics"\n\n' +
      '### Session Management\n' +
      '- First message: Send without `sessionId` to create a new session\n' +
      '- Follow-up messages: Include the `sessionId` from the previous response\n' +
      '- Sessions expire after 30 minutes of inactivity\n' +
      '- Session data is NOT persisted (anonymous conversations only)\n\n' +
      '### Rate Limiting\n' +
      '- Limit: 10 requests per minute per IP address\n' +
      '- When exceeded: Returns 429 with `retryAfter` header\n' +
      '- Recommendation: Wait at least 6 seconds between requests',
  })
  @ApiBody({
    type: SendMessageDto,
    description:
      'Chat message payload with optional session ID for conversation continuity',
    examples: {
      statusCommand: {
        summary: 'Status Command (First Message)',
        description:
          'Request comprehensive system status without a session ID (creates new session)',
        value: { message: 'status' },
      },
      naturalLanguage: {
        summary: 'Natural Language Query',
        description:
          'Ask a question in plain English using AI-powered processing',
        value: { message: 'How much energy was generated today?' },
      },
      withSession: {
        summary: 'Follow-up Message',
        description:
          'Continue conversation by including the sessionId from previous response',
        value: {
          message: 'What about yesterday?',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      helpCommand: {
        summary: 'Help Command',
        description:
          'Get a list of all available commands and their descriptions',
        value: { message: 'help' },
      },
      energyCommand: {
        summary: 'Energy Command',
        description: 'Get current energy generation data',
        value: { message: 'energy' },
      },
      todayCommand: {
        summary: 'Today Command',
        description: "Get today's comprehensive energy summary",
        value: { message: 'today' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      '**Successful response** - Message processed successfully, bot response returned with session ID',
    type: ChatResponseDto,
    examples: {
      statusResponse: {
        summary:
          'Status Command Response - Comprehensive system status with current readings and milestone progress',
        value: {
          success: true,
          response:
            '⚡ Current Energy Status\n\n📊 Today\'s Generation\nEnergy: 0.145 kWh\nAverage Power: 23.45 W\nPeak Power: 32.10 W\nUpdated: Just now\n\n🎯 Next Milestone\n500 Wh (29% complete)\n\n💡 Try "today" for full daily report',
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          suggestions: ['today', 'battery', 'help'],
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
      naturalLanguageResponse: {
        summary:
          'Natural Language Response - AI-powered response to natural language query',
        value: {
          success: true,
          response:
            'Today, the system has generated 0.145 kWh of energy from 43 footsteps. The average power output is 23.45 watts, with a peak of 32.10 watts recorded at 10:30 AM.',
          sessionId: '456e7890-f12b-34d5-b678-542715285001',
          suggestions: ['week', 'month', 'impact'],
          timestamp: '2024-01-01T12:05:00.000Z',
        },
      },
      helpResponse: {
        summary:
          'Help Command Response - List of all available commands with descriptions',
        value: {
          success: true,
          response:
            "🌞 EcoStep Chat Assistant\n\nI can help you with:\n\n📊 System Status\n• status - Comprehensive system overview\n• energy - Current energy generation\n\n📈 Analytics\n• today - Today's energy summary\n• week - This week's summary\n• month - This month's summary\n• peak - Peak generation this month\n\n🌱 Environmental Impact\n• impact - CO₂ avoided and equivalents\n• savings - Cost savings analysis\n\nℹ️ Information\n• help - Show this message\n• about - About EcoStep\n\n💡 Tip: You can also ask questions in plain English!",
          sessionId: '789e0123-g23c-45e6-c789-653826396002',
          suggestions: ['status', 'today', 'about'],
          timestamp: '2024-01-01T12:10:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      '**Bad Request** - Validation error (empty message, exceeds 2000 characters, or invalid session ID format)',
    examples: {
      emptyMessage: {
        summary:
          'Empty Message Error - Message field is empty or contains only whitespace',
        value: {
          statusCode: 400,
          message: ['Message cannot be empty'],
          error: 'Bad Request',
        },
      },
      messageTooLong: {
        summary:
          'Message Too Long Error - Message exceeds the 2000 character limit',
        value: {
          statusCode: 400,
          message: ['message must be shorter than or equal to 2000 characters'],
          error: 'Bad Request',
        },
      },
      invalidSessionId: {
        summary:
          'Invalid Session ID Error - Session ID is not a valid UUID v4 format',
        value: {
          statusCode: 400,
          message: ['Invalid session ID format'],
          error: 'Bad Request',
        },
      },
      missingMessage: {
        summary:
          'Missing Message Field - Request body does not contain the required "message" field',
        value: {
          statusCode: 400,
          message: ['message should not be empty'],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description:
      '**Too Many Requests** - Rate limit exceeded (max 10 requests per minute per IP address)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example: 'Too many requests. Please try again later.',
        },
        error: { type: 'string', example: 'Too Many Requests' },
        retryAfter: {
          type: 'number',
          example: 60,
          description: 'Seconds until rate limit resets',
        },
      },
    },
    examples: {
      rateLimitExceeded: {
        summary:
          'Rate Limit Exceeded - Exceeded 10 requests per minute limit. Wait for the specified retry period.',
        value: {
          statusCode: 429,
          message: 'Too many requests. Please try again later.',
          error: 'Too Many Requests',
          retryAfter: 60,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description:
      '**Internal Server Error** - Unexpected server error (details not exposed for security)',
    examples: {
      genericError: {
        summary:
          'Generic Server Error - Unexpected error occurred. Internal details are not exposed to clients for security.',
        value: {
          statusCode: 500,
          message:
            'An error occurred while processing your request. Please try again.',
          error: 'Internal Server Error',
        },
      },
      databaseUnavailable: {
        summary:
          'Database Unavailable Error - Database connection or query failed. User-friendly message provided without exposing database details.',
        value: {
          statusCode: 500,
          message: 'Database temporarily unavailable. Please try again later.',
          error: 'Internal Server Error',
        },
      },
    },
  })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Ip() ip: string,
  ): Promise<ChatResponseDto> {
    const messagePreview = dto.message.substring(0, 50);
    this.logger.log(
      `Chat request from IP ${ip}: "${messagePreview}${dto.message.length > 50 ? '...' : ''}"`,
    );

    try {
      // Validate input (should be caught by ValidationPipe, but double-check)
      if (!dto.message || dto.message.trim().length === 0) {
        throw new BadRequestException('Message cannot be empty');
      }

      if (dto.message.length > 2000) {
        throw new BadRequestException('Message too long (max 2000 characters)');
      }

      // Get or create session
      const session = await this.sessionManager.getOrCreateSession(
        dto.sessionId,
      );

      this.logger.debug(`Processing message for session: ${session.sessionId}`);

      // Add user message to session history
      await this.sessionManager.updateSession(session.sessionId, {
        role: 'user',
        text: dto.message,
        timestamp: new Date(),
      });

      // Process message through chatbot core
      const response = await this.chatbotCore.processMessage(dto.message, {
        userId: session.sessionId,
        channel: 'web',
        sessionData: session.messageHistory,
        originalText: dto.message,
      });

      // Add bot response to session history
      await this.sessionManager.updateSession(session.sessionId, {
        role: 'bot',
        text: response.text,
        timestamp: new Date(),
      });

      this.logger.log(
        `Successfully processed message for session ${session.sessionId}`,
      );

      // Return response
      return {
        success: true,
        response: response.text,
        sessionId: session.sessionId,
        suggestions: response.suggestions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Log error internally with full details
      this.logger.error(
        `Error processing chat message from IP ${ip}`,
        error.stack,
      );

      // Re-throw BadRequestException (validation errors)
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle database/service unavailability
      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        throw new InternalServerErrorException(
          'Database temporarily unavailable. Please try again later.',
        );
      }

      // Generic error response (don't expose internal details)
      throw new InternalServerErrorException(
        'An error occurred while processing your request. Please try again.',
      );
    }
  }

  /**
   * GET /api/chat/health
   * Health check endpoint with session metrics
   *
   * Requirements: 5.12, 17.6
   */
  @Get('health')
  @ApiOperation({
    summary: 'Chat service health check',
    description:
      '**Check if the chat service is running and responsive.**\n\n' +
      'Returns service status and active session count for monitoring purposes.\n' +
      'Use this endpoint for:\n' +
      '- Uptime monitoring\n' +
      '- Load balancer health checks\n' +
      '- Service availability verification\n' +
      '- Session metrics tracking',
  })
  @ApiResponse({
    status: 200,
    description:
      '**Service is healthy** - Returns OK status with active session count',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
          description: 'Service health status',
        },
        sessionCount: {
          type: 'number',
          example: 5,
          description: 'Number of active chat sessions',
        },
      },
    },
    examples: {
      healthyNoSessions: {
        summary:
          'Healthy - No Active Sessions - Service is running but no users are currently chatting',
        value: {
          status: 'ok',
          sessionCount: 0,
        },
      },
      healthyWithSessions: {
        summary:
          'Healthy - Active Sessions - Service is running with active user sessions',
        value: {
          status: 'ok',
          sessionCount: 5,
        },
      },
    },
  })
  healthCheck(): { status: string; sessionCount: number } {
    return {
      status: 'ok',
      sessionCount: this.sessionManager.getSessionCount(),
    };
  }
}
