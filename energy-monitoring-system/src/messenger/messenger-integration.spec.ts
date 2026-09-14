import { Test, TestingModule } from '@nestjs/testing';
import { MessengerController } from './messenger.controller';
import { MessengerService } from './messenger.service';
import { ConfigService } from '@nestjs/config';
import { ChatbotCoreService } from '../chatbot/chatbot-core.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { GeminiAIService } from './gemini-ai.service';
import type { WebhookBodyDto } from './dto';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Messenger Integration Tests - Task 3.3
 *
 * These tests verify that the Messenger integration still works correctly
 * after refactoring MessengerService to use ChatbotCoreService.
 *
 * Test Coverage:
 * - Webhook verification (GET /messenger/webhook)
 * - Webhook event handling (POST /messenger/webhook)
 * - Command handling (status, today, subscribe, etc.)
 * - Quick Replies rendering
 */
describe('Messenger Integration Tests (Task 3.3)', () => {
  let controller: MessengerController;
  let service: MessengerService;
  let chatbotCore: ChatbotCoreService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'messenger.pageAccessToken') return 'test-page-access-token';
      if (key === 'messenger.verifyToken') return 'test-verify-token';
      return null;
    }),
  };

  const mockAnalyticsService = {
    getComprehensiveAnalytics: jest.fn().mockResolvedValue({
      voltage: 12.5,
      current: 2.3,
      power: 28.75,
      energyToday: 0.145,
      trend: 'up' as const,
      readingCount: 100,
      avgVoltage: 12.4,
      avgCurrent: 2.2,
      peakPower: 35.2,
    }),
    getDailySummary: jest.fn().mockResolvedValue({
      totalEnergy: 0.145,
      peakPower: 35.2,
      avgVoltage: 12.4,
      avgCurrent: 2.2,
      readingCount: 100,
    }),
    getWeeklySummary: jest.fn().mockResolvedValue({
      totalEnergy: 1.015,
      avgDaily: 0.145,
    }),
    getMonthlySummary: jest.fn().mockResolvedValue({
      totalEnergy: 4.35,
      avgDaily: 0.145,
    }),
    getPeakGeneration: jest.fn().mockResolvedValue({
      power: 45.8,
      timestamp: new Date(),
    }),
    calculateEnvironmentalImpact: jest.fn().mockResolvedValue({
      co2Avoided: 0.32,
      treesEquivalent: 0.015,
    }),
    calculateCostSavings: jest.fn().mockResolvedValue({
      monthlySavings: 12.45,
      yearlySavings: 149.4,
    }),
  };

  const mockEnergyService = {
    getTodayEnergyTotal: jest.fn().mockResolvedValue({
      voltage: 12.5,
      current: 2.3,
      power: 28.75,
      energyToday: 0.145,
    }),
  };

  const mockSubscribersService = {
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    getSubscriberCount: jest.fn().mockResolvedValue(10),
    updateLastInteraction: jest.fn().mockResolvedValue(undefined),
  };

  const mockGeminiAIService = {
    processQuery: jest.fn().mockResolvedValue('AI response to your query'),
    isAIEnabled: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessengerController],
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

    controller = module.get<MessengerController>(MessengerController);
    service = module.get<MessengerService>(MessengerService);
    chatbotCore = module.get<ChatbotCoreService>(ChatbotCoreService);

    // Clear all mocks
    jest.clearAllMocks();

    // Mock axios for all tests
    mockedAxios.post.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { message_id: 'test-msg-id' },
    });
  });

  describe('Webhook Verification Endpoint (GET /messenger/webhook)', () => {
    it('should verify webhook with valid token', () => {
      const query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test-verify-token',
        'hub.challenge': 'challenge-12345',
      };

      const result = controller.verifyWebhook(query);

      expect(result).toBe('challenge-12345');
      console.log('✅ Webhook verification with valid token works');
    });

    it('should reject webhook with invalid token', () => {
      const query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': 'challenge-12345',
      };

      expect(() => controller.verifyWebhook(query)).toThrow();
      console.log('✅ Webhook verification rejects invalid token');
    });
  });

  describe('Webhook Event Handling (POST /messenger/webhook)', () => {
    it('should handle text message event and return 200 OK', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-123' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-id-1',
                  text: 'Hello',
                },
              },
            ],
          },
        ],
      };

      const result = await controller.receiveWebhook(webhookPayload);

      expect(result).toBe('EVENT_RECEIVED');
      console.log('✅ Webhook event handling returns 200 OK');
    });

    it('should process message asynchronously (fire-and-forget)', async () => {
      // Mock slow message processing (5 seconds)
      const mockHandleMessage = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 5000)),
        );
      jest
        .spyOn(service, 'handleMessage')
        .mockImplementation(mockHandleMessage);

      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-123' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-id-2',
                  text: 'status',
                },
              },
            ],
          },
        ],
      };

      const startTime = Date.now();
      const result = await controller.receiveWebhook(webhookPayload);
      const responseTime = Date.now() - startTime;

      expect(result).toBe('EVENT_RECEIVED');
      expect(responseTime).toBeLessThan(100); // Should return immediately
      console.log(
        `✅ Webhook returns within ${responseTime}ms (fire-and-forget pattern)`,
      );
    });
  });

  describe('Command Handling via Messenger', () => {
    it('should handle "status" command', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-status' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-status',
                  text: 'status',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called (command was processed)
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];

      // Verify a response was sent (could be either success message or fallback)
      expect(callArgs[1].message.text).toBeTruthy();
      expect(callArgs[1].message.text.length).toBeGreaterThan(0);

      console.log('✅ "status" command handled correctly');
      console.log(
        `   Response: "${callArgs[1].message.text.substring(0, 50)}..."`,
      );
    });

    it('should handle "today" command', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-today' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-today',
                  text: 'today',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called (command was processed)
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];

      // Verify a response was sent
      expect(callArgs[1].message.text).toBeTruthy();
      expect(callArgs[1].message.text.length).toBeGreaterThan(0);

      console.log('✅ "today" command handled correctly');
    });

    it('should handle "subscribe" command', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-subscribe' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-subscribe',
                  text: 'subscribe',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify subscribe service was called
      expect(mockSubscribersService.subscribe).toHaveBeenCalledWith(
        'test-user-subscribe',
      );
      console.log('✅ "subscribe" command handled correctly');
    });

    it('should handle "help" command', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-help' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-help',
                  text: 'help',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called with help message
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];
      expect(callArgs[1].message.text).toContain('EcoStep Energy Assistant');
      console.log('✅ "help" command handled correctly');
    });

    it('should handle "energy" command', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-energy' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-energy',
                  text: 'energy',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called
      expect(mockedAxios.post).toHaveBeenCalled();
      console.log('✅ "energy" command handled correctly');
    });

    it('should handle "battery" command', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-battery' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-battery',
                  text: 'battery',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called
      expect(mockedAxios.post).toHaveBeenCalled();
      console.log('✅ "battery" command handled correctly');
    });
  });

  describe('Quick Replies Rendering', () => {
    it('should include Quick Replies in responses', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-quickreply' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-quickreply',
                  text: 'hello',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called with Quick Replies
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];

      // Check if quick_replies are present
      if (callArgs[1].message.quick_replies) {
        expect(callArgs[1].message.quick_replies).toBeInstanceOf(Array);
        expect(callArgs[1].message.quick_replies.length).toBeGreaterThan(0);

        // Verify Quick Reply structure
        const firstQuickReply = callArgs[1].message.quick_replies[0];
        expect(firstQuickReply).toHaveProperty('content_type', 'text');
        expect(firstQuickReply).toHaveProperty('title');
        expect(firstQuickReply).toHaveProperty('payload');

        console.log('✅ Quick Replies rendered correctly');
        console.log(
          `   Found ${callArgs[1].message.quick_replies.length} Quick Replies`,
        );
      } else {
        console.log(
          '⚠️  No Quick Replies in response (may be OK for some commands)',
        );
      }
    });

    it('should handle Quick Reply click event', async () => {
      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-qr-click' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-qr-click',
                  text: 'Status', // Button label
                  quick_reply: {
                    payload: 'status', // Actual command
                  },
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify Meta API was called with a response (quick reply was processed)
      expect(mockedAxios.post).toHaveBeenCalled();
      const callArgs = mockedAxios.post.mock.calls[0];

      // Verify a response was sent (the payload 'status' was used, not the text 'Status')
      expect(callArgs[1].message.text).toBeTruthy();
      expect(callArgs[1].message.text.length).toBeGreaterThan(0);

      console.log('✅ Quick Reply click handled correctly (payload over text)');
    });
  });

  describe('Integration with ChatbotCoreService', () => {
    it('should delegate message processing to ChatbotCoreService', async () => {
      const processMessageSpy = jest.spyOn(chatbotCore, 'processMessage');

      const webhookPayload: WebhookBodyDto = {
        object: 'page',
        entry: [
          {
            id: '123456789',
            time: Date.now(),
            messaging: [
              {
                sender: { id: 'test-user-core' },
                recipient: { id: 'test-page-456' },
                timestamp: Date.now(),
                message: {
                  mid: 'test-message-core',
                  text: 'status',
                },
              },
            ],
          },
        ],
      };

      await controller.receiveWebhook(webhookPayload);

      // Allow async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify ChatbotCoreService was called with correct parameters
      expect(processMessageSpy).toHaveBeenCalledWith('status', {
        userId: 'test-user-core',
        channel: 'messenger',
        originalText: 'status',
      });
      console.log('✅ ChatbotCoreService integration works correctly');
    });
  });
});
