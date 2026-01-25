/**
 * Expense Service
 * API service for expense CRUD operations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Expense, ExpenseRating } from '../types';
import type { InsertTables, UpdateTables } from '../types/database';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export interface CreateExpenseData {
  what: string;
  amount: number;
  currency: string;
  rating: ExpenseRating;
  date?: string;
  recurring?: boolean;
}

export interface UpdateExpenseData {
  what?: string;
  amount?: number;
  currency?: string;
  rating?: ExpenseRating;
  date?: string;
  recurring?: boolean;
}

// Map database row to app Expense type
function mapRowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    what: row.what as string,
    amount: Number(row.amount),
    currency: (row.currency as string) || 'MXN',
    rating: row.rating as ExpenseRating,
    date: row.date as string,
    created_at: row.created_at as string,
    recurring: Boolean(row.recurring),
  };
}

export const expenseService = {
  /**
   * Get all expenses for the current user
   */
  async getAll(): Promise<Expense[]> {
    if (DEV_MODE) {
      console.log('[DEV MODE] expenseService.getAll() - use localStorage');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    return (data || []).map(mapRowToExpense);
  },

  /**
   * Get expenses for a specific month
   */
  async getByMonth(year: number, month: number): Promise<Expense[]> {
    if (DEV_MODE) {
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    return (data || []).map(mapRowToExpense);
  },

  /**
   * Get a single expense by ID
   */
  async getById(id: string): Promise<Expense | null> {
    if (DEV_MODE) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }

    return mapRowToExpense(data);
  },

  /**
   * Create a new expense
   */
  async create(expense: CreateExpenseData): Promise<Expense> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData: InsertTables<'expenses'> = {
      user_id: user.id,
      what: expense.what,
      amount: expense.amount,
      currency: expense.currency,
      rating: expense.rating,
      date: expense.date || new Date().toISOString().split('T')[0],
      recurring: expense.recurring || false,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    return mapRowToExpense(data);
  },

  /**
   * Update an existing expense
   */
  async update(id: string, updates: UpdateExpenseData): Promise<Expense> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: UpdateTables<'expenses'> = {};
    if (updates.what !== undefined) updateData.what = updates.what;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.recurring !== undefined) updateData.recurring = updates.recurring;

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update expense: ${error.message}`);
    }

    return mapRowToExpense(data);
  },

  /**
   * Delete an expense
   */
  async delete(id: string): Promise<void> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete expense: ${error.message}`);
    }
  },

  /**
   * Bulk create expenses (for import)
   */
  async bulkCreate(expenses: CreateExpenseData[]): Promise<Expense[]> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData: InsertTables<'expenses'>[] = expenses.map(expense => ({
      user_id: user.id,
      what: expense.what,
      amount: expense.amount,
      currency: expense.currency,
      rating: expense.rating,
      date: expense.date || new Date().toISOString().split('T')[0],
      recurring: expense.recurring || false,
    }));

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create expenses: ${error.message}`);
    }

    return (data || []).map(mapRowToExpense);
  },
};
