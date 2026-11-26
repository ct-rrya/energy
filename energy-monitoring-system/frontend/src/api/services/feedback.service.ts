import apiClient from '../client';
import { getOrCreateVisitorId } from '@/contexts/VisitorContext';

export type FeedbackCategory = 'review' | 'suggestion' | 'issue' | 'general';
export type FeedbackStatus = 'open' | 'resolved';
export type FeedbackTab = 'newest' | 'top' | 'unanswered' | 'resolved';
export type VoteDirection = 'up' | 'down';

export interface FeedbackAnswer {
  id: string;
  authorName: string;
  authorRole: 'visitor' | 'admin';
  body: string;
  voteScore: number;
  isAccepted: boolean;
  parentAnswerId?: string | null;
  replyToAuthor?: string | null;
  userVote?: VoteDirection | null;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  authorName: string;
  category: FeedbackCategory;
  rating?: number;
  message: string;
  status: FeedbackStatus;
  upvotes: number;
  views: number;
  hasUpvoted?: boolean;
  userVote?: VoteDirection | null;
  answers: FeedbackAnswer[];
  answersCount: number;
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
  title?: string;
  authorName?: string;
  category: FeedbackCategory;
  rating?: number;
  message: string;
}

export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  adminReply?: string;
}

export function getFeedbackVoterId(): string {
  return getOrCreateVisitorId();
}

export const getFeedbackList = async (params?: {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  sort?: 'newest' | 'top';
  tab?: FeedbackTab;
}): Promise<FeedbackListResponse> => {
  const response = await apiClient.get<FeedbackListResponse>('/feedback', {
    params: {
      ...params,
      voterId: getFeedbackVoterId(),
    },
  });
  return response.data;
};

export const getFeedbackById = async (
  id: string,
  options?: { noCount?: boolean },
): Promise<FeedbackItem> => {
  const response = await apiClient.get<{ data: FeedbackItem }>(`/feedback/${id}`, {
    params: {
      voterId: getFeedbackVoterId(),
      ...(options?.noCount ? { noCount: 'true' } : {}),
    },
  });
  return response.data.data;
};

export const createFeedback = async (
  payload: CreateFeedbackPayload,
): Promise<FeedbackItem> => {
  const response = await apiClient.post<{ data: FeedbackItem }>('/feedback', payload);
  return response.data.data;
};

export const voteFeedbackPost = async (
  id: string,
  direction: VoteDirection,
): Promise<FeedbackItem> => {
  const response = await apiClient.post<{ data: FeedbackItem }>(
    `/feedback/${id}/vote`,
    { direction, voterId: getFeedbackVoterId() },
  );
  return response.data.data;
};

export const toggleFeedbackUpvote = async (id: string): Promise<FeedbackItem> => {
  return voteFeedbackPost(id, 'up');
};

export const createFeedbackAnswer = async (
  id: string,
  payload: { body: string; authorName?: string; parentAnswerId?: string },
): Promise<FeedbackItem> => {
  const response = await apiClient.post<{ data: FeedbackItem }>(
    `/feedback/${id}/answers`,
    payload,
    { params: { voterId: getFeedbackVoterId() } },
  );
  return response.data.data;
};

export const voteFeedbackAnswer = async (
  id: string,
  answerId: string,
  direction: VoteDirection,
): Promise<FeedbackItem> => {
  const response = await apiClient.post<{ data: FeedbackItem }>(
    `/feedback/${id}/answers/${answerId}/vote`,
    { direction, voterId: getFeedbackVoterId() },
  );
  return response.data.data;
};

export const toggleAcceptFeedbackAnswer = async (
  id: string,
  answerId: string,
): Promise<FeedbackItem> => {
  const response = await apiClient.patch<{ data: FeedbackItem }>(
    `/feedback/${id}/answers/${answerId}/accept`,
  );
  return response.data.data;
};

export const deleteFeedbackAnswer = async (
  id: string,
  answerId: string,
): Promise<FeedbackItem> => {
  const response = await apiClient.delete<{ data: FeedbackItem }>(
    `/feedback/${id}/answers/${answerId}`,
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
  getFeedbackById,
  createFeedback,
  voteFeedbackPost,
  toggleFeedbackUpvote,
  createFeedbackAnswer,
  voteFeedbackAnswer,
  toggleAcceptFeedbackAnswer,
  deleteFeedbackAnswer,
  updateFeedbackAdmin,
  deleteFeedback,
};
