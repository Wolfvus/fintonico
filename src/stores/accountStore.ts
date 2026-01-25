import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '../types';
import {
  validateAccountName,
  validateAccountType,
  validateCurrency,
  validateBalance,
  validatePercentage,
  validateDayOfMonth,
} from '../utils/sanitization';
import { netWorthAccountService } from '../services/netWorthAccountService';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

// Liability account types
const LIABILITY_TYPES = ['loan', 'credit-card', 'mortgage'];

/**
 * Validate and sanitize account data before storing
 */
function validateAccountData(account: Omit<Account, 'id'>): Omit<Account, 'id'> {
  const nameResult = validateAccountName(account.name);
  if (!nameResult.isValid) {
    throw new Error(nameResult.error || 'Invalid account name');
  }

  const typeResult = validateAccountType(account.type);
  if (!typeResult.isValid) {
    throw new Error(typeResult.error || 'Invalid account type');
  }

  const currencyResult = validateCurrency(account.currency);
  if (!currencyResult.isValid) {
    throw new Error(currencyResult.error || 'Invalid currency');
  }

  const balanceResult = validateBalance(account.balance);
  if (!balanceResult.isValid) {
    throw new Error(balanceResult.error || 'Invalid balance');
  }

  const yieldResult = validatePercentage(account.estimatedYield);
  if (!yieldResult.isValid) {
    throw new Error(yieldResult.error || 'Invalid yield percentage');
  }

  const dueDateResult = validateDayOfMonth(account.recurringDueDate);
  if (!dueDateResult.isValid) {
    throw new Error(dueDateResult.error || 'Invalid due date');
  }

  let minPayment: number | undefined;
  let paymentToAvoid: number | undefined;

  if (account.minMonthlyPayment !== undefined) {
    const minPaymentResult = validateBalance(account.minMonthlyPayment);
    if (!minPaymentResult.isValid) {
      throw new Error(minPaymentResult.error || 'Invalid minimum payment');
    }
    minPayment = minPaymentResult.sanitizedValue;
  }

  if (account.paymentToAvoidInterest !== undefined) {
    const avoidResult = validateBalance(account.paymentToAvoidInterest);
    if (!avoidResult.isValid) {
      throw new Error(avoidResult.error || 'Invalid payment to avoid interest');
    }
    paymentToAvoid = avoidResult.sanitizedValue;
  }

  return {
    name: nameResult.sanitizedValue,
    type: typeResult.sanitizedValue,
    currency: currencyResult.sanitizedValue,
    balance: balanceResult.sanitizedValue,
    excludeFromTotal: account.excludeFromTotal ?? false,
    dueDate: account.dueDate,
    recurringDueDate: dueDateResult.sanitizedValue,
    isPaidThisMonth: account.isPaidThisMonth,
    lastPaidDate: account.lastPaidDate,
    estimatedYield: yieldResult.sanitizedValue,
    lastUpdated: account.lastUpdated,
    minMonthlyPayment: minPayment,
    paymentToAvoidInterest: paymentToAvoid,
  };
}

