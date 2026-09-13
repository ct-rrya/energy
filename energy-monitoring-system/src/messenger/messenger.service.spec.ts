import { Test, TestingModule } from '@nestjs/testing';
import { MessengerService } from './messenger.service';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { GeminiAIService } from './gemini-ai.service';
import { ChatbotCoreService } from '../chatbot/chatbot-core.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MessengerService - Messenger-Specific Features (Task 3.2)', () => {
  let service: MessengerService;
  let chatbotCoreService: ChatbotCoreService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'messenger.pageAccessToken') return 'test-page-access-token';
      return null;
    }),
  };

  const mockAnalyticsService = {
    getComprehensiveAnalytics: jest.fn(),
    getDailySummary: jest.fn(),
    getWeeklySummary: jest.fn(),
    getMonthlySummary: jest.fn(),
    getPeakGeneration: jest.fn(),
    calculateEnvironmentalImpact: jest.fn(),
    calculateCostSavings: jest.fn(),
  };

  const mockEnergyService = {
    getTodayEnergyTotal: jest.fn(),
  };

  const mockSubscribersService = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getSubscriberCount: jest.fn().mockResolvedValue(10),
    updateLastInteraction: jest.fn(),
  };

  const mockGeminiAIService = {
    processQuery: jest.fn(),
    isAIEnabled: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessengerService,
        ChatbotCoreService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: EnergyService, useValue: mockEnergyService },
        { provide: SubscribersService, useValue: mockSubscribersService },
        { provide: GeminiAIService, useValue: mockGeminiAIService },
      ],
    }).compile();

    service = module.get<MessengerService>(MessengerService);
    chatbotCoreService = module.get<ChatbotCoreService>(ChatbotCoreService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Messenger-Specific Methods Preserved', () => {
    it('should have sendMessage() method', () => {
      expect(service.sendMessage).toBeDefined();
      expect(typeof service.sendMessage).toBe('function');
    });

    it('should have sendButtonTemplate() method', () => {
      expect(service.sendButtonTemplate).toBeDefined();
      expect(typeof service.sendButtonTemplate).toBe('function');
    });

    it('should have setPersistentMenu() method', () => {
      expect(service.setPersistentMenu).toBeDefined();
      expect(typeof service.setPersistentMenu).toBe('function');
    });

    it('should have setGetStartedButton() method', () => {
      expect(service.setGetStartedButton).toBeDefined();
      expect(typeof service.setGetStartedButton).toBe('function');
    });
  });

  describe('Quick Reply Generation', () => {
    it('should format suggestions as Quick Replies', async () => {
      // Mock ChatbotCoreService response
      const mockResponse = {
        text: 'Welcome to EcoStep!',
        suggestions: ['status', 'help', 'energy'],
      };

      jest.spyOn(chatbotCoreService, 'processMessage').mockResolvedValue(mockResponse);
      
      // Mock axios post for sendMessage
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'test-msg-id' },
      });

      await service.handleMessage('test-user-id', 'hello');

      // Verify sendMessage was called with Quick Replies
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/me/messages'),
        expect.objectContaining({
          message: expect.objectContaining({
            text: 'Welcome to EcoStep!',
            quick_replies: expect.arrayContaining([
              expect.objectContaining({
                content_type: 'text',
                title: expect.any(String),
                payload: expect.any(String),
              }),
            ]),
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('sendMessage() with Quick Replies', () => {
    it('should send message with Quick Replies via Meta API', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'msg-123' },
      });

      const quickReplies = [
        { title: '📊 Status', payload: 'status' },
        { title: 'ℹ️ Help', payload: 'help' },
      ];

      await service.sendMessage('user-123', 'Test message', quickReplies);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/me/messages'),
        {
          recipient: { id: 'user-123' },
          message: {
            text: 'Test message',
            quick_replies: [
              { content_type: 'text', title: '📊 Status', payload: 'status' },
              { content_type: 'text', title: 'ℹ️ Help', payload: 'help' },
            ],
          },
        },
        { params: { access_token: 'test-page-access-token' } },
      );
    });

    it('should send message without Quick Replies when none provided', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'msg-456' },
      });

      await service.sendMessage('user-123', 'Test message');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/me/messages'),
        {
          recipient: { id: 'user-123' },
          message: {
            text: 'Test message',
          },
        },
        { params: { access_token: 'test-page-access-token' } },
      );
    });
  });

  describe('sendButtonTemplate()', () => {
    it('should send button template via Meta API', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'msg-789' },
      });

      const buttons = [
        { title: 'Today', payload: 'today' },
        { title: 'This Week', payload: 'week' },
        { title: 'This Month', payload: 'month' },
      ];

      await service.sendButtonTemplate('user-123', 'Choose a time period:', buttons);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/me/messages'),
        {
          recipient: { id: 'user-123' },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: 'Choose a time period:',
                buttons: [
                  { type: 'postback', title: 'Today', payload: 'today' },
                  { type: 'postback', title: 'This Week', payload: 'week' },
                  { type: 'postback', title: 'This Month', payload: 'month' },
                ],
              },
            },
          },
        },
        { params: { access_token: 'test-page-access-token' } },
      );
    });
  });

  describe('ChatbotResponse to Meta-Compatible Format', () => {
    it('should convert ChatbotResponse suggestions to Quick Replies', async () => {
      const mockResponse = {
        text: '📊 System Status: All systems operational',
        suggestions: ['today', 'battery', 'help'],
      };

      jest.spyOn(chatbotCoreService, 'processMessage').mockResolvedValue(mockResponse);
      
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'test-msg' },
      });

      await service.handleMessage('user-123', 'status');

      // Verify the call to Meta API includes Quick Replies
      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        recipient: { id: 'user-123' },
        message: {
          text: '📊 System Status: All systems operational',
          quick_replies: expect.arrayContaining([
            expect.objectContaining({ payload: 'today' }),
            expect.objectContaining({ payload: 'battery' }),
            expect.objectContaining({ payload: 'help' }),
          ]),
        },
      });
    });

    it('should handle response with no suggestions', async () => {
      const mockResponse = {
        text: 'Simple response with no suggestions',
      };

      jest.spyOn(chatbotCoreService, 'processMessage').mockResolvedValue(mockResponse);
      
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'test-msg' },
      });

      await service.handleMessage('user-123', 'test');

      // Verify message was sent without quick_replies
      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1].message).toEqual({
        text: 'Simple response with no suggestions',
      });
    });
  });

  describe('Integration with ChatbotCoreService', () => {
    it('should delegate to ChatbotCoreService.processMessage()', async () => {
      const mockResponse = {
        text: 'Test response',
        suggestions: ['status'],
      };

      const processMessageSpy = jest
        .spyOn(chatbotCoreService, 'processMessage')
        .mockResolvedValue(mockResponse);
      
      mockedAxios.post.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { message_id: 'test-msg' },
      });

      await service.handleMessage('user-123', 'test message');

      expect(processMessageSpy).toHaveBeenCalledWith('test message', {
        userId: 'user-123',
        channel: 'messenger',
        originalText: 'test message',
      });
    });
  });
});
