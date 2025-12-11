import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user: User;
  userId: string;
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
