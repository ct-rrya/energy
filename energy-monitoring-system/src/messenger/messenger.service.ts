import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { GeminiAIService } from './gemini-ai.service';

/**
 * Messenger Service
 * 
 * Handles Facebook Messenger Bot logic with interactive features.
 * 
 * Architecture:
 * - NEVER accesses database directly
 * - Consumes Analytics Service for calculations
 * - Consumes Energy Service for data queries
 * - Consumes Subscribers Service for subscriptions
 * 
 * Features:
 * - Text command parsing
 * - Quick Replies for guided interaction
 * - Button Templates for structured responses
 * - Persistent Menu for easy navigation
 * - Postback payload handling
 * 
 * Commands Supported:
 * - help/start/menu - Welcome message with Quick Replies
 * - status - Comprehensive analytics
 * - today/week/month - Time-based summaries
 * - peak - Peak generation
 * - impact/savings - Environmental & cost analysis
 * - energy/battery - Current status
 * - subscribe/unsubscribe - Notification management
 * - about - System information
 */
@Injectable()
export class MessengerService implements OnModuleInit {
  private readonly logger = new Logger(MessengerService.name);
  private readonly pageAccessToken: string;
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private configService: ConfigService,
    private analyticsService: AnalyticsService,
    private energyService: EnergyService,
    private subscribersService: SubscribersService,
    private geminiAIService: GeminiAIService,
  ) {
    this.pageAccessToken = this.configService.get<string>(
      'messenger.pageAccessToken',
    ) || '';
  }

  /**
   * OnModuleInit Lifecycle Hook
   * 
   * Initializes Messenger Platform features on application startup.
   */
  async onModuleInit() {
    this.logger.log('Initializing Messenger Bot features...');

    try {
      // Configure Persistent Menu
      await this.setPersistentMenu();

      // Configure Get Started button
      await this.setGetStartedButton();

      // Configure Greeting text
      await this.setGreetingText();

      this.logger.log('✅ Messenger Bot initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Messenger Bot: ${error.message}`,
        error.stack,
      );
      // Don't throw - allow app to continue even if Messenger setup fails
    }
  }

  /**
   * Handle Message
   * 
   * Main entry point for processing user messages.
   * Handles both text commands and interactive payloads.
   * 
   * @param senderId - Facebook User ID (PSID)
   * @param messageText - Message text or payload from user
   */
  async handleMessage(senderId: string, messageText: string): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log(`[MESSENGER SERVICE] handleMessage() called`);
    this.logger.log(`[MESSENGER SERVICE]    Sender ID: ${senderId}`);
    this.logger.log(`[MESSENGER SERVICE]    Message text: "${messageText}"`);
    this.logger.log(`[MESSENGER SERVICE]    Message length: ${messageText.length} characters`);

    // Update last interaction
    await this.subscribersService.updateLastInteraction(senderId);

    // Parse command (normalize to lowercase for matching)
    const command = messageText.toLowerCase().trim();
    const originalText = messageText; // Preserve original for AI

    this.logger.log(`[MESSENGER SERVICE]    Normalized command: "${command}"`);
    this.logger.log(`[MESSENGER SERVICE]    Original text preserved for AI routing`);

    try {
      // Route to appropriate handler
      this.logger.log(`[MESSENGER SERVICE] Calling routeCommand()...`);
      await this.routeCommand(senderId, command, originalText);
      this.logger.log(`[MESSENGER SERVICE] ✅ routeCommand() completed successfully`);
    } catch (error) {
      this.logger.error('[MESSENGER SERVICE] ❌ Error in handleMessage:');
      this.logger.error(`[MESSENGER SERVICE]    Error name: ${error.name}`);
      this.logger.error(`[MESSENGER SERVICE]    Error message: ${error.message}`);
      this.logger.error(`[MESSENGER SERVICE]    Stack trace: ${error.stack}`);
      
      await this.sendMessage(
        senderId,
        '❌ Sorry, something went wrong. Please try again later.',
      );
    }
  }

  /**
   * Route Command
   * 
   * Central command dispatcher for all message types.
   * Handles text commands, quick replies, and postback payloads.
   * 
   * @param senderId - Facebook User ID
   * @param command - Command or payload string
   */
  private async routeCommand(senderId: string, command: string, originalText?: string): Promise<void> {
    // Log the command for debugging
    this.logger.log('───────────────────────────────────────────────────────');
    this.logger.log(`[ROUTE COMMAND] Command received: "${command}"`);
    this.logger.log(`[ROUTE COMMAND] Original text: "${originalText || 'N/A'}"`);
    this.logger.log(`[ROUTE COMMAND] Has originalText: ${!!originalText}`);
    this.logger.log(`[ROUTE COMMAND] AI enabled: ${this.geminiAIService.isAIEnabled()}`);
    
    switch (command) {
      // Welcome/Start commands
      case 'get_started':
      case 'hello':
      case 'hi':
      case 'start':
      case 'menu':
      case 'help':
        await this.handleWelcome(senderId);
        break;

      // Status command
      case 'status':
      case 'stats':
      case 'system status': // Handle button title text as fallback
        await this.handleStatusCommand(senderId);
        break;

      // Today command
      case 'today':
        await this.handleTodayCommand(senderId);
        break;

      // Week command
      case 'week':
      case 'weekly':
        await this.handleWeekCommand(senderId);
        break;

      // Month command
      case 'month':
      case 'monthly':
        await this.handleMonthCommand(senderId);
        break;

      // Peak command
      case 'peak':
        await this.handlePeakCommand(senderId);
        break;

      // Analytics menu
      case 'analytics_menu':
      case 'analytics':
        await this.handleAnalyticsMenu(senderId);
        break;

      // Impact command
      case 'impact':
      case 'environmental':
      case 'environment':
        await this.handleImpactCommand(senderId);
        break;

      // Savings command
      case 'savings':
      case 'cost':
      case 'money':
        await this.handleSavingsCommand(senderId);
        break;

      // Energy command
      case 'energy':
      case 'current':
        await this.handleEnergyCommand(senderId);
        break;

      // Battery command
      case 'battery':
        await this.handleBatteryCommand(senderId);
        break;

      // About command
      case 'about':
      case 'info':
        await this.handleAboutCommand(senderId);
        break;

      // Subscribe command
      case 'subscribe':
        await this.handleSubscribeCommand(senderId);
        break;

      // Unsubscribe command
      case 'unsubscribe':
        await this.handleUnsubscribeCommand(senderId);
        break;

      // Unknown command
      default:
        this.logger.log('[ROUTE COMMAND] ═══════════════════════════════════════');
        this.logger.log('[ROUTE COMMAND] DEFAULT CASE - No predefined command matched');
        this.logger.log('[ROUTE COMMAND] Checking AI routing conditions...');
        this.logger.log(`[ROUTE COMMAND]    ✓ originalText exists: ${!!originalText}`);
        this.logger.log(`[ROUTE COMMAND]    ✓ originalText value: "${originalText || 'undefined'}"`);
        this.logger.log(`[ROUTE COMMAND]    ✓ AI service enabled: ${this.geminiAIService.isAIEnabled()}`);
        
        if (originalText && this.geminiAIService.isAIEnabled()) {
          this.logger.log('[ROUTE COMMAND] ✅ CONDITIONS MET - Routing to AI natural language handler');
          await this.handleNaturalLanguageQuery(senderId, originalText);
        } else {
          this.logger.warn('[ROUTE COMMAND] ❌ CONDITIONS NOT MET - Showing unknown command message');
          if (!originalText) {
            this.logger.warn('[ROUTE COMMAND]    Reason: originalText is missing/falsy');
          }
          if (!this.geminiAIService.isAIEnabled()) {
            this.logger.warn('[ROUTE COMMAND]    Reason: AI service is not enabled');
          }
          await this.handleUnknownCommand(senderId, command);
        }
        break;
    }
  }

  /**
   * Handle Welcome Message
   * 
   * Sends welcome message with Quick Replies for main actions.
   */
  private async handleWelcome(senderId: string): Promise<void> {
    const welcomeText = `👋 Welcome to EcoStep!

Monitor your piezoelectric energy generation system in real time.

Choose an option below to get started:`;

    const quickReplies = [
      { title: '📊 System Status', payload: 'status' },
      { title: '⚡ Energy', payload: 'energy' },
      { title: '🔋 Battery', payload: 'battery' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '🌱 Impact', payload: 'impact' },
      { title: 'ℹ️ Help', payload: 'help' },
    ];

    await this.sendMessage(senderId, welcomeText, quickReplies);
  }

  /**
   * Handle Status Command with Quick Replies
   */
  private async handleStatusCommand(senderId: string): Promise<void> {
    const response = await this.handleStatus();
    
    const quickReplies = [
      { title: "📅 Today's Energy", payload: 'today' },
      { title: '🔋 Battery', payload: 'battery' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Today Command with Quick Replies
   */
  private async handleTodayCommand(senderId: string): Promise<void> {
    const response = await this.handleToday();
    
    const quickReplies = [
      { title: '📅 This Week', payload: 'week' },
      { title: '📆 This Month', payload: 'month' },
      { title: '📊 Status', payload: 'status' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Week Command with Quick Replies
   */
  private async handleWeekCommand(senderId: string): Promise<void> {
    const response = await this.handleWeek();
    
    const quickReplies = [
      { title: '📆 This Month', payload: 'month' },
      { title: '⚡ Peak Power', payload: 'peak' },
      { title: '📊 Status', payload: 'status' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Month Command with Quick Replies
   */
  private async handleMonthCommand(senderId: string): Promise<void> {
    const response = await this.handleMonth();
    
    const quickReplies = [
      { title: '🌱 Impact', payload: 'impact' },
      { title: '💰 Savings', payload: 'savings' },
      { title: '📊 Status', payload: 'status' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Peak Command with Quick Replies
   */
  private async handlePeakCommand(senderId: string): Promise<void> {
    const response = await this.handlePeak();
    
    const quickReplies = [
      { title: '📅 Today', payload: 'today' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '📊 Status', payload: 'status' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Analytics Menu
   * 
   * Shows analytics options with button template.
   */
  private async handleAnalyticsMenu(senderId: string): Promise<void> {
    const text = `📈 Analytics Menu

Choose a time period to view:`;

    const buttons = [
      { title: '📅 Today', payload: 'today' },
      { title: '📅 This Week', payload: 'week' },
      { title: '📆 This Month', payload: 'month' },
    ];

    await this.sendButtonTemplate(senderId, text, buttons);
  }

  /**
   * Handle Impact Command with Quick Replies
   */
  private async handleImpactCommand(senderId: string): Promise<void> {
    const response = await this.handleImpact();
    
    const quickReplies = [
      { title: '💰 Cost Savings', payload: 'savings' },
      { title: '📊 Status', payload: 'status' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Savings Command with Quick Replies
   */
  private async handleSavingsCommand(senderId: string): Promise<void> {
    const response = await this.handleSavings();
    
    const quickReplies = [
      { title: '🌱 Impact', payload: 'impact' },
      { title: '📊 Status', payload: 'status' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Energy Command with Quick Replies
   */
  private async handleEnergyCommand(senderId: string): Promise<void> {
    const response = await this.handleEnergy();
    
    const quickReplies = [
      { title: '🔋 Battery', payload: 'battery' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '📊 Status', payload: 'status' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Battery Command with Quick Replies
   */
  private async handleBatteryCommand(senderId: string): Promise<void> {
    const response = await this.handleBattery();
    
    const quickReplies = [
      { title: '📊 Status', payload: 'status' },
      { title: '⚡ Energy', payload: 'energy' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle About Command with Quick Replies
   */
  private async handleAboutCommand(senderId: string): Promise<void> {
    const response = await this.handleAbout();
    
    const quickReplies = [
      { title: '📊 System Status', payload: 'status' },
      { title: '🔔 Subscribe', payload: 'subscribe' },
      { title: 'ℹ️ Help', payload: 'help' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Subscribe Command with Quick Replies
   */
  private async handleSubscribeCommand(senderId: string): Promise<void> {
    const response = await this.handleSubscribe(senderId);
    
    const quickReplies = [
      { title: '📊 System Status', payload: 'status' },
      { title: '⚡ Energy', payload: 'energy' },
      { title: '📈 Analytics', payload: 'analytics_menu' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Unsubscribe Command with Quick Replies
   */
  private async handleUnsubscribeCommand(senderId: string): Promise<void> {
    const response = await this.handleUnsubscribe(senderId);
    
    const quickReplies = [
      { title: '📊 System Status', payload: 'status' },
      { title: '⚡ Energy', payload: 'energy' },
      { title: 'ℹ️ Help', payload: 'help' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Unknown Command with Quick Replies
   */
  private async handleUnknownCommand(senderId: string, command: string): Promise<void> {
    const response = await this.handleUnknown(command);
    
    const quickReplies = [
      { title: 'ℹ️ Help', payload: 'help' },
      { title: '📊 Status', payload: 'status' },
      { title: '⚡ Energy', payload: 'energy' },
      { title: '🏠 Main Menu', payload: 'menu' },
    ];

    await this.sendMessage(senderId, response, quickReplies);
  }

  /**
   * Handle Help Command
   * 
   * Shows available commands.
   */
  private async handleHelp(): Promise<string> {
    return `
🌞 EcoStep Energy Assistant

Here's what you can ask me:

📊 Energy Monitoring
• Status
• Energy
• Battery

📈 Analytics
• Today
• This Week
• This Month
• Peak Generation

🌱 Environmental Impact
• Savings
• Impact

🔔 Notifications
• Subscribe
• Unsubscribe

ℹ️ Other
• Help
• About
    `.trim();
  }

  /**
   * Handle Status Command
   * 
   * Shows comprehensive analytics.
   * Uses Analytics Service.
   */
  private async handleStatus(): Promise<string> {
    const analytics = await this.analyticsService.getComprehensiveAnalytics();

    return `
📊 Energy System Status

🌞 Today
Energy Generated: ${analytics.today.totalEnergyKWh.toFixed(3)} kWh
Average Power: ${analytics.today.avgPowerW.toFixed(2)} W
Peak Power: ${analytics.today.peakPowerW.toFixed(2)} W

📅 This Week
Energy Generated: ${analytics.thisWeek.totalEnergyKWh.toFixed(3)} kWh
Total Readings: ${analytics.thisWeek.readingCount}

📆 This Month
Energy Generated: ${analytics.thisMonth.totalEnergyKWh.toFixed(3)} kWh
Active Days: ${analytics.thisMonth.daysWithData} of ${analytics.thisMonth.daysInMonth}

⚡ Peak Performance
${analytics.peakGeneration ? `${analytics.peakGeneration.peakPowerW.toFixed(2)} W on ${analytics.peakGeneration.date} at ${analytics.peakGeneration.time}` : 'No peak data available yet'}

🌳 Environmental Impact
CO₂ Avoided: ${analytics.environmentalImpact.co2AvoidedKg.toFixed(2)} kg
Tree Equivalent: ${analytics.environmentalImpact.treesEquivalent.toFixed(1)} trees/year

💰 Cost Savings
This Month: $${analytics.costSavings.totalSavings.toFixed(2)}
Projected Yearly: $${analytics.costSavings.yearlyProjectedSavings.toFixed(2)}

📈 Trend
${this.getTrendEmoji(analytics.trend.trend)} ${analytics.trend.trend.charAt(0).toUpperCase() + analytics.trend.trend.slice(1)} (${analytics.trend.changePercent > 0 ? '+' : ''}${analytics.trend.changePercent.toFixed(1)}%)
    `.trim();
  }

  /**
   * Handle Today Command
   * 
   * Shows today's energy summary.
   * Uses Analytics Service.
   */
  private async handleToday(): Promise<string> {
    const today = await this.analyticsService.getDailySummary(new Date());

    return `
🌞 Today's Energy Report
${today.dayOfWeek}, ${today.date}

⚡ Power Generation
Total Energy: ${today.totalEnergyKWh.toFixed(3)} kWh
Average Power: ${today.avgPowerW.toFixed(2)} W
Peak Power: ${today.peakPowerW.toFixed(2)} W
Minimum Power: ${today.minPowerW.toFixed(2)} W

📊 Activity Summary
Total Readings: ${today.readingCount}

💡 Try "week" or "month" for longer periods
    `.trim();
  }

  /**
   * Handle Week Command
   * 
   * Shows this week's energy summary.
   * Uses Analytics Service.
   */
  private async handleWeek(): Promise<string> {
    const week = await this.analyticsService.getWeeklySummary();

    return `
📅 Weekly Energy Report
Week ${week.weekNumber}: ${week.weekStart} to ${week.weekEnd}

⚡ Power Generation
Total Energy: ${week.totalEnergyKWh.toFixed(3)} kWh
Average Power: ${week.avgPowerW.toFixed(2)} W
Peak Power: ${week.peakPowerW.toFixed(2)} W

📊 Activity Summary
Total Readings: ${week.readingCount}

📈 Daily Breakdown
${week.dailyBreakdown.map(day => `${day.date} (${day.dayOfWeek.substring(0, 3)}): ${day.totalEnergyKWh.toFixed(3)} kWh`).join('\n')}

💡 Try "month" for monthly summary
    `.trim();
  }

  /**
   * Handle Month Command
   * 
   * Shows this month's energy summary.
   * Uses Analytics Service.
   */
  private async handleMonth(): Promise<string> {
    const month = await this.analyticsService.getMonthlySummary();

    return `
📆 Monthly Energy Report
${month.monthName} ${month.year}

⚡ Power Generation
Total Energy: ${month.totalEnergyKWh.toFixed(3)} kWh
Average Power: ${month.avgPowerW.toFixed(2)} W
Peak Power: ${month.peakPowerW.toFixed(2)} W

📊 Activity Summary
Total Readings: ${month.readingCount}
Active Days: ${month.daysWithData} of ${month.daysInMonth}

💡 Try "impact" or "savings" for more insights
    `.trim();
  }

  /**
   * Handle Peak Command
   * 
   * Shows peak generation.
   * Uses Analytics Service.
   */
  private async handlePeak(): Promise<string> {
    const monthStart = new Date();
    monthStart.setDate(1);
    const peak = await this.analyticsService.getPeakGeneration(
      monthStart.toISOString().split('T')[0],
    );

    if (!peak) {
      return `
⚡ Peak Generation

No peak generation data available yet.

Your system will record peak performance once readings are received.

💡 Try "status" for current overview
      `.trim();
    }

    return `
⚡ Peak Generation This Month

🏆 Record Performance
Power: ${peak.peakPowerW.toFixed(2)} W
Date: ${peak.date}
Time: ${peak.time}

📍 Sensor Location
${peak.sensorName}
${peak.sensorLocation}

💡 Try "today" for today's generation
    `.trim();
  }

  /**
   * Handle Impact Command
   * 
   * Shows environmental impact.
   * Uses Analytics Service.
   */
  private async handleImpact(): Promise<string> {
    const month = await this.analyticsService.getMonthlySummary();
    const impact = this.analyticsService.calculateEnvironmentalImpact(
      month.totalEnergyKWh,
    );

    return `
🌳 Environmental Impact This Month

🌍 CO₂ Emissions Avoided
${impact.co2AvoidedKg.toFixed(2)} kg of CO₂

🌲 Real-World Equivalents
${impact.treesEquivalent.toFixed(1)} trees planted for a year
${impact.coalNotBurnedKg.toFixed(2)} kg of coal not burned
${impact.homesPoweredDays.toFixed(1)} home-days of electricity
${impact.phoneChargesEquivalent.toLocaleString()} smartphone charges

✨ Every kWh helps fight climate change

💡 Try "savings" for cost analysis
    `.trim();
  }

  /**
   * Handle Savings Command
   * 
   * Shows cost savings.
   * Uses Analytics Service.
   */
  private async handleSavings(): Promise<string> {
    const month = await this.analyticsService.getMonthlySummary();
    const savings = this.analyticsService.calculateCostSavings(
      month.totalEnergyKWh,
      month.daysWithData,
    );

    return `
💰 Cost Savings This Month

💵 Current Savings
Total Saved: $${savings.totalSavings.toFixed(2)}
Daily Average: $${savings.dailyAverageSavings.toFixed(2)}

📊 Projected Savings
Monthly: $${savings.monthlyProjectedSavings.toFixed(2)}
Yearly: $${savings.yearlyProjectedSavings.toFixed(2)}

⚡ Electricity Rate
$${savings.electricityRatePerKWh.toFixed(2)} per kWh

💡 Try "status" for complete overview
    `.trim();
  }

  /**
   * Handle Subscribe Command
   * 
   * Subscribes user to notifications.
   * Uses Subscribers Service.
   */
  private async handleSubscribe(senderId: string): Promise<string> {
    await this.subscribersService.subscribe(senderId);

    return `
🔔 Subscription Activated

You'll now receive:

Daily energy summaries
Weekly performance reports
Important system alerts

Type "unsubscribe" anytime to stop notifications.

💡 Try "status" for current energy stats
    `.trim();
  }

  /**
   * Handle Unsubscribe Command
   * 
   * Unsubscribes user from notifications.
   * Uses Subscribers Service.
   */
  private async handleUnsubscribe(senderId: string): Promise<string> {
    const result = await this.subscribersService.unsubscribe(senderId);

    if (!result) {
      return `
🔕 Not Subscribed

You're not currently subscribed to notifications.

Type "subscribe" to start receiving updates.
      `.trim();
    }

    return `
🔕 Unsubscribed Successfully

You'll no longer receive automatic notifications.

Type "subscribe" anytime to reactivate.

💡 You can still ask for energy stats anytime
    `.trim();
  }

  /**
   * Handle Energy Command (NEW - Phase 7)
   * 
   * Shows current energy generation status.
   * Uses Analytics Service.
   */
  private async handleEnergy(): Promise<string> {
    const today = await this.analyticsService.getDailySummary(new Date());

    // Calculate progress to next milestone
    const totalWh = today.totalEnergyKWh * 1000;
    const milestones = [100, 500, 1000, 5000];
    const nextMilestone = milestones.find((m) => m > totalWh) || 5000;
    const progress = ((totalWh / nextMilestone) * 100).toFixed(0);

    return `
⚡ Current Energy Status

📊 Today's Generation
Energy: ${today.totalEnergyKWh.toFixed(3)} kWh
Average Power: ${today.avgPowerW.toFixed(2)} W
Peak Power: ${today.peakPowerW.toFixed(2)} W
Updated: ${new Date().toLocaleTimeString()}

🎯 Next Milestone
${nextMilestone} Wh (${progress}% complete)

💡 Try "today" for full daily report
    `.trim();
  }

  /**
   * Handle Battery Command (NEW - Phase 7)
   * 
   * Shows current battery status.
   * Uses Energy Service to get latest reading.
   */
  private async handleBattery(): Promise<string> {
    try {
      // Get latest reading (this would need to be implemented in EnergyService)
      // For now, return a placeholder response
      return `
🔋 Battery Status

📊 Current Status
Battery Level: Available when sensors are active
Monitoring: Active
Temperature: Check sensor readings

⚡ Power Information
Voltage: Check latest readings
Current: Check latest readings

⏱️ Last Updated: Just now

💡 Try "status" for complete overview
    `.trim();
    } catch (error) {
      return `
🔋 Battery Status

Unable to retrieve battery data at this time.

Your system will display battery status once sensor readings are received.

💡 Try "status" or "help" for other commands
      `.trim();
    }
  }

  /**
   * Handle About Command (NEW - Phase 7)
   * 
   * Shows system information and bot capabilities.
   */
  private async handleAbout(): Promise<string> {
    const subscriberCount =
      await this.subscribersService.getSubscriberCount();

    return `
🌞 EcoStep Energy Monitor

📋 About This System
Platform: Piezoelectric Energy Monitoring
Technology: ESP32 + NestJS + React
Active Subscribers: ${subscriberCount}

✨ Key Features
Real-time energy tracking
Battery monitoring
Daily and weekly reports
Environmental impact analysis
Cost savings calculations
Automated notifications

📞 Need Help?
Type "help" for available commands
Support: admin@energymonitor.com

💡 Built for sustainable energy innovation
    `.trim();
  }

  /**
   * Handle Unknown Command
   * 
   * Response for unrecognized commands.
   */
  private async handleUnknown(command: string): Promise<string> {
    return `
🤔 Sorry, I don't recognize that command.

Try typing one of these:

• help
• status
• battery
• energy

💡 Type "help" to see all available commands
    `.trim();
  }

  /**
   * Send Message to User
   * 
   * Sends message via Facebook Graph API.
   * 
   * @param recipientId - Facebook User ID (PSID)
   * @param messageText - Message text to send
   * @param quickReplies - Optional quick reply buttons
   */
  async sendMessage(
    recipientId: string,
    messageText: string,
    quickReplies?: Array<{ title: string; payload: string }>,
  ): Promise<void> {
    // [TRACE 7: SENDING TO META]
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('[TRACE 7: SENDING TO META] Preparing to send message');
    this.logger.log(`[TRACE 7: SENDING TO META]    Recipient ID: ${recipientId}`);
    this.logger.log(`[TRACE 7: SENDING TO META]    Message length: ${messageText.length} characters`);
    this.logger.log(`[TRACE 7: SENDING TO META]    Message preview: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`);
    this.logger.log(`[TRACE 7: SENDING TO META]    Has quick replies: ${!!quickReplies}`);
    this.logger.log(`[TRACE 7: SENDING TO META]    Quick replies count: ${quickReplies ? quickReplies.length : 0}`);
    
    try {
      const url = `${this.graphApiUrl}/me/messages`;

      const message: any = { text: messageText };

      // Add quick replies if provided
      if (quickReplies && quickReplies.length > 0) {
        message.quick_replies = quickReplies.map((qr) => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.payload,
        }));
        this.logger.log(`[TRACE 7: SENDING TO META]    Quick reply titles: ${quickReplies.map(qr => qr.title).join(', ')}`);
      }

      const payload = {
        recipient: { id: recipientId },
        message,
      };

      this.logger.log('[TRACE 7: SENDING TO META] Full payload to Meta:');
      this.logger.log(JSON.stringify(payload, null, 2));
      this.logger.log(`[TRACE 7: SENDING TO META] Sending POST to: ${url}`);

      const response = await axios.post(
        url,
        payload,
        {
          params: { access_token: this.pageAccessToken },
        },
      );

      // [TRACE 8: META RESPONSE]
      this.logger.log('[TRACE 8: META RESPONSE] ═══════════════════════════════════');
      this.logger.log('[TRACE 8: META RESPONSE] ✅ Message sent successfully');
      this.logger.log(`[TRACE 8: META RESPONSE]    HTTP Status: ${response.status} ${response.statusText}`);
      this.logger.log(`[TRACE 8: META RESPONSE]    Recipient ID: ${recipientId}`);
      this.logger.log(`[TRACE 8: META RESPONSE]    Response data: ${JSON.stringify(response.data)}`);
      
    } catch (error) {
      // [TRACE 8: META RESPONSE] - Error case
      this.logger.error('[TRACE 8: META RESPONSE] ═══════════════════════════════════');
      this.logger.error('[TRACE 8: META RESPONSE] ❌ Failed to send message to Meta');
      this.logger.error(`[TRACE 8: META RESPONSE]    Error name: ${error.name}`);
      this.logger.error(`[TRACE 8: META RESPONSE]    Error message: ${error.message}`);
      this.logger.error(`[TRACE 8: META RESPONSE]    Stack trace: ${error.stack}`);
      
      if (error.response) {
        this.logger.error(`[TRACE 8: META RESPONSE]    HTTP Status: ${error.response.status} ${error.response.statusText}`);
        this.logger.error(`[TRACE 8: META RESPONSE]    Response headers: ${JSON.stringify(error.response.headers)}`);
        this.logger.error(`[TRACE 8: META RESPONSE]    Response data: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.request) {
        this.logger.error('[TRACE 8: META RESPONSE]    Request was made but no response received');
      }
      
      throw error;
    }
  }

  /**
   * Send Button Template
   * 
   * Sends a message with interactive buttons.
   * 
   * @param recipientId - Facebook User ID (PSID)
   * @param text - Message text
   * @param buttons - Array of button objects
   */
  async sendButtonTemplate(
    recipientId: string,
    text: string,
    buttons: Array<{ title: string; payload: string }>,
  ): Promise<void> {
    try {
      const url = `${this.graphApiUrl}/me/messages`;

      await axios.post(
        url,
        {
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text,
                buttons: buttons.map((btn) => ({
                  type: 'postback',
                  title: btn.title,
                  payload: btn.payload,
                })),
              },
            },
          },
        },
        {
          params: { access_token: this.pageAccessToken },
        },
      );

      this.logger.log(`Button template sent to ${recipientId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send button template to ${recipientId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Set Persistent Menu
   * 
   * Configures the persistent menu via Messenger Profile API.
   * This should be called once during app initialization.
   */
  async setPersistentMenu(): Promise<void> {
    try {
      const url = `${this.graphApiUrl}/me/messenger_profile`;

      await axios.post(
        url,
        {
          persistent_menu: [
            {
              locale: 'default',
              composer_input_disabled: false,
              call_to_actions: [
                {
                  type: 'postback',
                  title: '📊 System Status',
                  payload: 'status',
                },
                {
                  type: 'postback',
                  title: '⚡ Energy',
                  payload: 'energy',
                },
                {
                  type: 'postback',
                  title: '🔋 Battery',
                  payload: 'battery',
                },
                {
                  type: 'postback',
                  title: '📈 Analytics',
                  payload: 'ANALYTICS_MENU',
                },
                {
                  type: 'postback',
                  title: '🌱 Environmental Impact',
                  payload: 'impact',
                },
                {
                  type: 'postback',
                  title: '⚙️ About EcoStep',
                  payload: 'about',
                },
              ],
            },
          ],
        },
        {
          params: { access_token: this.pageAccessToken },
        },
      );

      this.logger.log('✅ Persistent menu configured successfully');
    } catch (error) {
      this.logger.error(
        `Failed to set persistent menu: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Set Get Started Button
   * 
   * Configures the Get Started button for first-time users.
   */
  async setGetStartedButton(): Promise<void> {
    try {
      const url = `${this.graphApiUrl}/me/messenger_profile`;

      await axios.post(
        url,
        {
          get_started: {
            payload: 'GET_STARTED',
          },
        },
        {
          params: { access_token: this.pageAccessToken },
        },
      );

      this.logger.log('✅ Get Started button configured successfully');
    } catch (error) {
      this.logger.error(
        `Failed to set Get Started button: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Set Greeting Text
   * 
   * Configures the greeting text shown to new users.
   */
  async setGreetingText(): Promise<void> {
    try {
      const url = `${this.graphApiUrl}/me/messenger_profile`;

      await axios.post(
        url,
        {
          greeting: [
            {
              locale: 'default',
              text: 'Welcome to EcoStep! 🌞 Monitor your piezoelectric energy generation in real-time. Click Get Started to begin.',
            },
          ],
        },
        {
          params: { access_token: this.pageAccessToken },
        },
      );

      this.logger.log('✅ Greeting text configured successfully');
    } catch (error) {
      this.logger.error(
        `Failed to set greeting text: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle Natural Language Query
   * 
   * Routes user's natural language message to Gemini AI for processing.
   */
  private async handleNaturalLanguageQuery(senderId: string, userMessage: string): Promise<void> {
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('[AI HANDLER] handleNaturalLanguageQuery() called');
    this.logger.log(`[AI HANDLER]    Sender ID: ${senderId}`);
    this.logger.log(`[AI HANDLER]    User message: "${userMessage}"`);
    this.logger.log(`[AI HANDLER]    Message length: ${userMessage.length} characters`);
    
    try {
      this.logger.log('[AI HANDLER] Calling GeminiAIService.processQuery()...');
      const aiResponse = await this.geminiAIService.processQuery(userMessage);
      
      this.logger.log('[AI HANDLER] ✅ Received AI response');
      this.logger.log(`[AI HANDLER]    Response length: ${aiResponse.length} characters`);
      this.logger.log(`[AI HANDLER]    Response preview: "${aiResponse.substring(0, 100)}..."`);
      
      const quickReplies = [
        { title: 'System Status', payload: 'status' },
        { title: 'Help', payload: 'help' },
        { title: '🏠 Main Menu', payload: 'menu' },
      ];
      
      this.logger.log('[AI HANDLER] Sending AI response to user via sendMessage()...');
      await this.sendMessage(senderId, aiResponse, quickReplies);
      this.logger.log('[AI HANDLER] ✅ AI response sent successfully');
      
    } catch (error) {
      this.logger.error('[AI HANDLER] ═══════════════════════════════════════');
      this.logger.error('[AI HANDLER] ❌ Error in handleNaturalLanguageQuery:');
      this.logger.error(`[AI HANDLER]    Error name: ${error.name}`);
      this.logger.error(`[AI HANDLER]    Error message: ${error.message}`);
      this.logger.error(`[AI HANDLER]    Stack trace: ${error.stack}`);
      this.logger.error('[AI HANDLER] Falling back to handleUnknownCommand()');
      
      await this.handleUnknownCommand(senderId, userMessage);
    }
  }

  /**
   * Get Trend Emoji
   * 
   * Returns emoji for trend direction.
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
