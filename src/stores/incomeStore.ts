import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCurrencyStore } from './currencyStore';
import type { Income, IncomeFrequency } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';
import { incomeService } from '../services/incomeService';

export type { IncomeFrequency } from '../types';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export interface NewIncome {
  source: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  date?: string;
}

type InitializationStatus = 'idle' | 'loading' | 'success' | 'error';

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  error: string | null;
  initializationStatus: InitializationStatus;
  errorDetails: string | null;
  isReady: () => boolean;
  fetchAll: () => Promise<void>;
  addIncome: (income: NewIncome) => Promise<Income>;
  updateIncome: (id: string, updates: Partial<NewIncome>) => Promise<Income>;
  deleteIncome: (id: string) => Promise<void>;
  bulkImport: (incomes: NewIncome[]) => Promise<Income[]>;
  getMonthlyTotal: () => number;
  clearError: () => void;
}

export const useIncomeStore = create<IncomeState>()(
  persist(
    (set, get) => ({
      incomes: [],
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
          const incomes = await incomeService.getAll();
          set({ incomes, loading: false, initializationStatus: 'success' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch income';
          set({
            error: message,
            errorDetails: message,
            loading: false,
            initializationStatus: 'error',
          });
        }
      },

      addIncome: async (data: NewIncome) => {
        const sanitizedSource = sanitizeDescription(data.source);
        const amountResult = validateAmount(String(data.amount));

        if (!sanitizedSource || !amountResult.isValid) {
          throw new Error('Invalid income data');
        }

        const incomeData = {
          source: sanitizedSource,
          amount: data.amount,
          currency: data.currency,
          frequency: data.frequency,
          date: data.date || new Date().toISOString().split('T')[0],
        };

        if (DEV_MODE) {
          const newIncome: Income = {
            ...incomeData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          };

          set((state) => ({
            incomes: [newIncome, ...state.incomes],
          }));

          return newIncome;
        }

        set({ loading: true, error: null });
        try {
          const newIncome = await incomeService.create(incomeData);
          set((state) => ({
            incomes: [newIncome, ...state.incomes],
            loading: false,
          }));
          return newIncome;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add income',
            loading: false,
          });
          throw error;
        }
      },

      updateIncome: async (id: string, updates: Partial<NewIncome>) => {
        if (updates.source !== undefined) {
          const sanitized = sanitizeDescription(updates.source);
          if (!sanitized) throw new Error('Invalid source');
          updates.source = sanitized;
        }
        if (updates.amount !== undefined) {
          const result = validateAmount(String(updates.amount));
          if (!result.isValid) throw new Error('Invalid amount');
        }

        if (DEV_MODE) {
          const income = get().incomes.find(i => i.id === id);
          if (!income) throw new Error('Income not found');

          const updatedIncome: Income = { ...income, ...updates };
          set((state) => ({
            incomes: state.incomes.map(i => i.id === id ? updatedIncome : i),
          }));
          return updatedIncome;
        }

        set({ loading: true, error: null });
        try {
          const updatedIncome = await incomeService.update(id, updates);
          set((state) => ({
            incomes: state.incomes.map(i => i.id === id ? updatedIncome : i),
            loading: false,
          }));
          return updatedIncome;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update income',
            loading: false,
          });
          throw error;
        }
      },

      deleteIncome: async (id: string) => {
        if (DEV_MODE) {
          set((state) => ({
            incomes: state.incomes.filter((income) => income.id !== id),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await incomeService.delete(id);
          set((state) => ({
            incomes: state.incomes.filter((income) => income.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete income',
            loading: false,
          });
          throw error;
        }
      },

      bulkImport: async (incomes: NewIncome[]) => {
        const validatedIncomes = incomes.map(data => {
          const sanitizedSource = sanitizeDescription(data.source);
          const amountResult = validateAmount(String(data.amount));
          if (!sanitizedSource || !amountResult.isValid) {
            throw new Error(`Invalid income data: ${data.source}`);
          }
          return {
            source: sanitizedSource,
            amount: data.amount,
            currency: data.currency,
            frequency: data.frequency,
            date: data.date || new Date().toISOString().split('T')[0],
          };
        });

        if (DEV_MODE) {
          const newIncomes: Income[] = validatedIncomes.map(data => ({
            ...data,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }));

          set((state) => ({
            incomes: [...newIncomes, ...state.incomes],
          }));

          return newIncomes;
        }

        set({ loading: true, error: null });
        try {
          const newIncomes = await incomeService.bulkCreate(validatedIncomes);
          set((state) => ({
            incomes: [...newIncomes, ...state.incomes],
            loading: false,
          }));
          return newIncomes;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to import income',
            loading: false,
          });
          throw error;
        }
      },

      getMonthlyTotal: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const { baseCurrency, convertAmount } = useCurrencyStore.getState();

        return get().incomes
          .filter((income) => {
            const incomeDate = new Date(income.date);
            return incomeDate.getMonth() === currentMonth &&
                   incomeDate.getFullYear() === currentYear;
          })
          .reduce((total, income) => {
            return total + convertAmount(income.amount, income.currency, baseCurrency);
          }, 0);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fintonico-incomes',
      partialize: (state) => ({ incomes: state.incomes }),
      onRehydrateStorage: () => (state) => {
        if (state?.incomes) {
          state.incomes = state.incomes.filter((income: unknown) => {
            if (typeof income !== 'object' || !income) return false;
            const inc = income as Record<string, unknown>;
            const sourceResult = sanitizeDescription(String(inc.source || ''));
            const amountResult = validateAmount(String(inc.amount || ''));
            const dateResult = validateDate(String(inc.date || ''));
            return sourceResult && amountResult.isValid && dateResult.isValid;
          }).map((income: unknown) => {
            const inc = income as Record<string, unknown>;
            let frequency = String(inc.frequency || 'one-time');
            if (frequency === 'yearly') {
              frequency = 'monthly';
            }
            if (!['one-time', 'weekly', 'bi-weekly', 'monthly'].includes(frequency)) {
              frequency = 'one-time';
            }
            return {
              id: String(inc.id || crypto.randomUUID()),
              source: sanitizeDescription(String(inc.source)),
              amount: validateAmount(String(inc.amount)).sanitizedValue,
              currency: String(inc.currency || 'MXN'),
              frequency: frequency as IncomeFrequency,
              date: String(inc.date),
              created_at: String(inc.created_at || new Date().toISOString()),
            };
          });
        }
      },
    }
  )
);
