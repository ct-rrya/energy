import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminChatThread,
  AdminChatThreadDocument,
} from './schemas/admin-chat-thread.schema';
import {
  AdminChatSettings,
  AdminChatSettingsDocument,
  CannedReplyItem,
  DEFAULT_AUTO_REPLY_MESSAGE,
  DEFAULT_CANNED_REPLIES,
} from './schemas/admin-chat-settings.schema';

export interface PublicAdminChatSettings {
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  autoReplyCooldownMinutes: number;
  cannedReplies: CannedReplyItem[];
  updatedBy: string | null;
}

export interface UpdateAdminChatSettingsPayload {
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;
  autoReplyCooldownMinutes?: number;
  cannedReplies?: Array<{ id?: string; label: string; text: string }>;
}

@Injectable()
export class AdminChatService {
  constructor(
    @InjectModel(AdminChatThread.name)
    private readonly threadModel: Model<AdminChatThreadDocument>,
    @InjectModel(AdminChatSettings.name)
    private readonly settingsModel: Model<AdminChatSettingsDocument>,
  ) {}

  async getSettings(): Promise<PublicAdminChatSettings> {
    let doc = await this.settingsModel.findOne({ key: 'global' }).exec();
    if (!doc) {
      doc = await this.settingsModel.create({
        key: 'global',
        autoReplyEnabled: false,
        autoReplyMessage: DEFAULT_AUTO_REPLY_MESSAGE,
        autoReplyCooldownMinutes: 60,
        cannedReplies: DEFAULT_CANNED_REPLIES,
        updatedBy: null,
      });
    }
    return {
      autoReplyEnabled: Boolean(doc.autoReplyEnabled),
      autoReplyMessage: doc.autoReplyMessage || DEFAULT_AUTO_REPLY_MESSAGE,
      autoReplyCooldownMinutes: doc.autoReplyCooldownMinutes ?? 60,
      cannedReplies:
        Array.isArray(doc.cannedReplies) && doc.cannedReplies.length > 0
          ? doc.cannedReplies.map((r) => ({
              id: r.id,
              label: r.label,
              text: r.text,
            }))
          : DEFAULT_CANNED_REPLIES,
      updatedBy: doc.updatedBy || null,
    };
  }

