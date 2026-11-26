import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FeedbackCategory {
  REVIEW = 'review',
  SUGGESTION = 'suggestion',
  ISSUE = 'issue',
  GENERAL = 'general',
}

export enum FeedbackStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export type FeedbackAnswerRole = 'visitor' | 'admin';

@Schema({ _id: true })
export class FeedbackAnswer {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    default: 'Anonymous',
    maxlength: 60,
  })
  authorName: string;

  @Prop({
    required: true,
    enum: ['visitor', 'admin'],
    default: 'visitor',
  })
  authorRole: FeedbackAnswerRole;

  @Prop({
    required: true,
    trim: true,
    maxlength: 2000,
  })
  body: string;

  @Prop({
    default: 0,
  })
  voteScore: number;

  @Prop({
    type: [String],
    default: [],
  })
  upvotedByTokens: string[];

  @Prop({
    type: [String],
    default: [],
  })
  downvotedByTokens: string[];

  @Prop({
    default: false,
  })
  isAccepted: boolean;

  @Prop({
    type: String,
    default: null,
  })
  parentAnswerId?: string | null;

  @Prop({
    type: String,
    default: null,
    maxlength: 60,
  })
  replyToAuthor?: string | null;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date;
}

export const FeedbackAnswerSchema = SchemaFactory.createForClass(FeedbackAnswer);

export type FeedbackDocument = Feedback & Document;

@Schema({
  timestamps: true,
  collection: 'feedbacks',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.upvotedByTokens;
      delete ret.downvotedByTokens;
      if (Array.isArray(ret.answers)) {
        ret.answers = ret.answers.map((ans: any) => ({
          id: ans._id ? ans._id.toString() : ans.id,
          authorName: ans.authorName,
          authorRole: ans.authorRole || 'visitor',
          body: ans.body,
          voteScore: ans.voteScore ?? 0,
          isAccepted: Boolean(ans.isAccepted),
          parentAnswerId: ans.parentAnswerId || null,
          replyToAuthor: ans.replyToAuthor || null,
          createdAt: ans.createdAt,
        }));
      }
      return ret;
    },
  },
})
export class Feedback {
  @Prop({
    required: false,
    trim: true,
    maxlength: 160,
  })
  title?: string;

  @Prop({
    required: true,
    trim: true,
    default: 'Anonymous',
    maxlength: 60,
  })
  authorName: string;

  @Prop({
    required: true,
    enum: FeedbackCategory,
    default: FeedbackCategory.GENERAL,
    index: true,
  })
  category: FeedbackCategory;

  @Prop({
    required: false,
    min: 1,
    max: 5,
  })
  rating?: number;

  @Prop({
    required: true,
    trim: true,
    maxlength: 2000,
  })
  message: string;

  @Prop({
    required: true,
    enum: FeedbackStatus,
    default: FeedbackStatus.OPEN,
    index: true,
  })
  status: FeedbackStatus;

  @Prop({
    default: 0,
    index: true,
  })
  upvotes: number;

  @Prop({
    default: 0,
    min: 0,
  })
  views: number;

  @Prop({
    type: [String],
    default: [],
  })
  upvotedByTokens: string[];

  @Prop({
    type: [String],
    default: [],
  })
  downvotedByTokens: string[];

  @Prop({
    type: [FeedbackAnswerSchema],
    default: [],
  })
  answers: FeedbackAnswer[];

  @Prop({
    required: false,
    trim: true,
    maxlength: 1000,
  })
  adminReply?: string;

  @Prop({
    required: false,
    trim: true,
  })
  adminReplyBy?: string;

  @Prop({
    required: false,
  })
  adminReplyAt?: Date;

  @Prop({
    required: false,
  })
  resolvedAt?: Date;

  @Prop({
    required: false,
    trim: true,
  })
  resolvedBy?: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ category: 1, createdAt: -1 });
FeedbackSchema.index({ upvotes: -1, createdAt: -1 });
