import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Feedback,
  FeedbackCategory,
  FeedbackDocument,
  FeedbackStatus,
} from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateAnswerDto, UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ContentModerationService } from './content-moderation.service';

export type FeedbackTab = 'newest' | 'top' | 'unanswered' | 'resolved';

export interface FeedbackListQuery {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  sort?: 'newest' | 'top';
  tab?: FeedbackTab;
  voterId?: string;
  search?: string;
}

export interface FeedbackStats {
  total: number;
  openCount: number;
  resolvedCount: number;
  averageRating: number | null;
  ratingCount: number;
}

export interface FeedbackQuotaStatus {
  postsUsed: number;
  postsLimit: number;
  postsRemaining: number;
  commentsUsed: number;
  commentsLimit: number;
  commentsRemaining: number;
  postCooldownSec: number;
  commentCooldownSec: number;
  isUnlimited: boolean;
}

const DAILY_POST_LIMIT = 5;
const DAILY_COMMENT_LIMIT = 20;
const POST_COOLDOWN_MS = 30_000;
const COMMENT_COOLDOWN_MS = 15_000;
const MAX_ANSWERS_PER_THREAD = 200;

@Injectable()
export class FeedbackService {
  private readonly lastPostByVisitor = new Map<string, number>();
  private readonly lastCommentByVisitor = new Map<string, number>();

  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    private readonly contentModeration: ContentModerationService,
  ) {}

  private getPhtDayStart(): Date {
    const now = new Date();
    const phtOffsetMs = 8 * 60 * 60 * 1000;
    const phtNow = new Date(now.getTime() + phtOffsetMs);
    phtNow.setUTCHours(0, 0, 0, 0);
    return new Date(phtNow.getTime() - phtOffsetMs);
  }

  private normalizeForDuplicateCheck(value: string): string {
    return (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private tokenizeSearchText(value: string): string[] {
    return (value || '')
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length >= 2) ?? [];
  }

  private damerauLevenshtein(a: string, b: string, maxDist: number): number {
    const lenA = a.length;
    const lenB = b.length;
    if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1;
    if (a === b) return 0;

    const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
      new Array<number>(lenB + 1).fill(0),
    );
    for (let i = 0; i <= lenA; i++) dp[i][0] = i;
    for (let j = 0; j <= lenB; j++) dp[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      let rowMin = maxDist + 1;
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let val = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
        if (
          i > 1 &&
          j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]
        ) {
          val = Math.min(val, dp[i - 2][j - 2] + 1);
        }
        dp[i][j] = val;
        if (val < rowMin) rowMin = val;
      }
      if (rowMin > maxDist) return maxDist + 1;
    }

    return dp[lenA][lenB];
  }

  private maxEditDistanceForToken(token: string): number {
    if (token.length <= 2) return 0;
    if (token.length <= 4) return 1;
    if (token.length <= 8) return 2;
    return 3;
  }

  private findFuzzyMatches<T extends FeedbackDocument>(
    candidates: T[],
    rawSearch: string,
  ): { matched: T[]; suggestedTerm: string | null } {
    const queryTokens = this.tokenizeSearchText(rawSearch);
    if (queryTokens.length === 0) {
      return { matched: [], suggestedTerm: null };
    }

    const tokenBestCorrection = new Map<
      string,
      { word: string; dist: number; weight: number }
    >();

    const scored: Array<{ doc: T; score: number }> = [];

    for (const doc of candidates) {
      const titleWords = this.tokenizeSearchText(doc.title || '');
      const messageWords = this.tokenizeSearchText(doc.message || '');
      const authorWords = this.tokenizeSearchText(doc.authorName || '');
      const answerWords = Array.isArray(doc.answers)
        ? doc.answers.flatMap((a) => this.tokenizeSearchText(a.body || ''))
        : [];

      const fieldBuckets: Array<{ words: string[]; weight: number }> = [
        { words: titleWords, weight: 3 },
        { words: messageWords, weight: 2 },
        { words: answerWords, weight: 1.2 },
        { words: authorWords, weight: 1 },
      ];

      let docScore = 0;
      let matchedTokenCount = 0;

      for (const qToken of queryTokens) {
        const maxDist = this.maxEditDistanceForToken(qToken);
        let bestDist = maxDist + 1;
        let bestWord = '';
        let bestWeight = 0;

        for (const bucket of fieldBuckets) {
          for (const word of bucket.words) {
            if (word === qToken) {
              if (bestDist > 0 || bucket.weight > bestWeight) {
                bestDist = 0;
                bestWord = word;
                bestWeight = bucket.weight;
              }
              continue;
            }
            if (qToken.length >= 3 && (word.startsWith(qToken) || qToken.startsWith(word))) {
              const prefixDist = Math.abs(word.length - qToken.length) <= 3 ? 0.5 : 1;
              if (prefixDist < bestDist || (prefixDist === bestDist && bucket.weight > bestWeight)) {
                bestDist = prefixDist;
                bestWord = word;
                bestWeight = bucket.weight;
              }
              continue;
            }
            if (maxDist > 0) {
              const dist = this.damerauLevenshtein(qToken, word, maxDist);
              if (dist <= maxDist) {
                if (dist < bestDist || (dist === bestDist && bucket.weight > bestWeight)) {
                  bestDist = dist;
                  bestWord = word;
                  bestWeight = bucket.weight;
                }
              }
            }
          }
        }

        if (bestDist <= maxDist && bestWord) {
          matchedTokenCount += 1;
          docScore += bestWeight * (maxDist + 1.5 - bestDist);

          const prev = tokenBestCorrection.get(qToken);
          if (
            !prev ||
            bestDist < prev.dist ||
            (bestDist === prev.dist && bestWeight > prev.weight)
          ) {
            tokenBestCorrection.set(qToken, {
              word: bestWord,
              dist: bestDist,
              weight: bestWeight,
            });
          }
        }
      }

      if (matchedTokenCount > 0) {
        // Prefer posts that match more of the user's query words
        const coverageBonus = (matchedTokenCount / queryTokens.length) * 5;
        scored.push({ doc, score: docScore + coverageBonus });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const correctedTokens = queryTokens.map(
      (t) => tokenBestCorrection.get(t)?.word ?? t,
    );
    const correctedPhrase = correctedTokens.join(' ');
    const normalizedInput = queryTokens.join(' ');
    const suggestedTerm =
      scored.length > 0 && correctedPhrase !== normalizedInput
        ? correctedPhrase
        : null;

    return {
      matched: scored.map((s) => s.doc),
      suggestedTerm,
    };
  }

  async getQuotaStatus(
    visitorId?: string,
    isAdmin = false,
  ): Promise<FeedbackQuotaStatus> {
    if (isAdmin) {
      return {
        postsUsed: 0,
        postsLimit: DAILY_POST_LIMIT,
        postsRemaining: DAILY_POST_LIMIT,
        commentsUsed: 0,
        commentsLimit: DAILY_COMMENT_LIMIT,
        commentsRemaining: DAILY_COMMENT_LIMIT,
        postCooldownSec: 0,
        commentCooldownSec: 0,
        isUnlimited: true,
      };
    }

    const cleanVisitor = visitorId?.trim();
    if (!cleanVisitor) {
      return {
        postsUsed: 0,
        postsLimit: DAILY_POST_LIMIT,
        postsRemaining: DAILY_POST_LIMIT,
        commentsUsed: 0,
        commentsLimit: DAILY_COMMENT_LIMIT,
        commentsRemaining: DAILY_COMMENT_LIMIT,
        postCooldownSec: 0,
        commentCooldownSec: 0,
        isUnlimited: false,
      };
    }

    const dayStart = this.getPhtDayStart();
    const [postsUsed, commentAgg] = await Promise.all([
      this.feedbackModel
        .countDocuments({
          visitorId: cleanVisitor,
          createdAt: { $gte: dayStart },
        })
        .exec(),
      this.feedbackModel
        .aggregate([
          { $match: { 'answers.visitorId': cleanVisitor } },
          { $unwind: '$answers' },
          {
            $match: {
              'answers.visitorId': cleanVisitor,
              'answers.createdAt': { $gte: dayStart },
            },
          },
          { $count: 'count' },
        ])
        .exec(),
    ]);

    const commentsUsed = commentAgg?.[0]?.count ?? 0;
    const now = Date.now();
    const lastPostMs = this.lastPostByVisitor.get(cleanVisitor) ?? 0;
    const lastCommentMs = this.lastCommentByVisitor.get(cleanVisitor) ?? 0;

    return {
      postsUsed,
      postsLimit: DAILY_POST_LIMIT,
      postsRemaining: Math.max(0, DAILY_POST_LIMIT - postsUsed),
      commentsUsed,
      commentsLimit: DAILY_COMMENT_LIMIT,
      commentsRemaining: Math.max(0, DAILY_COMMENT_LIMIT - commentsUsed),
      postCooldownSec: Math.max(
        0,
        Math.ceil((POST_COOLDOWN_MS - (now - lastPostMs)) / 1000),
      ),
      commentCooldownSec: Math.max(
        0,
        Math.ceil((COMMENT_COOLDOWN_MS - (now - lastCommentMs)) / 1000),
      ),
      isUnlimited: false,
    };
  }

  private sanitizeText(value: string): string {
    return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim();
  }

  private deriveTitleFromMessage(message: string): string {
    const firstLine = (message || '').split(/\r?\n/)[0].trim();
    const firstSentence = firstLine.split(/(?<=[.!?])\s+/)[0] || firstLine;
    return firstSentence.length > 96
      ? `${firstSentence.slice(0, 93).trimEnd()}...`
      : firstSentence || 'Community Feedback';
  }

  private formatPublicItem(doc: FeedbackDocument, voterId?: string) {
    const upTokens = Array.isArray(doc.upvotedByTokens) ? doc.upvotedByTokens : [];
    const downTokens = Array.isArray(doc.downvotedByTokens) ? doc.downvotedByTokens : [];
    const userVote: 'up' | 'down' | null = voterId
      ? upTokens.includes(voterId)
        ? 'up'
        : downTokens.includes(voterId)
          ? 'down'
          : null
      : null;

    const rawAnswers = Array.isArray(doc.answers) ? doc.answers : [];
    const formattedAnswers = rawAnswers
      .map((ans) => {
        const ansUp = Array.isArray(ans.upvotedByTokens) ? ans.upvotedByTokens : [];
        const ansDown = Array.isArray(ans.downvotedByTokens) ? ans.downvotedByTokens : [];
        const ansUserVote: 'up' | 'down' | null = voterId
          ? ansUp.includes(voterId)
            ? 'up'
            : ansDown.includes(voterId)
              ? 'down'
              : null
          : null;

        return {
          id: ans._id ? ans._id.toString() : '',
          authorName: ans.authorName || 'Anonymous',
          authorRole: ans.authorRole || 'visitor',
          body: ans.body,
          voteScore: ans.voteScore ?? (ansUp.length - ansDown.length),
          upvoteCount: ansUp.length,
          downvoteCount: ansDown.length,
          isAccepted: Boolean(ans.isAccepted),
          parentAnswerId: ans.parentAnswerId || null,
          replyToAuthor: ans.replyToAuthor || null,
          userVote: ansUserVote,
          createdAt: ans.createdAt,
        };
      })
      .sort((a, b) => {
        if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
        if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    const json = doc.toJSON() as any;
    const resolvedTitle =
      (doc.title && doc.title.trim()) || this.deriveTitleFromMessage(doc.message);

    return {
      ...json,
      title: resolvedTitle,
      views: doc.views ?? 0,
      upvoteCount: upTokens.length,
      downvoteCount: downTokens.length,
      hasUpvoted: userVote === 'up',
      userVote,
      answers: formattedAnswers,
      answersCount: formattedAnswers.length + (doc.adminReply && formattedAnswers.length === 0 ? 1 : 0),
    };
  }

  async getStats(): Promise<FeedbackStats> {
    const [summary] = await this.feedbackModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          openCount: {
            $sum: { $cond: [{ $eq: ['$status', FeedbackStatus.OPEN] }, 1, 0] },
          },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', FeedbackStatus.RESOLVED] }, 1, 0] },
          },
          ratingSum: {
            $sum: { $cond: [{ $gt: ['$rating', 0] }, '$rating', 0] },
          },
          ratingCount: {
            $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] },
          },
        },
      },
    ]);

    if (!summary) {
      return {
        total: 0,
        openCount: 0,
        resolvedCount: 0,
        averageRating: null,
        ratingCount: 0,
      };
    }

    return {
      total: summary.total || 0,
      openCount: summary.openCount || 0,
      resolvedCount: summary.resolvedCount || 0,
      averageRating:
        summary.ratingCount > 0
          ? Math.round((summary.ratingSum / summary.ratingCount) * 10) / 10
          : null,
      ratingCount: summary.ratingCount || 0,
    };
  }

  async findAll(query: FeedbackListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    const andConditions: Record<string, any>[] = [];

    if (query.tab === 'resolved') {
      filter.status = FeedbackStatus.RESOLVED;
      filter.category = { $in: [FeedbackCategory.ISSUE, FeedbackCategory.SUGGESTION] };
    } else if (query.tab === 'unanswered') {
      andConditions.push(
        { $or: [{ answers: { $exists: false } }, { answers: { $size: 0 } }] },
        { $or: [{ adminReply: { $exists: false } }, { adminReply: null }, { adminReply: '' }] },
      );
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = query.category;
    }

    const baseFilter: Record<string, any> = { ...filter };
    const baseAndConditions = [...andConditions];

    const cleanSearch = query.search?.trim();
    if (cleanSearch) {
      const regex = new RegExp(this.escapeRegex(cleanSearch), 'i');
      andConditions.push({
        $or: [
          { title: regex },
          { message: regex },
          { authorName: regex },
          { 'answers.body': regex },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const sortSpec: Record<string, 1 | -1> =
      query.tab === 'top' || query.sort === 'top'
        ? { upvotes: -1, createdAt: -1 }
        : { createdAt: -1 };

    let [items, total, stats] = await Promise.all([
      this.feedbackModel.find(filter).sort(sortSpec).skip(skip).limit(limit).exec(),
      this.feedbackModel.countDocuments(filter).exec(),
      this.getStats(),
    ]);

    let isFuzzyMatch = false;
    let suggestedTerm: string | null = null;

    // Smart typo-tolerant fallback when exact substring search finds nothing
    if (cleanSearch && total === 0) {
      if (baseAndConditions.length > 0) {
        baseFilter.$and = baseAndConditions;
      }
      const candidates = await this.feedbackModel
        .find(baseFilter)
        .sort(sortSpec)
        .limit(500)
        .exec();

      const fuzzy = this.findFuzzyMatches(candidates, cleanSearch);
      if (fuzzy.matched.length > 0) {
        isFuzzyMatch = true;
        suggestedTerm = fuzzy.suggestedTerm;
        total = fuzzy.matched.length;
        items = fuzzy.matched.slice(skip, skip + limit);
      }
    }

    return {
      data: items.map((item) => this.formatPublicItem(item, query.voterId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        ...(cleanSearch ? { isFuzzyMatch, suggestedTerm } : {}),
      },
      stats,
    };
  }

  async findOne(id: string, voterId?: string, incrementViews = true) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const feedback = incrementViews
      ? await this.feedbackModel
          .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
          .exec()
      : await this.feedbackModel.findById(id).exec();

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return this.formatPublicItem(feedback, voterId);
  }

  async create(dto: CreateFeedbackDto, visitorId?: string, isAdmin = false) {
    // 1. Hidden honeypot trap for automated spam bots
    if (dto.website && dto.website.trim().length > 0) {
      throw new BadRequestException('Submission rejected by spam protection');
    }

    const cleanMessage = this.sanitizeText(dto.message);
    if (cleanMessage.length < 3) {
      throw new BadRequestException('Message must be at least 3 characters');
    }

    const cleanTitle = dto.title ? this.sanitizeText(dto.title) : '';
    const resolvedTitle = cleanTitle || this.deriveTitleFromMessage(cleanMessage);
    const cleanName = dto.authorName ? this.sanitizeText(dto.authorName) : '';
    const cleanVisitor = visitorId?.trim() || null;

    // 2. Per-visitor 30s cooldown & daily quota (admins bypass)
    if (!isAdmin && cleanVisitor) {
      const now = Date.now();
      const lastPostMs = this.lastPostByVisitor.get(cleanVisitor) ?? 0;
      const elapsed = now - lastPostMs;
      if (elapsed < POST_COOLDOWN_MS) {
        const waitSec = Math.max(1, Math.ceil((POST_COOLDOWN_MS - elapsed) / 1000));
        throw new HttpException(
          `Please wait ${waitSec}s before creating another post.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const dayStart = this.getPhtDayStart();
      const postsToday = await this.feedbackModel
        .countDocuments({
          visitorId: cleanVisitor,
          createdAt: { $gte: dayStart },
        })
        .exec();

      if (postsToday >= DAILY_POST_LIMIT) {
        throw new HttpException(
          `Daily posting limit reached (${DAILY_POST_LIMIT} posts/day). Please try again tomorrow.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 3. All-time duplicate-post detection (matches identical normalized title OR message)
    const incomingNormMsg = this.normalizeForDuplicateCheck(cleanMessage);
    const incomingNormTitle = this.normalizeForDuplicateCheck(resolvedTitle);
    const existingPosts = await this.feedbackModel
      .find({})
      .select('title message')
      .lean()
      .exec();

    const isDuplicate = existingPosts.some((p) => {
      const existingTitle = this.normalizeForDuplicateCheck(p.title || '');
      const existingMsg = this.normalizeForDuplicateCheck(p.message || '');
      return (
        (incomingNormTitle.length >= 3 && existingTitle === incomingNormTitle) ||
        (incomingNormMsg.length >= 3 && existingMsg === incomingNormMsg)
      );
    });
    if (isDuplicate) {
      throw new BadRequestException(
        'A post with this same title or message already exists. Try searching ECommunity to join the existing discussion.',
      );
    }

    // 4. Content moderation: profanity, external links, gibberish, and optional AI topic check
    await this.contentModeration.assertAllowed({
      kind: 'post',
      title: resolvedTitle,
      message: cleanMessage,
      category: dto.category || FeedbackCategory.GENERAL,
      isAdmin,
    });

    const resolvedCategory = dto.category || FeedbackCategory.GENERAL;
    const feedback = new this.feedbackModel({
      title: resolvedTitle,
      authorName: cleanName || 'Anonymous',
      visitorId: cleanVisitor,
      category: resolvedCategory,
      rating: resolvedCategory === FeedbackCategory.REVIEW ? dto.rating : undefined,
      message: cleanMessage,
      status: FeedbackStatus.OPEN,
      upvotes: 0,
      views: 0,
      upvotedByTokens: [],
      downvotedByTokens: [],
      answers: [],
    });

    const saved = await feedback.save();
    if (!isAdmin && cleanVisitor) {
      this.lastPostByVisitor.set(cleanVisitor, Date.now());
    }
    return this.formatPublicItem(saved, cleanVisitor || undefined);
  }

  async votePost(id: string, direction: 'up' | 'down', voterKey: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const cleanKey = this.sanitizeText(voterKey) || 'anonymous';
    let upTokens = Array.isArray(feedback.upvotedByTokens) ? [...feedback.upvotedByTokens] : [];
    let downTokens = Array.isArray(feedback.downvotedByTokens) ? [...feedback.downvotedByTokens] : [];

    if (direction === 'up') {
      const alreadyUp = upTokens.includes(cleanKey);
      upTokens = upTokens.filter((t) => t !== cleanKey);
      downTokens = downTokens.filter((t) => t !== cleanKey);
      if (!alreadyUp) {
        upTokens.push(cleanKey);
      }
    } else {
      const alreadyDown = downTokens.includes(cleanKey);
      upTokens = upTokens.filter((t) => t !== cleanKey);
      downTokens = downTokens.filter((t) => t !== cleanKey);
      if (!alreadyDown) {
        downTokens.push(cleanKey);
      }
    }

    feedback.upvotedByTokens = upTokens;
    feedback.downvotedByTokens = downTokens;
    feedback.upvotes = upTokens.length - downTokens.length;

    const saved = await feedback.save();
    return this.formatPublicItem(saved, cleanKey);
  }

  async toggleUpvote(id: string, voterKey: string) {
    return this.votePost(id, 'up', voterKey);
  }

  async addAnswer(
    id: string,
    dto: CreateAnswerDto,
    isAdmin: boolean,
    adminName?: string,
    voterId?: string,
  ) {
    // 1. Hidden honeypot trap for automated spam bots
    if (dto.website && dto.website.trim().length > 0) {
      throw new BadRequestException('Submission rejected by spam protection');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const cleanBody = this.sanitizeText(dto.body);
    if (cleanBody.length < 2) {
      throw new BadRequestException('Answer must be at least 2 characters');
    }

    const cleanVisitor = !isAdmin && voterId?.trim() ? voterId.trim() : null;

    // 2. Per-visitor 15s cooldown & daily comment quota (admins bypass)
    if (!isAdmin && cleanVisitor) {
      const now = Date.now();
      const lastCommentMs = this.lastCommentByVisitor.get(cleanVisitor) ?? 0;
      const elapsed = now - lastCommentMs;
      if (elapsed < COMMENT_COOLDOWN_MS) {
        const waitSec = Math.max(1, Math.ceil((COMMENT_COOLDOWN_MS - elapsed) / 1000));
        throw new HttpException(
          `Please wait ${waitSec}s before posting another reply.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const dayStart = this.getPhtDayStart();
      const commentAgg = await this.feedbackModel
        .aggregate([
          { $match: { 'answers.visitorId': cleanVisitor } },
          { $unwind: '$answers' },
          {
            $match: {
              'answers.visitorId': cleanVisitor,
              'answers.createdAt': { $gte: dayStart },
            },
          },
          { $count: 'count' },
        ])
        .exec();

      const commentsToday = commentAgg?.[0]?.count ?? 0;
      if (commentsToday >= DAILY_COMMENT_LIMIT) {
        throw new HttpException(
          `Daily reply limit reached (${DAILY_COMMENT_LIMIT} replies/day). Please try again tomorrow.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (!Array.isArray(feedback.answers)) {
      feedback.answers = [];
    }

    // 3. Thread size cap so no single document can be bloated
    if (feedback.answers.length >= MAX_ANSWERS_PER_THREAD) {
      throw new BadRequestException(
        'This discussion has reached the maximum number of replies.',
      );
    }

    // 4. All-time duplicate-comment block on the same thread
    const incomingNormBody = this.normalizeForDuplicateCheck(cleanBody);
    const isDuplicateComment = feedback.answers.some(
      (a) => this.normalizeForDuplicateCheck(a.body) === incomingNormBody,
    );
    if (isDuplicateComment) {
      throw new BadRequestException(
        'This exact reply already exists in this thread. Please avoid duplicate replies.',
      );
    }

    // 5. Content moderation: profanity, external links, and gibberish filter
    await this.contentModeration.assertAllowed({
      kind: 'reply',
      message: cleanBody,
      isAdmin,
    });

    const authorName = isAdmin
      ? this.sanitizeText(adminName || 'EcoStep Admin') || 'EcoStep Admin'
      : this.sanitizeText(dto.authorName || '') || 'Anonymous';

    let resolvedParentId: string | null = null;
    let resolvedReplyToAuthor: string | null = null;
    if (dto.parentAnswerId) {
      const parent = feedback.answers.find(
        (a) => a._id && a._id.toString() === dto.parentAnswerId,
      );
      if (!parent) {
        throw new NotFoundException(`Parent comment with ID ${dto.parentAnswerId} not found`);
      }
      resolvedParentId = parent._id.toString();
      resolvedReplyToAuthor = parent.authorName || 'Anonymous';
    }

    feedback.answers.push({
      _id: new Types.ObjectId(),
      authorName,
      authorRole: isAdmin ? 'admin' : 'visitor',
      body: cleanBody,
      voteScore: 0,
      upvotedByTokens: [],
      downvotedByTokens: [],
      isAccepted: false,
      parentAnswerId: resolvedParentId,
      replyToAuthor: resolvedReplyToAuthor,
      visitorId: cleanVisitor,
      createdAt: new Date(),
    });

    const saved = await feedback.save();
    if (!isAdmin && cleanVisitor) {
      this.lastCommentByVisitor.set(cleanVisitor, Date.now());
    }
    return this.formatPublicItem(saved, voterId);
  }

  async voteAnswer(
    id: string,
    answerId: string,
    direction: 'up' | 'down',
    voterKey: string,
  ) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(answerId)) {
      throw new BadRequestException('Invalid feedback or answer ID');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const answer = (feedback.answers || []).find(
      (a) => a._id && a._id.toString() === answerId,
    );
    if (!answer) {
      throw new NotFoundException(`Answer with ID ${answerId} not found`);
    }

    const cleanKey = this.sanitizeText(voterKey) || 'anonymous';
    let upTokens = Array.isArray(answer.upvotedByTokens) ? [...answer.upvotedByTokens] : [];
    let downTokens = Array.isArray(answer.downvotedByTokens) ? [...answer.downvotedByTokens] : [];

    if (direction === 'up') {
      const alreadyUp = upTokens.includes(cleanKey);
      upTokens = upTokens.filter((t) => t !== cleanKey);
      downTokens = downTokens.filter((t) => t !== cleanKey);
      if (!alreadyUp) upTokens.push(cleanKey);
    } else {
      const alreadyDown = downTokens.includes(cleanKey);
      upTokens = upTokens.filter((t) => t !== cleanKey);
      downTokens = downTokens.filter((t) => t !== cleanKey);
      if (!alreadyDown) downTokens.push(cleanKey);
    }

    answer.upvotedByTokens = upTokens;
    answer.downvotedByTokens = downTokens;
    answer.voteScore = upTokens.length - downTokens.length;

    feedback.markModified('answers');
    const saved = await feedback.save();
    return this.formatPublicItem(saved, cleanKey);
  }

  async toggleAcceptAnswer(id: string, answerId: string, adminName: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(answerId)) {
      throw new BadRequestException('Invalid feedback or answer ID');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const target = (feedback.answers || []).find(
      (a) => a._id && a._id.toString() === answerId,
    );
    if (!target) {
      throw new NotFoundException(`Answer with ID ${answerId} not found`);
    }

    const nextAccepted = !target.isAccepted;
    for (const ans of feedback.answers) {
      ans.isAccepted = ans._id.toString() === answerId ? nextAccepted : false;
    }

    const supportsResolution =
      feedback.category === FeedbackCategory.ISSUE ||
      feedback.category === FeedbackCategory.SUGGESTION;

    if (nextAccepted && supportsResolution && feedback.status !== FeedbackStatus.RESOLVED) {
      feedback.status = FeedbackStatus.RESOLVED;
      feedback.resolvedAt = new Date();
      feedback.resolvedBy = adminName || 'Admin';
    }

    feedback.markModified('answers');
    const saved = await feedback.save();
    return this.formatPublicItem(saved);
  }

  async deleteAnswer(id: string, answerId: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(answerId)) {
      throw new BadRequestException('Invalid feedback or answer ID');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const allAnswers = feedback.answers || [];
    const idsToDelete = new Set<string>([answerId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const a of allAnswers) {
        const aId = a._id ? a._id.toString() : '';
        if (aId && !idsToDelete.has(aId) && a.parentAnswerId && idsToDelete.has(a.parentAnswerId)) {
          idsToDelete.add(aId);
          grew = true;
        }
      }
    }

    const before = allAnswers.length;
    feedback.answers = allAnswers.filter(
      (a) => a._id && !idsToDelete.has(a._id.toString()),
    );
    if (feedback.answers.length === before) {
      throw new NotFoundException(`Answer with ID ${answerId} not found`);
    }

    feedback.markModified('answers');
    const saved = await feedback.save();
    return this.formatPublicItem(saved);
  }

  async adminUpdate(
    id: string,
    dto: UpdateFeedbackDto,
    adminName: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (dto.status !== undefined) {
      feedback.status = dto.status;
      if (dto.status === FeedbackStatus.RESOLVED) {
        feedback.resolvedAt = new Date();
        feedback.resolvedBy = adminName || 'Admin';
      } else {
        feedback.resolvedAt = undefined;
        feedback.resolvedBy = undefined;
      }
    }

    if (dto.adminReply !== undefined) {
      const cleanReply = this.sanitizeText(dto.adminReply);
      if (cleanReply.length === 0) {
        feedback.adminReply = undefined;
        feedback.adminReplyBy = undefined;
        feedback.adminReplyAt = undefined;
      } else {
        feedback.adminReply = cleanReply;
        feedback.adminReplyBy = adminName || 'Admin';
        feedback.adminReplyAt = new Date();
      }
    }

    const saved = await feedback.save();
    return this.formatPublicItem(saved);
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const deleted = await this.feedbackModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return {
      id: deleted._id.toString(),
      authorName: deleted.authorName,
      category: deleted.category,
    };
  }
}
