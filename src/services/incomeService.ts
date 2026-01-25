/**
 * Income Service
 * API service for income CRUD operations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Income, IncomeFrequency } from '../types';
import type { InsertTables, UpdateTables } from '../types/database';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export interface CreateIncomeData {
  source: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  date?: string;
}

export interface UpdateIncomeData {
  source?: string;
  amount?: number;
  currency?: string;
  frequency?: IncomeFrequency;
  date?: string;
}

// Map database row to app Income type
function mapRowToIncome(row: Record<string, unknown>): Income {
  return {
    id: row.id as string,
    source: row.source as string,
    amount: Number(row.amount),
    currency: (row.currency as string) || 'MXN',
    frequency: (row.frequency as IncomeFrequency) || 'one-time',
    date: row.date as string,
    created_at: row.created_at as string,
  };
}

export const incomeService = {
  /**
   * Get all income entries for the current user
   */
  async getAll(): Promise<Income[]> {
    if (DEV_MODE) {
      console.log('[DEV MODE] incomeService.getAll() - use localStorage');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch income: ${error.message}`);
    }

    return (data || []).map(mapRowToIncome);
  },

  /**
   * Get income entries for a specific month
   */
  async getByMonth(year: number, month: number): Promise<Income[]> {
    if (DEV_MODE) {
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch income: ${error.message}`);
    }

    return (data || []).map(mapRowToIncome);
  },

  /**
   * Get a single income entry by ID
   */
  async getById(id: string): Promise<Income | null> {
    if (DEV_MODE) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch income: ${error.message}`);
    }

    return mapRowToIncome(data);
  },

  /**
   * Create a new income entry
   */
  async create(income: CreateIncomeData): Promise<Income> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData: InsertTables<'income'> = {
      user_id: user.id,
      source: income.source,
      amount: income.amount,
      currency: income.currency,
      frequency: income.frequency,
      date: income.date || new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('income')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create income: ${error.message}`);
    }

    return mapRowToIncome(data);
  },

  /**
   * Update an existing income entry
   */
  async update(id: string, updates: UpdateIncomeData): Promise<Income> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: UpdateTables<'income'> = {};
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
    if (updates.date !== undefined) updateData.date = updates.date;

    const { data, error } = await supabase
      .from('income')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update income: ${error.message}`);
    }

    return mapRowToIncome(data);
  },

  /**
   * Delete an income entry
   */
  async delete(id: string): Promise<void> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete income: ${error.message}`);
    }
  },

  /**
   * Bulk create income entries (for import)
   */
  async bulkCreate(incomes: CreateIncomeData[]): Promise<Income[]> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData: InsertTables<'income'>[] = incomes.map(income => ({
      user_id: user.id,
      source: income.source,
      amount: income.amount,
      currency: income.currency,
      frequency: income.frequency,
      date: income.date || new Date().toISOString().split('T')[0],
    }));

    const { data, error } = await supabase
      .from('income')
      .insert(insertData)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create income: ${error.message}`);
    }

    return (data || []).map(mapRowToIncome);
  },
};
