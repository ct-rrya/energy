import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatbotCoreService } from '../chatbot/chatbot-core.service';
import { SessionManager } from './session.manager';
import { SendMessageDto } from './dto/send-message.dto';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';

/**
 * Unit tests for ChatController
 *
 * Tests:
 * - Successful message processing
 * - Validation error handling
 * - Session management
 * - Error handling
 *
 * Requirements: 14.1, 14.2
 */
describe('ChatController', () => {
  let controller: ChatController;
  let chatbotCore: jest.Mocked<ChatbotCoreService>;
  let sessionManager: jest.Mocked<SessionManager>;

  const mockSession = {
    sessionId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(),
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    messageHistory: [],
  };

  const mockChatbotResponse = {
    text: 'Bot response text',
    suggestions: ['status', 'help'],
    metadata: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatbotCoreService,
          useValue: {
            processMessage: jest.fn(),
          },
        },
        {
          provide: SessionManager,
          useValue: {
            getOrCreateSession: jest.fn(),
            updateSession: jest.fn(),
            getSessionCount: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ChatController>(ChatController);
    chatbotCore = module.get(ChatbotCoreService);
    sessionManager = module.get(SessionManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should process message and return response', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message: 'status',
      };
      const ip = '127.0.0.1';

      sessionManager.getOrCreateSession.mockResolvedValue(mockSession);
      chatbotCore.processMessage.mockResolvedValue(mockChatbotResponse);

      // Act
      const result = await controller.sendMessage(dto, ip);

      // Assert
      expect(result).toMatchObject({
        success: true,
        response: 'Bot response text',
        sessionId: mockSession.sessionId,
        suggestions: ['status', 'help'],
      });
      expect(result.timestamp).toBeDefined();
      expect(sessionManager.getOrCreateSession).toHaveBeenCalledWith(undefined);
      expect(sessionManager.updateSession).toHaveBeenCalledTimes(2); // user + bot messages
      expect(chatbotCore.processMessage).toHaveBeenCalledWith('status', {
        userId: mockSession.sessionId,
        channel: 'web',
        sessionData: mockSession.messageHistory,
        originalText: 'status',
      });
    });

    it('should use existing session when sessionId provided', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message: 'hello',
        sessionId: mockSession.sessionId,
      };
      const ip = '127.0.0.1';

      sessionManager.getOrCreateSession.mockResolvedValue(mockSession);
      chatbotCore.processMessage.mockResolvedValue(mockChatbotResponse);

      // Act
      const result = await controller.sendMessage(dto, ip);

      // Assert
      expect(result.sessionId).toBe(mockSession.sessionId);
      expect(sessionManager.getOrCreateSession).toHaveBeenCalledWith(
        mockSession.sessionId,
      );
    });

    it('should throw BadRequestException for empty message', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message: '   ', // Whitespace only
      };
      const ip = '127.0.0.1';

      // Act & Assert
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        'Message cannot be empty',
      );
    });

    it('should throw BadRequestException for message too long', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message: 'a'.repeat(2001), // Over 2000 characters
      };
      const ip = '127.0.0.1';

      // Act & Assert
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        'Message too long',
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message: 'status',
      };
      const ip = '127.0.0.1';

      const dbError = new Error('Connection failed');
      dbError.name = 'MongoError';
      sessionManager.getOrCreateSession.mockRejectedValue(dbError);

      // Act & Assert
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        'Database temporarily unavailable',
      );
    });

    it('should handle generic errors with generic message', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message: 'status',
      };
      const ip = '127.0.0.1';

      sessionManager.getOrCreateSession.mockResolvedValue(mockSession);
      chatbotCore.processMessage.mockRejectedValue(
        new Error('Something went wrong'),
      );

      // Act & Assert
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.sendMessage(dto, ip)).rejects.toThrow(
        'An error occurred while processing your request',
      );
    });

    it('should log IP address and message preview', async () => {
      // Arrange
      const dto: SendMessageDto = {
        message:
          'This is a very long message that should be truncated in the log to prevent log spam',
      };
      const ip = '192.168.1.100';

      sessionManager.getOrCreateSession.mockResolvedValue(mockSession);
      chatbotCore.processMessage.mockResolvedValue(mockChatbotResponse);

      const loggerSpy = jest.spyOn(controller['logger'], 'log');

      // Act
      await controller.sendMessage(dto, ip);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(ip));
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'This is a very long message that should be truncat',
        ),
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status with session count', () => {
      // Arrange
      sessionManager.getSessionCount.mockReturnValue(5);

      // Act
      const result = controller.healthCheck();

      // Assert
      expect(result).toEqual({
        status: 'ok',
        sessionCount: 5,
      });
      expect(sessionManager.getSessionCount).toHaveBeenCalled();
    });
  });
});
