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

// Liability account types
const LIABILITY_TYPES = ['loan', 'credit-card', 'mortgage'];

/**
 * Validate and sanitize account data before storing
 * Throws error if required fields are invalid
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

  // Validate optional fields
  const yieldResult = validatePercentage(account.estimatedYield);
  if (!yieldResult.isValid) {
    throw new Error(yieldResult.error || 'Invalid yield percentage');
  }

  const dueDateResult = validateDayOfMonth(account.recurringDueDate);
  if (!dueDateResult.isValid) {
    throw new Error(dueDateResult.error || 'Invalid due date');
  }

  // Validate optional payment amounts
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

      // addAccount function with validation
      addAccount: (newAccount) => {
        // Validate and sanitize input data
        const validatedData = validateAccountData(newAccount);

        const completeAccount: Account = {
          ...validatedData,
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

      // updateAccount function with validation - accepts partial updates
      updateAccount: (accountId, updates) => {
        const today = new Date().toISOString().split('T')[0];

        // Validate individual fields if they are being updated
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

        // Pass through boolean and date fields without validation
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

        set((state) => ({
          accounts: state.accounts.map(account =>
            account.id === accountId
              ? { ...account, ...validatedUpdates, lastUpdated: today }
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
