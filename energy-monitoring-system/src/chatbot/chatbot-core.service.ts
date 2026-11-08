import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { EnergyService } from '../energy/energy.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { GeminiAIService } from '../ai/gemini-ai.service';
import { MilestonesService } from '../milestones/milestones.service';
import { Player } from '../players/schemas/player.schema';

/**
 * Channel types for chat processing
 */
export type ChatChannel = 'messenger' | 'web' | 'mobile';

/**
 * Context information for message processing
 */
export interface MessageContext {
  userId: string; // Meta PSID or session ID
  channel: ChatChannel;
  sessionData?: any; // For web channel conversation context
  originalText?: string; // Preserve for AI
  player?: Player; // Optional authenticated guest player
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
 * - Consumes Milestones Service for kinetic energy generation targets & progress
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
    @Inject(forwardRef(() => MilestonesService))
    private readonly milestonesService: MilestonesService,
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
      missions: 'milestones',
      mission: 'milestones',
      learning: 'guide',
      academy: 'milestones',
      progress: 'milestones',
      level: 'milestones',
      xp: 'milestones',
      badges: 'milestones',
      rank: 'milestones',
      milestones: 'milestones',
      milestone: 'milestones',
      goals: 'milestones',
      goal: 'milestones',
      targets: 'milestones',
      target: 'milestones',
      guide: 'guide',
      ecoguide: 'guide',
      learn: 'guide',
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
      'milestones',
      'guide',
    ];

    if (informationalCommands.includes(command)) {
      return this.handleInformationalCommand(command, context);
    }

    // Handle natural language with AI
    if (this.geminiAIService.isAvailable()) {
      return this.handleNaturalLanguage(originalMessage, context);
    }

    // Even if AI provider is offline, handle recognized EcoStep intents gracefully
    const detectedIntent = this.detectIntent(originalMessage);
    if (detectedIntent !== 'general') {
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

      case 'milestones':
      case 'missions':
      case 'progress':
        return this.handleMilestones();

      case 'guide':
        return this.handleGuide();

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
   * Fetches relevant EcoStep data and provides it to the AI
   * for grounded, context-aware responses
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
      // 1. Guardrail Check: Enforce EcoStep domain boundary, no keys, no backend code, no unrelated trivia, no unrelated math
      const scopeCheck = this.checkEcoStepScope(message);
      if (!scopeCheck.allowed && scopeCheck.refusal) {
        this.logger.log(`Query intercepted by EcoStep scope guardrail: "${message.substring(0, 50)}"`);
        return scopeCheck.refusal;
      }

      // Determine what data to fetch based on message intent
      const intent = this.detectIntent(message);
      const dataContext = await this.buildDataContext(intent, context);

      // Build enriched prompt with EcoStep data
      const enrichedPrompt = this.buildEnrichedPrompt(
        message,
        dataContext,
        intent,
        context,
      );

      // Query AI with EcoChat context enabled
      const aiResponse = await this.geminiAIService.processQuery(
        enrichedPrompt,
        true, // Enable EcoChat system instructions
      );

      // Handle null response from AI
      if (!aiResponse) {
        this.logger.warn('AI service returned null, using graceful fallback');
        return this.getGracefulFallback(message, intent, context, dataContext);
      }

      return {
        text: aiResponse,
        suggestions: this.getSuggestionsForIntent(intent),
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
      const intent = this.detectIntent(message);
      return this.getGracefulFallback(message, intent, context, {});
    }
  }

  /**
   * Graceful intelligent fallback when AI is temporarily unavailable or returns null
   * Enforces 1–3 concise sentences (30–60 words) and direct answers.
   */
  private getGracefulFallback(
    message: string,
    intent: string,
    context: MessageContext,
    dataContext: any,
  ): ChatbotResponse {
    if (intent === 'greeting') {
      return {
        text: `Hey there! 👋 I'm EcoGuide, your energy and physics companion. Ready to explore footstep kinetic harvesting and milestone goals whenever you are!`,
        suggestions: ['status', 'energy', 'milestones', 'guide'],
      };
    }

    if (intent === 'milestones_query') {
      const ms = dataContext?.milestones;
      if (ms?.monthlyMilestone) {
        const m = ms.monthlyMilestone;
        const target = m.targetMWh?.toFixed(3) || '0.100';
        const current = m.currentMWh?.toFixed(3) || '0.000';
        const pct = m.progressPercentage?.toFixed(1) || '0.0';
        const label = ms.monthLabel || 'this month';
        if (m.isAchieved) {
          return {
            text: `🎉 Milestone achieved for ${label}! We've reached ${current} mWh, surpassing our ${target} mWh goal. Keep walking to set new records!`,
            suggestions: ['milestones', 'today', 'status'],
          };
        }
        return {
          text: `For ${label}, our milestone goal is ${target} mWh. We've harvested ${current} mWh so far (${pct}% achieved). Every footstep counts!`,
          suggestions: ['milestones', 'today', 'status'],
        };
      }
      return {
        text: `Milestone goals track our weekly and monthly clean energy harvest. Check out 'milestones' for current targets and progress!`,
        suggestions: ['milestones', 'today', 'status'],
      };
    }

    if (intent === 'deprecated_missions') {
      return {
        text: `EcoStep has retired missions and XP in favor of real-world Milestone Goals! We now track weekly and monthly kinetic generation targets from actual footsteps.`,
        suggestions: ['milestones', 'status', 'guide'],
      };
    }

    if (intent === 'current_status' || intent === 'energy_query') {
      const stats = dataContext?.todayStats;
      if (stats && stats.readingCount > 0) {
        const mWh = stats.totalEnergyMWh?.toFixed(2) || '0.00';
        return {
          text: `Today's harvest is sitting at ${mWh} mWh across ${stats.readingCount} steps. Keep walking and let's bank some more power!`,
          suggestions: ['today', 'energy', 'help'],
        };
      }
      return {
        text: `Today's energy total is 0 mWh—the tiles are awake and ready, but nobody's walked on them yet today. Time to get some steps in!`,
        suggestions: ['today', 'energy', 'help'],
      };
    }

    const lower = message.toLowerCase();
    if (lower.includes('1 mw') || lower.includes('1mw') || lower.includes('milliwatt')) {
      return {
        text: `1 milliwatt (1 mW) is 0.001 Watts—a micro-scale energy amount! Single footsteps add up fast like coins in a piggy bank to power clean sensors without batteries.`,
        suggestions: ['energy', 'status', 'guide'],
      };
    }

    if (
      lower.includes('difference between power and energy') ||
      (lower.includes('power') && lower.includes('energy'))
    ) {
      return {
        text: `Power ($P = V \\times I$, in Watts or mW) is how fast energy is flowing right this second, like water pouring from a tap. Energy ($E = P \\times t$, in mWh or Joules) is the total amount you've actually collected over time, like the water filling up your glass or charging your phone battery!`,
        suggestions: ['energy', 'status', 'guide'],
      };
    }

    return {
      text: `I'm having a brief connection hiccup reaching my AI brain, but I'm still here! Feel free to ask about energy, milestone goals, or check 'status' anytime.`,
      suggestions: ['status', 'energy', 'milestones', 'help'],
    };
  }

  /**
   * Check if query is within EcoStep scope and complies with security/content restrictions
   *
   * Enforces:
   * 1. No requests for API keys, secrets, tokens, credentials, or environment variables
   * 2. No coding questions related to codebase, backend, schemas, or programming
   * 3. No unrelated trivia, politics, public figures, or "who is who" questions
   * 4. No math equations unless directly related to EcoStep energy/power calculations
   */
  public checkEcoStepScope(message: string): {
    allowed: boolean;
    refusal?: ChatbotResponse;
  } {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check for Keys, Secrets, Credentials, and Environment Variables
    const keyPatterns = [
      /\b(?:api[_\s-]?keys?|secret[_\s-]?keys?|jwt[_\s-]?secrets?|private[_\s-]?keys?)\b/i,
      /\b(?:passwords?|credentials?|auth[_\s-]?tokens?|access[_\s-]?tokens?)\b/i,
      /\b(?:\.env|env(?:ironment)?\s*(?:files?|vars?|variables?))\b/i,
      /\b(?:gemini[_\s-]?api[_\s-]?key|groq[_\s-]?api[_\s-]?key|iot[_\s-]?api[_\s-]?key|mongodb[_\s-]?uri)\b/i,
      /\b(?:give|show|reveal|display|tell|print|what\s+is|what're|get)\b.*\b(?:keys?|secrets?|tokens?|passwords?|credentials?)\b/i,
    ];

    if (keyPatterns.some((pattern) => pattern.test(lower))) {
      return {
        allowed: false,
        refusal: {
          text: '🔒 For security reasons, I cannot disclose any API keys, credentials, secrets, or internal configurations. I can only assist with questions regarding the EcoStep energy harvesting system.',
          suggestions: ['status', 'energy', 'help'],
          metadata: {
            commandType: 'security_restriction',
            dataSource: 'guardrail',
          },
        },
      };
    }

    // 2. Check for Coding, Programming, or Backend Inquiries
    const codePatterns = [
      /\b(?:source\s*code|backend\s*code|frontend\s*code|codebase|repository|repo|github)\b/i,
      /\b(?:show|write|give|generate|explain|display)\s+(?:me\s+)?(?:the\s+|a\s+|an\s+)?(?:[a-z0-9_-]+\s+)?(?:code|script|function|class|program|algorithm|query|controller|service|endpoint)\b/i,
      /\b(?:nestjs|express|mongodb|mongoose|postgres|mysql|sqlite|prisma|typeorm)\b/i,
      /\b(?:database|db)\s+(?:schema|model|table|collection|structure)\b/i,
      /\b(?:schema|model)\s+for\s+(?:database|mongodb|mongoose|db)\b/i,
      /\b(?:python|javascript|typescript|java|c\+\+|golang|rust|php|bash|powershell|sql|html|css)\s+(?:code|script|program|function|file)\b/i,
      /\b(?:how\s+is\s+(?:the\s+)?(?:backend|frontend|code|controller|service|api|database)\s+(?:coded|implemented|written|structured|built))\b/i,
      /\b(?:debug|fix|write|refactor)\s+(?:my|this|a|the)\s+(?:code|script|program|function|bug)\b/i,
      /\b(?:backend|frontend|server)\s+(?:implementation|architecture|logic|files?)\b/i,
    ];

    if (codePatterns.some((pattern) => pattern.test(lower))) {
      return {
        allowed: false,
        refusal: {
          text: '💻 I cannot answer coding, programming, or backend implementation questions. I am exclusively designed to help you monitor and understand EcoStep\'s footstep energy generation and dashboard metrics.',
          suggestions: ['status', 'today', 'help'],
          metadata: {
            commandType: 'code_restriction',
            dataSource: 'guardrail',
          },
        },
      };
    }

    // 3. Check for Unrelated People, Presidents, Politics, and General Trivia ("who is who")
    // Allow questions asking about EcoStep, EcoGuide, Milestone goals, or educational physics (e.g. Pierre & Jacques Curie, PZT)
    const isAllowedTopic =
      lower.includes('ecostep') ||
      lower.includes('ecochat') ||
      lower.includes('ecoguide') ||
      lower.includes('milestone') ||
      lower.includes('goal') ||
      lower.includes('target') ||
      lower.includes('curie') ||
      lower.includes('jacques') ||
      lower.includes('pierre') ||
      lower.includes('piezo') ||
      lower.includes('piezoelectric') ||
      lower.includes('footstep') ||
      lower.includes('harvest') ||
      lower.includes('mission') ||
      lower.includes('quiz') ||
      lower.includes('badge') ||
      lower.includes('level') ||
      lower.includes('xp') ||
      lower.includes('energy') ||
      lower.includes('power') ||
      lower.includes('voltage') ||
      lower.includes('current') ||
      lower.includes('who are you') ||
      lower.includes('what are you');

    if (!isAllowedTopic) {
      const unrelatedPeopleTriviaPatterns = [
        /\bwho\s+is\s+(?:the\s+)?(?:current\s+)?(?:president|vice\s*president|prime\s*minister|governor|mayor|king|queen|senator|leader|ceo|founder)\b/i,
        /\bwho\s+is\s+who\b/i,
        /\bwho\s+is\s+[a-z]+/i,
        /\bwho\s+was\s+[a-z]+/i,
        /\bwho\s+are\s+[a-z]+/i,
        /\b(?:who\s+won|who\s+invented|who\s+discovered)\b/i,
        /\b(?:what\s+is\s+the\s+capital\s+of|tell\s+me\s+a\s+(?:joke|story|poem)|how\s+to\s+cook|recipe\s+for|weather\s+in)\b/i,
        /\b(?:politics|presidential|election|democrat|republican|celebrity|hollywood|movie|song|actor|actress)\b/i,
      ];

      if (unrelatedPeopleTriviaPatterns.some((pattern) => pattern.test(lower))) {
        return {
          allowed: false,
          refusal: {
            text: '🌿 I am EcoGuide, the learning and energy assistant for EcoStep. I can answer questions related to the EcoStep kinetic energy harvesting system, piezoelectric physics, electrical formulas, and milestone energy goals. How can I assist you with EcoStep today?',
            suggestions: ['status', 'milestones', 'guide'],
            metadata: {
              commandType: 'trivia_restriction',
              dataSource: 'guardrail',
            },
          },
        };
      }
    }

    // 4. Check for Math Equations
    // Math is permitted ONLY if it's related to EcoStep calculation concepts
    const ecostepCalculationTerms = [
      'ecostep',
      'ecoguide',
      'energy',
      'power',
      'watt',
      'watts',
      'w',
      'mw',
      'milliwatt',
      'milliwatts',
      'kw',
      'kilowatt',
      'kilowatts',
      'wh',
      'mwh',
      'kwh',
      'watt-hour',
      'watthour',
      'milliwatt-hour',
      'volt',
      'volts',
      'v',
      'mv',
      'millivolt',
      'amp',
      'amps',
      'a',
      'ma',
      'milliamp',
      'milliamps',
      'step',
      'steps',
      'footstep',
      'footsteps',
      'tile',
      'tiles',
      'piezo',
      'piezoelectric',
      'battery',
      'joule',
      'joules',
      'j',
      'harvest',
      'harvesting',
      'kinetic',
      'generation',
      'reading',
      'readings',
      'formula',
      'formulas',
      'ohm',
      'ohms',
      'resistance',
      'resistor',
      'capacitor',
      'capacitance',
      'farad',
      'rectifier',
      'pzt',
      'efficiency',
      'work',
    ];

    const hasEcoStepTerm = ecostepCalculationTerms.some((term) =>
      new RegExp(`\\b${term}\\b`, 'i').test(lower),
    );

    const mathPatterns = [
      /\b(?:solve|evaluate|simplify)\b.*\b(?:equation|integral|derivative|algebra|polynomial|fraction|math)\b/i,
      /\b(?:solve|calculate|compute|what\s+is)\s+[\d\s\+\-\*\/\^\(\)\=\.xXyYzZ]{3,}\b/i,
      /^\s*(?:what\s+is\s+)?\d+\s*[\+\-\*\/xX\^]\s*\d+\s*\??\s*$/i,
      /\b\d+x\s*[\+\-]\s*\d+\s*\=/i,
      /\b(?:solve\s+for\s+[a-z])\b/i,
    ];

    if (mathPatterns.some((pattern) => pattern.test(lower)) && !hasEcoStepTerm) {
      return {
        allowed: false,
        refusal: {
          text: '⚡ I can only assist with math calculations directly related to EcoStep metrics and electrical physics (such as calculating power $P = V \\times I$, voltage, current, and energy $E = P \\times t$).',
          suggestions: ['energy', 'status', 'help'],
          metadata: {
            commandType: 'math_restriction',
            dataSource: 'guardrail',
          },
        },
      };
    }

    return { allowed: true };
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): string {
    const trimmed = message.trim();
    const lowerMessage = trimmed.toLowerCase();

    // 1. Greeting or test message
    const isGreeting =
      /^(hello|hi|hey|howdy|sup|greetings|good\s+(morning|afternoon|evening))\b/i.test(trimmed) ||
      /\b(hello\s+test|test\s+message|hello\s+there)\b/i.test(trimmed) ||
      lowerMessage === 'test' ||
      lowerMessage === 'test!' ||
      lowerMessage === 'testing' ||
      lowerMessage === 'testing!' ||
      lowerMessage === 'hello world';

    if (isGreeting) {
      return 'greeting';
    }

    // 2. Milestones & Goals Query
    if (
      lowerMessage.includes('milestone') ||
      lowerMessage.includes('milestones') ||
      lowerMessage.includes('goal') ||
      lowerMessage.includes('goals') ||
      lowerMessage.includes('target') ||
      lowerMessage.includes('targets') ||
      lowerMessage.includes('on track') ||
      lowerMessage.includes('how close') ||
      lowerMessage.includes('how much energy left') ||
      lowerMessage.includes('reach the goal') ||
      lowerMessage.includes('achieve the goal') ||
      lowerMessage.includes('monthly goal') ||
      lowerMessage.includes('weekly goal') ||
      lowerMessage.includes('milestone progress') ||
      lowerMessage.includes('goal progress') ||
      lowerMessage.includes('target progress') ||
      /\b(milestone|milestones|goal|goals|target|targets)\b/i.test(lowerMessage)
    ) {
      return 'milestones_query';
    }

    // 3. Deprecated missions / XP query
    if (
      lowerMessage.includes('mission') ||
      lowerMessage.includes('missions') ||
      lowerMessage.includes('my xp') ||
      lowerMessage.includes('how much xp') ||
      lowerMessage.includes('how many xp') ||
      lowerMessage.includes('my points') ||
      lowerMessage.includes('my level') ||
      lowerMessage.includes('what level') ||
      lowerMessage.includes('what is my level') ||
      lowerMessage.includes('next level') ||
      lowerMessage.includes('badge') ||
      lowerMessage.includes('badges') ||
      lowerMessage.includes('quiz') ||
      /\b(how much xp|what level am i|what mission|complete next)\b/i.test(lowerMessage)
    ) {
      return 'deprecated_missions';
    }

    // 5. Educational physics & concepts
    if (
      lowerMessage.includes('1 mw') ||
      lowerMessage.includes('1mw') ||
      lowerMessage.includes('milliwatt') ||
      lowerMessage.includes('difference between power and energy') ||
      lowerMessage.includes('power and energy') ||
      lowerMessage.includes('power vs energy') ||
      lowerMessage.includes('piezo') ||
      lowerMessage.includes('curie') ||
      lowerMessage.includes('formula') ||
      lowerMessage.includes('formulas') ||
      lowerMessage.includes('ohm') ||
      lowerMessage.includes('dipole') ||
      lowerMessage.includes('kinetic') ||
      lowerMessage.includes('harvesting') ||
      lowerMessage.includes('rectifier') ||
      lowerMessage.includes('capacitor') ||
      lowerMessage.includes('storage') ||
      lowerMessage.includes('architecture') ||
      lowerMessage.includes('difference between') ||
      lowerMessage.includes('what does power generation mean') ||
      lowerMessage.includes('how does piezoelectricity work') ||
      lowerMessage.includes('how do footsteps') ||
      lowerMessage.includes('how does footstep')
    ) {
      return 'educational_physics';
    }

    // Current status / latest readings
    if (
      lowerMessage.includes('latest') ||
      lowerMessage.includes('current') ||
      lowerMessage.includes('status') ||
      lowerMessage.includes('now') ||
      lowerMessage.includes('right now')
    ) {
      return 'current_status';
    }

    // Dashboard guidance
    if (
      lowerMessage.includes('dashboard') ||
      lowerMessage.includes('how do i read') ||
      lowerMessage.includes('how to read') ||
      lowerMessage.includes('understand the')
    ) {
      return 'dashboard_help';
    }

    // Historical / today's data
    if (
      lowerMessage.includes('today') ||
      lowerMessage.includes('this week') ||
      lowerMessage.includes('this month') ||
      lowerMessage.includes('history') ||
      lowerMessage.includes('summary')
    ) {
      return 'historical';
    }

    // Power-related
    if (
      lowerMessage.includes('power') ||
      lowerMessage.includes('watt')
    ) {
      return 'power_query';
    }

    // Energy-related
    if (
      lowerMessage.includes('energy') ||
      lowerMessage.includes('generation')
    ) {
      return 'energy_query';
    }

    // Steps
    if (
      lowerMessage.includes('step') ||
      lowerMessage.includes('footstep')
    ) {
      return 'steps_query';
    }

    // Voltage/Current
    if (
      lowerMessage.includes('voltage') ||
      lowerMessage.includes('current') ||
      lowerMessage.includes('volt') ||
      lowerMessage.includes('amp')
    ) {
      return 'electrical_query';
    }

    // General question
    return 'general';
  }

  /**
   * Build data context based on intent and optional player session
   */
  private async buildDataContext(
    intent: string,
    context?: MessageContext,
  ): Promise<any> {
    try {
      const dataContext: any = {};

      // 1. Authoritative Milestones & Goals Context
      try {
        dataContext.milestones = await this.milestonesService.getMilestonesProgress();
      } catch (mErr) {
        this.logger.warn(`Failed to fetch milestone goals: ${mErr.message}`);
      }

      // 2. Telemetry and Analytics Context
      // For almost all queries, include latest readings and today's telemetry stats
      const latestReadings = await this.energyService.getRecentReadings(1);
      dataContext.latestReading = latestReadings[0] || null;
      dataContext.todayStats = await this.energyService.getTodayRawStatistics();

      // For historical queries, also fetch detailed breakdown
      if (intent === 'historical') {
        dataContext.todayDetailed = await this.energyService.getTodayDetailedStats();
      }

      return dataContext;
    } catch (error) {
      this.logger.error('Failed to build data context', error);
      return {};
    }
  }

  /**
   * Build enriched prompt with EcoStep data, educational curriculum, and player progress
   */
  private buildEnrichedPrompt(
    message: string,
    dataContext: any,
    intent: string,
    context?: MessageContext,
  ): string {
    let prompt = `User Query: "${message}"\nDetected Intent: ${intent}\n\n`;

    // 1. Conversation History (if available from session)
    if (
      context?.sessionData &&
      Array.isArray(context.sessionData) &&
      context.sessionData.length > 0
    ) {
      const history = context.sessionData.slice(-4);
      prompt += `**Recent Conversation Context:**\n`;
      for (const item of history) {
        if (item && item.text && item.text !== message) {
          prompt += `- ${item.role === 'user' ? 'User' : 'EcoGuide'}: "${item.text}"\n`;
        }
      }
      prompt += `(Use this context to maintain flow and avoid repeating explanations)\n\n`;
    }

    // 2. Intent-Specific Guidance & Data
    if (intent === 'greeting') {
      prompt += `**Special Directive for Greeting / Test Message:**\n`;
      prompt += `- The user is saying hello or testing the connection.\n`;
      prompt += `- Respond warmly, briefly, and with a touch of wit as EcoGuide in 1-2 conversational sentences.\n`;
      prompt += `- DO NOT list levels, XP, missions, formulas, or raw data unsolicited.\n`;
      prompt += `- Invite them to ask about footstep kinetic energy, electrical physics, or milestone goals whenever they are ready.\n\n`;
    } else if (intent === 'milestones_query') {
      prompt += `**Milestones & Energy Goals Context:**\n`;
      if (dataContext.milestones) {
        const ms = dataContext.milestones;
        const m = ms.monthlyMilestone;
        prompt += `- Current Month: ${ms.monthLabel || 'Current Month'} (${ms.yearMonth})\n`;
        prompt += `- Monthly Target: ${m?.targetMWh?.toFixed(3) || '0.100'} mWh (${m?.targetWh?.toFixed(6) || '0.000100'} Wh)\n`;
        prompt += `- Monthly Harvested So Far: ${m?.currentMWh?.toFixed(3) || '0.000'} mWh (${m?.progressPercentage?.toFixed(1) || '0.0'}% of goal)\n`;
        prompt += `- Monthly Goal Achieved: ${m?.isAchieved ? 'YES (Goal met!)' : 'Not yet (In progress)'}\n`;
        prompt += `- Steps Counted This Month: ${m?.stepCount || 0} steps\n`;

        const activeWeek = (ms.weeklyMilestones || []).find((w: any) => w.state === 'CURRENT') || ms.weeklyMilestones?.[0];
        if (activeWeek) {
          prompt += `- Active Week: ${activeWeek.label} (${activeWeek.dayRangeLabel})\n`;
          prompt += `- Weekly Target: ${activeWeek.targetMWh?.toFixed(3) || '0.025'} mWh\n`;
          prompt += `- Weekly Harvested: ${activeWeek.currentMWh?.toFixed(3) || '0.000'} mWh (${activeWeek.progressPercentage?.toFixed(1) || '0.0'}%)\n`;
          prompt += `- Weekly Goal Achieved: ${activeWeek.isAchieved ? 'YES' : 'Not yet'}\n`;
        }
        prompt += `- All-Time Generation: ${ms.allTimeEnergyMWh?.toFixed(3) || '0.000'} mWh across ${ms.allTimeSteps || 0} total footsteps\n`;
        if (m?.realWorldEquivalents?.comparisonText) {
          prompt += `- Real-World Impact: ${m.realWorldEquivalents.comparisonText}\n`;
        }
      }
      prompt += `- Directive: Answer the user's question about milestones or targets directly and accurately using these numbers. Be punchy, witty, and encouraging. If achieved, celebrate! If in progress, cheer them on to step on the tiles.\n\n`;
    } else if (intent === 'deprecated_missions') {
      prompt += `**Missions & XP Deprecated Directive:**\n`;
      prompt += `- The user is asking about gamified missions, XP, levels, or badges.\n`;
      prompt += `- Directive: Warmly and clearly explain that EcoStep has retired the gamified missions and XP system in favor of real-world **Milestone Goals** that track weekly and monthly kinetic energy generation from actual footsteps. If relevant, mention this month's energy target.\n\n`;
    }

    const wantsDetail = /\b(explain in detail|detailed|elaborate|deep dive|comprehensive|full explanation|in depth|step by step)\b/i.test(message);

    if (wantsDetail) {
      prompt += `**User Requested Deep Explanation:** The user explicitly requested an in-depth explanation. Provide a thorough, well-structured explanation while keeping the concepts accessible.\n\n`;
    } else {
      prompt += `**STRICT LENGTH RULE (MANDATORY):**\n`;
      prompt += `- Respond in strictly 1–3 short sentences (around 30–60 words total).\n`;
      prompt += `- Answer the user's specific question or state the single most relevant data point FIRST.\n`;
      prompt += `- Include at most ONE simple analogy or explanation.\n`;
      prompt += `- Do NOT narrate every sensor reading or explain multiple concepts at once.\n`;
      prompt += `- Do NOT end with a question or call to action unless specifically relevant.\n\n`;
    }

    // 3. Telemetry Grounding (distinguish actual measurements from hypothetical)
    if (dataContext.todayStats && dataContext.todayStats.readingCount > 0) {
      const stats = dataContext.todayStats;
      const mWh = stats.totalEnergyMWh?.toFixed(2) || '0.00';
      const steps = stats.readingCount || 0;
      prompt += `**Telemetry Context (Today's Key Metric):**\n`;
      prompt += `- Total Energy: ${mWh} mWh across ${steps} footstep events.\n`;
      if (dataContext.latestReading) {
        const r = dataContext.latestReading;
        const pMw = (((r.powerW ?? r.power ?? 0) * 1000)).toFixed(1);
        prompt += `- Latest Power Spike: ${pMw} mW\n`;
      }
      prompt += `- Directive: Mention ONLY the single most relevant measurement (e.g. today's energy or recent spike) in 1 sentence with an encouraging observation. Do NOT narrate all voltage, current, and step fields.\n\n`;
    } else {
      prompt += `**Telemetry Context (No Readings Yet):**\n`;
      prompt += `- Today's readings: 0 mWh (tiles in standby, waiting for footsteps).\n`;
      prompt += `- Directive: If asked about generation or status right now, be witty and straightforward: state that tiles are active and ready, but nobody has stepped on them yet today. Keep it punchy and relatable. Do NOT use odometer or car analogies.\n\n`;
    }

    // 4. Core Educational Science Reference (Use at most ONE per response)
    prompt += `**Core Physics Reference (Use at most ONE per response):**\n`;
    prompt += `- Power: Power = Voltage × Current ($P = V \\times I$, Watts or mW)—flow rate in the moment (like water pouring from a tap).\n`;
    prompt += `- Energy: Energy = Power × Time ($E = P \\times t$, mWh or Joules)—total work collected over time (like water filling a glass or charging a battery).\n`;
    prompt += `- 1 mW ($0.001\\text{ W}$): Micro-power scale typical of kinetic pulses; footsteps store up in capacitors to run clean IoT sensors.\n`;
    prompt += `- Piezoelectric effect (Curie brothers, 1880): Compressing crystal lattices (PZT ceramic) generates potential difference.\n\n`;

    // 5. EcoGuide Persona Directives
    prompt += `**EcoGuide Persona & Directives:**\n`;
    prompt += `1. Personality: Witty, sharp, and straightforward. Answer the user's specific question FIRST with zero filler.\n`;
    prompt += `2. Formula Presentation: Always format formulas so they are clearly understandable to anyone—pair words and symbols like "Power = Voltage × Current ($P = V \\times I$)". Never output raw unrendered LaTeX commands like "\\times" in plain text.\n`;
    prompt += `3. Relatable analogies ONLY: NEVER use obscure metaphors (NO odometers, NO complex machinery). If comparing, use everyday modern things like phone battery percentage, steps on your smartwatch, or charging earbuds.\n`;
    prompt += `4. Default Length: 1–3 short, punchy sentences (~25–50 words) unless user explicitly requested detail.\n`;
    prompt += `5. Milestones & Goals Grounding: Report the authoritative targets and progress percentages provided in the context; never fabricate numbers.\n`;
    prompt += `6. Do NOT end every response with a question or call to action.\n`;

    return prompt;
  }

  /**
   * Get relevant suggestions based on intent
   */
  private getSuggestionsForIntent(intent: string): string[] {
    switch (intent) {
      case 'greeting':
        return ['status', 'energy', 'milestones', 'guide'];
      case 'milestones_query':
        return ['today', 'status', 'energy', 'help'];
      case 'deprecated_missions':
        return ['milestones', 'status', 'guide'];
      case 'educational_physics':
        return ['energy', 'status', 'milestones', 'guide'];
      case 'current_status':
        return ['today', 'energy', 'milestones', 'help'];
      case 'dashboard_help':
        return ['status', 'energy', 'milestones', 'today'];
      case 'historical':
        return ['week', 'month', 'milestones', 'status'];
      case 'power_query':
      case 'energy_query':
        return ['today', 'battery', 'milestones', 'status'];
      case 'steps_query':
        return ['energy', 'today', 'milestones', 'status'];
      case 'electrical_query':
        return ['status', 'energy', 'help'];
      default:
        return ['milestones', 'status', 'guide'];
    }
  }

  /**
   * OLD Handle natural language - REPLACED ABOVE
   * 
   * Delegates to data-enriched and guarded handleNaturalLanguage
   */
  private async handleNaturalLanguageOld(
    message: string,
    context: MessageContext,
  ): Promise<ChatbotResponse> {
    return this.handleNaturalLanguage(message, context);
  }

  /**
   * Handle Welcome Message
   */
  private async handleWelcome(): Promise<ChatbotResponse> {
    return {
      text: `👋 Hey there! Welcome to EcoGuide—your companion for kinetic energy, piezoelectric physics, and milestone energy goals. What would you like to explore today?`,
      suggestions: ['status', 'milestones', 'guide', 'help'],
    };
  }

  /**
   * Handle Help Command
   */
  private async handleHelp(): Promise<ChatbotResponse> {
    return {
      text: `🌿 **EcoGuide Learning & Energy Assistant**\n\nHere is what you can ask me:\n\n🎯 **Milestones & Goals**\n• Milestones — View current monthly & weekly generation targets and progress\n• Guide — Learn piezoelectric physics & electrical formulas\n\n📊 **Energy Monitoring**\n• Status — Real-time power and overall stats\n• Energy — Generation metrics and readings\n• Battery — Energy storage and status\n\n📈 **Analytics**\n• Today — Today's energy summary\n• Week / Month — Extended generation trends\n• Peak — Peak power performance\n\n🌱 **Environmental Impact**\n• Impact — CO₂ avoided & tree equivalents\n• Savings — Estimated electricity cost savings\n\n💡 *Try asking: "What is our milestone goal this month?" or "How close are we to this week's target?"*`,
      suggestions: ['milestones', 'status', 'energy', 'guide'],
    };
  }

  /**
   * Handle Milestones Command
   * Displays monthly & weekly kinetic energy goals, target mWh, current generation, and progress
   */
  private async handleMilestones(): Promise<ChatbotResponse> {
    try {
      const data = await this.milestonesService.getMilestonesProgress();
      const m = data.monthlyMilestone;
      const monthProgress = m?.progressPercentage ? m.progressPercentage.toFixed(1) : '0.0';
      const monthTarget = m?.targetMWh !== undefined ? m.targetMWh.toFixed(3) : '0.100';
      const monthCurrent = m?.currentMWh !== undefined ? m.currentMWh.toFixed(3) : '0.000';
      const monthStatus = m?.isAchieved ? '✅ Target Achieved!' : `${monthProgress}% achieved`;

      // Find active/current week
      const currentWeek =
        (data.weeklyMilestones || []).find((w) => w.state === 'CURRENT') ||
        data.weeklyMilestones?.[0];

      let text = `🎯 **EcoStep Milestone Goals (${data.monthLabel})**\n\n`;
      text += `📅 **Monthly Goal:**\n`;
      text += `• Target: **${monthTarget} mWh**\n`;
      text += `• Harvested: **${monthCurrent} mWh** (${monthStatus})\n`;
      text += `• Steps Counted: **${(m?.stepCount || 0).toLocaleString()} steps**\n\n`;

      if (currentWeek) {
        const weekProgress = currentWeek.progressPercentage ? currentWeek.progressPercentage.toFixed(1) : '0.0';
        const weekTarget = currentWeek.targetMWh !== undefined ? currentWeek.targetMWh.toFixed(3) : '0.025';
        const weekCurrent = currentWeek.currentMWh !== undefined ? currentWeek.currentMWh.toFixed(3) : '0.000';
        const weekStatus = currentWeek.isAchieved ? '✅ Target Achieved!' : `${weekProgress}% achieved`;

        text += `📆 **${currentWeek.label} (${currentWeek.dayRangeLabel}):**\n`;
        text += `• Target: **${weekTarget} mWh**\n`;
        text += `• Harvested: **${weekCurrent} mWh** (${weekStatus})\n`;
        text += `• Steps Counted: **${(currentWeek.stepCount || 0).toLocaleString()} steps**\n\n`;
      }

      text += `⚡ **All-Time Generation:** ${(data.allTimeEnergyMWh || 0).toFixed(3)} mWh (${(data.allTimeSteps || 0).toLocaleString()} total steps)\n`;

      if (m?.realWorldEquivalents?.comparisonText) {
        text += `🌱 **Impact:** ${m.realWorldEquivalents.comparisonText}\n`;
      }

      text += `\n💡 *Tip: Every footstep on the kinetic tiles adds clean energy toward our milestone goals!*`;

      return {
        text,
        suggestions: ['today', 'status', 'energy', 'help'],
        metadata: {
          commandType: 'milestones',
          dataSource: 'milestones_service',
        },
      };
    } catch (error) {
      this.logger.error('Failed to retrieve milestone goals', error);
      return {
        text: 'Milestone goals are temporarily unavailable. Please try again shortly.',
        suggestions: ['status', 'help'],
      };
    }
  }

  /**
   * Handle Guide Command
   * Explains educational concepts covered by EcoGuide
   */
  private async handleGuide(): Promise<ChatbotResponse> {
    return {
      text: `🌿 **EcoGuide — Your EcoStep Learning Assistant**\n\nI am here to help you master clean kinetic energy concepts:\n\n• ⚡ **Piezoelectricity:** How mechanical compression of crystal dipoles (PZT ceramics) generates electrical potential.\n• 📐 **Electrical Formulas:**\n  - Power: $P = V \\times I$ (Watts = Volts × Amperes)\n  - Energy: $E = P \\times t$ (Joules or Watt-hours)\n  - Ohm's Law: $V = I \\times R$\n• 🛠️ **EcoStep Architecture:** Kinetic footstep tiles ➔ Bridge Rectifier (AC to DC) ➔ Smoothing Capacitor / Storage ➔ ESP32 / PZEM Sensors ➔ Real-time Dashboard.\n• 🎯 **Milestone Goals:** Tracking real-time progress toward weekly and monthly kinetic generation targets set by administrators.\n\nAsk me anything! For example:\n- *"How does a piezoelectric tile generate electricity?"*\n- *"What is our milestone goal this month?"*\n- *"How close are we to this week's target?"*`,
      suggestions: ['milestones', 'status', 'energy'],
      metadata: {
        commandType: 'guide',
        dataSource: 'system',
      },
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

      const text = `📊 Energy System Status\n\n🌞 Today\nEnergy Generated: ${analytics.today.totalEnergyKWh.toFixed(3)} mWh\nAverage Power: ${analytics.today.avgPowerW.toFixed(2)} W\nPeak Power: ${analytics.today.peakPowerW.toFixed(2)} W\n\n📅 This Week\nEnergy Generated: ${analytics.thisWeek.totalEnergyKWh.toFixed(3)} mWh\nTotal Readings: ${analytics.thisWeek.readingCount}\n\n📆 This Month\nEnergy Generated: ${analytics.thisMonth.totalEnergyKWh.toFixed(3)} mWh\nActive Days: ${analytics.thisMonth.daysWithData} of ${analytics.thisMonth.daysInMonth}\n\n⚡ Peak Performance\n${analytics.peakGeneration ? `${analytics.peakGeneration.peakPowerW.toFixed(2)} W on ${analytics.peakGeneration.date} at ${analytics.peakGeneration.time}` : 'No peak data available yet'}\n\n🌳 Environmental Impact\nCO₂ Avoided: ${analytics.environmentalImpact.co2AvoidedKg.toFixed(2)} kg\nTree Equivalent: ${analytics.environmentalImpact.treesEquivalent.toFixed(1)} trees/year\n\n💰 Cost Savings\nThis Month: $${analytics.costSavings.totalSavings.toFixed(2)}\nProjected Yearly: $${analytics.costSavings.yearlyProjectedSavings.toFixed(2)}\n\n📈 Trend\n${this.getTrendEmoji(analytics.trend.trend)} ${analytics.trend.trend.charAt(0).toUpperCase() + analytics.trend.trend.slice(1)} (${analytics.trend.changePercent > 0 ? '+' : ''}${analytics.trend.changePercent.toFixed(1)}%)`;

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

      const text = `🌞 Today's Energy Report\n${today.dayOfWeek}, ${today.date}\n\n⚡ Power Generation\nTotal Energy: ${today.totalEnergyKWh.toFixed(3)} mWh\nAverage Power: ${today.avgPowerW.toFixed(2)} W\nPeak Power: ${today.peakPowerW.toFixed(2)} W\nMinimum Power: ${today.minPowerW.toFixed(2)} W\n\n📊 Activity Summary\nTotal Readings: ${today.readingCount}\n\n💡 Try "week" or "month" for longer periods`;

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

      const text = `📅 Weekly Energy Report\nWeek ${week.weekNumber}: ${week.weekStart} to ${week.weekEnd}\n\n⚡ Power Generation\nTotal Energy: ${week.totalEnergyKWh.toFixed(3)} mWh\nAverage Power: ${week.avgPowerW.toFixed(2)} W\nPeak Power: ${week.peakPowerW.toFixed(2)} W\n\n📊 Activity Summary\nTotal Readings: ${week.readingCount}\n\n📈 Daily Breakdown\n${week.dailyBreakdown.map((day) => `${day.date} (${day.dayOfWeek.substring(0, 3)}): ${day.totalEnergyKWh.toFixed(3)} mWh`).join('\n')}\n\n💡 Try "month" for monthly summary`;

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

      const text = `📆 Monthly Energy Report\n${month.monthName} ${month.year}\n\n⚡ Power Generation\nTotal Energy: ${month.totalEnergyKWh.toFixed(3)} mWh\nAverage Power: ${month.avgPowerW.toFixed(2)} W\nPeak Power: ${month.peakPowerW.toFixed(2)} W\n\n📊 Activity Summary\nTotal Readings: ${month.readingCount}\nActive Days: ${month.daysWithData} of ${month.daysInMonth}\n\n💡 Try "impact" or "savings" for more insights`;

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

      const text = `🌳 Environmental Impact This Month\n\n🌍 CO₂ Emissions Avoided\n${impact.co2AvoidedKg.toFixed(2)} kg of CO₂\n\n🌲 Real-World Equivalents\n${impact.treesEquivalent.toFixed(1)} trees planted for a year\n${impact.coalNotBurnedKg.toFixed(2)} kg of coal not burned\n${impact.homesPoweredDays.toFixed(1)} home-days of electricity\n${impact.phoneChargesEquivalent.toLocaleString()} smartphone charges\n\n✨ Every mWh helps fight climate change\n\n💡 Try "savings" for cost analysis`;

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

      const text = `💰 Cost Savings This Month\n\n💵 Current Savings\nTotal Saved: $${savings.totalSavings.toFixed(2)}\nDaily Average: $${savings.dailyAverageSavings.toFixed(2)}\n\n📊 Projected Savings\nMonthly: $${savings.monthlyProjectedSavings.toFixed(2)}\nYearly: $${savings.yearlyProjectedSavings.toFixed(2)}\n\n⚡ Electricity Rate\n$${savings.electricityRatePerKWh.toFixed(2)} per mWh\n\n💡 Try "status" for complete overview`;

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

      const text = `⚡ Current Energy Status\n\n📊 Today's Generation\nEnergy: ${today.totalEnergyKWh.toFixed(3)} mWh\nAverage Power: ${today.avgPowerW.toFixed(2)} W\nPeak Power: ${today.peakPowerW.toFixed(2)} W\nUpdated: ${new Date().toLocaleTimeString()}\n\n🎯 Next Milestone\n${nextMilestone} Wh (${progress}% complete)\n\n💡 Try "today" for full daily report`;

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
      missions: '🎯 Milestones',
      milestones: '🎯 Milestones',
      progress: '🎯 Milestones',
      guide: '🌿 EcoGuide',
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
