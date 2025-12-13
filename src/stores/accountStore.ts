import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '../types';

// Liability account types
const LIABILITY_TYPES = ['loan', 'credit-card', 'mortgage'];

// Migration function to convert old formats and ensure all fields exist
function migrateAccount(account: any): Account {
  let migrated: Account;

  // If account already has the new format (currency + balance fields)
  if (typeof account.currency === 'string' && typeof account.balance === 'number') {
    migrated = account as Account;
  }
  // Migrate from old format (balances array)
  else if (account.balances && Array.isArray(account.balances) && account.balances.length > 0) {
    const primaryBalance = account.balances[0];
    migrated = {
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
      estimatedYield: account.estimatedYield,
      lastUpdated: account.lastUpdated,
      minMonthlyPayment: account.minMonthlyPayment,
      paymentToAvoidInterest: account.paymentToAvoidInterest,
    };
  }
  // Fallback for malformed data
  else {
    migrated = {
      id: account.id || crypto.randomUUID(),
      name: account.name || 'Unknown Account',
      type: account.type || 'other',
      currency: 'MXN',
      balance: 0,
    };
  }

  // Ensure liability-specific fields exist for liability accounts
  if (LIABILITY_TYPES.includes(migrated.type)) {
    // Preserve existing values or default to undefined
    migrated.minMonthlyPayment = migrated.minMonthlyPayment;
    migrated.paymentToAvoidInterest = migrated.paymentToAvoidInterest;
  }

  return migrated;
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
