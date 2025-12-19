import type { Request } from 'express';

// Re-export express type augmentation
import './express';

/**
 * Request with guaranteed authenticated user.
 * Use this in route handlers that are protected by authMiddleware.
 */
export interface AuthenticatedRequest extends Request {
  user: NonNullable<Request['user']>;
  userId: NonNullable<Request['userId']>;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
