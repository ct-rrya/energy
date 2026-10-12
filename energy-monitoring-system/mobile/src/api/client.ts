/**
 * API Client
 * 
 * Configured axios instance with request/response interceptors.
 * Follows the pattern from frontend/src/api/client.ts but adapted for React Native.
 * 
 * Request interceptor: Attaches JWT token as Authorization Bearer header
 * Response interceptor: Handles 401 errors (expired/invalid token)
 */

import axios from 'axios';
import { getToken, clearAuth } from '../utils/secureStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Registry for 401 event listeners (used by AuthContext to trigger logout)
const unauthorizedListeners: Array<() => void> = [];

export function onUnauthorized(callback: () => void): () => void {
  unauthorizedListeners.push(callback);
  // Return unsubscribe function
  return () => {
    const index = unauthorizedListeners.indexOf(callback);
    if (index > -1) {
      unauthorizedListeners.splice(index, 1);
    }
  };
}

function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((callback) => callback());
}

// Request interceptor: Attach JWT token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If token retrieval fails, proceed without token
      console.error('Failed to attach token to request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 (unauthorized) errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Clear stored auth data and notify listeners (AuthContext will handle logout)
      await clearAuth();
      notifyUnauthorized();
    }

    // Return error for service layer to handle
    return Promise.reject(error);
  }
);

export default apiClient;
