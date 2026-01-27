import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getNetWorthAt } from '../selectors/finance';
import type { AccountNature } from '../domain/ledger';
import { useAccountStore } from './accountStore';
import { useCurrencyStore } from './currencyStore';
import type { AccountType } from '../types';
import { snapshotService } from '../services/snapshotService';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

// Per-account snapshot for historical tracking
export interface AccountSnapshot {
  accountId: string;
  balance: number; // Balance in original currency
  balanceBase: number; // Balance converted to base currency
  // Reference data preserved in case account is later deleted/renamed
  accountName: string;
  accountType: AccountType;
  currency: string;
  nature: 'asset' | 'liability';
}

export interface NetWorthSnapshot {
  id?: string;
  monthEndLocal: string; // YYYY-MM format (local month end)
  netWorthBase: number; // Net worth in base currency
  totalsByNature: Record<AccountNature, number>; // Totals by account nature in base currency
  accountSnapshots?: AccountSnapshot[]; // Per-account breakdown (optional for backwards compat)
  createdAt: string; // ISO timestamp when snapshot was created
}

interface SnapshotState {
  snapshots: NetWorthSnapshot[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchAll: () => Promise<void>;
  getSnapshot: (monthEnd: string) => NetWorthSnapshot | undefined;
  getHistory: (startMonth?: string, endMonth?: string) => NetWorthSnapshot[];
  createSnapshot: (monthEnd?: string) => Promise<NetWorthSnapshot>;
  ensureCurrentMonthSnapshot: () => Promise<NetWorthSnapshot>;
  clearError: () => void;
}

// Utility to get month end date string in YYYY-MM format
const getMonthEndString = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Utility to get the last day of a month
const getMonthEndDate = (monthEndString: string): Date => {
  const [year, month] = monthEndString.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
};

// Determine if account type is an asset or liability
const LIABILITY_TYPES = ['loan', 'credit-card', 'mortgage'];
const getNatureFromType = (type: string, balance: number): 'asset' | 'liability' => {
  if (LIABILITY_TYPES.includes(type)) return 'liability';
  if (type === 'other') return balance < 0 ? 'liability' : 'asset';
  return 'asset';
};

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],
      loading: false,
      error: null,
      initialized: false,

      fetchAll: async () => {
        if (DEV_MODE) {
          set({ initialized: true });
          return;
        }

        set({ loading: true, error: null });
        try {
          const snapshots = await snapshotService.getAll();
          set({ snapshots, loading: false, initialized: true });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch snapshots',
            loading: false,
            initialized: true,
          });
        }
      },

      getSnapshot: (monthEnd: string) => {
        return get().snapshots.find(s => s.monthEndLocal === monthEnd);
      },

      getHistory: (startMonth?: string, endMonth?: string) => {
        const snapshots = get().snapshots;

        // If no filters, return all snapshots sorted by date
        if (!startMonth && !endMonth) {
          return [...snapshots].sort((a, b) => a.monthEndLocal.localeCompare(b.monthEndLocal));
        }

        return snapshots.filter(s => {
          if (startMonth && s.monthEndLocal < startMonth) return false;
          if (endMonth && s.monthEndLocal > endMonth) return false;
          return true;
        }).sort((a, b) => a.monthEndLocal.localeCompare(b.monthEndLocal));
      },

      createSnapshot: async (monthEnd?: string) => {
        const monthEndString = monthEnd || getMonthEndString();
        const monthEndDate = getMonthEndDate(monthEndString);

        // Get net worth data at month end
        const netWorthData = getNetWorthAt(monthEndDate);

        // Calculate totals by account nature
        const totalsByNature: Record<AccountNature, number> = {
          asset: netWorthData.breakdown.ledger.assets.toMajorUnits() +
                 netWorthData.breakdown.external.assets.toMajorUnits(),
          liability: netWorthData.breakdown.ledger.liabilities.toMajorUnits() +
                    netWorthData.breakdown.external.liabilities.toMajorUnits(),
          income: 0, // Income/expense are flow accounts, not balance sheet items
          expense: 0,
          equity: 0 // Equity is typically calculated as assets - liabilities
        };

        // Capture per-account balances
        const accounts = useAccountStore.getState().accounts;
        const { convertAmount, baseCurrency } = useCurrencyStore.getState();

        const accountSnapshots: AccountSnapshot[] = accounts
          .filter(a => !a.excludeFromTotal) // Only include accounts that count toward net worth
          .map(account => ({
            accountId: account.id,
            balance: account.balance,
            balanceBase: convertAmount(account.balance, account.currency, baseCurrency),
            accountName: account.name,
            accountType: account.type,
            currency: account.currency,
            nature: getNatureFromType(account.type, account.balance),
          }));

        const snapshot: NetWorthSnapshot = {
          monthEndLocal: monthEndString,
          netWorthBase: netWorthData.netWorth.toMajorUnits(),
          totalsByNature,
          accountSnapshots,
          createdAt: new Date().toISOString()
        };

        if (DEV_MODE) {
          // Remove existing snapshot for the same month if it exists
          const existingSnapshots = get().snapshots.filter(s => s.monthEndLocal !== monthEndString);

          set({
            snapshots: [...existingSnapshots, snapshot].sort((a, b) =>
              a.monthEndLocal.localeCompare(b.monthEndLocal)
            )
          });

          return snapshot;
        }

        // Supabase mode
        set({ loading: true, error: null });
        try {
          const savedSnapshot = await snapshotService.create({
            monthEndLocal: monthEndString,
            netWorthBase: snapshot.netWorthBase,
            totalAssets: totalsByNature.asset,
            totalLiabilities: totalsByNature.liability,
            baseCurrency,
            accountSnapshots,
          });

          // Remove existing snapshot for the same month if it exists locally
          const existingSnapshots = get().snapshots.filter(s => s.monthEndLocal !== monthEndString);

          set({
            snapshots: [...existingSnapshots, savedSnapshot].sort((a, b) =>
              a.monthEndLocal.localeCompare(b.monthEndLocal)
            ),
            loading: false,
          });

          return savedSnapshot;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create snapshot',
            loading: false,
          });
          throw error;
        }
      },

      ensureCurrentMonthSnapshot: async () => {
        const currentMonthEnd = getMonthEndString();
        const existing = get().getSnapshot(currentMonthEnd);

        if (existing) {
          return existing;
        }

        return get().createSnapshot(currentMonthEnd);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fintonico-snapshots',
      version: 2,
      partialize: (state) => ({ snapshots: state.snapshots }),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { snapshots?: NetWorthSnapshot[] };

        if (version < 2) {
          // Migration from v1 to v2: add empty accountSnapshots to existing snapshots
          if (state.snapshots) {
            state.snapshots = state.snapshots.map(snapshot => ({
              ...snapshot,
              accountSnapshots: snapshot.accountSnapshots || [],
            }));
          }
        }

        return state as SnapshotState;
      },
    }
  )
);
