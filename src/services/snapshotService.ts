/**
 * Snapshot Service
 * API service for net worth snapshot CRUD operations with Supabase
 */

import { supabase, supabaseUntyped } from '../lib/supabase';
import type { Account, AccountType } from '../types';
import type { AccountNature } from '../domain/ledger';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

// Types matching the snapshotStore
export interface AccountSnapshot {
  accountId: string;
  balance: number;
  balanceBase: number;
  accountName: string;
  accountType: AccountType;
  currency: string;
  nature: 'asset' | 'liability'; // Only balance sheet items for account snapshots
}

export interface NetWorthSnapshot {
  id?: string;
  monthEndLocal: string;
  netWorthBase: number;
  totalsByNature: Record<AccountNature, number>;
  accountSnapshots?: AccountSnapshot[];
  createdAt: string;
}

export interface CreateSnapshotData {
  monthEndLocal: string;
  netWorthBase: number;
  totalAssets: number;
  totalLiabilities: number;
  baseCurrency: string;
  accountSnapshots?: AccountSnapshot[];
}

// Map database row to app NetWorthSnapshot type
function mapRowToSnapshot(
  row: Record<string, unknown>,
  accountSnapshots?: AccountSnapshot[]
): NetWorthSnapshot {
  return {
    id: row.id as string,
    monthEndLocal: row.month_end_local as string,
    netWorthBase: Number(row.net_worth_base),
    totalsByNature: {
      asset: Number(row.total_assets) || 0,
      liability: Number(row.total_liabilities) || 0,
      income: 0,
      expense: 0,
      equity: 0,
    },
    accountSnapshots,
    createdAt: row.created_at as string,
  };
}

// Map database row to AccountSnapshot
function mapRowToAccountSnapshot(row: Record<string, unknown>): AccountSnapshot {
  return {
    accountId: row.account_id as string,
    balance: Number(row.balance),
    balanceBase: Number(row.balance_base),
    accountName: row.account_name as string,
    accountType: row.account_type as AccountType,
    currency: row.currency as string,
    nature: row.nature as 'asset' | 'liability',
  };
}

