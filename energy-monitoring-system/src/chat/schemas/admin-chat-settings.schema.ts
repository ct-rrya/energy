import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminChatSettingsDocument = AdminChatSettings & Document;

export interface CannedReplyItem {
  id: string;
  label: string;
  text: string;
}

export const DEFAULT_AUTO_REPLY_MESSAGE =
  "Thanks for messaging the EcoStep team! We've received your concern and an admin will reply shortly.";

export const DEFAULT_CANNED_REPLIES: CannedReplyItem[] = [
  {
    id: 'inspecting-tile',
    label: 'Inspecting tile',
    text: "We're inspecting the floor tile right now. Thanks for letting us know!",
  },
  {
    id: 'thanks-reporting',
    label: 'Thanks for reporting',
    text: 'Thanks for reporting this! Our team has logged it and will check on it shortly.',
  },
  {
    id: 'issue-resolved',
    label: 'Issue resolved',
    text: 'This issue has been fixed and verified. Let us know if you notice anything else!',
  },
  {
    id: 'checking-readings',
    label: 'Checking readings',
    text: "We're reviewing the live sensor readings now and will update you soon.",
  },
];

@Schema({ _id: false, timestamps: false })
export class CannedReplySubdoc {
  @Prop({ required: true, trim: true, maxlength: 60 })
  id: string;

  @Prop({ required: true, trim: true, maxlength: 40 })
  label: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  text: string;
}

export const CannedReplySubdocSchema = SchemaFactory.createForClass(CannedReplySubdoc);

@Schema({
  timestamps: true,
  collection: 'admin_chat_settings',
})
export class AdminChatSettings {
  @Prop({ required: true, unique: true, default: 'global' })
  key: string;

  @Prop({ default: false })
  autoReplyEnabled: boolean;

  @Prop({
    default: DEFAULT_AUTO_REPLY_MESSAGE,
    trim: true,
    maxlength: 500,
  })
  autoReplyMessage: string;

  @Prop({ default: 60, min: 1, max: 1440 })
  autoReplyCooldownMinutes: number;

  @Prop({ type: [CannedReplySubdocSchema], default: () => DEFAULT_CANNED_REPLIES })
  cannedReplies: CannedReplyItem[];

  @Prop({ type: String, default: null })
  updatedBy: string | null;
}

export const AdminChatSettingsSchema = SchemaFactory.createForClass(AdminChatSettings);
