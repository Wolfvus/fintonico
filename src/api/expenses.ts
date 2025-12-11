// Expenses API
import { apiClient } from './client';
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  CategorizationResult,
  PaginatedResponse,
} from './types';

export const expensesApi = {
  /**
   * Get all expenses with optional filtering
   */
  async getAll(filters?: ExpenseFilters): Promise<PaginatedResponse<Expense>> {
    return apiClient.get<PaginatedResponse<Expense>>('/expenses', filters as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single expense by ID
   */
  async getById(id: string): Promise<Expense> {
    return apiClient.get<Expense>(`/expenses/${id}`);
  },

  /**
   * Create a new expense
   */
  async create(data: CreateExpenseRequest): Promise<Expense> {
    return apiClient.post<Expense>('/expenses', data);
  },

  /**
   * Update an existing expense
   */
  async update(id: string, data: UpdateExpenseRequest): Promise<Expense> {
    return apiClient.put<Expense>(`/expenses/${id}`, data);
  },

  /**
   * Delete an expense
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/expenses/${id}`);
  },

  /**
   * Get AI-powered categorization for an expense
   */
  async categorize(id: string): Promise<CategorizationResult> {
    return apiClient.post<CategorizationResult>(`/expenses/${id}/categorize`);
  },
};
