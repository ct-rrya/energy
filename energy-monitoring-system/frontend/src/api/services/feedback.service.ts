import apiClient from '../client';

export type FeedbackCategory = 'review' | 'suggestion' | 'issue' | 'general';
export type FeedbackStatus = 'open' | 'resolved';

export interface FeedbackItem {
  id: string;
  authorName: string;
  category: FeedbackCategory;
  rating?: number;
  message: string;
  status: FeedbackStatus;
  upvotes: number;
  hasUpvoted?: boolean;
  adminReply?: string;
  adminReplyBy?: string;
  adminReplyAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  total: number;
  openCount: number;
  resolvedCount: number;
  averageRating: number | null;
  ratingCount: number;
}

export interface FeedbackListResponse {
  success: boolean;
  data: FeedbackItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: FeedbackStats;
}

export interface CreateFeedbackPayload {
  authorName?: string;
  category: FeedbackCategory;
  rating?: number;
  message: string;
}

export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  adminReply?: string;
}

const VOTER_ID_STORAGE_KEY = 'ecostep_feedback_voter_id';

export function getFeedbackVoterId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let existing = localStorage.getItem(VOTER_ID_STORAGE_KEY);
    if (!existing) {
      const randomPart =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      existing = `v_${randomPart}`;
      localStorage.setItem(VOTER_ID_STORAGE_KEY, existing);
    }
    return existing;
  } catch {
    return 'anonymous';
  }
}

export const getFeedbackList = async (params?: {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  sort?: 'newest' | 'top';
}): Promise<FeedbackListResponse> => {
  const response = await apiClient.get<FeedbackListResponse>('/feedback', {
    params: {
      ...params,
      voterId: getFeedbackVoterId(),
    },
  });
  return response.data;
};

export const createFeedback = async (
  payload: CreateFeedbackPayload,
): Promise<FeedbackItem> => {
  const response = await apiClient.post<{ data: FeedbackItem }>('/feedback', payload);
  return response.data.data;
};

export const toggleFeedbackUpvote = async (id: string): Promise<FeedbackItem> => {
  const response = await apiClient.post<{ data: FeedbackItem }>(
    `/feedback/${id}/upvote`,
    { voterId: getFeedbackVoterId() },
  );
  return response.data.data;
};

export const updateFeedbackAdmin = async (
  id: string,
  payload: UpdateFeedbackPayload,
): Promise<FeedbackItem> => {
  const response = await apiClient.patch<{ data: FeedbackItem }>(
    `/feedback/${id}`,
    payload,
  );
  return response.data.data;
};

export const deleteFeedback = async (id: string): Promise<void> => {
  await apiClient.delete(`/feedback/${id}`);
};

export const feedbackService = {
  getFeedbackList,
  createFeedback,
  toggleFeedbackUpvote,
  updateFeedbackAdmin,
  deleteFeedback,
};
