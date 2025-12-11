import { supabaseAdmin } from '../lib/supabase';
import { NotFoundError, BadRequestError, UnbalancedTransactionError } from '../middleware/errorHandler';
import { accountService } from './AccountService';
import type { Database } from '../../src/types/database';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
type Posting = Database['public']['Tables']['postings']['Row'];

export interface PostingInput {
  account_id: string;
  amount_cents: number;
  currency: string;
  is_debit: boolean;
}

export interface CreateTransactionInput {
  date: string;
  description: string;
  memo?: string;
  transaction_type?: 'income' | 'expense' | 'transfer' | 'adjustment';
  postings: PostingInput[];
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense' | 'transfer' | 'adjustment';
  account_id?: string;
  page?: number;
  limit?: number;
}

export interface TransactionWithPostings extends Transaction {
  postings: Posting[];
}

export interface PaginatedTransactions {
  data: TransactionWithPostings[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TransactionService {
  /**
   * Validate that debits equal credits
   */
  private validateBalance(postings: PostingInput[]): boolean {
    const debits = postings.filter((p) => p.is_debit).reduce((sum, p) => sum + p.amount_cents, 0);
    const credits = postings.filter((p) => !p.is_debit).reduce((sum, p) => sum + p.amount_cents, 0);
    return debits === credits;
  }

  /**
   * Verify all accounts belong to user
   */
  private async verifyAccountOwnership(userId: string, accountIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(accountIds)];
    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .in('id', uniqueIds)
      .eq('user_id', userId);

    if (error) throw error;

    if (!accounts || accounts.length !== uniqueIds.length) {
      throw new BadRequestError('One or more accounts not found or do not belong to you');
    }
  }

  /**
   * Get all transactions for a user with optional filtering
   */
  async getTransactions(userId: string, filters: TransactionFilters = {}): Promise<PaginatedTransactions> {
    const { startDate, endDate, type, account_id, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // If filtering by account, get transaction IDs first
    let transactionIds: string[] | null = null;
    if (account_id) {
      const { data: postings } = await supabaseAdmin
        .from('postings')
        .select('transaction_id')
        .eq('account_id', account_id);

      if (!postings || postings.length === 0) {
        return {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      transactionIds = [...new Set(postings.map((p) => p.transaction_id))];
    }

    let query = supabaseAdmin
      .from('transactions')
      .select('*, postings(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (type) {
      query = query.eq('transaction_type', type);
    }

    if (transactionIds) {
      query = query.in('id', transactionIds);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []) as TransactionWithPostings[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get a single transaction by ID with postings
   */
  async getTransactionById(userId: string, transactionId: string): Promise<TransactionWithPostings> {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*, postings(*, accounts(name, type, code))')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      throw new NotFoundError('Transaction', transactionId);
    }
    if (error) throw error;

    return data as TransactionWithPostings;
  }

  /**
   * Create a new transaction with postings
   */
  async createTransaction(userId: string, input: CreateTransactionInput): Promise<TransactionWithPostings> {
    const { postings, ...transactionData } = input;

    // Validate balance
    if (!this.validateBalance(postings)) {
      throw new UnbalancedTransactionError();
    }

    // Verify account ownership
    await this.verifyAccountOwnership(
      userId,
      postings.map((p) => p.account_id)
    );

    // Create transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        ...transactionData,
        user_id: userId,
      })
      .select()
      .single();

    if (txError) throw txError;

    // Create postings
    const postingsData = postings.map((p) => ({
      ...p,
      transaction_id: transaction.id,
    }));

    const { error: postingsError } = await supabaseAdmin.from('postings').insert(postingsData);

    if (postingsError) {
      // Rollback transaction
      await supabaseAdmin.from('transactions').delete().eq('id', transaction.id);
      throw postingsError;
    }

    // Return full transaction
    return this.getTransactionById(userId, transaction.id);
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<CreateTransactionInput>
  ): Promise<TransactionWithPostings> {
    const { postings, ...transactionData } = updates;

    // Verify transaction exists
    await this.getTransactionById(userId, transactionId);

    // Update transaction header if data provided
    if (Object.keys(transactionData).length > 0) {
      const { error } = await supabaseAdmin
        .from('transactions')
        .update(transactionData)
        .eq('id', transactionId);

      if (error) throw error;
    }

    // Update postings if provided
    if (postings) {
      // Validate balance
      if (!this.validateBalance(postings)) {
        throw new UnbalancedTransactionError();
      }

      // Verify account ownership
      await this.verifyAccountOwnership(
        userId,
        postings.map((p) => p.account_id)
      );

      // Delete old postings
      const { error: deleteError } = await supabaseAdmin
        .from('postings')
        .delete()
        .eq('transaction_id', transactionId);

      if (deleteError) throw deleteError;

      // Create new postings
      const postingsData = postings.map((p) => ({
        ...p,
        transaction_id: transactionId,
      }));

      const { error: postingsError } = await supabaseAdmin.from('postings').insert(postingsData);

      if (postingsError) throw postingsError;
    }

    return this.getTransactionById(userId, transactionId);
  }

  /**
   * Delete a transaction (cascades to postings)
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    // Verify transaction exists
    await this.getTransactionById(userId, transactionId);

    const { error } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Create an income transaction
   */
  async createIncomeTransaction(
    userId: string,
    data: {
      date: string;
      description: string;
      amount_cents: number;
      currency: string;
      deposit_account_id: string;
      income_account_id: string;
      memo?: string;
    }
  ): Promise<TransactionWithPostings> {
    return this.createTransaction(userId, {
      date: data.date,
      description: data.description,
      memo: data.memo,
      transaction_type: 'income',
      postings: [
        {
          account_id: data.deposit_account_id,
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_debit: true,
        },
        {
          account_id: data.income_account_id,
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_debit: false,
        },
      ],
    });
  }

  /**
   * Create an expense transaction
   */
  async createExpenseTransaction(
    userId: string,
    data: {
      date: string;
      description: string;
      amount_cents: number;
      currency: string;
      funding_account_id: string;
      expense_account_id: string;
      memo?: string;
    }
  ): Promise<TransactionWithPostings> {
    return this.createTransaction(userId, {
      date: data.date,
      description: data.description,
      memo: data.memo,
      transaction_type: 'expense',
      postings: [
        {
          account_id: data.expense_account_id,
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_debit: true,
        },
        {
          account_id: data.funding_account_id,
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_debit: false,
        },
      ],
    });
  }

  /**
   * Create a transfer transaction
   */
  async createTransferTransaction(
    userId: string,
    data: {
      date: string;
      description: string;
      amount_cents: number;
      currency: string;
      from_account_id: string;
      to_account_id: string;
      memo?: string;
    }
  ): Promise<TransactionWithPostings> {
    return this.createTransaction(userId, {
      date: data.date,
      description: data.description,
      memo: data.memo,
      transaction_type: 'transfer',
      postings: [
        {
          account_id: data.to_account_id,
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_debit: true,
        },
        {
          account_id: data.from_account_id,
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_debit: false,
        },
      ],
    });
  }

  /**
   * Get transactions for a specific account
   */
  async getAccountTransactions(
    userId: string,
    accountId: string,
    filters: Omit<TransactionFilters, 'account_id'> = {}
  ): Promise<PaginatedTransactions> {
    // Verify account ownership
    await accountService.getAccountById(userId, accountId);

    return this.getTransactions(userId, { ...filters, account_id: accountId });
  }
}

export const transactionService = new TransactionService();
