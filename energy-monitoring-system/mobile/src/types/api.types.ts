/**
 * API Response Types
 * 
 * Common response structures from the backend API.
 * These match the NestJS backend's ApiResponse wrapper structure.
 */

/**
 * Standard API Response wrapper
 * All backend endpoints wrap their responses in this structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Paginated API Response
 * Used by endpoints that support pagination (e.g., alerts)
 */
export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

/**
 * API Error Response
 * Returned when an API call fails
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
  };
  statusCode: number;
  message?: string;
}
