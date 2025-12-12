import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '../types';

// Migration function to convert old multi-currency accounts to new single-currency format
function migrateAccount(account: any): Account {
  // If account already has the new format (currency + balance fields)
  if (typeof account.currency === 'string' && typeof account.balance === 'number') {
    return account as Account;
  }

  // Migrate from old format (balances array)
  if (account.balances && Array.isArray(account.balances) && account.balances.length > 0) {
    const primaryBalance = account.balances[0];
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: primaryBalance.currency,
      balance: primaryBalance.amount,
      excludeFromTotal: account.excludeFromTotal,
      dueDate: account.dueDate,
      recurringDueDate: account.recurringDueDate,
      isPaidThisMonth: account.isPaidThisMonth,
      lastPaidDate: account.lastPaidDate,
    };
  }

  // Fallback for malformed data
  return {
    id: account.id || crypto.randomUUID(),
    name: account.name || 'Unknown Account',
    type: account.type || 'other',
    currency: 'MXN',
    balance: 0,
  };
}

// Define the Store's State and Actions
interface AccountState {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => Account;
  deleteAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Omit<Account, 'id'>>) => void;
  toggleExcludeFromTotal: (accountId: string) => void;
}

// Implement the Zustand Store
export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      // Initial State
      accounts: [],

      // addAccount function
      addAccount: (newAccount) => {
        const completeAccount: Account = {
          ...newAccount,
          id: crypto.randomUUID(),
          lastUpdated: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          accounts: [...state.accounts, completeAccount],
        }));

        return completeAccount;
      },

      // deleteAccount function
      deleteAccount: (accountId) => {
        set((state) => ({
          accounts: state.accounts.filter(account => account.id !== accountId)
        }));
      },

      // updateAccount function - now accepts partial updates
      updateAccount: (accountId, updates) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId
              ? { ...account, ...updates, lastUpdated: today }
              : account
          )
        }));
      },

      // toggleExcludeFromTotal function
      toggleExcludeFromTotal: (accountId) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId
              ? { ...account, excludeFromTotal: !account.excludeFromTotal, lastUpdated: today }
              : account
          )
        }));
      },
    }),
    {
      name: 'fintonico-accounts',
      // Migration on load
      onRehydrateStorage: () => (state) => {
        if (state?.accounts) {
          state.accounts = state.accounts.map(migrateAccount);
        }
      },
    }
  )
);
