// Accounts API
import { apiClient } from './client';
import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountBalance,
  PaginatedResponse,
  PaginationParams,
  AccountType,
} from './types';

export interface AccountFilters extends PaginationParams {
  type?: AccountType;
  is_active?: boolean;
}

export const accountsApi = {
  /**
   * Get all accounts with optional filtering
   */
  async getAll(filters?: AccountFilters): Promise<PaginatedResponse<Account>> {
    return apiClient.get<PaginatedResponse<Account>>('/accounts', filters as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single account by ID
   */
  async getById(id: string): Promise<Account> {
    return apiClient.get<Account>(`/accounts/${id}`);
  },

  /**
   * Create a new account
   */
  async create(data: CreateAccountRequest): Promise<Account> {
    return apiClient.post<Account>('/accounts', data);
  },

  /**
   * Update an existing account
   */
  async update(id: string, data: UpdateAccountRequest): Promise<Account> {
    return apiClient.put<Account>(`/accounts/${id}`, data);
  },

  /**
   * Delete an account
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/accounts/${id}`);
  },

  /**
   * Get account balance as of a specific date
   */
  async getBalance(id: string, asOfDate?: string): Promise<AccountBalance> {
    return apiClient.get<AccountBalance>(`/accounts/${id}/balance`, { asOfDate });
  },
};
