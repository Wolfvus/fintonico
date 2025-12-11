// Income API
import { apiClient } from './client';
import type {
  Income,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  PaginatedResponse,
  PaginationParams,
  DateRangeParams,
} from './types';

export interface IncomeFilters extends PaginationParams, DateRangeParams {
  is_recurring?: boolean;
}

export const incomeApi = {
  /**
   * Get all income entries with optional filtering
   */
  async getAll(filters?: IncomeFilters): Promise<PaginatedResponse<Income>> {
    return apiClient.get<PaginatedResponse<Income>>('/income', filters as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single income entry by ID
   */
  async getById(id: string): Promise<Income> {
    return apiClient.get<Income>(`/income/${id}`);
  },

  /**
   * Create a new income entry
   */
  async create(data: CreateIncomeRequest): Promise<Income> {
    return apiClient.post<Income>('/income', data);
  },

  /**
   * Update an existing income entry
   */
  async update(id: string, data: UpdateIncomeRequest): Promise<Income> {
    return apiClient.put<Income>(`/income/${id}`, data);
  },

  /**
   * Delete an income entry
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/income/${id}`);
  },
};
