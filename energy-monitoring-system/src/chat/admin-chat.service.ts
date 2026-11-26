import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminChatThread,
  AdminChatThreadDocument,
} from './schemas/admin-chat-thread.schema';

@Injectable()
export class AdminChatService {
  constructor(
    @InjectModel(AdminChatThread.name)
    private readonly threadModel: Model<AdminChatThreadDocument>,
  ) {}

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
        unreadByVisitor: 0,
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

    const existing = await this.threadModel.findOne({ visitorId: cleanId }).exec();
    if (!existing) {
      const created = await this.threadModel.create({
        visitorId: cleanId,
        visitorName: cleanName,
        status: 'open',
        unreadByAdmin: 1,
        unreadByVisitor: 0,
        lastMessageAt: now,
        messages: [
          {
            sender: 'visitor',
            senderName: cleanName,
            text: cleanText,
            createdAt: now,
          },
        ],
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
    existing.status = 'open';
    existing.lastMessageAt = now;

    await existing.save();
    return existing.toJSON();
  }

  async markVisitorRead(visitorId: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    await this.threadModel
      .updateOne({ visitorId: cleanId }, { $set: { unreadByVisitor: 0 } })
      .exec();
    return { success: true };
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
    thread.lastMessageAt = now;

    await thread.save();
    return thread.toJSON();
  }

  async markAdminRead(visitorId: string) {
    const cleanId = this.sanitizeVisitorId(visitorId);
    await this.threadModel
      .updateOne({ visitorId: cleanId }, { $set: { unreadByAdmin: 0 } })
      .exec();
    return { success: true };
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
