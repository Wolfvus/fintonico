import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCurrencyStore } from './currencyStore';
import type { Expense, ExpenseRating } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';

export interface NewExpense {
  what: string;
  amount: number;
  currency: string;
  rating: ExpenseRating;
  date?: string;
  recurring?: boolean;
}

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getMonthlyTotal: () => number;
  getExpensesByRating: () => Record<ExpenseRating, number>;
  clearError: () => void;
  // For backwards compatibility
  _deriveExpensesFromLedger: () => Expense[];
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      addExpense: async (data: NewExpense) => {
        const sanitizedWhat = sanitizeDescription(data.what);
        const amountResult = validateAmount(String(data.amount));

        if (!sanitizedWhat || !amountResult.isValid) {
          throw new Error('Invalid expense data');
        }

        const newExpense: Expense = {
          id: crypto.randomUUID(),
          what: sanitizedWhat,
          amount: data.amount,
          currency: data.currency,
          rating: data.rating,
          date: data.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          recurring: data.recurring || false,
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
        }));
      },

      deleteExpense: async (id: string) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },

      getMonthlyTotal: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const { baseCurrency, convertAmount } = useCurrencyStore.getState();

        return get().expenses
          .filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth &&
                   expenseDate.getFullYear() === currentYear;
          })
          .reduce((total, expense) => {
            return total + convertAmount(expense.amount, expense.currency, baseCurrency);
          }, 0);
      },

      getExpensesByRating: () => {
        const { baseCurrency, convertAmount } = useCurrencyStore.getState();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return get().expenses
          .filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth &&
                   expenseDate.getFullYear() === currentYear;
          })
          .reduce((acc, expense) => {
            const convertedAmount = convertAmount(expense.amount, expense.currency, baseCurrency);
            acc[expense.rating] = (acc[expense.rating] || 0) + convertedAmount;
            return acc;
          }, {} as Record<ExpenseRating, number>);
      },

      // For backwards compatibility - just return the stored expenses
      _deriveExpensesFromLedger: () => get().expenses,
    }),
    {
      name: 'fintonico-expenses',
      // Migration from old format
      onRehydrateStorage: () => (state) => {
        if (state?.expenses) {
          // Validate and clean up any old data
          state.expenses = state.expenses.filter((expense: any) => {
            if (typeof expense !== 'object' || !expense) return false;
            const whatResult = sanitizeDescription(expense.what || '');
            const amountResult = validateAmount(String(expense.amount || ''));
            const dateResult = validateDate(expense.date || '');
            return whatResult && amountResult.isValid && dateResult.isValid;
          }).map((expense: any) => ({
            id: String(expense.id || crypto.randomUUID()),
            what: sanitizeDescription(expense.what),
            amount: validateAmount(String(expense.amount)).sanitizedValue,
            currency: String(expense.currency || 'MXN'),
            rating: String(expense.rating || 'non_essential') as ExpenseRating,
            date: expense.date,
            created_at: String(expense.created_at || new Date().toISOString()),
            recurring: Boolean(expense.recurring),
          }));
        }
      },
    }
  )
);
