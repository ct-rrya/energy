import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { GeminiAIService } from '../messenger/gemini-ai.service';

/**
 * Channel types for chat processing
 */
export type ChatChannel = 'messenger' | 'web';

/**
 * Context information for message processing
 */
export interface MessageContext {
  userId: string; // Meta PSID or session ID
  channel: ChatChannel;
  sessionData?: any; // For web channel conversation context
  originalText?: string; // Preserve for AI
}

/**
 * Structured response from chatbot processing
 */
export interface ChatbotResponse {
  text: string;
  suggestions?: string[]; // Follow-up suggestions
  metadata?: {
    commandType?: string;
    dataSource?: string;
  };
}

/**
 * Quick Reply button structure for Messenger
 */
export interface QuickReply {
  title: string;
  payload: string;
}

/**
 * ChatbotCoreService
 *
 * Provides channel-agnostic message processing and response generation.
 * This service is shared between Messenger and web chat channels.
 *
 * Architecture:
 * - NEVER accesses database directly
 * - Consumes Analytics Service for calculations
 * - Consumes Energy Service for data queries
 * - Consumes Subscribers Service for subscriptions
 * - Consumes Gemini AI Service for natural language
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.8, 6.8, 9.9
 */
@Injectable()
export class ChatbotCoreService {
  private readonly logger = new Logger(ChatbotCoreService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly energyService: EnergyService,
    private readonly subscribersService: SubscribersService,
    @Inject(forwardRef(() => GeminiAIService))
    private readonly geminiAIService: GeminiAIService,
  ) {}

  /**
   * Main entry point for processing messages
   * Returns channel-agnostic response data
   *
   * @param message - The user's message text
   * @param context - Context information about the message
   * @returns Promise<ChatbotResponse> - Structured response
   */
  async processMessage(
    message: string,
    context: MessageContext,
  ): Promise<ChatbotResponse> {
    this.logger.log(
      `Processing message from ${context.channel}: "${message.substring(0, 50)}..."`,
    );

    try {
      // Update last interaction for messenger users
      if (context.channel === 'messenger') {
        await this.subscribersService.updateLastInteraction(context.userId);
      }

      // Parse and route the command
      const command = this.parseCommand(message);
      return await this.routeCommand(command, message, context);
    } catch (error) {
      this.logger.error('Error processing message', error.stack);
      return {
        text: 'System temporarily unavailable, please try again later',
        suggestions: ['help', 'status'],
      };
    }
  }

  /**
   * Parse message to identify command type
   * Normalizes command to lowercase and maps variants
   *
   * @param message - The user's message
   * @returns The normalized command string
   */
  private parseCommand(message: string): string {
    const normalized = message.trim().toLowerCase();

    // Command mapping for variants
    const commandMap: Record<string, string> = {
      stats: 'status',
      'system status': 'status',
      weekly: 'week',
      monthly: 'month',
      hi: 'hello',
      hey: 'hello',
      start: 'hello',
      menu: 'hello',
      get_started: 'hello',
      analytics: 'analytics_menu',
      analytics_menu: 'analytics_menu',
      environmental: 'impact',
      environment: 'impact',
      cost: 'savings',
      money: 'savings',
      current: 'energy',
      info: 'about',
    };

    return commandMap[normalized] || normalized;
  }

  /**
   * Route to appropriate handler based on command
   *
   * @param command - The normalized command
   * @param originalMessage - Original message text
   * @param context - Message context
   * @returns Promise<ChatbotResponse>
   */
  private async routeCommand(
    command: string,
    originalMessage: string,
    context: MessageContext,
  ): Promise<ChatbotResponse> {
    this.logger.log(`Routing command: "${command}"`);

    // Handle subscription commands (channel-specific)
    if (command === 'subscribe' || command === 'unsubscribe') {
      return this.handleSubscriptionCommand(command, context);
    }

    // Handle informational commands
    const informationalCommands = [
      'status',
      'today',
      'week',
      'month',
      'peak',
      'impact',
      'savings',
      'energy',
      'battery',
      'about',
      'help',
      'hello',
      'analytics_menu',
    ];

    if (informationalCommands.includes(command)) {
      return this.handleInformationalCommand(command, context);
    }

    // Handle natural language with AI
    if (this.geminiAIService.isAIEnabled()) {
      return this.handleNaturalLanguage(originalMessage, context);
    }

    // Fallback for unknown commands
    return {
      text: `🤔 Sorry, I don't recognize that command.\n\nTry typing one of these:\n\n• help\n• status\n• battery\n• energy\n\n💡 Type "help" to see all available commands`,
      suggestions: ['help', 'status', 'energy'],
    };
  }

