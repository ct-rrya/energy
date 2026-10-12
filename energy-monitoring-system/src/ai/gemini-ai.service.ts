import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Service (Standalone)
 *
 * Lightweight AI service for generating insights without circular dependencies.
 * This service ONLY uses ConfigService - no other module dependencies.
 *
 * Features:
 * - Ultra-low latency with gemini-3.5-flash model (Pro-level intelligence at Flash speed)
 * - Simple query processing
 * - Graceful fallback when AI unavailable
 * - No circular dependencies
 *
 * Usage:
 * - Dashboard AI insights
 * - Report analysis generation
 * - Analytics insights
 */
@Injectable()
export class GeminiAIService {
  private readonly logger = new Logger(GeminiAIService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly isEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    this.logger.log('Initializing GeminiAIService (Standalone)...');

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // Check if API key is configured
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      this.logger.warn('GEMINI_API_KEY not configured - AI features disabled');
      this.logger.warn('Set GEMINI_API_KEY in .env to enable AI insights');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Use Gemini 3.5 Flash for ultra-fast responses with Pro-level intelligence
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
      });

      this.isEnabled = true;
      this.logger.log('✅ Gemini AI Service initialized successfully');
      this.logger.log('   Model: gemini-3.5-flash');
      this.logger.log('   Status: ENABLED');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI:', error.message);
    }
  }

  /**
   * Process Query
   *
   * Sends a prompt to Gemini API and returns the response.
   * Used for generating AI insights for dashboard, reports, and analytics.
   *
   * @param prompt - The prompt to send to Gemini
   * @returns AI-generated response or null if unavailable
   */
  async processQuery(prompt: string): Promise<string | null> {
    if (!this.isEnabled || !this.model) {
      this.logger.debug('AI not enabled - returning null');
      return null;
    }

    try {
      this.logger.debug(`Sending prompt to Gemini (${prompt.length} chars)...`);
      
      // Create timeout promise (10 second timeout)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Gemini API timeout after 10s')),
          10000,
        );
      });

      // Race between API call and timeout
      const result = await Promise.race([
        this.model.generateContent(prompt),
        timeoutPromise,
      ]);

      const response = result.response;
      const text = response.text();
      
      this.logger.debug(`✅ Received response (${text.length} chars)`);
      return text;
    } catch (error) {
      if (error.message === 'Gemini API timeout after 10s') {
        this.logger.warn('Gemini API timed out after 10s');
      } else {
        this.logger.error('Gemini API error:', error.message);
      }
      return null;
    }
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
   * @returns true if Gemini AI is enabled and ready
   */
  isAvailable(): boolean {
    return this.isEnabled && !!this.model;
  }
}
