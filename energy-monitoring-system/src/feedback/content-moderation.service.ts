import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiAIService } from '../ai/gemini-ai.service';

export interface ModerationContext {
  kind: 'post' | 'reply';
  title?: string;
  message: string;
  category?: string;
  isAdmin?: boolean;
}

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|t\.me\/|discord\.gg\/|wa\.me\/)/i;

const BARE_DOMAIN_PATTERN =
  /\b[a-z0-9-]{2,}\.(?:com|net|org|xyz|click|ru|tk|top|vip|bet|casino|shop|online|site|info|io|co)\b(?:\/\S*)?/i;

const PROMO_SPAM_PATTERNS: RegExp[] = [
  /\b(?:free\s+money|earn\s+\$?\d+|crypto\s+signals?|forex\s+signals?|online\s+casino|slot\s+machine|betting\s+site|buy\s+followers|dm\s+for\s+promo|whatsapp\s+me|telegram\s+@)\b/i,
];

// Word-boundary profanity / abusive terms (English + Filipino/Tagalog)
const PROFANITY_TERMS: string[] = [
  // English
  'fuck',
  'fucker',
  'fucking',
  'fucked',
  'fck',
  'fcking',
  'fuk',
  'fuking',
  'fack',
  'facking',
  'motherfucker',
  'shit',
  'bullshit',
  'bitch',
  'bitches',
  'asshole',
  'bastard',
  'cunt',
  'dickhead',
  'dumbass',
  'jackass',
  'slut',
  'whore',
  'retard',
  'retarded',
  'faggot',
  'nigger',
  'nigga',
  'stfu',
  'kys',
  // Filipino / Tagalog
  'putangina',
  'putang ina',
  'tangina',
  'tang ina',
  'taena',
  'pota',
  'puta',
  'gago',
  'gagu',
  'tanga',
  'bobo',
  'ulol',
  'tarantado',
  'pakyu',
  'pakyo',
  'kupal',
  'hindot',
  'kantot',
  'punyeta',
  'leche',
  'bwisit',
  'hayop ka',
  'inutil',
  'ungas',
];

const KEYBOARD_SMASH_SEQUENCES = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'qazwsxedc',
  'poiuytrewq',
  'lkjhgfdsa',
  'mnbvcxz',
];