  /**
   * Handle subscription commands (channel-specific)
   *
   * Requirements: 6.2, 6.3, 6.4
   *
   * @param command - 'subscribe' or 'unsubscribe'
   * @param context - Message context
   * @returns Promise<ChatbotResponse>
   */
  private async handleSubscriptionCommand(
    command: 'subscribe' | 'unsubscribe',
    context: MessageContext,
  ): Promise<ChatbotResponse> {
    // Web channel cannot access subscriptions
    if (context.channel === 'web') {
      return {
        text: '📱 Subscriptions are only available via Facebook Messenger.\n\nTo subscribe:\n1. Message us on Facebook Messenger\n2. Send "subscribe" to receive daily updates',
        suggestions: ['status', 'today', 'help'],
      };
    }

    // Handle subscribe command for Messenger
    if (command === 'subscribe') {
      await this.subscribersService.subscribe(context.userId);
      return {
        text: `🔔 Subscription Activated\n\nYou'll now receive:\n\nDaily energy summaries\nWeekly performance reports\nImportant system alerts\n\nType "unsubscribe" anytime to stop notifications.\n\n💡 Try "status" for current energy stats`,
        suggestions: ['status', 'today', 'energy'],
      };
    }

    // Handle unsubscribe command for Messenger
    const result = await this.subscribersService.unsubscribe(context.userId);
    if (!result) {
      return {
        text: `🔕 Not Subscribed\n\nYou're not currently subscribed to notifications.\n\nType "subscribe" to start receiving updates.`,
        suggestions: ['subscribe', 'status', 'help'],
      };
    }

    return {
      text: `🔕 Unsubscribed Successfully\n\nYou'll no longer receive automatic notifications.\n\nType "subscribe" anytime to reactivate.\n\n💡 You can still ask for energy stats anytime`,
      suggestions: ['subscribe', 'status', 'energy'],
    };
  }

  /**
   * Handle informational commands
   *
   * Requirements: 2.6, 6.8
   *
   * @param command - The command to handle
   * @param context - Message context
   * @returns Promise<ChatbotResponse>
   */
  private async handleInformationalCommand(
    command: string,
    context: MessageContext,
  ): Promise<ChatbotResponse> {
    this.logger.log(`Handling informational command: ${command}`);

    switch (command) {
      case 'hello':
      case 'start':
      case 'menu':
        return this.handleWelcome();

      case 'help':
        return this.handleHelp();

      case 'status':
        return this.handleStatus();

      case 'today':
        return this.handleToday();

      case 'week':
        return this.handleWeek();

      case 'month':
        return this.handleMonth();

      case 'peak':
        return this.handlePeak();

      case 'analytics_menu':
        return this.handleAnalyticsMenu();

      case 'impact':
        return this.handleImpact();

      case 'savings':
        return this.handleSavings();

      case 'energy':
        return this.handleEnergy();

      case 'battery':
        return this.handleBattery();

      case 'about':
        return this.handleAbout();

      default:
        return {
          text: `Command "${command}" recognized but not yet implemented.\n\nTry: status, today, or help`,
          suggestions: ['status', 'today', 'help'],
        };
    }
  }

  /**
   * Handle natural language queries via AI
   *
   * Requirements: 2.8, 9.9
   *
   * @param message - The user's message
   * @param context - Message context
   * @returns Promise<ChatbotResponse>
   */
  private async handleNaturalLanguage(
    message: string,
    context: MessageContext,
  ): Promise<ChatbotResponse> {
    this.logger.log('Handling natural language query via AI');

    try {
      const aiResponse = await this.geminiAIService.processQuery(message);

      return {
        text: aiResponse,
        suggestions: ['status', 'help'],
        metadata: {
          commandType: 'natural_language',
          dataSource: 'gemini_ai',
        },
      };
    } catch (error) {
      this.logger.warn(
        'AI service failed, falling back to default response',
        error.message,
      );

      // Graceful fallback when AI fails
      return {
        text: `I'm having trouble understanding that right now. Try one of these commands:\n\n• status\n• energy\n• today\n• help`,
        suggestions: ['status', 'energy', 'help'],
      };
    }
  }

  /**
   * Handle Welcome Message
   */
  private async handleWelcome(): Promise<ChatbotResponse> {
    return {
      text: `👋 Welcome to EcoStep!\n\nMonitor your piezoelectric energy generation system in real time.\n\nChoose an option below to get started:`,
      suggestions: ['status', 'energy', 'battery', 'help'],
    };
  }

