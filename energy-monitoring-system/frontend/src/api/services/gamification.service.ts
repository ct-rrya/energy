import axios from 'axios';
import { GAMIFICATION_ENDPOINTS } from '../constants';
import type {
  Mission,
  QuizSubmissionResult,
  Badge,
  PlayerProgressSummary,
  LeaderboardResponse,
  LeaderboardQuery,
} from '@/types';

/**
 * Dedicated Axios client for Gamification endpoints.
 * Sends guest player credentials via Authorization / X-Guest-Session headers when available.
 */
const gamificationClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getAuthHeaders(sessionToken?: string | null) {
  if (!sessionToken) return {};
  return {
    Authorization: `Bearer ${sessionToken}`,
    'X-Guest-Session': sessionToken,
  };
}

export const gamificationService = {
  /**
   * Fetch all educational missions with completion status if authenticated
   */
  getMissions: async (sessionToken?: string | null): Promise<Mission[]> => {
    const response = await gamificationClient.get<Mission[]>(
      GAMIFICATION_ENDPOINTS.MISSIONS,
      {
        headers: getAuthHeaders(sessionToken),
      },
    );
    return response.data;
  },

  /**
   * Fetch a single mission by ID with lesson content and quiz questions
   */
  getMission: async (
    id: string,
    sessionToken?: string | null,
  ): Promise<Mission> => {
    const response = await gamificationClient.get<Mission>(
      GAMIFICATION_ENDPOINTS.MISSION_DETAILS(id),
      {
        headers: getAuthHeaders(sessionToken),
      },
    );
    return response.data;
  },

  /**
   * Submit quiz answers for scoring and XP/badge rewards
   */
  submitQuiz: async (
    id: string,
    answers: number[],
    sessionToken: string,
  ): Promise<QuizSubmissionResult> => {
    const response = await gamificationClient.post<QuizSubmissionResult>(
      GAMIFICATION_ENDPOINTS.SUBMIT_QUIZ(id),
      { answers },
      {
        headers: getAuthHeaders(sessionToken),
      },
    );
    return response.data;
  },

  /**
   * Fetch current authenticated player's gamification progress summary
   */
  getPlayerProgress: async (
    sessionToken: string,
  ): Promise<PlayerProgressSummary> => {
    const response = await gamificationClient.get<PlayerProgressSummary>(
      GAMIFICATION_ENDPOINTS.PROGRESS,
      {
        headers: getAuthHeaders(sessionToken),
      },
    );
    return response.data;
  },

  /**
   * Fetch all badges with unlock status
   */
  getBadges: async (sessionToken?: string | null): Promise<Badge[]> => {
    const response = await gamificationClient.get<Badge[]>(
      GAMIFICATION_ENDPOINTS.BADGES,
      {
        headers: getAuthHeaders(sessionToken),
      },
    );
    return response.data;
  },

  /**
   * Fetch paginated leaderboard with current player rank
   */
  getLeaderboard: async (
    query: LeaderboardQuery = {},
    sessionToken?: string | null,
  ): Promise<LeaderboardResponse> => {
    const response = await gamificationClient.get<LeaderboardResponse>(
      GAMIFICATION_ENDPOINTS.LEADERBOARD,
      {
        params: query,
        headers: getAuthHeaders(sessionToken),
      },
    );
    return response.data;
  },
};
