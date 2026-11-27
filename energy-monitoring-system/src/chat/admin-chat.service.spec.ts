import { AdminChatService } from './admin-chat.service';
import {
  DEFAULT_AUTO_REPLY_MESSAGE,
  DEFAULT_CANNED_REPLIES,
} from './schemas/admin-chat-settings.schema';

describe('AdminChatService (Auto-Reply & Quick Replies)', () => {
  let service: AdminChatService;
  let mockThreadModel: any;
  let mockSettingsModel: any;

  beforeEach(() => {
    mockThreadModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    mockSettingsModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    service = new AdminChatService(mockThreadModel, mockSettingsModel);
  });

  it('appends an automatic greeting when autoReplyEnabled is true on a new visitor thread', async () => {
    mockThreadModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    mockSettingsModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyMessage: 'Thanks for contacting EcoStep!',
        autoReplyCooldownMinutes: 60,
        cannedReplies: DEFAULT_CANNED_REPLIES,
        updatedBy: 'Admin',
      }),
    });
    mockThreadModel.create.mockImplementation(async (doc: any) => ({
      ...doc,
      toJSON: () => doc,
    }));

    const result = await service.sendVisitorMessage(
      'vis-123456',
      'Is the floor tile working?',
      'LeafyTrail',
    );

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].sender).toBe('visitor');
    expect(result.messages[1].sender).toBe('admin');
    expect(result.messages[1].isAutoReply).toBe(true);
    expect(result.messages[1].text).toBe('Thanks for contacting EcoStep!');
    expect(result.unreadByAdmin).toBe(1);
  });

  it('does not spam auto-reply within the cooldown window', async () => {
    const recentAutoReplyAt = new Date(Date.now() - 5 * 60_000); // 5 mins ago
    const existingDoc: any = {
      visitorId: 'vis-123456',
      visitorName: 'LeafyTrail',
      messages: [
        { sender: 'visitor', senderName: 'LeafyTrail', text: 'Hi', createdAt: recentAutoReplyAt },
      ],
      unreadByAdmin: 1,
      unreadByVisitor: 0,
      lastAutoReplyAt: recentAutoReplyAt,
      save: jest.fn().mockResolvedValue(undefined),
      toJSON() {
        return { ...this };
      },
    };

    mockThreadModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(existingDoc) });
    mockSettingsModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        autoReplyEnabled: true,
        autoReplyMessage: DEFAULT_AUTO_REPLY_MESSAGE,
        autoReplyCooldownMinutes: 60,
        cannedReplies: DEFAULT_CANNED_REPLIES,
        updatedBy: 'Admin',
      }),
    });

    const result = await service.sendVisitorMessage('vis-123456', 'Follow up question');

    expect(result.messages).toHaveLength(2); // only original + follow-up, no duplicate auto-reply
    expect(result.messages[1].sender).toBe('visitor');
  });

  it('does not send auto-reply when autoReplyEnabled is false', async () => {
    mockThreadModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    mockSettingsModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        autoReplyEnabled: false,
        autoReplyMessage: DEFAULT_AUTO_REPLY_MESSAGE,
        autoReplyCooldownMinutes: 60,
        cannedReplies: DEFAULT_CANNED_REPLIES,
        updatedBy: null,
      }),
    });
    mockThreadModel.create.mockImplementation(async (doc: any) => ({
      ...doc,
      toJSON: () => doc,
    }));

    const result = await service.sendVisitorMessage('vis-123456', 'Hello admin');

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].sender).toBe('visitor');
  });
});
