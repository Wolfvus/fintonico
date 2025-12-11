// Transactions API
import { apiClient } from './client';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  PaginatedResponse,
} from './types';

export const transactionsApi = {
  /**
   * Get all transactions with optional filtering
   */
  async getAll(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    return apiClient.get<PaginatedResponse<Transaction>>('/transactions', filters as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single transaction by ID (includes postings)
   */
  async getById(id: string): Promise<Transaction> {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },

  /**
   * Create a new transaction with postings
   */
  async create(data: CreateTransactionRequest): Promise<Transaction> {
    return apiClient.post<Transaction>('/transactions', data);
  },

  /**
   * Update an existing transaction
   */
  async update(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    return apiClient.put<Transaction>(`/transactions/${id}`, data);
  },

  /**
   * Delete a transaction (cascades to postings)
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/transactions/${id}`);
  },
};