  /**
   * Handle Help Command
   */
  private async handleHelp(): Promise<ChatbotResponse> {
    return {
      text: `🌞 EcoStep Energy Assistant\n\nHere's what you can ask me:\n\n📊 Energy Monitoring\n• Status\n• Energy\n• Battery\n\n📈 Analytics\n• Today\n• This Week\n• This Month\n• Peak Generation\n\n🌱 Environmental Impact\n• Savings\n• Impact\n\n🔔 Notifications\n• Subscribe\n• Unsubscribe\n\nℹ️ Other\n• Help\n• About`,
      suggestions: ['status', 'today', 'energy'],
    };
  }

  /**
   * Handle Status Command
   * Shows comprehensive analytics
   */
  private async handleStatus(): Promise<ChatbotResponse> {
    try {
      const analytics = await this.analyticsService.getComprehensiveAnalytics();

      // Check if we have recent data (requirement 9.2)
      if (!analytics || analytics.today.readingCount === 0) {
        return {
          text: 'No recent sensor data available',
          suggestions: ['help', 'about'],
        };
      }

      const text = `📊 Energy System Status\n\n🌞 Today\nEnergy Generated: ${analytics.today.totalEnergyKWh.toFixed(3)} kWh\nAverage Power: ${analytics.today.avgPowerW.toFixed(2)} W\nPeak Power: ${analytics.today.peakPowerW.toFixed(2)} W\n\n📅 This Week\nEnergy Generated: ${analytics.thisWeek.totalEnergyKWh.toFixed(3)} kWh\nTotal Readings: ${analytics.thisWeek.readingCount}\n\n📆 This Month\nEnergy Generated: ${analytics.thisMonth.totalEnergyKWh.toFixed(3)} kWh\nActive Days: ${analytics.thisMonth.daysWithData} of ${analytics.thisMonth.daysInMonth}\n\n⚡ Peak Performance\n${analytics.peakGeneration ? `${analytics.peakGeneration.peakPowerW.toFixed(2)} W on ${analytics.peakGeneration.date} at ${analytics.peakGeneration.time}` : 'No peak data available yet'}\n\n🌳 Environmental Impact\nCO₂ Avoided: ${analytics.environmentalImpact.co2AvoidedKg.toFixed(2)} kg\nTree Equivalent: ${analytics.environmentalImpact.treesEquivalent.toFixed(1)} trees/year\n\n💰 Cost Savings\nThis Month: $${analytics.costSavings.totalSavings.toFixed(2)}\nProjected Yearly: $${analytics.costSavings.yearlyProjectedSavings.toFixed(2)}\n\n📈 Trend\n${this.getTrendEmoji(analytics.trend.trend)} ${analytics.trend.trend.charAt(0).toUpperCase() + analytics.trend.trend.slice(1)} (${analytics.trend.changePercent > 0 ? '+' : ''}${analytics.trend.changePercent.toFixed(1)}%)`;

      return {
        text,
        suggestions: ['today', 'battery', 'help'],
        metadata: {
          commandType: 'status',
          dataSource: 'analytics_service',
        },
      };
    } catch (error) {
      this.logger.error('Failed to get analytics for status', error);
      return {
        text: 'System data is temporarily unavailable. Please try again in a few moments.',
        suggestions: ['help', 'about'],
      };
    }
  }