export const snapshotService = {
  /**
   * Get all snapshots for the current user
   */
  async getAll(): Promise<NetWorthSnapshot[]> {
    if (DEV_MODE) {
      console.log('[DEV MODE] snapshotService.getAll() - use localStorage');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('month_end_local', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    return (data || []).map(row => mapRowToSnapshot(row));
  },

  /**
   * Get snapshots within a date range
   */
  async getByDateRange(startMonth?: string, endMonth?: string): Promise<NetWorthSnapshot[]> {
    if (DEV_MODE) {
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', user.id);

    if (startMonth) {
      query = query.gte('month_end_local', startMonth);
    }
    if (endMonth) {
      query = query.lte('month_end_local', endMonth);
    }

    const { data, error } = await query.order('month_end_local', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    return (data || []).map(row => mapRowToSnapshot(row));
  },

  /**
   * Get a snapshot for a specific month
   */
  async getByMonth(monthEndLocal: string): Promise<NetWorthSnapshot | null> {
    if (DEV_MODE) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the snapshot
    const { data: snapshotData, error: snapshotError } = await supabaseUntyped
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_end_local', monthEndLocal)
      .single();

    if (snapshotError) {
      if (snapshotError.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch snapshot: ${snapshotError.message}`);
    }

    // Get account snapshots for this snapshot
    const { data: accountData, error: accountError } = await supabaseUntyped
      .from('account_snapshots')
      .select('*')
      .eq('snapshot_id', snapshotData.id);

    if (accountError) {
      throw new Error(`Failed to fetch account snapshots: ${accountError.message}`);
    }

    const accountSnapshots = (accountData || []).map(mapRowToAccountSnapshot);
    return mapRowToSnapshot(snapshotData, accountSnapshots);
  },

  /**
   * Create a new snapshot
   */
  async create(snapshot: CreateSnapshotData): Promise<NetWorthSnapshot> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Insert the main snapshot
    const snapshotInsert = {
      user_id: user.id,
      month_end_local: snapshot.monthEndLocal,
      net_worth_base: snapshot.netWorthBase,
      total_assets: snapshot.totalAssets,
      total_liabilities: snapshot.totalLiabilities,
      base_currency: snapshot.baseCurrency,
    };

    const { data: snapshotData, error: snapshotError } = await supabaseUntyped
      .from('net_worth_snapshots')
      .insert(snapshotInsert)
      .select()
      .single();

    if (snapshotError) {
      throw new Error(`Failed to create snapshot: ${snapshotError.message}`);
    }

    // Insert account snapshots if provided
    if (snapshot.accountSnapshots && snapshot.accountSnapshots.length > 0) {
      const accountInserts = snapshot.accountSnapshots.map(as => ({
        snapshot_id: snapshotData.id,
        account_id: as.accountId,
        account_name: as.accountName,
        account_type: as.accountType,
        nature: as.nature,
        currency: as.currency,
        balance: as.balance,
        balance_base: as.balanceBase,
      }));

      const { error: accountError } = await supabaseUntyped
        .from('account_snapshots')
        .insert(accountInserts);

      if (accountError) {
        // Log for debugging, but also throw so callers know snapshot is incomplete
        console.error('Failed to create account snapshots:', accountError);
        throw new Error(`Snapshot created but account details failed to save: ${accountError.message}`);
      }
    }

    return mapRowToSnapshot(snapshotData, snapshot.accountSnapshots);
  },

  /**
   * Create or update snapshot for current month
   */
  async upsertCurrentMonth(
    accounts: Account[],
    baseCurrency: string,
    convertAmount: (amount: number, from: string, to: string) => number
  ): Promise<NetWorthSnapshot> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const now = new Date();
    const monthEndLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Calculate totals
    let totalAssets = 0;
    let totalLiabilities = 0;
    const accountSnapshots: AccountSnapshot[] = [];

    const getAccountNature = (type: AccountType): 'asset' | 'liability' => {
      const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];
      return liabilityTypes.includes(type) ? 'liability' : 'asset';
    };

    for (const account of accounts) {
      if (account.excludeFromTotal) continue;

      const nature = getAccountNature(account.type);
      const balanceBase = convertAmount(account.balance, account.currency, baseCurrency);

      if (nature === 'asset') {
        totalAssets += balanceBase;
      } else {
        totalLiabilities += Math.abs(balanceBase);
      }

      accountSnapshots.push({
        accountId: account.id,
        balance: account.balance,
        balanceBase,
        accountName: account.name,
        accountType: account.type,
        currency: account.currency,
        nature,
      });
    }

    const netWorthBase = totalAssets - totalLiabilities;

    // Check if snapshot exists for this month
    const existing = await this.getByMonth(monthEndLocal);

    if (existing && existing.id) {
      // Delete existing account snapshots and snapshot
      await supabase
        .from('account_snapshots')
        .delete()
        .eq('snapshot_id', existing.id);

      await supabase
        .from('net_worth_snapshots')
        .delete()
        .eq('id', existing.id);
    }

    // Create new snapshot
    return this.create({
      monthEndLocal,
      netWorthBase,
      totalAssets,
      totalLiabilities,
      baseCurrency,
      accountSnapshots,
    });
  },

  /**
   * Delete a snapshot
   */
  async delete(id: string): Promise<void> {
    if (DEV_MODE) {
      throw new Error('DEV_MODE: Use localStorage store instead');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Account snapshots will be deleted by CASCADE
    const { error } = await supabase
      .from('net_worth_snapshots')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete snapshot: ${error.message}`);
    }
  },

  /**
   * Get month-over-month change
   */
  async getMoMChange(): Promise<{ amount: number; percentage: number } | null> {
    if (DEV_MODE) {
      return null;
    }

    const snapshots = await this.getAll();
    if (snapshots.length < 2) return null;

    // Sorted by date descending, so [0] is current, [1] is previous
    const current = snapshots[0];
    const previous = snapshots[1];

    const amount = current.netWorthBase - previous.netWorthBase;
    const percentage = previous.netWorthBase !== 0
      ? (amount / Math.abs(previous.netWorthBase)) * 100
      : 0;

    return { amount, percentage };
  },
};
