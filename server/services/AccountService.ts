import { supabaseAdmin } from '../lib/supabase';
import { NotFoundError, BadRequestError, ConflictError } from '../middleware/errorHandler';
import type { Database } from '../../src/types/database';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

export interface AccountFilters {
  type?: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedAccounts {
  data: Account[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AccountService {
  /**
   * Get all accounts for a user with optional filtering and pagination
   */
  async getAccounts(userId: string, filters: AccountFilters = {}): Promise<PaginatedAccounts> {
    const { type, is_active, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('accounts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('code', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get a single account by ID
   */
  async getAccountById(userId: string, accountId: string): Promise<Account> {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      throw new NotFoundError('Account', accountId);
    }
    if (error) throw error;

    return data;
  }

  /**
   * Get account by code
   */
  async getAccountByCode(userId: string, code: string): Promise<Account | null> {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }
    if (error) throw error;

    return data;
  }

  /**
   * Create a new account
   */
  async createAccount(userId: string, accountData: Omit<AccountInsert, 'user_id'>): Promise<Account> {
    // Check for duplicate code
    const existing = await this.getAccountByCode(userId, accountData.code);
    if (existing) {
      throw new ConflictError(`Account with code '${accountData.code}' already exists`);
    }

    const { data, error } = await supabaseAdmin
      .from('accounts')
      .insert({
        ...accountData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Account with code '${accountData.code}' already exists`);
      }
      throw error;
    }

    return data;
  }

  /**
   * Update an existing account
   */
  async updateAccount(userId: string, accountId: string, updates: AccountUpdate): Promise<Account> {
    // Verify account exists and belongs to user
    await this.getAccountById(userId, accountId);

    // If updating code, check for duplicates
    if (updates.code) {
      const existing = await this.getAccountByCode(userId, updates.code);
      if (existing && existing.id !== accountId) {
        throw new ConflictError(`Account with code '${updates.code}' already exists`);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Account with code '${updates.code}' already exists`);
      }
      throw error;
    }

    return data;
  }

  /**
   * Delete an account (only if no postings exist)
   */
  async deleteAccount(userId: string, accountId: string): Promise<void> {
    // Verify account exists
    await this.getAccountById(userId, accountId);

    // Check for existing postings
    const { count } = await supabaseAdmin
      .from('postings')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (count && count > 0) {
      throw new BadRequestError(
        'Cannot delete account with existing transactions. Deactivate it instead.'
      );
    }

    const { error } = await supabaseAdmin
      .from('accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Deactivate an account (soft delete)
   */
  async deactivateAccount(userId: string, accountId: string): Promise<Account> {
    return this.updateAccount(userId, accountId, { is_active: false });
  }

  /**
   * Reactivate an account
   */
  async reactivateAccount(userId: string, accountId: string): Promise<Account> {
    return this.updateAccount(userId, accountId, { is_active: true });
  }

  /**
   * Get account balance as of a specific date
   */
  async getAccountBalance(
    userId: string,
    accountId: string,
    asOfDate?: string
  ): Promise<{ account_id: string; balance_cents: number; currency: string; as_of_date: string }> {
    const date = asOfDate || new Date().toISOString().split('T')[0];

    // Verify account belongs to user
    const account = await this.getAccountById(userId, accountId);

    // Calculate balance using the database function
    const { data: balance, error } = await supabaseAdmin.rpc('get_account_balance', {
      p_account_id: accountId,
      p_as_of_date: date,
    });

    if (error) throw error;

    return {
      account_id: accountId,
      balance_cents: balance || 0,
      currency: account.currency,
      as_of_date: date,
    };
  }

  /**
   * Get balances for all accounts
   */
  async getAllAccountBalances(
    userId: string,
    asOfDate?: string
  ): Promise<Array<{ account_id: string; account_name: string; account_type: string; balance_cents: number; currency: string }>> {
    const date = asOfDate || new Date().toISOString().split('T')[0];

    // Get all active accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id, name, type, code, currency')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('code');

    if (accountsError) throw accountsError;
    if (!accounts) return [];

    // Get all postings up to date
    const { data: postings, error: postingsError } = await supabaseAdmin
      .from('postings')
      .select('account_id, amount_cents, is_debit, transactions!inner(date, user_id)')
      .eq('transactions.user_id', userId)
      .lte('transactions.date', date);

    if (postingsError) throw postingsError;

    // Calculate balances
    const balanceMap = new Map<string, number>();
    accounts.forEach((account) => balanceMap.set(account.id, 0));

    postings?.forEach((posting: any) => {
      const account = accounts.find((a) => a.id === posting.account_id);
      if (!account) return;

      let amount = posting.amount_cents;

      // Assets & Expenses: Debits increase, Credits decrease
      // Liabilities, Equity & Income: Credits increase, Debits decrease
      if (account.type === 'asset' || account.type === 'expense') {
        amount = posting.is_debit ? amount : -amount;
      } else {
        amount = posting.is_debit ? -amount : amount;
      }

      balanceMap.set(account.id, (balanceMap.get(account.id) || 0) + amount);
    });

    return accounts.map((account) => ({
      account_id: account.id,
      account_name: account.name,
      account_type: account.type,
      balance_cents: balanceMap.get(account.id) || 0,
      currency: account.currency,
    }));
  }

  /**
   * Seed default chart of accounts for a new user
   */
  async seedDefaultAccounts(userId: string): Promise<Account[]> {
    const defaultAccounts: Omit<AccountInsert, 'user_id'>[] = [
      // Asset accounts
      { name: 'Cash', type: 'asset', code: '1000', currency: 'MXN' },
      { name: 'Bank Account', type: 'asset', code: '1100', currency: 'MXN' },
      { name: 'Savings', type: 'asset', code: '1200', currency: 'MXN' },
      { name: 'Investments', type: 'asset', code: '1300', currency: 'MXN' },
      // Liability accounts
      { name: 'Credit Card', type: 'liability', code: '2000', currency: 'MXN' },
      { name: 'Loans', type: 'liability', code: '2100', currency: 'MXN' },
      // Equity accounts
      { name: 'Opening Balance', type: 'equity', code: '3000', currency: 'MXN' },
      { name: 'Retained Earnings', type: 'equity', code: '3100', currency: 'MXN' },
      // Income accounts
      { name: 'Salary', type: 'income', code: '4000', currency: 'MXN' },
      { name: 'Freelance Income', type: 'income', code: '4100', currency: 'MXN' },
      { name: 'Investment Income', type: 'income', code: '4200', currency: 'MXN' },
      { name: 'Other Income', type: 'income', code: '4900', currency: 'MXN' },
      // Expense accounts
      { name: 'Essential - Housing', type: 'expense', code: '5000', currency: 'MXN' },
      { name: 'Essential - Utilities', type: 'expense', code: '5010', currency: 'MXN' },
      { name: 'Essential - Groceries', type: 'expense', code: '5020', currency: 'MXN' },
      { name: 'Essential - Transportation', type: 'expense', code: '5030', currency: 'MXN' },
      { name: 'Essential - Healthcare', type: 'expense', code: '5040', currency: 'MXN' },
      { name: 'Non-Essential - Dining', type: 'expense', code: '5100', currency: 'MXN' },
      { name: 'Non-Essential - Entertainment', type: 'expense', code: '5110', currency: 'MXN' },
      { name: 'Non-Essential - Shopping', type: 'expense', code: '5120', currency: 'MXN' },
      { name: 'Luxury - Travel', type: 'expense', code: '5200', currency: 'MXN' },
      { name: 'Luxury - Premium Services', type: 'expense', code: '5210', currency: 'MXN' },
    ];

    const accountsToInsert = defaultAccounts.map((account) => ({
      ...account,
      user_id: userId,
    }));

    const { data, error } = await supabaseAdmin
      .from('accounts')
      .insert(accountsToInsert)
      .select();

    if (error) throw error;

    return data || [];
  }
}

export const accountService = new AccountService();