  /**
   * Handle Today Command
   * Shows today's energy summary
   */
  private async handleToday(): Promise<ChatbotResponse> {
    try {
      const today = await this.analyticsService.getDailySummary(new Date());

      const text = `🌞 Today's Energy Report\n${today.dayOfWeek}, ${today.date}\n\n⚡ Power Generation\nTotal Energy: ${today.totalEnergyKWh.toFixed(3)} kWh\nAverage Power: ${today.avgPowerW.toFixed(2)} W\nPeak Power: ${today.peakPowerW.toFixed(2)} W\nMinimum Power: ${today.minPowerW.toFixed(2)} W\n\n📊 Activity Summary\nTotal Readings: ${today.readingCount}\n\n💡 Try "week" or "month" for longer periods`;

      return {
        text,
        suggestions: ['week', 'month', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to get daily summary', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Week Command
   * Shows this week's energy summary
   */
  private async handleWeek(): Promise<ChatbotResponse> {
    try {
      const week = await this.analyticsService.getWeeklySummary();

      const text = `📅 Weekly Energy Report\nWeek ${week.weekNumber}: ${week.weekStart} to ${week.weekEnd}\n\n⚡ Power Generation\nTotal Energy: ${week.totalEnergyKWh.toFixed(3)} kWh\nAverage Power: ${week.avgPowerW.toFixed(2)} W\nPeak Power: ${week.peakPowerW.toFixed(2)} W\n\n📊 Activity Summary\nTotal Readings: ${week.readingCount}\n\n📈 Daily Breakdown\n${week.dailyBreakdown.map((day) => `${day.date} (${day.dayOfWeek.substring(0, 3)}): ${day.totalEnergyKWh.toFixed(3)} kWh`).join('\n')}\n\n💡 Try "month" for monthly summary`;

      return {
        text,
        suggestions: ['month', 'peak', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to get weekly summary', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Month Command
   * Shows this month's energy summary
   */
  private async handleMonth(): Promise<ChatbotResponse> {
    try {
      const month = await this.analyticsService.getMonthlySummary();

      const text = `📆 Monthly Energy Report\n${month.monthName} ${month.year}\n\n⚡ Power Generation\nTotal Energy: ${month.totalEnergyKWh.toFixed(3)} kWh\nAverage Power: ${month.avgPowerW.toFixed(2)} W\nPeak Power: ${month.peakPowerW.toFixed(2)} W\n\n📊 Activity Summary\nTotal Readings: ${month.readingCount}\nActive Days: ${month.daysWithData} of ${month.daysInMonth}\n\n💡 Try "impact" or "savings" for more insights`;

      return {
        text,
        suggestions: ['impact', 'savings', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to get monthly summary', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Peak Command
   * Shows peak generation
   */
  private async handlePeak(): Promise<ChatbotResponse> {
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      const peak = await this.analyticsService.getPeakGeneration(
        monthStart.toISOString().split('T')[0],
      );

      if (!peak) {
        return {
          text: `⚡ Peak Generation\n\nNo peak generation data available yet.\n\nYour system will record peak performance once readings are received.\n\n💡 Try "status" for current overview`,
          suggestions: ['status', 'today'],
        };
      }

      const text = `⚡ Peak Generation This Month\n\n🏆 Record Performance\nPower: ${peak.peakPowerW.toFixed(2)} W\nDate: ${peak.date}\nTime: ${peak.time}\n\n📍 Sensor Location\n${peak.sensorName}\n${peak.sensorLocation}\n\n💡 Try "today" for today's generation`;

      return {
        text,
        suggestions: ['today', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to get peak generation', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Analytics Menu
   */
  private async handleAnalyticsMenu(): Promise<ChatbotResponse> {
    return {
      text: `📈 Analytics Menu\n\nChoose a time period to view:`,
      suggestions: ['today', 'week', 'month'],
    };
  }

  /**
   * Handle Impact Command
   * Shows environmental impact
   */
  private async handleImpact(): Promise<ChatbotResponse> {
    try {
      const month = await this.analyticsService.getMonthlySummary();
      const impact = this.analyticsService.calculateEnvironmentalImpact(
        month.totalEnergyKWh,
      );

      const text = `🌳 Environmental Impact This Month\n\n🌍 CO₂ Emissions Avoided\n${impact.co2AvoidedKg.toFixed(2)} kg of CO₂\n\n🌲 Real-World Equivalents\n${impact.treesEquivalent.toFixed(1)} trees planted for a year\n${impact.coalNotBurnedKg.toFixed(2)} kg of coal not burned\n${impact.homesPoweredDays.toFixed(1)} home-days of electricity\n${impact.phoneChargesEquivalent.toLocaleString()} smartphone charges\n\n✨ Every kWh helps fight climate change\n\n💡 Try "savings" for cost analysis`;

      return {
        text,
        suggestions: ['savings', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to calculate impact', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Savings Command
   * Shows cost savings
   */
  private async handleSavings(): Promise<ChatbotResponse> {
    try {
      const month = await this.analyticsService.getMonthlySummary();
      const savings = this.analyticsService.calculateCostSavings(
        month.totalEnergyKWh,
        month.daysWithData,
      );

      const text = `💰 Cost Savings This Month\n\n💵 Current Savings\nTotal Saved: $${savings.totalSavings.toFixed(2)}\nDaily Average: $${savings.dailyAverageSavings.toFixed(2)}\n\n📊 Projected Savings\nMonthly: $${savings.monthlyProjectedSavings.toFixed(2)}\nYearly: $${savings.yearlyProjectedSavings.toFixed(2)}\n\n⚡ Electricity Rate\n$${savings.electricityRatePerKWh.toFixed(2)} per kWh\n\n💡 Try "status" for complete overview`;

      return {
        text,
        suggestions: ['impact', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to calculate savings', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Energy Command
   * Shows current energy generation status
   */
  private async handleEnergy(): Promise<ChatbotResponse> {
    try {
      const today = await this.analyticsService.getDailySummary(new Date());

      // Calculate progress to next milestone
      const totalWh = today.totalEnergyKWh * 1000;
      const milestones = [100, 500, 1000, 5000];
      const nextMilestone = milestones.find((m) => m > totalWh) || 5000;
      const progress = ((totalWh / nextMilestone) * 100).toFixed(0);

      const text = `⚡ Current Energy Status\n\n📊 Today's Generation\nEnergy: ${today.totalEnergyKWh.toFixed(3)} kWh\nAverage Power: ${today.avgPowerW.toFixed(2)} W\nPeak Power: ${today.peakPowerW.toFixed(2)} W\nUpdated: ${new Date().toLocaleTimeString()}\n\n🎯 Next Milestone\n${nextMilestone} Wh (${progress}% complete)\n\n💡 Try "today" for full daily report`;

      return {
        text,
        suggestions: ['battery', 'today', 'status'],
      };
    } catch (error) {
      this.logger.error('Failed to get energy status', error);
      return {
        text: 'Energy data not available at this time',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Battery Command
   * Shows current battery status
   */
  private async handleBattery(): Promise<ChatbotResponse> {
    try {
      const text = `🔋 Battery Status\n\n📊 Current Status\nBattery Level: Available when sensors are active\nMonitoring: Active\nTemperature: Check sensor readings\n\n⚡ Power Information\nVoltage: Check latest readings\nCurrent: Check latest readings\n\n⏱️ Last Updated: Just now\n\n💡 Try "status" for complete overview`;

      return {
        text,
        suggestions: ['status', 'energy'],
      };
    } catch (error) {
      this.logger.error('Failed to get battery status', error);
      return {
        text: `🔋 Battery Status\n\nUnable to retrieve battery data at this time.\n\nYour system will display battery status once sensor readings are received.\n\n💡 Try "status" or "help" for other commands`,
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle About Command
   * Shows system information
   */
  private async handleAbout(): Promise<ChatbotResponse> {
    try {
      const subscriberCount =
        await this.subscribersService.getSubscriberCount();

      const text = `🌞 EcoStep Energy Monitor\n\n📋 About This System\nPlatform: Piezoelectric Energy Monitoring\nTechnology: ESP32 + NestJS + React\nActive Subscribers: ${subscriberCount}\n\n✨ Key Features\nReal-time energy tracking\nBattery monitoring\nDaily and weekly reports\nEnvironmental impact analysis\nCost savings calculations\nAutomated notifications\n\n📞 Need Help?\nType "help" for available commands\nSupport: admin@energymonitor.com\n\n💡 Built for sustainable energy innovation`;

      return {
        text,
        suggestions: ['status', 'help'],
      };
    } catch (error) {
      this.logger.error('Failed to get about info', error);
      return {
        text: `🌞 EcoStep Energy Monitor\n\nAn academic IoT capstone project for real-time energy monitoring and analytics.\n\n💡 Type "help" for available commands`,
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Format response for specific channel
   *
   * Requirements: 6.5, 6.6, 6.7, 10.1, 10.2, 10.3, 10.7
   *
   * @param response - Core chatbot response
   * @param channel - Target channel
   * @returns Formatted response for the channel
   */
  formatForChannel(
    response: ChatbotResponse,
    channel: ChatChannel,
  ): {
    text: string;
    quickReplies?: QuickReply[];
    suggestions?: string[];
  } {
    if (channel === 'messenger') {
      // Format for Messenger with Quick Replies
      const quickReplies: QuickReply[] = (response.suggestions || []).map(
        (suggestion) => ({
          title: this.getSuggestionTitle(suggestion),
          payload: suggestion,
        }),
      );

      return {
        text: response.text,
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      };
    } else {
      // Format for web - plain text with suggestions array
      return {
        text: response.text,
        suggestions: response.suggestions,
      };
    }
  }

  /**
   * Get friendly title for suggestion
   */
  private getSuggestionTitle(suggestion: string): string {
    const titleMap: Record<string, string> = {
      status: '📊 Status',
      today: '📅 Today',
      week: '📅 This Week',
      month: '📆 This Month',
      peak: '⚡ Peak',
      energy: '⚡ Energy',
      battery: '🔋 Battery',
      impact: '🌱 Impact',
      savings: '💰 Savings',
      help: 'ℹ️ Help',
      about: 'ℹ️ About',
      subscribe: '🔔 Subscribe',
      hello: '🏠 Main Menu',
    };

    return titleMap[suggestion] || suggestion;
  }

  /**
   * Get trend emoji helper
   */
  private getTrendEmoji(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '📊';
    }
  }
}
