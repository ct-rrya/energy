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

// Word-boundary profanity & explicit sexual terms (English + Tagalog/Filipino + Cebuano/Bisaya)
const PROFANITY_TERMS: string[] = [
  // English profanity, slurs & explicit sexual terms
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
  'porn',
  'porno',
  'blowjob',
  'handjob',
  'masturbate',
  'horny',
  'boobs',
  'titties',
  'pussy',
  'penis',
  'vagina',
  'dildo',
  'retard',
  'retarded',
  'faggot',
  'nigger',
  'nigga',
  'stfu',
  'kys',
  // Tagalog / Filipino profanity & sexual slang
  'putangina',
  'putang ina',
  'tangina',
  'tang ina',
  'kingina',
  'puchangina',
  'taena',
  'pota',
  'puta',
  'putragis',
  'gago',
  'gagu',
  'tanga',
  'bobo',
  'ulol',
  'tarantado',
  'hinayupak',
  'siraulo',
  'pakyu',
  'pakyo',
  'kupal',
  'hindot',
  'kantot',
  'kantutan',
  'jakol',
  'chupa',
  'tsupa',
  'pekpek',
  'puke',
  'puki',
  'titi',
  'tite',
  'burat',
  'bayag',
  'libog',
  'malibog',
  'pokpok',
  'punyeta',
  'leche',
  'bwisit',
  'hayop ka',
  'inutil',
  'ungas',
  // Cebuano / Bisaya profanity & sexual slang
  'yawa',
  'yawaa',
  'yawaaa',
  'yawa ka',
  'piste',
  'pisti',
  'pisteng',
  'pisting',
  'piste ka',
  'atay',
  'ataya',
  'atay ka',
  'giatay',
  'giataya',
  'yati',
  'yatia',
  'linti',
  'animala',
  'buang',
  'boang',
  'bogo',
  'bogoa',
  'bugo',
  'bugoa',
  'amaw',
  'amawa',
  'bilat',
  'bilata',
  'oten',
  'otin',
  'iyot',
  'iyota',
  'iyotay',
  'kayat',
  'kayata',
  'kayatay',
  'bisong',
  'bisonga',
  'bigaon',
  'uwagan',
  'jerjer',
  'esmeringhoy',
  'esmiringhoy',
  'pakyuha',
];

// Unambiguous longer terms also checked with spaces/punctuation stripped (catches "y.a.w.a", "p u t a n g i n a", "e s m e r i n g h o y")
const COMPACT_PROFANITY_TERMS: string[] = [
  'putangina',
  'tangina',
  'motherfucker',
  'esmeringhoy',
  'esmiringhoy',
  'giatay',
  'kantutan',
  'tarantado',
  'hinayupak',
  'pisteng',
  'pisting',
  'yawaa',
];

const MASKED_PROFANITY_PATTERNS: RegExp[] = [
  /\bf[\W_]*[u@a*]+[\W_]*c[\W_]*k/i,
  /\by[\W_]*[a@*]+[\W_]*w[\W_]*[a@*]+/i,
  /\bp[\W_]*[u*]+[\W_]*t[\W_]*[a@*]+/i,
  /\bs[\W_]*h[\W_]*[i1!*]+[\W_]*t\b/i,
  /\bb[\W_]*[i1!*]+[\W_]*t[\W_]*c[\W_]*h/i,
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

const AI_MODERATION_TIMEOUT_MS = 6500;

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
    if (MASKED_PROFANITY_PATTERNS.some((pattern) => pattern.test(text))) {
      return true;
    }

    const normalized = this.normalizeForProfanity(text);
    const collapsed = normalized.replace(/(.)\1{2,}/g, '$1$1');
    const singleCollapsed = normalized.replace(/(.)\1+/g, '$1');

    if (
      this.profanityRegexes.some(
        (regex) =>
          regex.test(normalized) ||
          regex.test(collapsed) ||
          regex.test(singleCollapsed),
      )
    ) {
      return true;
    }

    const compact = normalized.replace(/\s+/g, '');
    const compactCollapsed = compact.replace(/(.)\1{2,}/g, '$1$1');
    return COMPACT_PROFANITY_TERMS.some(
      (term) => compact.includes(term) || compactCollapsed.includes(term),
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
      this.logger.warn(
        'AI topic moderation skipped: no Gemini or Groq API provider is configured/available.',
      );
      return;
    }

    const title = (ctx.title || '').slice(0, 160);
    const message = (ctx.message || '').slice(0, 800);
    const category = ctx.category || 'general';

    const prompt = `You are a strict but fair content moderator for ECommunity, the public feedback and Q&A board of EcoStep — a Philippine campus piezoelectric footstep energy harvesting and monitoring web application.

You MUST understand English, Tagalog/Filipino, Taglish, AND Cebuano/Bisaya (including Philippine campus slang, profanity, and sexual innuendo).

Decide if this user post should be ALLOWED or REJECTED.

ALLOW posts that are:
- Questions, bug reports, issues, suggestions, or reviews about EcoStep, the website, dashboard, analytics, reports, EcoGuide chatbot, admin chat, or user experience
- Reports or discussions about the physical floor tiles, piezo sensors, ESP32 hardware, power/voltage/energy readings, milestones, or campus sustainability
- Genuine, respectful campus feedback or questions related to EcoStep (in English, Tagalog, or Cebuano/Bisaya)

REJECT posts that are:
- Profanity, curses, insults, vulgarities, or sexual/NSFW content or slang in ANY language — especially English, Tagalog, or Cebuano/Bisaya (e.g., "yawa", "atay", "piste", "iyot", "bilat", "oten", "kayat", "esmeringhoy", coded sexual slang, or suggestive double-entendres)
- Single-word or meaningless low-effort posts, random names/words with no actual EcoStep question or feedback (e.g., Title: "Esme" / Message: "Esmeringhoy", or Title: "Test" / Message: "Hello")
- Unrelated memes, jokes, song lyrics, random quotes, unrelated homework, ads, scams, spam, trolling, or harassment

Post Category: ${category}
Post Title: ${title}
Post Message: ${message}

Reply with ONLY valid JSON and no markdown fences:
{"allowed": true, "reason": ""}
or
{"allowed": false, "reason": "Brief polite 1-sentence reason why it is not allowed"}`;

    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
      const raw = await Promise.race<string | null>([
        this.geminiAI.processQuery(prompt, false),
        new Promise<null>((resolve) => {
          timeoutHandle = setTimeout(() => resolve(null), AI_MODERATION_TIMEOUT_MS);
        }),
      ]);

      if (!raw) {
        this.logger.warn(
          `AI moderation timed out or returned empty for post "${title.slice(0, 60)}" — failing open.`,
        );
        return;
      }

      const parsed = this.parseModerationJson(raw);
      if (parsed && parsed.allowed === false) {
        const reason =
          parsed.reason && parsed.reason.trim().length > 0
            ? parsed.reason.trim()
            : 'This post is not allowed on ECommunity. Please keep posts respectful and related to EcoStep.';
        this.logger.warn(
          `AI moderation REJECTED post "${title.slice(0, 60)}": ${reason}`,
        );
        throw new BadRequestException(reason);
      }

      if (parsed && parsed.allowed === true) {
        this.logger.log(`AI moderation ALLOWED post "${title.slice(0, 60)}"`);
      } else {
        this.logger.warn(
          `AI moderation returned unparseable response for "${title.slice(0, 60)}" — failing open.`,
        );
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
