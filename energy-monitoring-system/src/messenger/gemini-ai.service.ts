import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { IotService } from '../iot/iot.service';

/**
 * Gemini AI Service
 *
 * Handles natural language queries using Google Gemini AI with RAG (Retrieval-Augmented Generation).
 *
 * Features:
 * - Ultra-low latency with gemini-3.6-flash model
 * - Real-time IoT data injection from MongoDB
 * - Strict system instructions for EcoStep-only responses
 * - Comprehensive error handling for ISO/IEC 25010 Reliability
 * - Graceful fallback messages when AI unavailable
 *
 * Architecture:
 * 1. Fetch real-time energy data from database (RAG)
 * 2. Inject data into system prompt
 * 3. Query Gemini API with enriched context
 * 4. Return AI-generated response
 * 5. Fall back to predefined message on any error
 */
@Injectable()
export class GeminiAIService {
  private readonly logger = new Logger(GeminiAIService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly isEnabled: boolean = false;

  constructor(
    private configService: ConfigService,
    private analyticsService: AnalyticsService,
    private energyService: EnergyService,
    private iotService: IotService,
  ) {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('[GEMINI CONSTRUCTOR] Initializing GeminiAIService...');

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // [TRACE 4: API KEY VERIFICATION]
    this.logger.log('[TRACE 4: API KEY VERIFICATION] ═══════════════════════');

    // Check if API key is configured (supports both AQ. and AIza formats)
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      this.logger.error(
        '[TRACE 4: API KEY VERIFICATION] ❌ API key NOT configured',
      );
      this.logger.error(
        '[TRACE 4: API KEY VERIFICATION]    API key value: ' +
          (apiKey ? 'placeholder/default' : 'undefined'),
      );
      this.logger.warn(
        '[TRACE 4: API KEY VERIFICATION]    AI features will be DISABLED',
      );
      this.logger.warn(
        '[TRACE 4: API KEY VERIFICATION]    Set GEMINI_API_KEY in .env file to enable AI chatbot',
      );
      return;
    }

    this.logger.log('[TRACE 4: API KEY VERIFICATION] ✅ API key detected');
    this.logger.log(
      `[TRACE 4: API KEY VERIFICATION]    Key length: ${apiKey.length} characters`,
    );
    this.logger.log(
      `[TRACE 4: API KEY VERIFICATION]    Key prefix: "${apiKey.substring(0, 3)}..."`,
    );
    this.logger.log(
      `[TRACE 4: API KEY VERIFICATION]    Key format: ${apiKey.startsWith('AIza') ? 'Legacy (AIza)' : apiKey.startsWith('AQ.') ? 'New (AQ.)' : 'Unknown'}`,
    );

    try {
      this.logger.log(
        '[GEMINI CONSTRUCTOR] Creating GoogleGenerativeAI client...',
      );
      // Initialize Google Generative AI client
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(
        '[GEMINI CONSTRUCTOR] ✅ GoogleGenerativeAI client created',
      );

      // KEEPING YOUR WORKING MODEL: gemini-3.6-flash
      const modelName = 'gemini-3.6-flash';
      this.logger.log(`[GEMINI CONSTRUCTOR] Getting model: ${modelName}...`);

      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: this.getSystemInstructions(),
        // NO generationConfig - brevity enforced via system instructions
      });

