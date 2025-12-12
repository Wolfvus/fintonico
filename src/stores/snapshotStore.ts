import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getNetWorthAt } from '../selectors/finance';
import type { AccountNature } from '../domain/ledger';

export interface NetWorthSnapshot {
  monthEndLocal: string; // YYYY-MM format (local month end)
  netWorthBase: number; // Net worth in base currency
  totalsByNature: Record<AccountNature, number>; // Totals by account nature in base currency
  createdAt: string; // ISO timestamp when snapshot was created
}

interface SnapshotState {
  snapshots: NetWorthSnapshot[];
  getSnapshot: (monthEnd: string) => NetWorthSnapshot | undefined;
  createSnapshot: (monthEnd?: string) => Promise<NetWorthSnapshot>;
  ensureCurrentMonthSnapshot: () => Promise<NetWorthSnapshot>;
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

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      getSnapshot: (monthEnd: string) => {
        return get().snapshots.find(s => s.monthEndLocal === monthEnd);
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

        const snapshot: NetWorthSnapshot = {
          monthEndLocal: monthEndString,
          netWorthBase: netWorthData.netWorth.toMajorUnits(),
          totalsByNature,
          createdAt: new Date().toISOString()
        };

        // Remove existing snapshot for the same month if it exists
        const existingSnapshots = get().snapshots.filter(s => s.monthEndLocal !== monthEndString);
        
        set({
          snapshots: [...existingSnapshots, snapshot].sort((a, b) => 
            a.monthEndLocal.localeCompare(b.monthEndLocal)
          )
        });

        return snapshot;
      },

      ensureCurrentMonthSnapshot: async () => {
        const currentMonthEnd = getMonthEndString();
        const existing = get().getSnapshot(currentMonthEnd);

        if (existing) {
          return existing;
        }

        return get().createSnapshot(currentMonthEnd);
      },
    }),
    {
      name: 'fintonico-snapshots',
      version: 1
    }
  )
);