const AI_MODERATION_TIMEOUT_MS = 4500;

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly profanityRegexes: RegExp[];

  constructor(
    private readonly geminiAI: GeminiAIService,
    private readonly configService: ConfigService,
  ) {
    this.profanityRegexes = PROFANITY_TERMS.map((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flexibleSpaces = escaped.replace(/\s+/g, '\\s+');
      return new RegExp(`\\b${flexibleSpaces}\\b`, 'i');
    });
  }

  /**
   * Validates post/reply content against local rules (profanity, links, gibberish)
   * and an optional AI topic-relevance check for all posts (visitors and admins alike).
   * Throws BadRequestException with a clear, user-friendly reason if rejected.
   */
  async assertAllowed(ctx: ModerationContext): Promise<void> {
    const combined = [ctx.title || '', ctx.message || ''].filter(Boolean).join('\n').trim();
    if (!combined) {
      return;
    }

    // 1. External links & promotional spam
    if (this.containsSpamLinkOrPromo(combined)) {
      throw new BadRequestException(
        'External links and promotional content are not allowed in ECommunity.',
      );
    }

    // 2. Profanity / abusive language (English + Filipino, with basic leetspeak normalization)
    if (this.containsProfanity(combined)) {
      throw new BadRequestException(
        'Please keep ECommunity respectful. Profanity or abusive language is not allowed.',
      );
    }

    // 3. Gibberish / keyboard smash / character flooding
    if (this.isGibberishOrFlood(combined)) {
      throw new BadRequestException(
        'Your submission looks like random characters or spam. Please write a clear question, feedback, or report.',
      );
    }

    // 4. Optional AI topic-relevance check (new posts only; fails open if AI is unavailable)
    if (ctx.kind === 'post') {
      await this.checkTopicRelevanceWithAI(ctx);
    }
  }

  containsSpamLinkOrPromo(text: string): boolean {
    if (URL_PATTERN.test(text) || BARE_DOMAIN_PATTERN.test(text)) {
      return true;
    }
    return PROMO_SPAM_PATTERNS.some((pattern) => pattern.test(text));
  }

  containsProfanity(text: string): boolean {
    const normalized = this.normalizeForProfanity(text);
    const collapsed = normalized.replace(/(.)\1{2,}/g, '$1$1');
    const singleCollapsed = normalized.replace(/(.)\1+/g, '$1');

    return this.profanityRegexes.some(
      (regex) =>
        regex.test(normalized) ||
        regex.test(collapsed) ||
        regex.test(singleCollapsed),
    );
  }

  isGibberishOrFlood(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // 8+ identical non-space characters in a row (e.g., "aaaaaaaaaa", "!!!!!!!!")
    if (/(.)\1{7,}/i.test(trimmed.replace(/\s+/g, ''))) {
      return true;
    }

    // Mostly symbols/punctuation when text is 10+ chars
    const nonSpace = trimmed.replace(/\s+/g, '');
    if (nonSpace.length >= 10) {
      const alnumCount = (nonSpace.match(/[a-z0-9]/gi) || []).length;
      if (alnumCount / nonSpace.length < 0.3) {
        return true;
      }
    }

    // Keyboard smash sequences (6+ consecutive keyboard-row chars)
    const lowerAlpha = trimmed.toLowerCase().replace(/[^a-z]/g, '');
    for (const seq of KEYBOARD_SMASH_SEQUENCES) {
      for (let i = 0; i <= seq.length - 6; i++) {
        if (lowerAlpha.includes(seq.slice(i, i + 6))) {
          return true;
        }
      }
    }

    // Very long consonant-only token (12+ letters with no vowels, e.g. "bcdfghjklmnpqrst")
    const words = trimmed.toLowerCase().match(/[a-z]{12,}/g) || [];
    for (const word of words) {
      if (!/[aeiouy]/.test(word)) {
        return true;
      }
    }

    return false;
  }

  private normalizeForProfanity(text: string): string {
    return text
      .toLowerCase()
      .replace(/[@4]/g, 'a')
      .replace(/[3]/g, 'e')
      .replace(/[1!|]/g, 'i')
      .replace(/[0]/g, 'o')
      .replace(/[$5]/g, 's')
      .replace(/[7]/g, 't')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async checkTopicRelevanceWithAI(ctx: ModerationContext): Promise<void> {
    const flag = this.configService.get<string>('FEEDBACK_AI_MODERATION');
    if (flag && flag.toLowerCase() === 'false') {
      return;
    }

    if (!this.geminiAI.isAvailable()) {
      return;
    }

    const title = (ctx.title || '').slice(0, 160);
    const message = (ctx.message || '').slice(0, 800);
    const category = ctx.category || 'general';

    const prompt = `You are a content moderator for ECommunity, the public feedback and Q&A board of EcoStep — a campus piezoelectric footstep energy harvesting and monitoring web application.

Decide if this user post should be ALLOWED or REJECTED.

ALLOW posts that are:
- Questions, bug reports, issues, suggestions, or reviews about EcoStep, the website, dashboard, analytics, reports, EcoGuide chatbot, admin chat, or user experience
- Reports or discussions about the physical floor tiles, piezo sensors, ESP32 hardware, power/voltage/energy readings, milestones, or campus sustainability
- Genuine greetings, compliments, or constructive campus feedback related to EcoStep (even if casual or written in Taglish/Filipino)

REJECT posts that are:
- Completely unrelated nonsense, memes, song lyrics, random jokes, or test gibberish (e.g., "The quick brown fox", "What does the fox say", random movie quotes)
- Unrelated homework, coding questions, ads, scams, or spam
- Harassment, hate speech, threats, or abusive content

Post Category: ${category}
Post Title: ${title}
Post Message: ${message}

Reply with ONLY valid JSON and no markdown fences:
{"allowed": true, "reason": ""}
or
{"allowed": false, "reason": "Brief polite 1-sentence reason why it is off-topic or not allowed"}`;

    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
      const raw = await Promise.race<string | null>([
        this.geminiAI.processQuery(prompt, false),
        new Promise<null>((resolve) => {
          timeoutHandle = setTimeout(() => resolve(null), AI_MODERATION_TIMEOUT_MS);
        }),
      ]);

      if (!raw) {
        // Fail open when AI times out or is unavailable
        return;
      }

      const parsed = this.parseModerationJson(raw);
      if (parsed && parsed.allowed === false) {
        const reason =
          parsed.reason && parsed.reason.trim().length > 0
            ? parsed.reason.trim()
            : 'This post appears unrelated to EcoStep. Please share questions, feedback, bug reports, or suggestions about EcoStep.';
        this.logger.warn(
          `AI moderation rejected post "${title.slice(0, 60)}": ${reason}`,
        );
        throw new BadRequestException(reason);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Fail open on unexpected AI/parsing errors so legitimate users are never blocked by provider outages
      this.logger.warn(
        `AI topic check skipped due to error: ${(error as Error)?.message || error}`,
      );
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private parseModerationJson(
    raw: string,
  ): { allowed: boolean; reason?: string } | null {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const obj = JSON.parse(match[0]);
      if (typeof obj?.allowed === 'boolean') {
        return {
          allowed: obj.allowed,
          reason: typeof obj.reason === 'string' ? obj.reason : undefined,
        };
      }
    } catch {
      return null;
    }
    return null;
  }
}
