import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

export type FeedbackTab = 'newest' | 'top' | 'unanswered' | 'resolved';

export interface FeedbackListQuery {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  sort?: 'newest' | 'top';
  tab?: FeedbackTab;
  voterId?: string;
}

export interface FeedbackStats {
  total: number;
  openCount: number;
  resolvedCount: number;
  averageRating: number | null;
  ratingCount: number;
}

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

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
    if (query.tab === 'resolved') {
      filter.status = FeedbackStatus.RESOLVED;
      filter.category = { $in: [FeedbackCategory.ISSUE, FeedbackCategory.SUGGESTION] };
    } else if (query.tab === 'unanswered') {
      filter.$and = [
        { $or: [{ answers: { $exists: false } }, { answers: { $size: 0 } }] },
        { $or: [{ adminReply: { $exists: false } }, { adminReply: null }, { adminReply: '' }] },
      ];
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      filter.category = query.category;
    }

    const sortSpec: Record<string, 1 | -1> =
      query.tab === 'top' || query.sort === 'top'
        ? { upvotes: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [items, total, stats] = await Promise.all([
      this.feedbackModel.find(filter).sort(sortSpec).skip(skip).limit(limit).exec(),
      this.feedbackModel.countDocuments(filter).exec(),
      this.getStats(),
    ]);

    return {
      data: items.map((item) => this.formatPublicItem(item, query.voterId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
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

  async create(dto: CreateFeedbackDto) {
    const cleanMessage = this.sanitizeText(dto.message);
    if (cleanMessage.length < 3) {
      throw new BadRequestException('Message must be at least 3 characters');
    }

    const cleanTitle = dto.title ? this.sanitizeText(dto.title) : '';
    const cleanName = dto.authorName ? this.sanitizeText(dto.authorName) : '';
    const resolvedCategory = dto.category || FeedbackCategory.GENERAL;
    const feedback = new this.feedbackModel({
      title: cleanTitle || this.deriveTitleFromMessage(cleanMessage),
      authorName: cleanName || 'Anonymous',
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
    return this.formatPublicItem(saved);
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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const cleanBody = this.sanitizeText(dto.body);
    if (cleanBody.length < 2) {
      throw new BadRequestException('Answer must be at least 2 characters');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const authorName = isAdmin
      ? this.sanitizeText(adminName || 'EcoStep Admin') || 'EcoStep Admin'
      : this.sanitizeText(dto.authorName || '') || 'Anonymous';

    if (!Array.isArray(feedback.answers)) {
      feedback.answers = [];
    }

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
      createdAt: new Date(),
    });

    const saved = await feedback.save();
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
