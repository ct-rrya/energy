import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
      return ret;
    },
  },
})
export class Feedback {
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
    maxlength: 1000,
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
    min: 0,
    index: true,
  })
  upvotes: number;

  @Prop({
    type: [String],
    default: [],
  })
  upvotedByTokens: string[];

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
