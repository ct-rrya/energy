import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiAIService } from './gemini-ai.service';

/**
 * GeminiAIService Tests with Groq Fallback
 * 
 * Tests the AI service with automatic fallback logic:
 * - Gemini success scenarios
 * - Gemini quota exhaustion with Groq fallback
 * - Both providers failing
 * - Error classification
 * - Provider availability checks
 */
describe('GeminiAIService', () => {
  let service: GeminiAIService;
  let configService: ConfigService;

  // Mock Gemini model
  const mockGeminiModel = {
    generateContent: jest.fn(),
  };

  // Mock Groq client
  const mockGroq = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiAIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-gemini-key';
              if (key === 'GROQ_API_KEY') return 'test-groq-key';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiAIService>(GeminiAIService);
    configService = module.get<ConfigService>(ConfigService);

    // Inject mocks into private fields
    (service as any).geminiModel = mockGeminiModel;
    (service as any).geminiEnabled = true;
    (service as any).groq = mockGroq;
    (service as any).groqEnabled = true;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Gemini Success', () => {
    it('should return response from Gemini when successful', async () => {
      const mockResponse = 'AI insight from Gemini';
      mockGeminiModel.generateContent.mockResolvedValue({
        response: {
          text: () => mockResponse,
        },
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(mockResponse);
      expect(mockGeminiModel.generateContent).toHaveBeenCalledWith('Test prompt');
      expect(mockGroq.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should handle Gemini responses with various lengths', async () => {
      const longResponse = 'A'.repeat(1000);
      mockGeminiModel.generateContent.mockResolvedValue({
        response: {
          text: () => longResponse,
        },
      });

      const result = await service.processQuery('Long analysis request');

      expect(result).toBe(longResponse);
      expect(result.length).toBe(1000);
    });
  });

  describe('Gemini Quota Exhaustion with Groq Fallback', () => {
    it('should fallback to Groq when Gemini quota is exhausted (HTTP 429)', async () => {
      const quotaError = new Error('Resource exhausted');
      (quotaError as any).status = 429;
      mockGeminiModel.generateContent.mockRejectedValue(quotaError);

      const groqResponse = 'AI insight from Groq';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: groqResponse,
            },
          },
        ],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
      expect(mockGeminiModel.generateContent).toHaveBeenCalled();
      expect(mockGroq.chat.completions.create).toHaveBeenCalled();
    });

    it('should fallback to Groq on quota message in error', async () => {
      const quotaError = new Error('Quota exceeded for quota metric');
      mockGeminiModel.generateContent.mockRejectedValue(quotaError);

      const groqResponse = 'Fallback response';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
      expect(mockGroq.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Test prompt' }],
        }),
      );
    });

    it('should fallback to Groq on rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockGeminiModel.generateContent.mockRejectedValue(rateLimitError);

      const groqResponse = 'Rate limit fallback';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
    });
  });

  describe('Server Error Fallback', () => {
    it('should fallback to Groq on 5xx server errors', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;
      mockGeminiModel.generateContent.mockRejectedValue(serverError);

      const groqResponse = 'Server error fallback';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
    });

    it('should fallback to Groq on timeout', async () => {
      const timeoutError = new Error('Gemini API timeout after 10s');
      mockGeminiModel.generateContent.mockRejectedValue(timeoutError);

      const groqResponse = 'Timeout fallback';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
    });
  });

  describe('No Fallback Scenarios', () => {
    it('should fallback to Groq even on authentication errors if Groq is available', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;
      mockGeminiModel.generateContent.mockRejectedValue(authError);

      const groqResponse = 'Response from Groq after Gemini auth failure';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
      expect(mockGroq.chat.completions.create).toHaveBeenCalled();
    });

    it('should NOT fallback on malformed requests', async () => {
      const invalidError = new Error('Invalid request format');
      (invalidError as any).status = 400;
      mockGeminiModel.generateContent.mockRejectedValue(invalidError);

      const result = await service.processQuery('Test prompt');

      expect(result).toBeNull();
      expect(mockGroq.chat.completions.create).not.toHaveBeenCalled();
    });
  });

  describe('Both Providers Failing', () => {
    it('should return null when both Gemini and Groq fail', async () => {
      const geminiError = new Error('Gemini quota exceeded');
      (geminiError as any).status = 429;
      mockGeminiModel.generateContent.mockRejectedValue(geminiError);

      const groqError = new Error('Groq service unavailable');
      mockGroq.chat.completions.create.mockRejectedValue(groqError);

      const result = await service.processQuery('Test prompt');

      expect(result).toBeNull();
      expect(mockGeminiModel.generateContent).toHaveBeenCalled();
      expect(mockGroq.chat.completions.create).toHaveBeenCalled();
    });

    it('should handle empty Groq response gracefully', async () => {
      const quotaError = new Error('Quota exceeded');
      (quotaError as any).status = 429;
      mockGeminiModel.generateContent.mockRejectedValue(quotaError);

      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '' } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBeNull();
    });
  });

  describe('Provider Availability', () => {
    it('should report true when any provider is available', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should return provider status', () => {
      const status = service.getProviderStatus();

      expect(status.gemini).toBe(true);
      expect(status.groq).toBe(true);
      expect(status.anyAvailable).toBe(true);
    });

    it('should return null when no providers are enabled', async () => {
      (service as any).geminiEnabled = false;
      (service as any).groqEnabled = false;

      const result = await service.processQuery('Test prompt');

      expect(result).toBeNull();
      expect(mockGeminiModel.generateContent).not.toHaveBeenCalled();
      expect(mockGroq.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should work with only Groq when Gemini is disabled', async () => {
      (service as any).geminiEnabled = false;
      (service as any).geminiModel = null;

      const groqResponse = 'Groq only response';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const result = await service.processQuery('Test prompt');

      expect(result).toBe(groqResponse);
      expect(mockGeminiModel.generateContent).not.toHaveBeenCalled();
      expect(mockGroq.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('Report Analysis', () => {
    it('should generate report analysis using processQuery', async () => {
      const mockResponse = 'Report analysis';
      mockGeminiModel.generateContent.mockResolvedValue({
        response: {
          text: () => mockResponse,
        },
      });

      const reportData = {
        hasData: true,
        period: {
          startDate: '2024-01-01',
          endDate: '2024-01-07',
        },
        energySummary: {
          totalEnergyKWh: 10.5,
          avgPowerW: 50.2,
          peakPowerW: 120.5,
        },
        environmentalImpact: {
          co2AvoidedKg: 5.2,
        },
        costSavings: {
          totalSavings: 2.5,
        },
      };

      const result = await service.generateReportAnalysis('weekly', reportData);

      expect(result).toBe(mockResponse);
      expect(mockGeminiModel.generateContent).toHaveBeenCalled();
    });

    it('should return null for reports with no data', async () => {
      const reportData = {
        hasData: false,
      };

      const result = await service.generateReportAnalysis('daily', reportData);

      expect(result).toBeNull();
      expect(mockGeminiModel.generateContent).not.toHaveBeenCalled();
    });

    it('should fallback to Groq for report analysis when Gemini fails', async () => {
      const quotaError = new Error('Quota exceeded');
      (quotaError as any).status = 429;
      mockGeminiModel.generateContent.mockRejectedValue(quotaError);

      const groqResponse = 'Report analysis from Groq';
      mockGroq.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: groqResponse } }],
      });

      const reportData = {
        hasData: true,
        period: { startDate: '2024-01-01', endDate: '2024-01-07' },
        energySummary: { totalEnergyKWh: 10, avgPowerW: 50, peakPowerW: 100 },
        environmentalImpact: { co2AvoidedKg: 5 },
        costSavings: { totalSavings: 2 },
      };

      const result = await service.generateReportAnalysis('weekly', reportData);

      expect(result).toBe(groqResponse);
    });
  });

  describe('Error Classification', () => {
    it('should classify quota errors correctly', () => {
      const error = new Error('Quota exceeded');
      (error as any).status = 429;

      const errorType = (service as any).classifyError(error, 'Gemini');
      const shouldFallback = (service as any).shouldFallback(errorType);

      expect(shouldFallback).toBe(true);
    });

    it('should classify auth errors correctly and not fallback', () => {
      const error = new Error('Invalid API key');
      (error as any).status = 401;

      const errorType = (service as any).classifyError(error, 'Gemini');
      const shouldFallback = (service as any).shouldFallback(errorType);

      expect(shouldFallback).toBe(false);
    });

    it('should classify server errors correctly', () => {
      const error = new Error('Internal server error');
      (error as any).status = 503;

      const errorType = (service as any).classifyError(error, 'Gemini');
      const shouldFallback = (service as any).shouldFallback(errorType);

      expect(shouldFallback).toBe(true);
    });
  });
});
