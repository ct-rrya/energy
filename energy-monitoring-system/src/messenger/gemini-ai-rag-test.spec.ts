import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiAIService } from './gemini-ai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';

/**
 * Task 2.6: RAG Data Injection Preservation Property Test
 * 
 * **Validates: Requirements 3.6**
 * **Property 2: Preservation** - RAG Methodology
 * 
 * This preservation test verifies that processQuery() fetches real-time energy
 * data from MongoDB and injects it into the Gemini AI prompt. This is the core
 * RAG (Retrieval-Augmented Generation) methodology that must be preserved after
 * implementing timeout fixes.
 * 
 * **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline RAG behavior)
 */
describe('Task 2.6: RAG Data Injection Preservation', () => {
  let service: GeminiAIService;
  let energyService: EnergyService;
  let analyticsService: AnalyticsService;
  let mockModel: any;
  let mockGenerateContent: jest.Mock;

  beforeEach(async () => {
    // Create mock for Gemini model.generateContent()
    mockGenerateContent = jest.fn();
    
    mockModel = {
      generateContent: mockGenerateContent,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiAIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') return 'AQ.test-api-key-for-testing';
              return null;
            }),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            getDailySummary: jest.fn().mockResolvedValue({
              totalEnergyKWh: 0.5,
              peakPowerW: 45.2,
              avgPowerW: 12.3,
              date: new Date().toISOString().split('T')[0],
            }),
          },
        },
        {
          provide: EnergyService,
          useValue: {
            getTodayEnergyTotal: jest.fn().mockResolvedValue({
              totalPower: 127.5,
              avgPower: 15.6,
              maxPower: 48.9,
              count: 450,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiAIService>(GeminiAIService);
    energyService = module.get<EnergyService>(EnergyService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);

    // Inject mock model into service
    (service as any).model = mockModel;
    (service as any).isEnabled = true;
  });

  /**
   * Property: For all queries, processQuery() fetches MongoDB data and injects into prompt
   */
  it('should fetch MongoDB data and inject into prompt (preservation property)', async () => {
    console.log('\n[RAG Preservation Test] Testing RAG data injection across various scenarios...\n');

    // Define various energy data scenarios to test
    const energyDataScenarios = [
      {
        name: 'Low Energy Day',
        mockTodayEnergy: {
          totalPower: 45.2,
          avgPower: 5.3,
          maxPower: 12.8,
          count: 120,
        },
        mockDailySummary: {
          totalEnergyKWh: 0.0452,
          peakPowerW: 12.8,
          avgPowerW: 5.3,
          date: '2024-01-15',
        },
      },
      {
        name: 'Medium Energy Day',
        mockTodayEnergy: {
          totalPower: 127.5,
          avgPower: 15.6,
          maxPower: 48.9,
          count: 450,
        },
        mockDailySummary: {
          totalEnergyKWh: 0.1275,
          peakPowerW: 48.9,
          avgPowerW: 15.6,
          date: '2024-01-16',
        },
      },
      {
        name: 'High Energy Day',
        mockTodayEnergy: {
          totalPower: 325.8,
          avgPower: 28.4,
          maxPower: 92.3,
          count: 890,
        },
        mockDailySummary: {
          totalEnergyKWh: 0.3258,
          peakPowerW: 92.3,
          avgPowerW: 28.4,
          date: '2024-01-17',
        },
      },
      {
        name: 'Zero Energy (No Activity)',
        mockTodayEnergy: {
          totalPower: 0,
          avgPower: 0,
          maxPower: 0,
          count: 0,
        },
        mockDailySummary: {
          totalEnergyKWh: 0,
          peakPowerW: 0,
          avgPowerW: 0,
          date: '2024-01-18',
        },
      },
    ];

    // Property: For ALL energy data scenarios, RAG injection should work consistently
    for (const scenario of energyDataScenarios) {
      console.log(`[RAG Test] Testing scenario: ${scenario.name}`);
      
      // Mock database responses with this scenario's data
      (energyService.getTodayEnergyTotal as jest.Mock).mockResolvedValue(
        scenario.mockTodayEnergy,
      );
      (analyticsService.getDailySummary as jest.Mock).mockResolvedValue(
        scenario.mockDailySummary,
      );

      // Track the prompt passed to Gemini API
      let capturedPrompt = '';
      mockGenerateContent.mockImplementation((prompt: string) => {
        capturedPrompt = prompt;
        return Promise.resolve({
          response: {
            text: () => `⚡ Based on your energy data: ${scenario.mockTodayEnergy.totalPower}Wh generated today! 💚`,
            candidates: [
              {
                finishReason: 'STOP',
                content: { parts: [{ text: 'Response' }] },
              },
            ],
          },
        });
      });

      // Test query
      const testQuery = 'What is my energy total today?';
      
      console.log(`[RAG Test] Calling processQuery() with: "${testQuery}"`);
      const response = await service.processQuery(testQuery);
      
      // ASSERTION 1: Database services should be called (RAG data fetching)
      expect(energyService.getTodayEnergyTotal).toHaveBeenCalled();
      expect(analyticsService.getDailySummary).toHaveBeenCalled();
      
      console.log(`[RAG Test] ✅ Database services called (fetchEnergyData executed)`);
      
      // ASSERTION 2: Gemini API should be called with prompt containing injected data
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(capturedPrompt).toBeDefined();
      expect(capturedPrompt.length).toBeGreaterThan(0);
      
      console.log(`[RAG Test] ✅ Gemini API called with prompt (${capturedPrompt.length} chars)`);
      
      // ASSERTION 3: Prompt should contain the specific energy data from this scenario
      // Check for JSON data structure in prompt
      expect(capturedPrompt).toContain('REAL-TIME ECOSTEP DATA FROM MONGODB DATABASE');
      expect(capturedPrompt).toContain('USER QUESTION');
      expect(capturedPrompt).toContain(testQuery);
      
      console.log(`[RAG Test] ✅ Prompt contains RAG template structure`);
      
      // ASSERTION 4: Prompt should contain the actual values from MongoDB
      const promptContainsData = 
        capturedPrompt.includes(scenario.mockTodayEnergy.totalPower.toString()) ||
        capturedPrompt.includes(scenario.mockTodayEnergy.avgPower.toString()) ||
        capturedPrompt.includes(scenario.mockDailySummary.totalEnergyKWh.toString());
      
      expect(promptContainsData).toBe(true);
      
      console.log(`[RAG Test] ✅ Prompt contains injected MongoDB data:`);
      console.log(`[RAG Test]    Total energy: ${scenario.mockTodayEnergy.totalPower}Wh`);
      console.log(`[RAG Test]    Peak power: ${scenario.mockDailySummary.peakPowerW}W`);
      console.log(`[RAG Test]    Reading count: ${scenario.mockTodayEnergy.count}`);
      
      // ASSERTION 5: Response should be received successfully
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      
      console.log(`[RAG Test] ✅ AI response received: "${response.substring(0, 80)}..."`);
      console.log(`[RAG Test] Scenario "${scenario.name}" completed successfully\n`);
      
      // Reset mocks for next scenario
      jest.clearAllMocks();
    }

    console.log('[RAG Preservation Test] ✅ All scenarios tested successfully\n');
    console.log('[RAG Preservation Test] Property verified:');
    console.log('  For ALL energy data scenarios → MongoDB data fetched and injected');
    console.log('  EnergyService.getTodayEnergyTotal() called');
    console.log('  AnalyticsService.getDailySummary() called');
    console.log('  Data included in prompt passed to Gemini');
    console.log('  RAG methodology working correctly\n');
  });

  /**
   * Property: Prompt structure follows RAG template with data injection
   */
  it('should format prompt with JSON data structure (preservation property)', async () => {
    console.log('\n[RAG Format Test] Testing prompt structure and formatting...\n');
    
    // Mock specific data
    const mockTodayEnergy = {
      totalPower: 127.5,
      avgPower: 15.6,
      maxPower: 48.9,
      count: 450,
    };
    
    const mockDailySummary = {
      totalEnergyKWh: 0.1275,
      peakPowerW: 48.9,
      avgPowerW: 15.6,
      date: '2024-01-20',
    };
    
    (energyService.getTodayEnergyTotal as jest.Mock).mockResolvedValue(mockTodayEnergy);
    (analyticsService.getDailySummary as jest.Mock).mockResolvedValue(mockDailySummary);

    // Capture prompt
    let capturedPrompt = '';
    mockGenerateContent.mockImplementation((prompt: string) => {
      capturedPrompt = prompt;
      return Promise.resolve({
        response: {
          text: () => '⚡ You generated 127.5Wh today!',
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: 'Response' }] },
            },
          ],
        },
      });
    });

    const testQuery = 'How much energy did I generate?';
    await service.processQuery(testQuery);
    
    // ASSERTION: Prompt should have expected RAG template structure
    console.log('[RAG Format Test] Analyzing prompt structure...');
    console.log('[RAG Format Test] Full prompt length:', capturedPrompt.length);
    
    // Check for required sections
    expect(capturedPrompt).toContain('**REAL-TIME ECOSTEP DATA FROM MONGODB DATABASE:**');
    console.log('[RAG Format Test] ✅ Contains data header');
    
    expect(capturedPrompt).toContain('```json');
    console.log('[RAG Format Test] ✅ Contains JSON code block');
    
    expect(capturedPrompt).toContain('**USER QUESTION:**');
    console.log('[RAG Format Test] ✅ Contains user question section');
    
    expect(capturedPrompt).toContain(testQuery);
    console.log('[RAG Format Test] ✅ Contains user query text');
    
    expect(capturedPrompt).toContain('**INSTRUCTIONS:**');
    console.log('[RAG Format Test] ✅ Contains instructions section');
    
    // Check for data fields in JSON
    expect(capturedPrompt).toContain('timestamp');
    expect(capturedPrompt).toContain('today');
    expect(capturedPrompt).toContain('analytics');
    expect(capturedPrompt).toContain('totalEnergyWh');
    expect(capturedPrompt).toContain('avgPowerW');
    expect(capturedPrompt).toContain('peakPowerW');
    console.log('[RAG Format Test] ✅ Contains all expected data fields');
    
    // Check for actual values
    expect(capturedPrompt).toContain('127.5'); // totalPower
    expect(capturedPrompt).toContain('15.6');  // avgPower
    expect(capturedPrompt).toContain('48.9');  // maxPower
    console.log('[RAG Format Test] ✅ Contains actual MongoDB values');
    
    console.log('\n[RAG Format Test] Property verified:');
    console.log('  Prompt follows RAG template structure');
    console.log('  MongoDB data formatted as JSON');
    console.log('  User question clearly separated');
    console.log('  Instructions included for AI\n');
  });

  /**
   * Property: Data fetching errors are handled gracefully
   */
  it('should handle database errors gracefully (preservation property)', async () => {
    console.log('\n[RAG Error Test] Testing database error handling...\n');
    
    // Mock database errors
    (energyService.getTodayEnergyTotal as jest.Mock).mockRejectedValue(
      new Error('MongoDB connection timeout'),
    );
    (analyticsService.getDailySummary as jest.Mock).mockRejectedValue(
      new Error('MongoDB connection timeout'),
    );

    // Mock Gemini to return response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '⚡ Live sensor data is currently unavailable. Please try again in a moment.',
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ text: 'Response' }] },
          },
        ],
      },
    });

    const testQuery = 'What is my energy total?';
    
    console.log('[RAG Error Test] Calling processQuery() with database errors...');
    const response = await service.processQuery(testQuery);
    
    // ASSERTION: Should NOT throw exception - errors handled internally
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    
    console.log('[RAG Error Test] ✅ No exception thrown (errors caught internally)');
    console.log(`[RAG Error Test] Response: "${response.substring(0, 100)}..."`);
    
    // Verify database service was attempted (even though it failed)
    // Note: fetchEnergyData catches errors early, so only getTodayEnergyTotal is called
    expect(energyService.getTodayEnergyTotal).toHaveBeenCalled();
    
    console.log('[RAG Error Test] ✅ Database service was called (error caught internally)');
    
    // Gemini should still be called (with error data structure)
    expect(mockGenerateContent).toHaveBeenCalled();
    
    console.log('[RAG Error Test] ✅ Gemini API still called (with error data)');
    console.log('\n[RAG Error Test] Property verified:');
    console.log('  Database errors handled gracefully');
    console.log('  Empty/error data structure passed to AI');
    console.log('  No exceptions propagate to caller');
    console.log('  AI can respond with "data unavailable" message\n');
  });
});
