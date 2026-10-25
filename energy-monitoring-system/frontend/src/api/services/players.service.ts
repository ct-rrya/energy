import axios from 'axios';
import { PLAYER_ENDPOINTS } from '../constants';
import type {
  PlayerProfile,
  GuestPlayerSessionResponse,
} from '@/types';

/**
 * Dedicated Axios instance for Guest Player API
 * Independent from administrator authentication to prevent credential cross-contamination.
 */
const playerApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const playersService = {
  /**
   * Create a new guest player with chosen username
   */
  createGuestPlayer: async (
    username: string,
  ): Promise<GuestPlayerSessionResponse> => {
    const response = await playerApiClient.post<GuestPlayerSessionResponse>(
      PLAYER_ENDPOINTS.CREATE_GUEST,
      { username },
    );
    return response.data;
  },

  /**
   * Retrieve current player profile using guest session token
   */
  getCurrentPlayer: async (sessionToken: string): Promise<PlayerProfile> => {
    const response = await playerApiClient.get<PlayerProfile>(
      PLAYER_ENDPOINTS.ME,
      {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'X-Guest-Session': sessionToken,
        },
      },
    );
    return response.data;
  },

  /**
   * End guest session on server
   */
  logout: async (
    sessionToken: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await playerApiClient.post<{ success: boolean; message: string }>(
      PLAYER_ENDPOINTS.LOGOUT,
      {},
      {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'X-Guest-Session': sessionToken,
        },
      },
    );
    return response.data;
  },
};