// Migration function for old formats
function migrateAccount(account: Account | Record<string, unknown>): Account {
  // Cast to Record for consistent property access
  const raw = account as Record<string, unknown>;
  let migrated: Account;

  // If it already has the right shape, just return it
  if (typeof raw.currency === 'string' && typeof raw.balance === 'number' &&
      typeof raw.id === 'string' && typeof raw.name === 'string' && typeof raw.type === 'string') {
    migrated = account as Account;
  } else if (raw.balances && Array.isArray(raw.balances) && raw.balances.length > 0) {
    const primaryBalance = raw.balances[0] as { currency: string; amount: number };
    migrated = {
      id: raw.id as string,
      name: raw.name as string,
      type: raw.type as Account['type'],
      currency: primaryBalance.currency,
      balance: primaryBalance.amount,
      excludeFromTotal: raw.excludeFromTotal as boolean | undefined,
      dueDate: raw.dueDate as string | undefined,
      recurringDueDate: raw.recurringDueDate as number | undefined,
      isPaidThisMonth: raw.isPaidThisMonth as boolean | undefined,
      lastPaidDate: raw.lastPaidDate as string | undefined,
      estimatedYield: raw.estimatedYield as number | undefined,
      lastUpdated: raw.lastUpdated as string | undefined,
      minMonthlyPayment: raw.minMonthlyPayment as number | undefined,
      paymentToAvoidInterest: raw.paymentToAvoidInterest as number | undefined,
    };
  } else {
    migrated = {
      id: (raw.id as string) || crypto.randomUUID(),
      name: (raw.name as string) || 'Unknown Account',
      type: (raw.type as Account['type']) || 'other',
      currency: 'MXN',
      balance: 0,
    };
  }

  if (LIABILITY_TYPES.includes(migrated.type)) {
    migrated.minMonthlyPayment = migrated.minMonthlyPayment;
    migrated.paymentToAvoidInterest = migrated.paymentToAvoidInterest;
  }

  return migrated;
}

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchAll: () => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account>;
  deleteAccount: (accountId: string) => Promise<void>;
  updateAccount: (accountId: string, updates: Partial<Omit<Account, 'id'>>) => Promise<Account>;
  toggleExcludeFromTotal: (accountId: string) => Promise<void>;
  bulkImport: (accounts: Omit<Account, 'id'>[]) => Promise<Account[]>;
  clearError: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
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
          const accounts = await netWorthAccountService.getAll();
          set({ accounts, loading: false, initialized: true });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch accounts',
            loading: false,
            initialized: true,
          });
        }
      },

      addAccount: async (newAccount) => {
        const validatedData = validateAccountData(newAccount);

        if (DEV_MODE) {
          const completeAccount: Account = {
            ...validatedData,
            id: crypto.randomUUID(),
            lastUpdated: new Date().toISOString().split('T')[0],
          };

          set((state) => ({
            accounts: [...state.accounts, completeAccount],
          }));

          return completeAccount;
        }

        set({ loading: true, error: null });
        try {
          const completeAccount = await netWorthAccountService.create({
            name: validatedData.name,
            type: validatedData.type,
            currency: validatedData.currency,
            balance: validatedData.balance,
            excludeFromTotal: validatedData.excludeFromTotal,
            dueDate: validatedData.dueDate,
            recurringDueDate: validatedData.recurringDueDate,
            estimatedYield: validatedData.estimatedYield,
            minMonthlyPayment: validatedData.minMonthlyPayment,
            paymentToAvoidInterest: validatedData.paymentToAvoidInterest,
          });
          set((state) => ({
            accounts: [...state.accounts, completeAccount],
            loading: false,
          }));
          return completeAccount;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add account',
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
          await netWorthAccountService.delete(accountId);
          set((state) => ({
            accounts: state.accounts.filter(account => account.id !== accountId),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete account',
            loading: false,
          });
          throw error;
        }
      },

      updateAccount: async (accountId, updates) => {
        const today = new Date().toISOString().split('T')[0];
        const validatedUpdates: Partial<Omit<Account, 'id'>> = {};

        if (updates.name !== undefined) {
          const result = validateAccountName(updates.name);
          if (!result.isValid) throw new Error(result.error || 'Invalid name');
          validatedUpdates.name = result.sanitizedValue;
        }

        if (updates.type !== undefined) {
          const result = validateAccountType(updates.type);
          if (!result.isValid) throw new Error(result.error || 'Invalid type');
          validatedUpdates.type = result.sanitizedValue;
        }

        if (updates.currency !== undefined) {
          const result = validateCurrency(updates.currency);
          if (!result.isValid) throw new Error(result.error || 'Invalid currency');
          validatedUpdates.currency = result.sanitizedValue;
        }

        if (updates.balance !== undefined) {
          const result = validateBalance(updates.balance);
          if (!result.isValid) throw new Error(result.error || 'Invalid balance');
          validatedUpdates.balance = result.sanitizedValue;
        }

        if (updates.estimatedYield !== undefined) {
          const result = validatePercentage(updates.estimatedYield);
          if (!result.isValid) throw new Error(result.error || 'Invalid yield');
          validatedUpdates.estimatedYield = result.sanitizedValue;
        }

        if (updates.recurringDueDate !== undefined) {
          const result = validateDayOfMonth(updates.recurringDueDate);
          if (!result.isValid) throw new Error(result.error || 'Invalid due date');
          validatedUpdates.recurringDueDate = result.sanitizedValue;
        }

        if (updates.minMonthlyPayment !== undefined) {
          const result = validateBalance(updates.minMonthlyPayment);
          if (!result.isValid) throw new Error(result.error || 'Invalid min payment');
          validatedUpdates.minMonthlyPayment = result.sanitizedValue;
        }

        if (updates.paymentToAvoidInterest !== undefined) {
          const result = validateBalance(updates.paymentToAvoidInterest);
          if (!result.isValid) throw new Error(result.error || 'Invalid payment');
          validatedUpdates.paymentToAvoidInterest = result.sanitizedValue;
        }

        if (updates.excludeFromTotal !== undefined) {
          validatedUpdates.excludeFromTotal = updates.excludeFromTotal;
        }
        if (updates.isPaidThisMonth !== undefined) {
          validatedUpdates.isPaidThisMonth = updates.isPaidThisMonth;
        }
        if (updates.lastPaidDate !== undefined) {
          validatedUpdates.lastPaidDate = updates.lastPaidDate;
        }
        if (updates.dueDate !== undefined) {
          validatedUpdates.dueDate = updates.dueDate;
        }

        if (DEV_MODE) {
          set((state) => ({
            accounts: state.accounts.map(account =>
              account.id === accountId
                ? { ...account, ...validatedUpdates, lastUpdated: today }
                : account
            )
          }));
          const updated = get().accounts.find(a => a.id === accountId);
          if (!updated) throw new Error('Account not found');
          return updated;
        }

        set({ loading: true, error: null });
        try {
          const updated = await netWorthAccountService.update(accountId, {
            ...validatedUpdates,
            lastUpdated: today,
          });
          set((state) => ({
            accounts: state.accounts.map(account =>
              account.id === accountId ? updated : account
            ),
            loading: false,
          }));
          return updated;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update account',
            loading: false,
          });
          throw error;
        }
      },

      toggleExcludeFromTotal: async (accountId) => {
        const account = get().accounts.find(a => a.id === accountId);
        if (!account) throw new Error('Account not found');

        const today = new Date().toISOString().split('T')[0];

        if (DEV_MODE) {
          set((state) => ({
            accounts: state.accounts.map(a =>
              a.id === accountId
                ? { ...a, excludeFromTotal: !a.excludeFromTotal, lastUpdated: today }
                : a
            )
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await netWorthAccountService.update(accountId, {
            excludeFromTotal: !account.excludeFromTotal,
          });
          set((state) => ({
            accounts: state.accounts.map(a =>
              a.id === accountId
                ? { ...a, excludeFromTotal: !a.excludeFromTotal, lastUpdated: today }
                : a
            ),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to toggle exclude',
            loading: false,
          });
          throw error;
        }
      },

      bulkImport: async (accounts) => {
        const validatedAccounts = accounts.map(validateAccountData);

        if (DEV_MODE) {
          const newAccounts: Account[] = validatedAccounts.map(data => ({
            ...data,
            id: crypto.randomUUID(),
            lastUpdated: new Date().toISOString().split('T')[0],
          }));

          set((state) => ({
            accounts: [...state.accounts, ...newAccounts],
          }));

          return newAccounts;
        }

        set({ loading: true, error: null });
        try {
          const newAccounts = await netWorthAccountService.bulkCreate(
            validatedAccounts.map(data => ({
              name: data.name,
              type: data.type,
              currency: data.currency,
              balance: data.balance,
              excludeFromTotal: data.excludeFromTotal,
              dueDate: data.dueDate,
              recurringDueDate: data.recurringDueDate,
              estimatedYield: data.estimatedYield,
              minMonthlyPayment: data.minMonthlyPayment,
              paymentToAvoidInterest: data.paymentToAvoidInterest,
            }))
          );
          set((state) => ({
            accounts: [...state.accounts, ...newAccounts],
            loading: false,
          }));
          return newAccounts;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to import accounts',
            loading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fintonico-accounts',
      partialize: (state) => DEV_MODE ? { accounts: state.accounts } : {},
      onRehydrateStorage: () => (state) => {
        if (state?.accounts && DEV_MODE) {
          state.accounts = state.accounts.map((account) => migrateAccount(account));
        }
      },
    }
  )
);