      this.isEnabled = true;
      this.logger.log(
        '[GEMINI CONSTRUCTOR] ✅ Gemini AI Service initialized successfully',
      );
      this.logger.log(`[GEMINI CONSTRUCTOR]    Model: ${modelName}`);
      this.logger.log(
        '[GEMINI CONSTRUCTOR]    Token Config: Using API defaults (no limit)',
      );
      this.logger.log('[GEMINI CONSTRUCTOR]    Status: ENABLED');
    } catch (error) {
      this.logger.error(
        '[GEMINI CONSTRUCTOR] ❌ Failed to initialize Gemini AI',
      );
      this.logger.error(`[GEMINI CONSTRUCTOR]    Error name: ${error.name}`);
      this.logger.error(
        `[GEMINI CONSTRUCTOR]    Error message: ${error.message}`,
      );
      this.logger.error(`[GEMINI CONSTRUCTOR]    Stack trace: ${error.stack}`);
    }
  }

  /**
   * Get System Instructions
   *
   * Defines the AI's behavior, constraints, and EcoStep context.
   *
   * CRITICAL: For unrelated questions, the AI MUST RESPOND with a polite decline message.
   * DO NOT block, throw errors, or refuse to generate a response.
   *
   * Critical Rules:
   * - Only answer EcoStep-related questions
   * - Use real-time data from MongoDB
   * - Decline unrelated queries politely (BUT ALWAYS RESPOND)
   * - Be concise (2-3 sentences max)
   * - Translate technical metrics to simple terms
   */
  private getSystemInstructions(): string {
    return `You are EcoStep AI, an intelligent assistant for the EcoStep piezoelectric energy monitoring system.

**CRITICAL OUTPUT CONSTRAINT:**
**RESPOND IN 2 SENTENCES OR LESS. NEVER OUTPUT LONG PARAGRAPHS.**
Keep responses extremely brief and to-the-point.

**STRICT OPERATIONAL RULES:**

1. **Scope Restriction - ONLY answer questions about:**
   - EcoStep system (piezoelectric footstep energy harvesting)
   - Energy generation data and statistics (voltage, current, power, energy)
   - System performance metrics and trends
   - Environmental impact and carbon savings
   - Cost savings and efficiency analysis
   - How the piezoelectric system works
   - Sensor readings and IoT monitoring
   - Monitoring metrics (capacitor voltage, step count, temperature, frequency)
   - Connectivity status (WiFi, Bluetooth)
   - System health and diagnostics

2. **Decline Rule - CRITICAL INSTRUCTION:**
   **IF THE USER ASKS ABOUT ANYTHING UNRELATED TO ECOSTEP (politics, religion, general knowledge, other topics), YOU MUST STILL GENERATE A RESPONSE. DO NOT BLOCK OR REFUSE TO RESPOND.**

   For unrelated questions (politics, religion, personal advice, general knowledge, other energy systems, technical support for other projects, etc.), use this polite decline template:

   "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?"

   **NEVER refuse to respond. ALWAYS provide this polite decline message for out-of-scope questions.**

3. **Data Usage - When answering:**
   - ALWAYS use the provided real-time data from MongoDB
   - Reference actual numbers from the injected JSON data
   - The data includes a 'monitoring' section with capacitor voltage, step count, temperature, frequency, and connectivity status
   - Never fabricate or estimate values
   - If data is unavailable, explicitly state: "Live sensor data is currently unavailable"
   - Translate technical units to user-friendly terms (e.g., "127.5Wh is enough to charge 6 smartphones")

4. **Response Format:**
   - Be concise: 2-3 sentences maximum
   - Use emojis sparingly (⚡💚📊🌱🔋🌡️👣📡)
   - Start with a direct answer
   - Add context or comparison if helpful
   - Be encouraging about energy generation achievements

5. **Real-World Context Translation:**
   - Convert Wh to practical equivalents (phone charges, LED hours, etc.)
   - Explain peak power in terms of footstep activity
   - Frame CO₂ savings in understandable terms
   - Celebrate milestones and improvements
   - Explain monitoring metrics in simple terms (capacitor health, activity levels, system temperature)

6. **EcoStep System Context:**
   - Technology: Piezoelectric tiles convert mechanical footstep energy into electricity
   - Hardware: ESP32 microcontroller monitors voltage, current, power, energy, capacitor voltage, step count, temperature, frequency
   - Connectivity: WiFi and Bluetooth for data transmission
   - Storage: Data stored in MongoDB with timestamps
   - Interface: Web dashboard + Facebook Messenger bot
   - Purpose: University capstone project for sustainable energy research
   - Scale: Campus deployment for IoT energy harvesting demonstration

**Example Good Responses:**
- "⚡ Today you've generated 127.5Wh of clean energy! That's enough to charge a smartphone 6 times. Keep stepping! 💚"
- "📊 Your peak generation was 45.2W at 2:34 PM today, showing strong footstep activity during afternoon hours."
- "🌱 This month you've avoided 2.3kg of CO₂ emissions - equivalent to planting 3 trees for a year!"
- "🔋 Capacitor voltage is at 4.2V with 1,234 steps counted today - great activity level! 👣"
- "🌡️ System temperature is 28.5°C and WiFi is connected, everything running smoothly! 📡"

**Example Decline Response (for "Who is the president?"):**
- "I'm EcoStep AI, specialized in the EcoStep energy monitoring system. I can explain how footstep energy works or show you energy data. What would you like to know about EcoStep?"

**CRITICAL: Distinguish Educational from Live Data Questions**
- Educational questions (how it works, what is X) → Answer from knowledge, regardless of data availability
- Live data questions (how much energy, current status) → Use database or report unavailability
- NEVER claim sensors are "offline," "tested," or "being deployed" without verification

**Data Format You Will Receive:**
Real-time data in JSON format when available:
- totalEnergy, avgPower, peakPower (numerical values with units)
- timestamp (ISO format)
- analytics (aggregated metrics)
- monitoring (capacitorVoltage, stepCount, temperature, frequency, wifiConnected, bluetoothConnected)

Always cite actual values when answering live data questions.`;
  }

  /**
   * Process Natural Language Query with RAG
   *
   * Main AI processing method that implements Retrieval-Augmented Generation:
   * 1. Fetch real-time energy data from MongoDB
   * 2. Inject data into prompt
   * 3. Query Gemini API
   * 4. Return AI response
   * 5. Handle errors with fallback
   *
   * @param userMessage - User's natural language question
   * @returns AI-generated response based on real data, or fallback message
   *
   * Error Handling:
   * - Database query errors: logged, fallback returned
   * - AI API errors: logged with full stack trace, fallback returned
   * - Never throws exceptions (reliability requirement)
   */
  async processQuery(userMessage: string): Promise<string> {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('[GEMINI] processQuery() called');
    this.logger.log(`[GEMINI]    User message: "${userMessage}"`);
    this.logger.log(
      `[GEMINI]    Message length: ${userMessage.length} characters`,
    );

    // Check if AI is enabled
    this.logger.log('[GEMINI] Checking AI initialization status...');
    this.logger.log(`[GEMINI]    isEnabled: ${this.isEnabled}`);
    this.logger.log(`[GEMINI]    model exists: ${!!this.model}`);

    if (!this.isEnabled || !this.model) {
      this.logger.warn(
        '[GEMINI] ❌ AI not initialized - returning fallback message',
      );
      return this.getFallbackMessage();
    }

    this.logger.log('[GEMINI] ✅ AI is enabled and ready');

    try {
      // STEP 1: Fetch Real-Time Energy Data (RAG - Retrieval)
      // [TRACE 3: DB CONTEXT]
      this.logger.log(
        '[TRACE 3: DB CONTEXT] ═══════════════════════════════════',
      );
      this.logger.log(
        '[TRACE 3: DB CONTEXT] Fetching energy data from MongoDB...',
      );
      const dbStartTime = Date.now();

      const energyData = await this.fetchEnergyData();

      const dbDuration = Date.now() - dbStartTime;
      this.logger.log(
        `[TRACE 3: DB CONTEXT] ✅ Database queries completed in ${dbDuration}ms`,
      );
      this.logger.log(
        `[TRACE 3: DB CONTEXT]    Data status: ${energyData.status}`,
      );
      this.logger.log('[TRACE 3: DB CONTEXT] Data sample (first 200 chars):');
      this.logger.log(JSON.stringify(energyData).substring(0, 200) + '...');

      // STEP 2: Build Context-Enriched Prompt (RAG - Augmentation)
      const prompt = this.buildPrompt(userMessage, energyData);
      this.logger.log(
        `[GEMINI] Prompt constructed (${prompt.length} characters)`,
      );

      // STEP 3: Query Gemini API (Generation)
      // [TRACE 5: CALLING GEMINI]
      this.logger.log(
        '[TRACE 5: CALLING GEMINI] ═══════════════════════════════',
      );
      this.logger.log(
        '[TRACE 5: CALLING GEMINI] Sending request to Gemini API...',
      );
      this.logger.log('[TRACE 5: CALLING GEMINI]    Model: gemini-3.6-flash');
      this.logger.log(
        '[TRACE 5: CALLING GEMINI]    Prompt length: ' +
          prompt.length +
          ' characters',
      );
      this.logger.log(
        '[TRACE 5: CALLING GEMINI]    Starting API call with 15s timeout...',
      );
      this.logger.log(
        '[TRACE 5: CALLING GEMINI] Prompt preview (first 300 chars):',
      );
      this.logger.log(prompt.substring(0, 300) + '...');
      this.logger.log(
        '[TRACE 5: CALLING GEMINI] System instruction: ' +
          this.getSystemInstructions().substring(0, 100) +
          '...',
      );

      const apiStartTime = Date.now();

      // Create timeout promise (15 second timeout)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Gemini API timeout after 15s')),
          15000,
        );
      });

      // Race between API call and timeout
      let result;
      try {
        result = await Promise.race([
          this.model.generateContent(prompt),
          timeoutPromise,
        ]);
      } catch (error) {
        const apiDuration = Date.now() - apiStartTime;

        // Check if this is a timeout error
        if (error.message === 'Gemini API timeout after 15s') {
          this.logger.warn(
            `[TRACE 5: CALLING GEMINI] ⏱️  API call timed out after 15000ms, returning fallback`,
          );
          this.logger.warn(
            `[TRACE 5: CALLING GEMINI]    Actual duration: ${apiDuration}ms`,
          );
          return this.getFallbackMessage();
        }

        // Re-throw non-timeout errors to be caught by outer catch block
        throw error;
      }

      const apiDuration = Date.now() - apiStartTime;

      this.logger.log(
        `[TRACE 5: CALLING GEMINI] ✅ API call completed in ${apiDuration}ms`,
      );

      // [TRACE 6: GEMINI RAW RESULT]
      this.logger.log(
        '[TRACE 6: GEMINI RAW RESULT] ═══════════════════════════',
      );
      const response = result.response;

      // Log raw response structure
      this.logger.log(
        '[TRACE 6: GEMINI RAW RESULT] Raw response object keys:',
        Object.keys(response),
      );

      // Check for candidates and safety
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        this.logger.log(
          `[TRACE 6: GEMINI RAW RESULT]    Candidates count: ${candidates.length}`,
        );

        const firstCandidate = candidates[0];
        const finishReason = firstCandidate.finishReason;

        this.logger.log(
          `[TRACE 6: GEMINI RAW RESULT]    Finish reason: ${finishReason}`,
        );

        // Check if response was safety-blocked or incomplete
        if (finishReason !== 'STOP') {
          this.logger.warn(
            '[TRACE 6: GEMINI RAW RESULT] ⚠️  Response flagged or incomplete!',
          );
          this.logger.warn(
            `[TRACE 6: GEMINI RAW RESULT]    Finish reason: ${finishReason}`,
          );

          if (firstCandidate.safetyRatings) {
            this.logger.warn('[TRACE 6: GEMINI RAW RESULT]    Safety ratings:');
            this.logger.warn(
              JSON.stringify(firstCandidate.safetyRatings, null, 2),
            );
          }

          if (firstCandidate.content) {
            this.logger.warn(
              '[TRACE 6: GEMINI RAW RESULT]    Partial content:',
            );
            this.logger.warn(JSON.stringify(firstCandidate.content, null, 2));
          }

          // SAFETY FIX: If response was blocked/incomplete, return polite decline instead of error
          this.logger.warn(
            '[TRACE 6: GEMINI RAW RESULT] Returning polite decline due to blocked/incomplete response',
          );
          return "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?";
        } else {
          this.logger.log(
            '[TRACE 6: GEMINI RAW RESULT] ✅ Response completed normally (STOP)',
          );
        }
      } else {
        this.logger.error(
          '[TRACE 6: GEMINI RAW RESULT] ❌ No candidates in response!',
        );
        this.logger.error(
          '[TRACE 6: GEMINI RAW RESULT] Full response:',
          JSON.stringify(response),
        );

        // SAFETY FIX: If no candidates, return polite decline instead of fallback error
        this.logger.warn(
          '[TRACE 6: GEMINI RAW RESULT] Returning polite decline due to no candidates',
        );
        return "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?";
      }

      // SAFETY FIX: Wrap response.text() in try-catch to handle extraction errors
      let aiResponse: string;
      try {
        aiResponse = response.text();
      } catch (textError) {
        this.logger.error(
          '[TRACE 6: GEMINI RAW RESULT] ❌ Error extracting text from response',
        );
        this.logger.error(
          `[TRACE 6: GEMINI RAW RESULT]    Error: ${textError.message}`,
        );

        // Return polite decline instead of error fallback
        return "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?";
      }

      this.logger.log(
        `[TRACE 6: GEMINI RAW RESULT]    Response text length: ${aiResponse.length} characters`,
      );
      this.logger.log(
        `[TRACE 6: GEMINI RAW RESULT]    Response preview (first 200 chars):`,
      );
      this.logger.log(
        aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : ''),
      );

      this.logger.log(
        '[GEMINI] ✅ Processing complete - returning AI response',
      );
      return aiResponse;
    } catch (error) {
      // Comprehensive error logging for debugging (ISO/IEC 25010 Reliability)
      this.logger.error(
        '[GEMINI] ═══════════════════════════════════════════════',
      );
      this.logger.error('[GEMINI] ❌ EXCEPTION in processQuery');
      this.logger.error(`[GEMINI]    Error name: ${error.name}`);
      this.logger.error(`[GEMINI]    Error message: ${error.message}`);
      this.logger.error(`[GEMINI]    Stack trace: ${error.stack}`);

      // Log API-specific error details if available
      if (error.response) {
        this.logger.error(
          `[GEMINI]    API HTTP Status: ${error.response.status}`,
        );
        this.logger.error(
          `[GEMINI]    API Response data: ${JSON.stringify(error.response.data)}`,
        );
      }

      if (error.status) {
        this.logger.error(`[GEMINI]    Error status code: ${error.status}`);
      }

      if (error.statusText) {
        this.logger.error(`[GEMINI]    Error status text: ${error.statusText}`);
      }

      // Return graceful fallback message (never fail silently)
      this.logger.error('[GEMINI] Returning fallback message due to error');
      return this.getFallbackMessage();
    }
  }

  /**
   * Fetch Energy Data from MongoDB
   *
   * Retrieves real-time EcoStep sensor readings for RAG injection.
   *
   * IMPORTANT: Only fetches real hardware data (source='hardware').
   * Mock/demo data (source='mock') is never included in AI queries.
   *
   * Data Sources:
   * - Today's total energy generation (hardware only)
   * - Latest voltage and current readings (hardware only)
   * - Daily analytics summary (hardware only)
   * - Peak power metrics (hardware only)
   *
   * @returns Combined energy data object with all metrics, or "no data" message
   *
   * Error Handling:
   * - Returns "no real data" message if no hardware readings exist
   * - Returns empty data structure with error flag on failure
   * - Logs detailed error information
   * - Never throws exceptions
   */
  private async fetchEnergyData(): Promise<any> {
    this.logger.log('[TRACE 3: DB CONTEXT] Starting fetchEnergyData()...');
    this.logger.log('[TRACE 3: DB CONTEXT] Filtering for source=hardware ONLY');

    try {
      // Fetch today's energy total (hardware only)
      this.logger.log(
        '[TRACE 3: DB CONTEXT] [1/3] Querying EnergyService.getTodayEnergyTotal()...',
      );
      const query1Start = Date.now();
      const todayEnergy = await this.energyService.getTodayEnergyTotal();
      const query1Duration = Date.now() - query1Start;
      this.logger.log(
        `[TRACE 3: DB CONTEXT] [1/3] ✅ Completed in ${query1Duration}ms`,
      );
      this.logger.log(
        `[TRACE 3: DB CONTEXT] [1/3] Result: ${JSON.stringify(todayEnergy).substring(0, 100)}...`,
      );

      // Fetch daily analytics summary (hardware only)
      this.logger.log(
        '[TRACE 3: DB CONTEXT] [2/3] Querying AnalyticsService.getDailySummary()...',
      );
      const query2Start = Date.now();
      const todaySummary = await this.analyticsService.getDailySummary(
        new Date(),
      );
      const query2Duration = Date.now() - query2Start;
      this.logger.log(
        `[TRACE 3: DB CONTEXT] [2/3] ✅ Completed in ${query2Duration}ms`,
      );
      this.logger.log(
        `[TRACE 3: DB CONTEXT] [2/3] Result: ${JSON.stringify(todaySummary).substring(0, 100)}...`,
      );

      // Fetch latest sensor readings with monitoring metrics (NEW)
      this.logger.log(
        '[TRACE 3: DB CONTEXT] [3/3] Querying IotService for latest readings with monitoring data...',
      );
      const query3Start = Date.now();
      const latestReadings = (await this.iotService.getLatestReadings()) || [];
      const latestReading =
        latestReadings.length > 0 ? latestReadings[0] : null;
      const query3Duration = Date.now() - query3Start;
      this.logger.log(
        `[TRACE 3: DB CONTEXT] [3/3] ✅ Completed in ${query3Duration}ms`,
      );
      this.logger.log(
        `[TRACE 3: DB CONTEXT] [3/3] Latest reading: ${latestReading ? 'Found' : 'None'}`,
      );

      // Check if any real hardware data exists
      if (todayEnergy.count === 0 && todaySummary.readingCount === 0) {
        this.logger.warn(
          '[TRACE 3: DB CONTEXT] ⚠️  No real hardware data available',
        );
        this.logger.warn(
          '[TRACE 3: DB CONTEXT] AI will return "no data" message',
        );

        return {
          timestamp: new Date().toISOString(),
          today: {
            totalEnergyWh: 0,
            avgPowerW: 0,
            maxPowerW: 0,
            readingCount: 0,
          },
          analytics: {
            totalEnergyKWh: 0,
            peakPowerW: 0,
            avgPowerW: 0,
            date: new Date().toISOString().split('T')[0],
          },
          monitoring: {
            available: false,
          },
          status: 'no_data',
          message: 'No real hardware data available for analysis',
        };
      }

      // Extract monitoring metrics from latest reading
      const monitoringMetrics = latestReading
        ? {
            available: true,
            capacitorVoltage: latestReading.capacitorVoltage || null,
            stepCount: latestReading.stepCount || null,
            temperature: latestReading.temperature || null,
            frequency: latestReading.frequency || null,
            wifiConnected: latestReading.wifiConnected ?? null,
            bluetoothConnected: latestReading.bluetoothConnected ?? null,
            voltage: latestReading.voltage || null,
            current: latestReading.current || null,
            lastUpdated: latestReading.timestamp
              ? new Date(latestReading.timestamp).toISOString()
              : null,
          }
        : {
            available: false,
            message:
              'Monitoring metrics not available - waiting for sensor data',
          };

      // Combine data for AI context
      const combinedData = {
        timestamp: new Date().toISOString(),
        today: {
          totalEnergyWh: todayEnergy.totalPower || 0,
          avgPowerW: todayEnergy.avgPower || 0,
          maxPowerW: todayEnergy.maxPower || 0,
          readingCount: todayEnergy.count || 0,
        },
        analytics: {
          totalEnergyKWh: todaySummary.totalEnergyKWh || 0,
          peakPowerW: todaySummary.peakPowerW || 0,
          avgPowerW: todaySummary.avgPowerW || 0,
          date: todaySummary.date || new Date().toISOString().split('T')[0],
        },
        monitoring: monitoringMetrics,
        status: 'ok',
      };

      this.logger.log('[TRACE 3: DB CONTEXT] ✅ Data compilation complete');
      this.logger.log('[TRACE 3: DB CONTEXT] Combined data structure:');
      this.logger.log(JSON.stringify(combinedData, null, 2));

      return combinedData;
    } catch (error) {
      // Log database error details
      this.logger.error(
        '[TRACE 3: DB CONTEXT] ═══════════════════════════════',
      );
      this.logger.error(
        '[TRACE 3: DB CONTEXT] ❌ Database error in fetchEnergyData',
      );
      this.logger.error(`[TRACE 3: DB CONTEXT]    Error name: ${error.name}`);
      this.logger.error(
        `[TRACE 3: DB CONTEXT]    Error message: ${error.message}`,
      );
      this.logger.error(`[TRACE 3: DB CONTEXT]    Stack trace: ${error.stack}`);

      // Return empty data structure with error indicator
      const errorData = {
        timestamp: new Date().toISOString(),
        today: {
          totalEnergyWh: 0,
          avgPowerW: 0,
          maxPowerW: 0,
          readingCount: 0,
        },
        analytics: { totalEnergyKWh: 0, peakPowerW: 0, avgPowerW: 0 },
        monitoring: { available: false },
        status: 'error',
        error: 'Data temporarily unavailable',
      };

      this.logger.error('[TRACE 3: DB CONTEXT] Returning error data structure');
      return errorData;
    }
  }

  /**
   * Build Prompt with Data Injection
   *
   * Constructs the final prompt by injecting real-time data into the user query.
   * This is the "Augmentation" step in RAG.
   *
   * @param userMessage - User's question
   * @param energyData - Real-time data from MongoDB (hardware only)
   * @returns Complete prompt with system context + data + user query
   */
  private buildPrompt(userMessage: string, energyData: any): string {
    // Build data context string
    const dataContext = energyData.status === 'no_data'
      ? `**SYSTEM STATUS:** No live sensor data available currently.

**IMPORTANT:** This does NOT mean the system is offline or broken. It only means there are currently no energy readings in the database.`
      : `**REAL-TIME ECOSTEP DATA FROM MONGODB DATABASE (source=hardware ONLY):**

\`\`\`json
${JSON.stringify(energyData, null, 2)}
\`\`\``;

    return `${dataContext}

**USER QUESTION:**
${userMessage}

**RESPONSE INSTRUCTIONS:**

1. **Answer Educational Questions Directly:**
   - If the user asks HOW footsteps generate power, HOW piezoelectricity works, WHAT voltage/current means, or other educational topics, answer those questions using your EcoStep knowledge
   - Educational questions should be answered regardless of whether live sensor data is available
   - Keep answers friendly, simple, and 2-3 sentences max

2. **Use Live Data When Relevant:**
   - If the question asks about CURRENT generation, SYSTEM STATUS, or LIVE READINGS, use the real-time data above
   - If no live data is available and the user asks for current readings, say: "I can explain how EcoStep works, but I can't retrieve live sensor readings right now. Try 'status' to check system data."
   - NEVER say sensors are "offline" or "being deployed" unless that's verified information

3. **Distinguish Educational from Live Data:**
   - "How does a footstep make power?" = Educational (answer from knowledge)
   - "How much energy have we generated?" = Live data (use database readings or report unavailability)
   - "What is piezoelectricity?" = Educational (answer from knowledge)
   - "Are sensors online?" = Live data (check actual status)

4. **For Off-Topic Questions:**
   - If question is unrelated to EcoStep, respond: "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?"

5. **Never Fabricate:**
   - Don't invent deployment timelines, test results, or hardware status
   - Don't claim sensors are "proven functional" or "ready to deploy" without evidence
   - Don't make up energy readings or sensor data

**REMEMBER:** Keep responses concise (2-3 sentences), friendly, and accurate!`;
  }

  /**
   * Get Fallback Message
   *
   * Returns predefined message when AI is unavailable.
   * Ensures chatbot never fails silently (reliability requirement).
   *
   * Message includes:
   * - Explanation of temporary unavailability
   * - Alternative commands user can try
   * - Help option
   *
   * @returns Graceful fallback message
   */
  private getFallbackMessage(): string {
    return `⚡ The monitoring system is currently processing data. Please try again in a moment, or use these commands:

📊 "status" - View current statistics
📈 "today" - Today's energy summary
💚 "impact" - Environmental impact
🔋 "battery" - Battery status

Type "help" to see all available commands.`;
  }

  /**
   * Check if AI Service is Enabled
   *
   * Used by messenger service to determine if AI processing is available.
   *
   * @returns true if Gemini API is configured and initialized
   */
  isAIEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Generate Report Analysis
   *
   * Analyzes structured report data and generates professional analysis.
   * This is SEPARATE from EcoChat - it's for report generation only.
   *
   * CRITICAL RULES:
   * - Receives ONLY structured report data (no database access)
   * - Read-only analysis
   * - Never invents measurements, trends, dates, or conclusions
   * - States when data is insufficient
   * - Adapts output to report type
   *
   * @param reportType - Type of report being generated
   * @param reportData - Structured report data (not raw database)
   * @returns AI-generated analysis or null if unavailable/failed
   */
  async generateReportAnalysis(
    reportType: string,
    reportData: any,
  ): Promise<string | null> {
    // Check if AI is enabled
    if (!this.isEnabled) {
      this.logger.warn(
        '[REPORT ANALYSIS] AI service not enabled - skipping analysis',
      );
      return null;
    }

    // Check if data is available
    if (!reportData.hasData) {
      this.logger.warn(
        '[REPORT ANALYSIS] No data available - skipping AI analysis',
      );
      return null;
    }

    try {
      this.logger.log(`[REPORT ANALYSIS] Generating analysis for ${reportType}`);

      // Get report-specific system prompt
      const systemPrompt = this.getReportAnalysisPrompt(reportType);

      // Build analysis prompt with structured data
      const prompt = this.buildReportAnalysisPrompt(reportType, reportData);

      // Create temporary model with report-specific instructions
      const reportModel = this.genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        systemInstruction: systemPrompt,
      });

      // Generate analysis with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout')), 10000);
      });

      const generationPromise = reportModel.generateContent(prompt);

      const result = await Promise.race([generationPromise, timeoutPromise]);

      const analysis = result.response.text();

      this.logger.log(
        `[REPORT ANALYSIS] ✅ Analysis generated successfully (${analysis.length} characters)`,
      );

      return analysis;
    } catch (error) {
      this.logger.error('[REPORT ANALYSIS] ❌ Failed to generate analysis');
      this.logger.error(`[REPORT ANALYSIS]    Error: ${error.message}`);
      // Return null - report will be generated without AI section
      return null;
    }
  }

  /**
   * Get Report Analysis System Prompt
   *
   * Returns report-type-specific system instructions for AI analysis.
   */
  private getReportAnalysisPrompt(reportType: string): string {
    const baseInstructions = `You are an analytical assistant for EcoStep piezoelectric energy monitoring reports.

Your role is to provide professional, data-driven analysis of report data.

CRITICAL RULES:
- Analyze ONLY the data provided
- Do NOT invent measurements, dates, or trends
- Clearly distinguish between observed data and interpretations
- State when data is insufficient for conclusions
- Use professional, technical language (not conversational)
- Be concise and focused`;

    switch (reportType) {
      case 'energy_monitoring':
        return `${baseInstructions}

REPORT TYPE: Energy Generation Report

ANALYZE:
- Total energy generated during period
- Voltage and current measurements
- Step activity patterns
- Electrical measurement observations

OUTPUT STRUCTURE:
## Overview
[Brief summary of energy generation during the period]

## Energy Generation Observations
[Data-driven observations about energy harvested]

## Electrical Measurements
[Observations about voltage/current patterns if present]

## Data Limitations
[What the data cannot tell us]`;

      case 'historical_analytics':
        return `${baseInstructions}

REPORT TYPE: Energy Trends Report

ANALYZE:
- Historical energy metrics over time
- Observable trends in the data
- Period-to-period comparisons

OUTPUT STRUCTURE:
## Overview
[Brief summary of trends observed]

## Trends Analysis
[Observable patterns in the data]

## Period Comparisons
[How periods compare if data supports it]

## Data Limitations
[What the data cannot tell us]`;

      case 'system_diagnostics':
        return `${baseInstructions}

REPORT TYPE: System Performance Report

ANALYZE:
- Diagnostic test results
- Expected vs actual energy measurements
- System performance metrics

OUTPUT STRUCTURE:
## Overview
[Brief summary of diagnostic results]

## Performance Observations
[Data-driven observations about system performance]

## Notable Results
[Any significant findings in test data]

## Data Limitations
[What the data cannot tell us]`;

      case 'system_summary':
        return `${baseInstructions}

REPORT TYPE: System Overview Report

ANALYZE:
- Combined summary across all data sources
- Overall system state

OUTPUT STRUCTURE:
## Overview
[Concise overall system observation]

## Key Observations
[Notable findings across all data sources]

## Data Limitations
[What the data cannot tell us]

Keep this CONCISE - system overview should be brief.`;

      default:
        return baseInstructions;
    }
  }

  /**
   * Build Report Analysis Prompt
   *
   * Constructs the analysis prompt with structured report data.
   */
  private buildReportAnalysisPrompt(
    reportType: string,
    reportData: any,
  ): string {
    const { period, periodDays, energySummary, summary } = reportData;

    return `**ECOSTEP REPORT DATA FOR ANALYSIS:**

**Report Type:** ${this.getReportTypeLabel(reportType)}

**Reporting Period:** ${period.startDate} to ${period.endDate} (${periodDays} days)

**Data Summary:**
\`\`\`json
${JSON.stringify(
  {
    period: period,
    periodDays: periodDays,
    summary: summary || {},
    energySummary: energySummary
      ? {
          totalEnergyKWh: energySummary.totalEnergyKWh,
          avgPowerW: energySummary.avgPowerW,
          peakPowerW: energySummary.peakPowerW,
          readingCount: energySummary.readingCount,
        }
      : null,
  },
  null,
  2,
)}
\`\`\`

**INSTRUCTIONS:**
- Analyze ONLY the data provided above
- Do NOT invent any values not present in the data
- State "insufficient data" if the dataset is sparse or limited
- Focus your analysis on what the data actually shows
- Adapt your analysis to the report type
- Be professional and concise`;
  }

  /**
   * Get Report Type Label
   *
   * Converts internal report type to user-facing name.
   */
  private getReportTypeLabel(reportType: string): string {
    switch (reportType) {
      case 'energy_monitoring':
        return 'Energy Generation Report';
      case 'historical_analytics':
        return 'Energy Trends Report';
      case 'system_diagnostics':
        return 'System Performance Report';
      case 'system_summary':
        return 'System Overview Report';
      default:
        return reportType;
    }
  }
}
