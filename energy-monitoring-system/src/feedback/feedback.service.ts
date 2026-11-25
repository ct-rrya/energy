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
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

export interface FeedbackListQuery {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  sort?: 'newest' | 'top';
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

  private formatPublicItem(doc: FeedbackDocument, voterId?: string) {
    const hasUpvoted = Boolean(
      voterId && Array.isArray(doc.upvotedByTokens) && doc.upvotedByTokens.includes(voterId),
    );
    return {
      ...doc.toJSON(),
      hasUpvoted,
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
    if (query.status) {
      filter.status = query.status;
    }
    if (query.category) {
      filter.category = query.category;
    }

    const sortSpec: Record<string, 1 | -1> =
      query.sort === 'top'
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

  async create(dto: CreateFeedbackDto) {
    const cleanMessage = this.sanitizeText(dto.message);
    if (cleanMessage.length < 3) {
      throw new BadRequestException('Message must be at least 3 characters');
    }

    const cleanName = dto.authorName ? this.sanitizeText(dto.authorName) : '';
    const feedback = new this.feedbackModel({
      authorName: cleanName || 'Anonymous',
      category: dto.category || FeedbackCategory.GENERAL,
      rating: dto.rating,
      message: cleanMessage,
      status: FeedbackStatus.OPEN,
      upvotes: 0,
      upvotedByTokens: [],
    });

    const saved = await feedback.save();
    return this.formatPublicItem(saved);
  }

  async toggleUpvote(id: string, voterKey: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid feedback ID');
    }

    const feedback = await this.feedbackModel.findById(id).exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const cleanKey = this.sanitizeText(voterKey) || 'anonymous';
    const existingTokens = feedback.upvotedByTokens || [];
    const alreadyUpvoted = existingTokens.includes(cleanKey);

    if (alreadyUpvoted) {
      feedback.upvotedByTokens = existingTokens.filter((t) => t !== cleanKey);
    } else {
      feedback.upvotedByTokens = [...existingTokens, cleanKey];
    }
    feedback.upvotes = feedback.upvotedByTokens.length;

    const saved = await feedback.save();
    return this.formatPublicItem(saved, cleanKey);
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
