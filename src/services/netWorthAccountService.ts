/**
 * Net Worth Account Service
 * API service for net worth account CRUD operations with Supabase
 */

import { supabase, supabaseUntyped } from '../lib/supabase';
import type { Account, AccountType } from '../types';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export interface CreateAccountData {
  name: string;
  type: AccountType;
  currency: string;
  balance?: number;
  excludeFromTotal?: boolean;
  dueDate?: string;
  recurringDueDate?: number;
  estimatedYield?: number;
  minMonthlyPayment?: number;
  paymentToAvoidInterest?: number;
}

export interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
  excludeFromTotal?: boolean;
  dueDate?: string;
  recurringDueDate?: number;
  isPaidThisMonth?: boolean;
  lastPaidDate?: string;
  estimatedYield?: number;
  lastUpdated?: string;
  minMonthlyPayment?: number;
  paymentToAvoidInterest?: number;
}

// Map database row to app Account type
function mapRowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as AccountType,
    currency: (row.currency as string) || 'MXN',
    balance: Number(row.balance) || 0,
    excludeFromTotal: Boolean(row.exclude_from_total),
    dueDate: row.due_date as string | undefined,
    recurringDueDate: row.recurring_due_date as number | undefined,
    isPaidThisMonth: Boolean(row.is_paid_this_month),
    lastPaidDate: row.last_paid_date as string | undefined,
    estimatedYield: row.estimated_yield as number | undefined,
    lastUpdated: row.last_updated as string | undefined,
    minMonthlyPayment: row.min_monthly_payment as number | undefined,
    paymentToAvoidInterest: row.payment_to_avoid_interest as number | undefined,
  };
}

export const netWorthAccountService = {
  /**
   * Get all net worth accounts for the current user
   */
  async getAll(): Promise<Account[]> {
    if (DEV_MODE) {
      console.log('[DEV MODE] netWorthAccountService.getAll() - use localStorage');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('net_worth_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return (data || []).map(mapRowToAccount);
  },

  /**
   * Get a single account by ID
   */
  async getById(id: string): Promise<Account | null> {
    if (DEV_MODE) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('net_worth_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return mapRowToAccount(data);
  },

  /**
   * Create a new net worth account
   */
  async create(account: CreateAccountData): Promise<Account> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData = {
      user_id: user.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance || 0,
      exclude_from_total: account.excludeFromTotal || false,
      due_date: account.dueDate || null,
      recurring_due_date: account.recurringDueDate || null,
      estimated_yield: account.estimatedYield || null,
      min_monthly_payment: account.minMonthlyPayment || null,
      payment_to_avoid_interest: account.paymentToAvoidInterest || null,
      last_updated: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabaseUntyped
      .from('net_worth_accounts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }

    return mapRowToAccount(data);
  },

  /**
   * Update an existing net worth account
   */
  async update(id: string, updates: UpdateAccountData): Promise<Account> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: Record<string, unknown> = {
      last_updated: new Date().toISOString().split('T')[0],
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.balance !== undefined) updateData.balance = updates.balance;
    if (updates.excludeFromTotal !== undefined) updateData.exclude_from_total = updates.excludeFromTotal;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.recurringDueDate !== undefined) updateData.recurring_due_date = updates.recurringDueDate;
    if (updates.isPaidThisMonth !== undefined) updateData.is_paid_this_month = updates.isPaidThisMonth;
    if (updates.lastPaidDate !== undefined) updateData.last_paid_date = updates.lastPaidDate;
    if (updates.estimatedYield !== undefined) updateData.estimated_yield = updates.estimatedYield;
    if (updates.minMonthlyPayment !== undefined) updateData.min_monthly_payment = updates.minMonthlyPayment;
    if (updates.paymentToAvoidInterest !== undefined) updateData.payment_to_avoid_interest = updates.paymentToAvoidInterest;

    const { data, error } = await supabaseUntyped
      .from('net_worth_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }

    return mapRowToAccount(data);
  },

  /**
   * Delete a net worth account
   */
  async delete(id: string): Promise<void> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('net_worth_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  },

  /**
   * Toggle exclude from total
   */
  async toggleExcludeFromTotal(id: string): Promise<Account> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const account = await this.getById(id);
    if (!account) throw new Error('Account not found');

    return this.update(id, { excludeFromTotal: !account.excludeFromTotal });
  },

  /**
   * Mark account as paid this month
   */
  async markAsPaid(id: string): Promise<Account> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    return this.update(id, {
      isPaidThisMonth: true,
      lastPaidDate: new Date().toISOString().split('T')[0],
    });
  },

  /**
   * Bulk create accounts (for import)
   */
  async bulkCreate(accounts: CreateAccountData[]): Promise<Account[]> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData = accounts.map(account => ({
      user_id: user.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance || 0,
      exclude_from_total: account.excludeFromTotal || false,
      due_date: account.dueDate || null,
      recurring_due_date: account.recurringDueDate || null,
      estimated_yield: account.estimatedYield || null,
      min_monthly_payment: account.minMonthlyPayment || null,
      payment_to_avoid_interest: account.paymentToAvoidInterest || null,
      last_updated: new Date().toISOString().split('T')[0],
    }));

    const { data, error } = await supabaseUntyped
      .from('net_worth_accounts')
      .insert(insertData)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create accounts: ${error.message}`);
    }

    return (data || []).map(mapRowToAccount);
  },
};
