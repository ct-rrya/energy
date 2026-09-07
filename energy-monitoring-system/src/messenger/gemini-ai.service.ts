import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';

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
  ) {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('[GEMINI CONSTRUCTOR] Initializing GeminiAIService...');

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // [TRACE 4: API KEY VERIFICATION]
    this.logger.log('[TRACE 4: API KEY VERIFICATION] ═══════════════════════');

    // Check if API key is configured (supports both AQ. and AIza formats)
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      this.logger.error('[TRACE 4: API KEY VERIFICATION] ❌ API key NOT configured');
      this.logger.error('[TRACE 4: API KEY VERIFICATION]    API key value: ' + (apiKey ? 'placeholder/default' : 'undefined'));
      this.logger.warn('[TRACE 4: API KEY VERIFICATION]    AI features will be DISABLED');
      this.logger.warn('[TRACE 4: API KEY VERIFICATION]    Set GEMINI_API_KEY in .env file to enable AI chatbot');
      return;
    }

    this.logger.log('[TRACE 4: API KEY VERIFICATION] ✅ API key detected');
    this.logger.log(`[TRACE 4: API KEY VERIFICATION]    Key length: ${apiKey.length} characters`);
    this.logger.log(`[TRACE 4: API KEY VERIFICATION]    Key prefix: "${apiKey.substring(0, 3)}..."`);
    this.logger.log(`[TRACE 4: API KEY VERIFICATION]    Key format: ${apiKey.startsWith('AIza') ? 'Legacy (AIza)' : apiKey.startsWith('AQ.') ? 'New (AQ.)' : 'Unknown'}`);

    try {
      this.logger.log('[GEMINI CONSTRUCTOR] Creating GoogleGenerativeAI client...');
      // Initialize Google Generative AI client
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('[GEMINI CONSTRUCTOR] ✅ GoogleGenerativeAI client created');

      // KEEPING YOUR WORKING MODEL: gemini-3.6-flash
      const modelName = 'gemini-3.6-flash';
      this.logger.log(`[GEMINI CONSTRUCTOR] Getting model: ${modelName}...`);

      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: this.getSystemInstructions(),
        // NO generationConfig - brevity enforced via system instructions
      });

      this.isEnabled = true;
      this.logger.log('[GEMINI CONSTRUCTOR] ✅ Gemini AI Service initialized successfully');
      this.logger.log(`[GEMINI CONSTRUCTOR]    Model: ${modelName}`);
      this.logger.log('[GEMINI CONSTRUCTOR]    Token Config: Using API defaults (no limit)');
      this.logger.log('[GEMINI CONSTRUCTOR]    Status: ENABLED');
    } catch (error) {
      this.logger.error('[GEMINI CONSTRUCTOR] ❌ Failed to initialize Gemini AI');
      this.logger.error(`[GEMINI CONSTRUCTOR]    Error name: ${error.name}`);
      this.logger.error(`[GEMINI CONSTRUCTOR]    Error message: ${error.message}`);
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

2. **Decline Rule - CRITICAL INSTRUCTION:**
   **IF THE USER ASKS ABOUT ANYTHING UNRELATED TO ECOSTEP (politics, religion, general knowledge, other topics), YOU MUST STILL GENERATE A RESPONSE. DO NOT BLOCK OR REFUSE TO RESPOND.**

   For unrelated questions (politics, religion, personal advice, general knowledge, other energy systems, technical support for other projects, etc.), use this polite decline template:

   "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?"

   **NEVER refuse to respond. ALWAYS provide this polite decline message for out-of-scope questions.**

3. **Data Usage - When answering:**
   - ALWAYS use the provided real-time data from MongoDB
   - Reference actual numbers from the injected JSON data
   - Never fabricate or estimate values
   - If data is unavailable, explicitly state: "Live sensor data is currently unavailable"
   - Translate technical units to user-friendly terms (e.g., "127.5Wh is enough to charge 6 smartphones")

4. **Response Format:**
   - Be concise: 2-3 sentences maximum
   - Use emojis sparingly (⚡💚📊🌱)
   - Start with a direct answer
   - Add context or comparison if helpful
   - Be encouraging about energy generation achievements

5. **Real-World Context Translation:**
   - Convert Wh to practical equivalents (phone charges, LED hours, etc.)
   - Explain peak power in terms of footstep activity
   - Frame CO₂ savings in understandable terms
   - Celebrate milestones and improvements

6. **EcoStep System Context:**
   - Technology: Piezoelectric tiles convert mechanical footstep energy into electricity
   - Hardware: ESP32 microcontroller monitors voltage, current, power, energy
   - Storage: Data stored in MongoDB with timestamps
   - Interface: Web dashboard + Facebook Messenger bot
   - Purpose: University capstone project for sustainable energy research
   - Scale: Campus deployment for IoT energy harvesting demonstration

**Example Good Responses:**
- "⚡ Today you've generated 127.5Wh of clean energy! That's enough to charge a smartphone 6 times. Keep stepping! 💚"
- "📊 Your peak generation was 45.2W at 2:34 PM today, showing strong footstep activity during afternoon hours."
- "🌱 This month you've avoided 2.3kg of CO₂ emissions - equivalent to planting 3 trees for a year!"

**Example Decline Response (for "Who is the president?"):**
- "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?"

**Data Format You Will Receive:**
The system will provide real-time data in JSON format with fields like:
- totalEnergy, avgPower, peakPower (numerical values with units)
- timestamp (ISO format)
- analytics (aggregated metrics)

Always cite these actual values in your response.`;
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
    this.logger.log(`[GEMINI]    Message length: ${userMessage.length} characters`);

    // Check if AI is enabled
    this.logger.log('[GEMINI] Checking AI initialization status...');
    this.logger.log(`[GEMINI]    isEnabled: ${this.isEnabled}`);
    this.logger.log(`[GEMINI]    model exists: ${!!this.model}`);

    if (!this.isEnabled || !this.model) {
      this.logger.warn('[GEMINI] ❌ AI not initialized - returning fallback message');
      return this.getFallbackMessage();
    }

    this.logger.log('[GEMINI] ✅ AI is enabled and ready');

    try {
      // STEP 1: Fetch Real-Time Energy Data (RAG - Retrieval)
      // [TRACE 3: DB CONTEXT]
      this.logger.log('[TRACE 3: DB CONTEXT] ═══════════════════════════════════');
      this.logger.log('[TRACE 3: DB CONTEXT] Fetching energy data from MongoDB...');
      const dbStartTime = Date.now();

      const energyData = await this.fetchEnergyData();

      const dbDuration = Date.now() - dbStartTime;
      this.logger.log(`[TRACE 3: DB CONTEXT] ✅ Database queries completed in ${dbDuration}ms`);
      this.logger.log(`[TRACE 3: DB CONTEXT]    Data status: ${energyData.status}`);
      this.logger.log('[TRACE 3: DB CONTEXT] Data sample (first 200 chars):');
      this.logger.log(JSON.stringify(energyData).substring(0, 200) + '...');

      // STEP 2: Build Context-Enriched Prompt (RAG - Augmentation)
      const prompt = this.buildPrompt(userMessage, energyData);
      this.logger.log(`[GEMINI] Prompt constructed (${prompt.length} characters)`);

      // STEP 3: Query Gemini API (Generation)
      // [TRACE 5: CALLING GEMINI]
      this.logger.log('[TRACE 5: CALLING GEMINI] ═══════════════════════════════');
      this.logger.log('[TRACE 5: CALLING GEMINI] Sending request to Gemini API...');
      this.logger.log('[TRACE 5: CALLING GEMINI]    Model: gemini-3.6-flash');
      this.logger.log('[TRACE 5: CALLING GEMINI]    Prompt length: ' + prompt.length + ' characters');
      this.logger.log('[TRACE 5: CALLING GEMINI]    Starting API call with 15s timeout...');
      this.logger.log('[TRACE 5: CALLING GEMINI] Prompt preview (first 300 chars):');
      this.logger.log(prompt.substring(0, 300) + '...');
      this.logger.log('[TRACE 5: CALLING GEMINI] System instruction: ' + this.getSystemInstructions().substring(0, 100) + '...');

      const apiStartTime = Date.now();

      // Create timeout promise (15 second timeout)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout after 15s')), 15000);
      });

      // Race between API call and timeout
      let result;
      try {
        result = await Promise.race([
          this.model.generateContent(prompt),
          timeoutPromise
        ]);
      } catch (error) {
        const apiDuration = Date.now() - apiStartTime;

        // Check if this is a timeout error
        if (error.message === 'Gemini API timeout after 15s') {
          this.logger.warn(`[TRACE 5: CALLING GEMINI] ⏱️  API call timed out after 15000ms, returning fallback`);
          this.logger.warn(`[TRACE 5: CALLING GEMINI]    Actual duration: ${apiDuration}ms`);
          return this.getFallbackMessage();
        }

        // Re-throw non-timeout errors to be caught by outer catch block
        throw error;
      }

      const apiDuration = Date.now() - apiStartTime;

      this.logger.log(`[TRACE 5: CALLING GEMINI] ✅ API call completed in ${apiDuration}ms`);

      // [TRACE 6: GEMINI RAW RESULT]
      this.logger.log('[TRACE 6: GEMINI RAW RESULT] ═══════════════════════════');
      const response = result.response;

      // Log raw response structure
      this.logger.log('[TRACE 6: GEMINI RAW RESULT] Raw response object keys:', Object.keys(response));

      // Check for candidates and safety
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        this.logger.log(`[TRACE 6: GEMINI RAW RESULT]    Candidates count: ${candidates.length}`);

        const firstCandidate = candidates[0];
        const finishReason = firstCandidate.finishReason;

        this.logger.log(`[TRACE 6: GEMINI RAW RESULT]    Finish reason: ${finishReason}`);

        // Check if response was safety-blocked or incomplete
        if (finishReason !== 'STOP') {
          this.logger.warn('[TRACE 6: GEMINI RAW RESULT] ⚠️  Response flagged or incomplete!');
          this.logger.warn(`[TRACE 6: GEMINI RAW RESULT]    Finish reason: ${finishReason}`);

          if (firstCandidate.safetyRatings) {
            this.logger.warn('[TRACE 6: GEMINI RAW RESULT]    Safety ratings:');
            this.logger.warn(JSON.stringify(firstCandidate.safetyRatings, null, 2));
          }

          if (firstCandidate.content) {
            this.logger.warn('[TRACE 6: GEMINI RAW RESULT]    Partial content:');
            this.logger.warn(JSON.stringify(firstCandidate.content, null, 2));
          }

          // SAFETY FIX: If response was blocked/incomplete, return polite decline instead of error
          this.logger.warn('[TRACE 6: GEMINI RAW RESULT] Returning polite decline due to blocked/incomplete response');
          return "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?";
        } else {
          this.logger.log('[TRACE 6: GEMINI RAW RESULT] ✅ Response completed normally (STOP)');
        }
      } else {
        this.logger.error('[TRACE 6: GEMINI RAW RESULT] ❌ No candidates in response!');
        this.logger.error('[TRACE 6: GEMINI RAW RESULT] Full response:', JSON.stringify(response));

        // SAFETY FIX: If no candidates, return polite decline instead of fallback error
        this.logger.warn('[TRACE 6: GEMINI RAW RESULT] Returning polite decline due to no candidates');
        return "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?";
      }

      // SAFETY FIX: Wrap response.text() in try-catch to handle extraction errors
      let aiResponse: string;
      try {
        aiResponse = response.text();
      } catch (textError) {
        this.logger.error('[TRACE 6: GEMINI RAW RESULT] ❌ Error extracting text from response');
        this.logger.error(`[TRACE 6: GEMINI RAW RESULT]    Error: ${textError.message}`);

        // Return polite decline instead of error fallback
        return "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?";
      }

      this.logger.log(`[TRACE 6: GEMINI RAW RESULT]    Response text length: ${aiResponse.length} characters`);
      this.logger.log(`[TRACE 6: GEMINI RAW RESULT]    Response preview (first 200 chars):`);
      this.logger.log(aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : ''));

      this.logger.log('[GEMINI] ✅ Processing complete - returning AI response');
      return aiResponse;

    } catch (error) {
      // Comprehensive error logging for debugging (ISO/IEC 25010 Reliability)
      this.logger.error('[GEMINI] ═══════════════════════════════════════════════');
      this.logger.error('[GEMINI] ❌ EXCEPTION in processQuery');
      this.logger.error(`[GEMINI]    Error name: ${error.name}`);
      this.logger.error(`[GEMINI]    Error message: ${error.message}`);
      this.logger.error(`[GEMINI]    Stack trace: ${error.stack}`);

      // Log API-specific error details if available
      if (error.response) {
        this.logger.error(`[GEMINI]    API HTTP Status: ${error.response.status}`);
        this.logger.error(`[GEMINI]    API Response data: ${JSON.stringify(error.response.data)}`);
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
   * Data Sources:
   * - Today's total energy generation
   * - Latest voltage and current readings
   * - Daily analytics summary
   * - Peak power metrics
   *
   * @returns Combined energy data object with all metrics
   *
   * Error Handling:
   * - Returns empty data structure with error flag on failure
   * - Logs detailed error information
   * - Never throws exceptions
   */
  private async fetchEnergyData(): Promise<any> {
    this.logger.log('[TRACE 3: DB CONTEXT] Starting fetchEnergyData()...');

    try {
      // Fetch today's energy total
      this.logger.log('[TRACE 3: DB CONTEXT] [1/2] Querying EnergyService.getTodayEnergyTotal()...');
      const query1Start = Date.now();
      const todayEnergy = await this.energyService.getTodayEnergyTotal();
      const query1Duration = Date.now() - query1Start;
      this.logger.log(`[TRACE 3: DB CONTEXT] [1/2] ✅ Completed in ${query1Duration}ms`);
      this.logger.log(`[TRACE 3: DB CONTEXT] [1/2] Result: ${JSON.stringify(todayEnergy).substring(0, 100)}...`);

      // Fetch daily analytics summary
      this.logger.log('[TRACE 3: DB CONTEXT] [2/2] Querying AnalyticsService.getDailySummary()...');
      const query2Start = Date.now();
      const todaySummary = await this.analyticsService.getDailySummary(new Date());
      const query2Duration = Date.now() - query2Start;
      this.logger.log(`[TRACE 3: DB CONTEXT] [2/2] ✅ Completed in ${query2Duration}ms`);
      this.logger.log(`[TRACE 3: DB CONTEXT] [2/2] Result: ${JSON.stringify(todaySummary).substring(0, 100)}...`);

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
        status: 'ok',
      };

      this.logger.log('[TRACE 3: DB CONTEXT] ✅ Data compilation complete');
      this.logger.log('[TRACE 3: DB CONTEXT] Combined data structure:');
      this.logger.log(JSON.stringify(combinedData, null, 2));

      return combinedData;

    } catch (error) {
      // Log database error details
      this.logger.error('[TRACE 3: DB CONTEXT] ═══════════════════════════════');
      this.logger.error('[TRACE 3: DB CONTEXT] ❌ Database error in fetchEnergyData');
      this.logger.error(`[TRACE 3: DB CONTEXT]    Error name: ${error.name}`);
      this.logger.error(`[TRACE 3: DB CONTEXT]    Error message: ${error.message}`);
      this.logger.error(`[TRACE 3: DB CONTEXT]    Stack trace: ${error.stack}`);

      // Return empty data structure with error indicator
      const errorData = {
        timestamp: new Date().toISOString(),
        today: { totalEnergyWh: 0, avgPowerW: 0, maxPowerW: 0, readingCount: 0 },
        analytics: { totalEnergyKWh: 0, peakPowerW: 0, avgPowerW: 0 },
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
   * @param energyData - Real-time data from MongoDB
   * @returns Complete prompt with system context + data + user query
   */
  private buildPrompt(userMessage: string, energyData: any): string {
    return `**REAL-TIME ECOSTEP DATA FROM MONGODB DATABASE:**

\`\`\`json
${JSON.stringify(energyData, null, 2)}
\`\`\`

**USER QUESTION:**
${userMessage}

**CRITICAL REMINDER:**
- If this question is about EcoStep energy data, answer using the JSON data above
- If this question is NOT about EcoStep (politics, religion, general topics), respond with: "I'm EcoStep AI, specialized in monitoring piezoelectric energy generation. I can only answer questions about EcoStep's energy data, performance metrics, and environmental impact. How can I help you with your energy monitoring?"
- Be concise (2 sentences max)
- NEVER refuse to generate a response - always reply with something`;
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
}