  async updateSettings(
    payload: UpdateAdminChatSettingsPayload,
    adminName?: string,
  ): Promise<PublicAdminChatSettings> {
    const current = await this.getSettings();
    const nextEnabled =
      typeof payload.autoReplyEnabled === 'boolean'
        ? payload.autoReplyEnabled
        : current.autoReplyEnabled;

    const nextMessage =
      typeof payload.autoReplyMessage === 'string'
        ? payload.autoReplyMessage.trim().slice(0, 500)
        : current.autoReplyMessage;

    if (nextEnabled && nextMessage.length < 3) {
      throw new BadRequestException(
        'Auto-reply message must be at least 3 characters when enabled.',
      );
    }

    const rawCooldown =
      payload.autoReplyCooldownMinutes !== undefined
        ? Number(payload.autoReplyCooldownMinutes)
        : current.autoReplyCooldownMinutes;
    const nextCooldown = Number.isFinite(rawCooldown)
      ? Math.min(1440, Math.max(1, Math.round(rawCooldown)))
      : current.autoReplyCooldownMinutes;

    let nextCanned = current.cannedReplies;
    if (Array.isArray(payload.cannedReplies)) {
      if (payload.cannedReplies.length > 12) {
        throw new BadRequestException('Maximum of 12 quick replies allowed.');
      }
      nextCanned = payload.cannedReplies
        .map((item, idx) => {
          const label = (item?.label || '').trim().slice(0, 40);
          const text = (item?.text || '').trim().slice(0, 500);
          if (!label || !text) return null;
          const id =
            (item?.id || '').trim().slice(0, 60) ||
            `reply-${Date.now()}-${idx}`;
          return { id, label, text };
        })
        .filter((x): x is CannedReplyItem => x !== null);
    }

    const updated = await this.settingsModel
      .findOneAndUpdate(
        { key: 'global' },
        {
          $set: {
            autoReplyEnabled: nextEnabled,
            autoReplyMessage: nextMessage || DEFAULT_AUTO_REPLY_MESSAGE,
            autoReplyCooldownMinutes: nextCooldown,
            cannedReplies: nextCanned,
            updatedBy: (adminName || '').trim() || 'EcoStep Admin',
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    return {
      autoReplyEnabled: Boolean(updated.autoReplyEnabled),
      autoReplyMessage: updated.autoReplyMessage || DEFAULT_AUTO_REPLY_MESSAGE,
      autoReplyCooldownMinutes: updated.autoReplyCooldownMinutes ?? 60,
      cannedReplies: (updated.cannedReplies || []).map((r) => ({
        id: r.id,
        label: r.label,
        text: r.text,
      })),
      updatedBy: updated.updatedBy || null,
    };
  }

  private shouldSendAutoReply(
    settings: PublicAdminChatSettings,
    lastAutoReplyAt: Date | null | undefined,
    now: Date,
  ): boolean {
    if (!settings.autoReplyEnabled) return false;
    if (!settings.autoReplyMessage || !settings.autoReplyMessage.trim()) return false;
    if (!lastAutoReplyAt) return true;
    const elapsedMs = now.getTime() - new Date(lastAutoReplyAt).getTime();
    return elapsedMs >= settings.autoReplyCooldownMinutes * 60_000;
  }

  private sanitizeVisitorId(visitorId: string): string {
    const clean = (visitorId || '').trim();
    if (!clean || clean.length < 6 || clean.length > 100) {
      throw new BadRequestException('Invalid visitor ID');
    }
    return clean;
  }

  private sanitizeText(text: string): string {
    const clean = (text || '').trim();
    if (!clean) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (clean.length > 2000) {
      throw new BadRequestException('Message is too long (max 2000 characters)');
    }
    return clean;
  }

  async getVisitorThread(visitorId: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    const thread = await this.threadModel.findOne({ visitorId: cleanId }).exec();
    if (!thread) {
      return {
        visitorId: cleanId,
        visitorName: 'Campus Visitor',
        status: 'open' as const,
        unreadByAdmin: 0,
        unreadByVisitor: 0,
        adminLastReadAt: null,
        visitorLastReadAt: null,
        messages: [],
        lastMessageAt: null,
      };
    }
    return thread.toJSON();
  }

  async sendVisitorMessage(visitorId: string, text: string, visitorName?: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    const cleanText = this.sanitizeText(text);
    const cleanName = (visitorName || '').trim().slice(0, 80) || 'Campus Visitor';
    const now = new Date();

    const [existing, settings] = await Promise.all([
      this.threadModel.findOne({ visitorId: cleanId }).exec(),
      this.getSettings(),
    ]);

    if (!existing) {
      const messages: Array<{
        sender: 'visitor' | 'admin';
        senderName: string;
        text: string;
        isAutoReply?: boolean;
        createdAt: Date;
      }> = [
        {
          sender: 'visitor',
          senderName: cleanName,
          text: cleanText,
          createdAt: now,
        },
      ];

      let lastAutoReplyAt: Date | null = null;
      let lastMessageAt = now;

      if (this.shouldSendAutoReply(settings, null, now)) {
        const autoReplyTime = new Date(now.getTime() + 500);
        messages.push({
          sender: 'admin',
          senderName: 'EcoStep Auto-Reply',
          text: settings.autoReplyMessage,
          isAutoReply: true,
          createdAt: autoReplyTime,
        });
        lastAutoReplyAt = autoReplyTime;
        lastMessageAt = autoReplyTime;
      }

      const created = await this.threadModel.create({
        visitorId: cleanId,
        visitorName: cleanName,
        status: 'open',
        unreadByAdmin: 1,
        unreadByVisitor: 0,
        adminLastReadAt: null,
        visitorLastReadAt: lastMessageAt,
        lastAutoReplyAt,
        lastMessageAt,
        messages,
      });
      return created.toJSON();
    }

    if (visitorName && visitorName.trim()) {
      existing.visitorName = cleanName;
    }
    existing.messages.push({
      sender: 'visitor',
      senderName: existing.visitorName || cleanName,
      text: cleanText,
      createdAt: now,
    });
    existing.unreadByAdmin = (existing.unreadByAdmin || 0) + 1;
    existing.unreadByVisitor = 0;
    existing.visitorLastReadAt = now;
    existing.status = 'open';
    existing.lastMessageAt = now;

    if (this.shouldSendAutoReply(settings, existing.lastAutoReplyAt, now)) {
      const autoReplyTime = new Date(now.getTime() + 500);
      existing.messages.push({
        sender: 'admin',
        senderName: 'EcoStep Auto-Reply',
        text: settings.autoReplyMessage,
        isAutoReply: true,
        createdAt: autoReplyTime,
      });
      existing.lastAutoReplyAt = autoReplyTime;
      existing.visitorLastReadAt = autoReplyTime;
      existing.lastMessageAt = autoReplyTime;
    }

    await existing.save();
    return existing.toJSON();
  }

  async markVisitorRead(visitorId: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    const now = new Date();
    await this.threadModel
      .updateOne(
        { visitorId: cleanId },
        { $set: { unreadByVisitor: 0, visitorLastReadAt: now } },
      )
      .exec();
    return { success: true, visitorId: cleanId, visitorLastReadAt: now.toISOString() };
  }

  async listThreadsForAdmin() {
    const threads = await this.threadModel
      .find()
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .exec();

    const items = threads.map((t) => t.toJSON());
    const totalUnread = threads.reduce((sum, t) => sum + (t.unreadByAdmin || 0), 0);

    return {
      threads: items,
      totalUnread,
    };
  }

  async replyAsAdmin(visitorId: string, text: string, adminName?: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    const cleanText = this.sanitizeText(text);
    const senderName = (adminName || '').trim() || 'EcoStep Admin';
    const now = new Date();

    const thread = await this.threadModel.findOne({ visitorId: cleanId }).exec();
    if (!thread) {
      throw new NotFoundException('Conversation not found');
    }

    thread.messages.push({
      sender: 'admin',
      senderName,
      text: cleanText,
      createdAt: now,
    });
    thread.unreadByAdmin = 0;
    thread.unreadByVisitor = (thread.unreadByVisitor || 0) + 1;
    thread.adminLastReadAt = now;
    thread.lastMessageAt = now;

    await thread.save();
    return thread.toJSON();
  }

  async markAdminRead(visitorId: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    const now = new Date();
    await this.threadModel
      .updateOne(
        { visitorId: cleanId },
        { $set: { unreadByAdmin: 0, adminLastReadAt: now } },
      )
      .exec();
    return { success: true, visitorId: cleanId, adminLastReadAt: now.toISOString() };
  }

  async updateThreadStatus(visitorId: string, status: 'open' | 'resolved') {
    const cleanId = this.sanitizeVisitorId(visitorId);
    if (status !== 'open' && status !== 'resolved') {
      throw new BadRequestException('Status must be open or resolved');
    }
    const thread = await this.threadModel
      .findOneAndUpdate(
        { visitorId: cleanId },
        { $set: { status, unreadByAdmin: 0 } },
        { new: true },
      )
      .exec();

    if (!thread) {
      throw new NotFoundException('Conversation not found');
    }
    return thread.toJSON();
  }
}
