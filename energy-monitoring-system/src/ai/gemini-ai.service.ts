import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * AI Provider Types
 */
enum AIProvider {
  GEMINI = 'Gemini',
  GROQ = 'Groq',
}

/**
 * AI Error Types for Fallback Logic
 */
enum AIErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  AUTH_ERROR = 'AUTH_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Gemini AI Service with Groq Fallback
 *
 * Primary AI service for generating insights with automatic fallback.
 * Gemini is the primary provider; Groq is used when Gemini fails.
 *
 * Features:
 * - Ultra-low latency with gemini-3.5-flash model (Pro-level intelligence at Flash speed)
 * - Automatic fallback to Groq on quota exhaustion, rate limits, or server errors
 * - No repeated retries on daily quota exhaustion
 * - Simple query processing
 * - Graceful degradation when both providers unavailable
 * - Provider-specific error classification
 * - Detailed logging without exposing secrets
 *
 * Fallback Conditions:
 * - HTTP 429 (Quota/Rate Limit) → Immediate fallback to Groq
 * - HTTP 5xx (Server Error) → Fallback to Groq
 * - Timeout → Fallback to Groq
 * - Invalid credentials or malformed requests → No fallback
 *
 * Usage:
 * - Dashboard AI insights
 * - Report analysis generation
 * - Analytics insights
 */
@Injectable()
export class GeminiAIService {
  private readonly logger = new Logger(GeminiAIService.name);
  
  // Gemini client and model
  private readonly genAI: GoogleGenerativeAI;
  private readonly geminiModel: any;
  private readonly geminiEnabled: boolean = false;
  
  // Groq client
  private readonly groq: Groq;
  private readonly groqEnabled: boolean = false;
  private readonly groqModel: string = 'openai/gpt-oss-120b';

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing AI Service with Groq fallback...');

