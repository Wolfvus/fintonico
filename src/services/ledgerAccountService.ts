/**
 * Ledger Account Service
 * API service for Chart of Accounts CRUD operations with Supabase
 */

import { supabase, supabaseUntyped, getSessionUser } from '../lib/supabase';
import type { LedgerAccount, LedgerAccountNormalBalance } from '../types';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export interface CreateLedgerAccountData {
  name: string;
  accountNumber?: string;
  clabe?: string;
  normalBalance: LedgerAccountNormalBalance;
  isActive?: boolean;
}

export interface UpdateLedgerAccountData {
  name?: string;
  accountNumber?: string;
  clabe?: string;
  normalBalance?: LedgerAccountNormalBalance;
  isActive?: boolean;
}

// Map database row to app LedgerAccount type
function mapRowToLedgerAccount(row: Record<string, unknown>): LedgerAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    accountNumber: row.account_number as string | undefined,
    clabe: row.clabe as string | undefined,
    normalBalance: (row.normal_balance as LedgerAccountNormalBalance) || 'debit',
    isActive: row.is_active !== false,
  };
}

export const ledgerAccountService = {
  /**
   * Get all ledger accounts for the current user
   */
  async getAll(): Promise<LedgerAccount[]> {
    if (DEV_MODE) {
      console.log('[DEV MODE] ledgerAccountService.getAll() - use localStorage');
      return [];
    }

    const user = await getSessionUser();

    const { data, error } = await supabase
      .from('ledger_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch ledger accounts: ${error.message}`);
    }

    return (data || []).map(mapRowToLedgerAccount);
  },

  /**
   * Get only active ledger accounts
   */
  async getActive(): Promise<LedgerAccount[]> {
    if (DEV_MODE) {
      return [];
    }

    const user = await getSessionUser();

    const { data, error } = await supabase
      .from('ledger_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch ledger accounts: ${error.message}`);
    }

    return (data || []).map(mapRowToLedgerAccount);
  },

  /**
   * Get a single ledger account by ID
   */
  async getById(id: string): Promise<LedgerAccount | null> {
    if (DEV_MODE) {
      return null;
    }

    const user = await getSessionUser();

    const { data, error } = await supabase
      .from('ledger_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch ledger account: ${error.message}`);
    }

    return mapRowToLedgerAccount(data);
  },

  /**
   * Create a new ledger account
   */
  async create(account: CreateLedgerAccountData): Promise<LedgerAccount> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const user = await getSessionUser();

    const insertData = {
      user_id: user.id,
      name: account.name,
      account_number: account.accountNumber || null,
      clabe: account.clabe || null,
      normal_balance: account.normalBalance,
      is_active: account.isActive !== false,
    };

    const { data, error } = await supabaseUntyped
      .from('ledger_accounts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ledger account: ${error.message}`);
    }

    return mapRowToLedgerAccount(data);
  },

  /**
   * Update an existing ledger account
   */
  async update(id: string, updates: UpdateLedgerAccountData): Promise<LedgerAccount> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const user = await getSessionUser();

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.accountNumber !== undefined) updateData.account_number = updates.accountNumber;
    if (updates.clabe !== undefined) updateData.clabe = updates.clabe;
    if (updates.normalBalance !== undefined) updateData.normal_balance = updates.normalBalance;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabaseUntyped
      .from('ledger_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ledger account: ${error.message}`);
    }

    return mapRowToLedgerAccount(data);
  },

  /**
   * Delete a ledger account
   */
  async delete(id: string): Promise<void> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const user = await getSessionUser();

    const { error } = await supabase
      .from('ledger_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete ledger account: ${error.message}`);
    }
  },

  /**
   * Toggle account active status
   */
  async toggleActive(id: string): Promise<LedgerAccount> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const account = await this.getById(id);
    if (!account) throw new Error('Ledger account not found');

    return this.update(id, { isActive: !account.isActive });
  },

  /**
   * Bulk create ledger accounts (for import)
   */
  async bulkCreate(accounts: CreateLedgerAccountData[]): Promise<LedgerAccount[]> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const user = await getSessionUser();

    const insertData = accounts.map(account => ({
      user_id: user.id,
      name: account.name,
      account_number: account.accountNumber || null,
      clabe: account.clabe || null,
      normal_balance: account.normalBalance,
      is_active: account.isActive !== false,
    }));

    const { data, error } = await supabaseUntyped
      .from('ledger_accounts')
      .insert(insertData)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create ledger accounts: ${error.message}`);
    }

    return (data || []).map(mapRowToLedgerAccount);
  },
};
