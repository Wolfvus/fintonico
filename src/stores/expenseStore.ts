import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCurrencyStore } from './currencyStore';
import type { Expense, ExpenseRating } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';
import { expenseService } from '../services/expenseService';

// Dev mode configuration
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

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
  initialized: boolean;
  fetchAll: () => Promise<void>;
  addExpense: (expense: NewExpense) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<NewExpense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  bulkImport: (expenses: NewExpense[]) => Promise<Expense[]>;
  getMonthlyTotal: () => number;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      loading: false,
      error: null,
      initialized: false,

      fetchAll: async () => {
        if (DEV_MODE) {
          // In dev mode, data comes from localStorage via persist
          set({ initialized: true });
          return;
        }

        set({ loading: true, error: null });
        try {
          const expenses = await expenseService.getAll();
          set({ expenses, loading: false, initialized: true });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch expenses',
            loading: false,
            initialized: true,
          });
        }
      },

      addExpense: async (data: NewExpense) => {
        const sanitizedWhat = sanitizeDescription(data.what);
        const amountResult = validateAmount(String(data.amount));

        if (!sanitizedWhat || !amountResult.isValid) {
          throw new Error('Invalid expense data');
        }

        const expenseData = {
          what: sanitizedWhat,
          amount: data.amount,
          currency: data.currency,
          rating: data.rating,
          date: data.date || new Date().toISOString().split('T')[0],
          recurring: data.recurring || false,
        };

        if (DEV_MODE) {
          // Local-only mode
          const newExpense: Expense = {
            ...expenseData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          };

          set((state) => ({
            expenses: [newExpense, ...state.expenses],
          }));

          return newExpense;
        }

        // Supabase mode
        set({ loading: true, error: null });
        try {
          const newExpense = await expenseService.create(expenseData);
          set((state) => ({
            expenses: [newExpense, ...state.expenses],
            loading: false,
          }));
          return newExpense;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to add expense',
            loading: false,
          });
          throw error;
        }
      },

      updateExpense: async (id: string, updates: Partial<NewExpense>) => {
        // Validate updates
        if (updates.what !== undefined) {
          const sanitized = sanitizeDescription(updates.what);
          if (!sanitized) throw new Error('Invalid description');
          updates.what = sanitized;
        }
        if (updates.amount !== undefined) {
          const result = validateAmount(String(updates.amount));
          if (!result.isValid) throw new Error('Invalid amount');
        }

        if (DEV_MODE) {
          const expense = get().expenses.find(e => e.id === id);
          if (!expense) throw new Error('Expense not found');

          const updatedExpense: Expense = { ...expense, ...updates };
          set((state) => ({
            expenses: state.expenses.map(e => e.id === id ? updatedExpense : e),
          }));
          return updatedExpense;
        }

        set({ loading: true, error: null });
        try {
          const updatedExpense = await expenseService.update(id, updates);
          set((state) => ({
            expenses: state.expenses.map(e => e.id === id ? updatedExpense : e),
            loading: false,
          }));
          return updatedExpense;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update expense',
            loading: false,
          });
          throw error;
        }
      },

      deleteExpense: async (id: string) => {
        if (DEV_MODE) {
          set((state) => ({
            expenses: state.expenses.filter((expense) => expense.id !== id),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await expenseService.delete(id);
          set((state) => ({
            expenses: state.expenses.filter((expense) => expense.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete expense',
            loading: false,
          });
          throw error;
        }
      },

      bulkImport: async (expenses: NewExpense[]) => {
        // Validate all expenses
        const validatedExpenses = expenses.map(data => {
          const sanitizedWhat = sanitizeDescription(data.what);
          const amountResult = validateAmount(String(data.amount));
          if (!sanitizedWhat || !amountResult.isValid) {
            throw new Error(`Invalid expense data: ${data.what}`);
          }
          return {
            what: sanitizedWhat,
            amount: data.amount,
            currency: data.currency,
            rating: data.rating,
            date: data.date || new Date().toISOString().split('T')[0],
            recurring: data.recurring || false,
          };
        });

        if (DEV_MODE) {
          const newExpenses: Expense[] = validatedExpenses.map(data => ({
            ...data,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }));

          set((state) => ({
            expenses: [...newExpenses, ...state.expenses],
          }));

          return newExpenses;
        }

        set({ loading: true, error: null });
        try {
          const newExpenses = await expenseService.bulkCreate(validatedExpenses);
          set((state) => ({
            expenses: [...newExpenses, ...state.expenses],
            loading: false,
          }));
          return newExpenses;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to import expenses',
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

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fintonico-expenses',
      partialize: (state) => ({ expenses: state.expenses }),
      onRehydrateStorage: () => (state) => {
        if (state?.expenses) {
          // Validate and clean up any old data
          state.expenses = state.expenses.filter((expense: unknown) => {
            if (typeof expense !== 'object' || !expense) return false;
            const exp = expense as Record<string, unknown>;
            const whatResult = sanitizeDescription(String(exp.what || ''));
            const amountResult = validateAmount(String(exp.amount || ''));
            const dateResult = validateDate(String(exp.date || ''));
            return whatResult && amountResult.isValid && dateResult.isValid;
          }).map((expense: unknown) => {
            const exp = expense as Record<string, unknown>;
            return {
              id: String(exp.id || crypto.randomUUID()),
              what: sanitizeDescription(String(exp.what)),
              amount: validateAmount(String(exp.amount)).sanitizedValue,
              currency: String(exp.currency || 'MXN'),
              rating: (['essential', 'discretionary', 'luxury'].includes(String(exp.rating))
                ? exp.rating : 'discretionary') as ExpenseRating,
              date: String(exp.date),
              created_at: String(exp.created_at || new Date().toISOString()),
              recurring: Boolean(exp.recurring),
            };
          });
        }
      },
    }
  )
);
