import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCurrencyStore } from './currencyStore';
import type { Income, IncomeFrequency } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';

export type { IncomeFrequency } from '../types';

export interface NewIncome {
  source: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  date?: string;
}

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  error: string | null;
  addIncome: (income: NewIncome) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  getMonthlyTotal: () => number;
}

export const useIncomeStore = create<IncomeState>()(
  persist(
    (set, get) => ({
      incomes: [],
      loading: false,
      error: null,

      addIncome: async (data: NewIncome) => {
        const sanitizedSource = sanitizeDescription(data.source);
        const amountResult = validateAmount(String(data.amount));

        if (!sanitizedSource || !amountResult.isValid) {
          throw new Error('Invalid income data');
        }

        const newIncome: Income = {
          id: crypto.randomUUID(),
          source: sanitizedSource,
          amount: data.amount,
          currency: data.currency,
          frequency: data.frequency,
          date: data.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          incomes: [newIncome, ...state.incomes],
        }));
      },

      deleteIncome: async (id: string) => {
        set((state) => ({
          incomes: state.incomes.filter((income) => income.id !== id),
        }));
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
    }),
    {
      name: 'fintonico-incomes',
      // Migration from old format
      onRehydrateStorage: () => (state) => {
        if (state?.incomes) {
          // Validate and clean up any old data
          state.incomes = state.incomes.filter((income: any) => {
            if (typeof income !== 'object' || !income) return false;
            const sourceResult = sanitizeDescription(income.source || '');
            const amountResult = validateAmount(String(income.amount || ''));
            const dateResult = validateDate(income.date || '');
            return sourceResult && amountResult.isValid && dateResult.isValid;
          }).map((income: any) => {
            // Migrate and validate frequency
            let frequency = String(income.frequency || 'one-time');
            if (frequency === 'yearly') {
              frequency = 'monthly'; // yearly was removed
            }
            if (!['one-time', 'weekly', 'bi-weekly', 'monthly'].includes(frequency)) {
              frequency = 'one-time'; // fallback for invalid values
            }
            return {
              id: String(income.id || crypto.randomUUID()),
              source: sanitizeDescription(income.source),
              amount: validateAmount(String(income.amount)).sanitizedValue,
              currency: String(income.currency || 'MXN'),
              frequency: frequency as IncomeFrequency,
              date: income.date,
              created_at: String(income.created_at || new Date().toISOString()),
            };
          });
        }
      },
    }
  )
);
