import apiClient from '../client';

export interface AdminChatMessage {
  _id?: string;
  sender: 'visitor' | 'admin';
  senderName: string;
  text: string;
  isAutoReply?: boolean;
  createdAt: string;
}

export interface CannedReplyItem {
  id: string;
  label: string;
  text: string;
}

export interface AdminChatSettings {
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  autoReplyCooldownMinutes: number;
  cannedReplies: CannedReplyItem[];
  updatedBy: string | null;
}

export interface AdminChatThread {
  id?: string;
  visitorId: string;
  visitorName: string;
  status: 'open' | 'resolved';
  unreadByAdmin?: number;
  unreadByVisitor: number;
  adminLastReadAt?: string | null;
  visitorLastReadAt?: string | null;
  messages: AdminChatMessage[];
  lastMessageAt: string | null;
}

export interface AdminThreadsListResponse {
  threads: AdminChatThread[];
  totalUnread: number;
}

export const adminChatService = {
  // Public visitor endpoints
  async getVisitorThread(visitorId: string): Promise<AdminChatThread> {
    const { data } = await apiClient.get<AdminChatThread>(
      `/chat/admin/thread/${encodeURIComponent(visitorId)}`,
    );
    return data;
  },

  async sendVisitorMessage(
    visitorId: string,
    message: string,
    visitorName?: string,
  ): Promise<AdminChatThread> {
    const { data } = await apiClient.post<AdminChatThread>(
      `/chat/admin/thread/${encodeURIComponent(visitorId)}/messages`,
      { message, visitorName },
    );
    return data;
  },

  async markVisitorRead(visitorId: string): Promise<void> {
    await apiClient.patch(`/chat/admin/thread/${encodeURIComponent(visitorId)}/read`);
  },

  // Admin inbox endpoints
  async listThreadsForAdmin(): Promise<AdminThreadsListResponse> {
    const { data } = await apiClient.get<AdminThreadsListResponse>('/chat/admin/threads');
    return data;
  },

  async replyAsAdmin(visitorId: string, message: string): Promise<AdminChatThread> {
    const { data } = await apiClient.post<AdminChatThread>(
      `/chat/admin/threads/${encodeURIComponent(visitorId)}/reply`,
      { message },
    );
    return data;
  },

  async markAdminRead(visitorId: string): Promise<void> {
    await apiClient.patch(`/chat/admin/threads/${encodeURIComponent(visitorId)}/read`);
  },

  async updateThreadStatus(
    visitorId: string,
    status: 'open' | 'resolved',
  ): Promise<AdminChatThread> {
    const { data } = await apiClient.patch<AdminChatThread>(
      `/chat/admin/threads/${encodeURIComponent(visitorId)}/status`,
      { status },
    );
    return data;
  },

  async getSettings(): Promise<AdminChatSettings> {
    const { data } = await apiClient.get<AdminChatSettings>('/chat/admin/settings');
    return data;
  },

  async updateSettings(payload: {
    autoReplyEnabled?: boolean;
    autoReplyMessage?: string;
    autoReplyCooldownMinutes?: number;
    cannedReplies?: Array<{ id?: string; label: string; text: string }>;
  }): Promise<AdminChatSettings> {
    const { data } = await apiClient.patch<AdminChatSettings>(
      '/chat/admin/settings',
      payload,
    );
    return data;
  },
};
