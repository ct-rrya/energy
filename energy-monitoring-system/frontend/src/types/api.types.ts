/**
 * Standard API Response Format
 * Matches backend NestJS response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API Error Response
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}
