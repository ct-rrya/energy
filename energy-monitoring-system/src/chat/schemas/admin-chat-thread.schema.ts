import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminChatThreadDocument = AdminChatThread & Document;

@Schema({ _id: true, timestamps: false })
export class AdminChatMessage {
  @Prop({ required: true, enum: ['visitor', 'admin'] })
  sender: 'visitor' | 'admin';

  @Prop({ required: true, trim: true })
  senderName: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  text: string;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;
}

export const AdminChatMessageSchema = SchemaFactory.createForClass(AdminChatMessage);

@Schema({
  timestamps: true,
  collection: 'admin_chat_threads',
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class AdminChatThread {
  @Prop({ required: true, unique: true, index: true, trim: true })
  visitorId: string;

  @Prop({ default: 'Campus Visitor', trim: true, maxlength: 80 })
  visitorName: string;

  @Prop({ type: [AdminChatMessageSchema], default: [] })
  messages: AdminChatMessage[];

  @Prop({ default: 0, min: 0 })
  unreadByAdmin: number;

  @Prop({ default: 0, min: 0 })
  unreadByVisitor: number;

  @Prop({ type: String, enum: ['open', 'resolved'], default: 'open', index: true })
  status: 'open' | 'resolved';

  @Prop({ type: Date, default: () => new Date(), index: true })
  lastMessageAt: Date;
}

export const AdminChatThreadSchema = SchemaFactory.createForClass(AdminChatThread);
AdminChatThreadSchema.index({ lastMessageAt: -1 });
