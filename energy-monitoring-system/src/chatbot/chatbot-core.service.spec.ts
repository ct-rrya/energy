import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotCoreService, MessageContext } from './chatbot-core.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { GeminiAIService } from '../messenger/gemini-ai.service';

describe('ChatbotCoreService', () => {
  let service: ChatbotCoreService;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let energyService: jest.Mocked<EnergyService>;
  let subscribersService: jest.Mocked<SubscribersService>;
  let geminiAIService: jest.Mocked<GeminiAIService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotCoreService,
        {
          provide: AnalyticsService,
          useValue: {
            getComprehensiveAnalytics: jest.fn(),
            getDailySummary: jest.fn(),
            getWeeklySummary: jest.fn(),
            getMonthlySummary: jest.fn(),
            getPeakGeneration: jest.fn(),
            calculateEnvironmentalImpact: jest.fn(),
            calculateCostSavings: jest.fn(),
          },
        },
        {
          provide: EnergyService,
          useValue: {},
        },
        {
          provide: SubscribersService,
          useValue: {
            updateLastInteraction: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            getSubscriberCount: jest.fn(),
          },
        },
        {
          provide: GeminiAIService,
          useValue: {
            isAIEnabled: jest.fn(),
            processQuery: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatbotCoreService>(ChatbotCoreService);
    analyticsService = module.get(AnalyticsService);
    energyService = module.get(EnergyService);
    subscribersService = module.get(SubscribersService);
    geminiAIService = module.get(GeminiAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should handle status command', async () => {
      const context: MessageContext = {
        userId: 'test-user',
        channel: 'web',
      };

      analyticsService.getComprehensiveAnalytics.mockResolvedValue({
        today: {
          totalEnergyKWh: 1.5,
          avgPowerW: 50,
          peakPowerW: 100,
          minPowerW: 10,
          readingCount: 100,
        },
        thisWeek: {
          totalEnergyKWh: 10,
          readingCount: 700,
        },
        thisMonth: {
          totalEnergyKWh: 40,
          daysWithData: 20,
          daysInMonth: 30,
        },
        peakGeneration: {
          peakPowerW: 120,
          date: '2024-01-15',
          time: '12:00',
        },
        environmentalImpact: {
          co2AvoidedKg: 20,
          treesEquivalent: 1.5,
        },
        costSavings: {
          totalSavings: 5,
          yearlyProjectedSavings: 60,
        },
        trend: {
          trend: 'up',
          changePercent: 10,
        },
      } as any);

      const response = await service.processMessage('status', context);

      expect(response.text).toContain('Energy System Status');
      expect(response.suggestions).toBeDefined();
    });

    it('should handle subscription command on web channel', async () => {
      const context: MessageContext = {
        userId: 'web-session-123',
        channel: 'web',
      };

      const response = await service.processMessage('subscribe', context);

      expect(response.text).toContain('only available via Facebook Messenger');
      expect(response.suggestions).toContain('status');
    });

    it('should handle unknown command', async () => {
      const context: MessageContext = {
        userId: 'test-user',
        channel: 'web',
      };

      geminiAIService.isAIEnabled.mockReturnValue(false);

      const response = await service.processMessage('xyz123', context);

      expect(response.text).toContain('available commands');
    });

    it('should handle natural language with AI', async () => {
      const context: MessageContext = {
        userId: 'test-user',
        channel: 'web',
      };

      geminiAIService.isAIEnabled.mockReturnValue(true);
      geminiAIService.processQuery.mockResolvedValue(
        'Your system generated 1.5 kWh today.',
      );

      const response = await service.processMessage(
        'how much energy today?',
        context,
      );

      expect(response.text).toContain('1.5 kWh');
      expect(geminiAIService.processQuery).toHaveBeenCalledWith(
        'how much energy today?',
      );
    });
  });

  describe('parseCommand', () => {
    it('should normalize commands to lowercase', async () => {
      const context: MessageContext = {
        userId: 'test-user',
        channel: 'web',
      };

      geminiAIService.isAIEnabled.mockReturnValue(false);
      const response = await service.processMessage('STATUS', context);
      expect(analyticsService.getComprehensiveAnalytics).toHaveBeenCalled();
    });

    it('should identify command variants', async () => {
      const context: MessageContext = {
        userId: 'test-user',
        channel: 'web',
      };

      geminiAIService.isAIEnabled.mockReturnValue(false);

      // Test 'stats' maps to 'status'
      await service.processMessage('stats', context);
      expect(analyticsService.getComprehensiveAnalytics).toHaveBeenCalled();
    });
  });

  describe('formatForChannel', () => {
    it('should format for messenger with quick replies', () => {
      const response = {
        text: 'Test message',
        suggestions: ['status', 'help'],
      };

      const formatted = service.formatForChannel(response, 'messenger');

      expect(formatted.quickReplies).toBeDefined();
      expect(formatted.quickReplies?.length).toBe(2);
      expect(formatted.quickReplies?.[0].title).toContain('Status');
      expect(formatted.quickReplies?.[0].payload).toBe('status');
    });

    it('should format for web with plain suggestions', () => {
      const response = {
        text: 'Test message',
        suggestions: ['status', 'help'],
      };

      const formatted = service.formatForChannel(response, 'web');

      expect(formatted.suggestions).toBeDefined();
      expect(formatted.suggestions?.length).toBe(2);
      expect(formatted.quickReplies).toBeUndefined();
    });

    it('should preserve core response text for both channels', () => {
      const response = {
        text: 'Energy System Status\n\nToday: 1.5 kWh\nPeak: 100W',
        suggestions: ['today', 'week'],
      };

      const messengerFormatted = service.formatForChannel(response, 'messenger');
      const webFormatted = service.formatForChannel(response, 'web');

      // Core content should be identical
      expect(messengerFormatted.text).toBe(response.text);
      expect(webFormatted.text).toBe(response.text);
    });

    it('should handle responses without suggestions for messenger', () => {
      const response = {
        text: 'Simple message with no suggestions',
      };

      const formatted = service.formatForChannel(response, 'messenger');

      expect(formatted.text).toBe(response.text);
      expect(formatted.quickReplies).toBeUndefined();
    });

    it('should handle responses without suggestions for web', () => {
      const response = {
        text: 'Simple message with no suggestions',
      };

      const formatted = service.formatForChannel(response, 'web');

      expect(formatted.text).toBe(response.text);
      expect(formatted.suggestions).toBeUndefined();
    });

    it('should handle empty suggestions array for messenger', () => {
      const response = {
        text: 'Message with empty suggestions',
        suggestions: [],
      };

      const formatted = service.formatForChannel(response, 'messenger');

      expect(formatted.text).toBe(response.text);
      expect(formatted.quickReplies).toBeUndefined();
    });

    it('should handle empty suggestions array for web', () => {
      const response = {
        text: 'Message with empty suggestions',
        suggestions: [],
      };

      const formatted = service.formatForChannel(response, 'web');

      expect(formatted.text).toBe(response.text);
      expect(formatted.suggestions).toEqual([]);
    });

    it('should format all suggestion types correctly for messenger', () => {
      const response = {
        text: 'Test all suggestions',
        suggestions: ['status', 'today', 'week', 'month', 'peak', 'energy', 'battery', 'impact', 'savings', 'help', 'about', 'subscribe', 'hello'],
      };

      const formatted = service.formatForChannel(response, 'messenger');

      expect(formatted.quickReplies).toBeDefined();
      expect(formatted.quickReplies?.length).toBe(13);
      
      // Verify specific titles and payloads
      expect(formatted.quickReplies?.[0]).toEqual({ title: '📊 Status', payload: 'status' });
      expect(formatted.quickReplies?.[1]).toEqual({ title: '📅 Today', payload: 'today' });
      expect(formatted.quickReplies?.[7]).toEqual({ title: '🌱 Impact', payload: 'impact' });
      expect(formatted.quickReplies?.[8]).toEqual({ title: '💰 Savings', payload: 'savings' });
    });

    it('should handle custom suggestions with fallback titles for messenger', () => {
      const response = {
        text: 'Test with custom suggestion',
        suggestions: ['status', 'custom_command', 'help'],
      };

      const formatted = service.formatForChannel(response, 'messenger');

      expect(formatted.quickReplies).toBeDefined();
      expect(formatted.quickReplies?.length).toBe(3);
      expect(formatted.quickReplies?.[1]).toEqual({ title: 'custom_command', payload: 'custom_command' });
    });

    it('should maintain suggestion order for both channels', () => {
      const response = {
        text: 'Test suggestion order',
        suggestions: ['help', 'status', 'energy', 'battery'],
      };

      const messengerFormatted = service.formatForChannel(response, 'messenger');
      const webFormatted = service.formatForChannel(response, 'web');

      // Verify order is maintained
      expect(messengerFormatted.quickReplies?.[0].payload).toBe('help');
      expect(messengerFormatted.quickReplies?.[1].payload).toBe('status');
      expect(messengerFormatted.quickReplies?.[2].payload).toBe('energy');
      expect(messengerFormatted.quickReplies?.[3].payload).toBe('battery');

      expect(webFormatted.suggestions?.[0]).toBe('help');
      expect(webFormatted.suggestions?.[1]).toBe('status');
      expect(webFormatted.suggestions?.[2]).toBe('energy');
      expect(webFormatted.suggestions?.[3]).toBe('battery');
    });
  });
});
