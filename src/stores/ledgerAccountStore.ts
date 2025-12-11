import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LedgerAccount } from '../types';

interface LedgerAccountState {
  accounts: LedgerAccount[];
  addAccount: (account: Omit<LedgerAccount, 'id'>) => LedgerAccount;
  deleteAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Omit<LedgerAccount, 'id'>>) => void;
  toggleActive: (accountId: string) => void;
}

export const useLedgerAccountStore = create<LedgerAccountState>()(
  persist(
    (set) => ({
      accounts: [],

      addAccount: (newAccount) => {
        const completeAccount: LedgerAccount = {
          ...newAccount,
          id: crypto.randomUUID(),
        };

        set((state) => ({
          accounts: [...state.accounts, completeAccount],
        }));

        return completeAccount;
      },

      deleteAccount: (accountId) => {
        set((state) => ({
          accounts: state.accounts.filter(account => account.id !== accountId)
        }));
      },

      updateAccount: (accountId, updates) => {
        set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId
              ? { ...account, ...updates }
              : account
          )
        }));
      },

      toggleActive: (accountId) => {
        set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId
              ? { ...account, isActive: !account.isActive }
              : account
          )
        }));
      },
    }),
    {
      name: 'fintonico-ledger-accounts',
    }
  )
);