    // Initialize Gemini (Primary Provider)
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key-here') {
      this.logger.warn('GEMINI_API_KEY not configured');
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.geminiModel = this.genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
        });
        this.geminiEnabled = true;
        this.logger.log('✅ Gemini AI initialized (Primary Provider)');
        this.logger.log('   Model: gemini-3.5-flash');
      } catch (error) {
        this.logger.error('Failed to initialize Gemini:', error.message);
      }
    }

    // Initialize Groq (Fallback Provider)
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    
    if (!groqApiKey || groqApiKey === 'your-groq-api-key-here') {
      this.logger.warn('GROQ_API_KEY not configured - fallback disabled');
    } else {
      try {
        this.groq = new Groq({ apiKey: groqApiKey });
        this.groqEnabled = true;
        this.logger.log('✅ Groq AI initialized (Fallback Provider)');
        this.logger.log(`   Model: ${this.groqModel}`);
      } catch (error) {
        this.logger.error('Failed to initialize Groq:', error.message);
      }
    }

    // Log overall status
    if (this.geminiEnabled && this.groqEnabled) {
      this.logger.log('🚀 AI Service: FULLY OPERATIONAL (Primary + Fallback)');
    } else if (this.geminiEnabled) {
      this.logger.warn('⚠️  AI Service: PRIMARY ONLY (No fallback available)');
    } else if (this.groqEnabled) {
      this.logger.warn('⚠️  AI Service: FALLBACK ONLY (Primary unavailable)');
    } else {
      this.logger.error('❌ AI Service: DISABLED (No providers available)');
    }
  }

  /**
   * Classify Error Type
   * 
   * Determines the type of error to decide whether to fallback
   * 
   * @param error - Error object from AI provider
   * @param provider - Which provider generated the error
   * @returns Error type classification
   */
  private classifyError(error: any, provider: AIProvider): AIErrorType {
    const message = error?.message?.toLowerCase() || '';
    const status = error?.status || error?.statusCode || 0;

    // Quota exhaustion (HTTP 429 or explicit quota messages)
    if (status === 429 || message.includes('quota') || message.includes('resource_exhausted')) {
      return AIErrorType.QUOTA_EXCEEDED;
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return AIErrorType.RATE_LIMIT;
    }

    // Server errors (5xx)
    if (status >= 500 && status < 600) {
      return AIErrorType.SERVER_ERROR;
    }

    // Timeout
    if (message.includes('timeout') || message.includes('timed out')) {
      return AIErrorType.TIMEOUT;
    }

    // Authentication errors (don't fallback)
    if (status === 401 || status === 403 || message.includes('auth') || message.includes('api key')) {
      return AIErrorType.AUTH_ERROR;
    }

    // Invalid request (don't fallback)
    if (status === 400 || message.includes('invalid') || message.includes('malformed')) {
      return AIErrorType.INVALID_REQUEST;
    }

    return AIErrorType.UNKNOWN;
  }

  /**
   * Should Fallback
   * 
   * Determines if we should attempt fallback based on error type
   * 
   * @param errorType - Classified error type
   * @returns true if fallback should be attempted
   */
  private shouldFallback(errorType: AIErrorType): boolean {
    switch (errorType) {
      case AIErrorType.QUOTA_EXCEEDED:
      case AIErrorType.RATE_LIMIT:
      case AIErrorType.SERVER_ERROR:
      case AIErrorType.TIMEOUT:
        return true;
      
      case AIErrorType.AUTH_ERROR:
      case AIErrorType.INVALID_REQUEST:
        return false;
      
      default:
        // For unknown errors, attempt fallback
        return true;
    }
  }

  /**
   * Query Gemini
   * 
   * Attempts to query Gemini AI with timeout
   * 
   * @param prompt - The prompt to send
   * @returns AI response or throws error
   */
  private async queryGemini(prompt: string): Promise<string> {
    this.logger.debug(`[Gemini] Sending prompt (${prompt.length} chars)...`);

    // Create timeout promise (10 second timeout)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Gemini API timeout after 10s')),
        10000,
      );
    });

    // Race between API call and timeout
    const result = await Promise.race([
      this.geminiModel.generateContent(prompt),
      timeoutPromise,
    ]);

    const response = result.response;
    const text = response.text();
    
    this.logger.debug(`[Gemini] ✅ Success (${text.length} chars)`);
    return text;
  }

  /**
   * Query Groq
   * 
   * Attempts to query Groq AI with timeout
   * 
   * @param prompt - The prompt to send
   * @returns AI response or throws error
   */
  private async queryGroq(prompt: string): Promise<string> {
    this.logger.debug(`[Groq] Sending prompt (${prompt.length} chars)...`);

    // Create timeout promise (10 second timeout)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Groq API timeout after 10s')),
        10000,
      );
    });

    // Race between API call and timeout
    const completion = await Promise.race([
      this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.groqModel,
        temperature: 0.7,
        max_tokens: 500,
      }),
      timeoutPromise,
    ]);

    const text = completion.choices[0]?.message?.content || '';
    
    if (!text) {
      throw new Error('Groq returned empty response');
    }

    this.logger.debug(`[Groq] ✅ Success (${text.length} chars)`);
    return text;
  }

  /**
   * Process Query
   *
   * Sends a prompt to AI providers with automatic fallback.
   * Tries Gemini first, falls back to Groq on qualifying failures.
   * Used for generating AI insights for dashboard, reports, and analytics.
   *
   * @param prompt - The prompt to send to AI
   * @returns AI-generated response or null if unavailable
   */
  async processQuery(prompt: string): Promise<string | null> {
    // Check if any provider is available
    if (!this.geminiEnabled && !this.groqEnabled) {
      this.logger.debug('No AI providers enabled - returning null');
      return null;
    }

    let lastError: any = null;

    // Try Gemini first (if enabled)
    if (this.geminiEnabled && this.geminiModel) {
      try {
        const result = await this.queryGemini(prompt);
        this.logger.log('[Gemini] ✅ Request successful');
        return result;
      } catch (error) {
        lastError = error;
        const errorType = this.classifyError(error, AIProvider.GEMINI);
        
        this.logger.warn(`[Gemini] ❌ ${errorType}: ${error.message}`);

        // Check if we should fallback to Groq
        if (this.shouldFallback(errorType) && this.groqEnabled) {
          this.logger.log(`[Fallback] Attempting Groq due to ${errorType}...`);
          // Continue to Groq attempt below
        } else {
          // Don't fallback for auth errors or invalid requests
          this.logger.error(`[Gemini] No fallback for ${errorType}`);
          
          // If Groq is available as primary, try it anyway for auth errors
          if (this.groqEnabled && errorType === AIErrorType.AUTH_ERROR) {
            this.logger.log('[Fallback] Gemini auth failed, trying Groq as primary...');
            // Continue to Groq attempt below
          } else {
            return null;
          }
        }
      }
    }

    // Try Groq (if enabled and fallback is warranted)
    if (this.groqEnabled) {
      try {
        const result = await this.queryGroq(prompt);
        
        // Log whether this was a fallback or primary attempt
        if (this.geminiEnabled) {
          this.logger.log('[Groq] ✅ Fallback successful');
        } else {
          this.logger.log('[Groq] ✅ Request successful (Primary provider)');
        }
        
        return result;
      } catch (error) {
        lastError = error;
        const errorType = this.classifyError(error, AIProvider.GROQ);
        this.logger.error(`[Groq] ❌ ${errorType}: ${error.message}`);
      }
    }

    // Both providers failed
    this.logger.error('❌ All AI providers failed');
    if (lastError) {
      this.logger.error(`Last error: ${lastError.message}`);
    }
    
    return null;
  }

  /**
   * Generate Report Analysis
   *
   * Generates AI analysis for energy reports.
   *
   * @param reportType - Type of report (daily, weekly, monthly, etc.)
   * @param reportData - Report data with metrics
   * @returns AI-generated analysis or null
   */
  async generateReportAnalysis(
    reportType: string,
    reportData: any,
  ): Promise<string | null> {
    if (!reportData.hasData) {
      this.logger.debug('No data available for report analysis');
      return null;
    }

    const prompt = `Analyze this ${reportType} energy report from EcoStep piezoelectric system:

**Period:** ${reportData.period.startDate} to ${reportData.period.endDate}
**Total Energy:** ${reportData.energySummary.totalEnergyKWh} kWh
**Average Power:** ${reportData.energySummary.avgPowerW} W
**Peak Power:** ${reportData.energySummary.peakPowerW} W
**CO2 Avoided:** ${reportData.environmentalImpact.co2AvoidedKg} kg
**Cost Savings:** $${reportData.costSavings.totalSavings} USD

Provide a brief analysis (2-3 sentences) covering:
1. Overall performance assessment
2. Notable trends or patterns
3. One actionable recommendation

Keep it concise and practical.`;

    return this.processQuery(prompt);
  }

  /**
   * Check if AI is available
   *
   * @returns true if at least one AI provider is enabled and ready
   */
  isAvailable(): boolean {
    return (this.geminiEnabled && !!this.geminiModel) || (this.groqEnabled && !!this.groq);
  }

  /**
   * Get Provider Status
   * 
   * Returns detailed status of all AI providers
   * Useful for health checks and diagnostics
   * 
   * @returns Object with provider availability
   */
  getProviderStatus(): { gemini: boolean; groq: boolean; anyAvailable: boolean } {
    return {
      gemini: this.geminiEnabled && !!this.geminiModel,
      groq: this.groqEnabled && !!this.groq,
      anyAvailable: this.isAvailable(),
    };
  }
}
