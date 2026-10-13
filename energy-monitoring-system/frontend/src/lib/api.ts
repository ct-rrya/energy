/**
 * API Client for EcoStep Chat and Telemetry
 * 
 * Provides type-safe interfaces for communicating with the backend API.
 * Reads API_BASE_URL from environment variables for configuration flexibility.
 * 
 * Requirements: 4.10, 5.11, 11.10, 15.4
 */

/**
 * Request DTO for sending chat messages
 */
export interface SendMessageRequest {
  message: string;
  channel?: 'web' | 'mobile';
}

/**
 * Response DTO for chat API
 */
export interface ChatResponse {
  text: string;
  suggestions?: string[];
  metadata?: {
    commandType?: string;
    dataSource?: string;
  };
}

/**
 * Legacy response wrapper for backward compatibility
 */
interface ChatResponseWrapper {
  success: boolean;
  response: string;
  sessionId: string;
  suggestions?: string[];
  timestamp: string;
}

/**
 * Telemetry data structure
 */
export interface TelemetryData {
  voltage: number;
  current: number;
  power: number;
  energyToday: number;
  timestamp: string;
  status: 'online' | 'offline';
}

/**
 * Error response structure from backend
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  retryAfter?: number; // For rate limit errors (429)
}

/**
 * Get API base URL from environment variables
 * Falls back to localhost if not configured
 * 
 * Requirements: 15.4
 */
const getApiBaseUrl = (): string => {
  // Read from Vite environment variable
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('VITE_API_BASE_URL not configured, using default: http://localhost:3000');
    return 'http://localhost:3000';
  }
  
  return baseUrl;
};

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * API client for chat functionality
 * 
 * Requirements: 4.10, 5.11
 */
export const chat = {
  /**
   * Send a message to the chatbot
   * 
   * @param message - The message text to send
   * @param sessionId - Optional session ID (ignored, kept for compatibility)
   * @returns Promise resolving to ChatResponse wrapped for compatibility
   * @throws Error with user-friendly message on failure
   * 
   * Requirements: 4.10
   */
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponseWrapper> {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/chat/message`;
    const token = getAuthToken();
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          channel: 'web',
        } as SendMessageRequest),
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        // Parse error response
        let errorData: ApiError | null = null;
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, use status text
        }
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Please log in to use EcoChat.');
        }
        
        if (response.status === 429) {
          const retryAfter = errorData?.retryAfter || 60;
          throw new Error(`Too many messages. Please wait ${retryAfter} seconds.`);
        }
        
        if (response.status === 400) {
          throw new Error(errorData?.message || 'Invalid message. Please check your input.');
        }
        
        if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again in a moment.');
        }
        
        // Generic error
        throw new Error(errorData?.message || 'Failed to send message. Please try again.');
      }
      
      // Parse successful response
      const data: ChatResponse = await response.json();
      
      // Wrap in legacy format for compatibility with useChat hook
      const wrappedResponse: ChatResponseWrapper = {
        success: true,
        response: data.text,
        sessionId: sessionId || crypto.randomUUID(),
        suggestions: data.suggestions,
        timestamp: new Date().toISOString(),
      };
      
      return wrappedResponse;
      
    } catch (error) {
      // Network errors or other exceptions
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect. Please check your internet connection.');
      }
      
      // Re-throw our formatted errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Unknown error
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },
};

/**
 * API client for public telemetry data
 * 
 * Requirements: 11.10
 */
export const telemetry = {
  /**
   * Get current system telemetry data
   * 
   * @returns Promise resolving to TelemetryData
   * @throws Error with user-friendly message on failure
   * 
   * Requirements: 11.10
   */
  async getCurrent(): Promise<TelemetryData> {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/public/telemetry`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        // Parse error response
        let errorData: ApiError | null = null;
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, use status text
        }
        
        // Handle specific error cases
        if (response.status === 503) {
          throw new Error('No recent sensor data available');
        }
        
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment.');
        }
        
        // Generic error
        throw new Error(errorData?.message || 'Failed to retrieve telemetry data');
      }
      
      // Parse successful response
      const data: TelemetryData = await response.json();
      return data;
      
    } catch (error) {
      // Network errors or other exceptions
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect. Please check your internet connection.');
      }
      
      // Re-throw our formatted errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Unknown error
      throw new Error('An unexpected error occurred while fetching telemetry data');
    }
  },
};

/**
 * Default export containing all API clients
 */
const api = {
  chat,
  telemetry,
};

export default api;
