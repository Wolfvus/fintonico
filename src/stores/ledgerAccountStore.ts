import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LedgerAccount } from '../types';
import { ledgerAccountService } from '../services/ledgerAccountService';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

type InitializationStatus = 'idle' | 'loading' | 'success' | 'error';

interface LedgerAccountState {
  accounts: LedgerAccount[];
  loading: boolean;
  error: string | null;
  initializationStatus: InitializationStatus;
  errorDetails: string | null;
  isReady: () => boolean;
  fetchAll: () => Promise<void>;
  addAccount: (account: Omit<LedgerAccount, 'id'>) => Promise<LedgerAccount>;
  deleteAccount: (accountId: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<Omit<LedgerAccount, 'id'>>) => Promise<LedgerAccount>;
  toggleActive: (accountId: string) => Promise<void>;
  bulkImport: (accounts: Omit<LedgerAccount, 'id'>[]) => Promise<LedgerAccount[]>;
  clearError: () => void;
}

export const useLedgerAccountStore = create<LedgerAccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      loading: false,
      error: null,
      initializationStatus: 'idle' as InitializationStatus,
      errorDetails: null,

      isReady: () => get().initializationStatus === 'success',

      fetchAll: async () => {
        if (DEV_MODE) {
          set({ initializationStatus: 'success' });
          return;
        }

        set({ initializationStatus: 'loading', loading: true, error: null, errorDetails: null });
        try {
          const accounts = await ledgerAccountService.getAll();
          set({ accounts, loading: false, initializationStatus: 'success' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch ledger accounts';
          set({
            error: message,
            errorDetails: message,
            loading: false,
            initializationStatus: 'error',
          });
        }
      },

      addAccount: async (newAccount) => {
        if (DEV_MODE) {
          const completeAccount: LedgerAccount = {
            ...newAccount,
            id: crypto.randomUUID(),
          };

          set((state) => ({
            accounts: [...state.accounts, completeAccount],
          }));

          return completeAccount;
        }

        set({ loading: true, error: null });
        try {
          const completeAccount = await ledgerAccountService.create({
            name: newAccount.name,
            accountNumber: newAccount.accountNumber,
            clabe: newAccount.clabe,
            normalBalance: newAccount.normalBalance,
            isActive: newAccount.isActive,
          });
          set((state) => ({
            accounts: [...state.accounts, completeAccount],
            loading: false,
          }));
          return completeAccount;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add ledger account',
            loading: false,
          });
          throw error;
        }
      },

      deleteAccount: async (accountId) => {
        if (DEV_MODE) {
          set((state) => ({
            accounts: state.accounts.filter(account => account.id !== accountId)
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await ledgerAccountService.delete(accountId);
          set((state) => ({
            accounts: state.accounts.filter(account => account.id !== accountId),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete ledger account',
            loading: false,
          });
          throw error;
        }
      },

      updateAccount: async (accountId, updates) => {
        if (DEV_MODE) {
          set((state) => ({
            accounts: state.accounts.map(account =>
              account.id === accountId
                ? { ...account, ...updates }
                : account
            )
          }));
          const updated = get().accounts.find(a => a.id === accountId);
          if (!updated) throw new Error('Ledger account not found');
          return updated;
        }

        set({ loading: true, error: null });
        try {
          const updated = await ledgerAccountService.update(accountId, updates);
          set((state) => ({
            accounts: state.accounts.map(account =>
              account.id === accountId ? updated : account
            ),
            loading: false,
          }));
          return updated;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update ledger account',
            loading: false,
          });
          throw error;
        }
      },

      toggleActive: async (accountId) => {
        const account = get().accounts.find(a => a.id === accountId);
        if (!account) throw new Error('Ledger account not found');

        if (DEV_MODE) {
          set((state) => ({
            accounts: state.accounts.map(a =>
              a.id === accountId
                ? { ...a, isActive: !a.isActive }
                : a
            )
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await ledgerAccountService.update(accountId, { isActive: !account.isActive });
          set((state) => ({
            accounts: state.accounts.map(a =>
              a.id === accountId
                ? { ...a, isActive: !a.isActive }
                : a
            ),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to toggle active',
            loading: false,
          });
          throw error;
        }
      },

      bulkImport: async (accounts) => {
        if (DEV_MODE) {
          const newAccounts: LedgerAccount[] = accounts.map(data => ({
            ...data,
            id: crypto.randomUUID(),
          }));

          set((state) => ({
            accounts: [...state.accounts, ...newAccounts],
          }));

          return newAccounts;
        }

        set({ loading: true, error: null });
        try {
          const newAccounts = await ledgerAccountService.bulkCreate(
            accounts.map(data => ({
              name: data.name,
              accountNumber: data.accountNumber,
              clabe: data.clabe,
              normalBalance: data.normalBalance,
              isActive: data.isActive,
            }))
          );
          set((state) => ({
            accounts: [...state.accounts, ...newAccounts],
            loading: false,
          }));
          return newAccounts;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to import ledger accounts',
            loading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fintonico-ledger-accounts',
      partialize: (state) => ({ accounts: state.accounts }),
    }
  )
);
