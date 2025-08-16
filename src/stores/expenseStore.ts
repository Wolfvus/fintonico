import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';

export type ExpenseRating = 'essential' | 'non_essential' | 'luxury';

export interface Expense {
  id: string;
  what: string;
  amount: number;
  currency: string;
  rating: ExpenseRating;
  date: string;
  created_at: string;
  recurring?: boolean;
}

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
  addExpense: (expense: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => void;
  getMonthlyTotal: () => number;
  getExpensesByRating: () => Record<ExpenseRating, number>;
}

const STORAGE_KEY = 'fintonico-expenses';

const storage = {
  get: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const expenses = data ? JSON.parse(data) : [];
      // Migrate old data without currency field
      return expenses.map((expense: any) => ({
        ...expense,
        currency: expense.currency || 'MXN'
      }));
    } catch {
      return [];
    }
  },
  set: (expenses: Expense[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: storage.get(),
  loading: false,

  addExpense: async (data: NewExpense) => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      what: data.what,
      amount: data.amount,
      currency: data.currency,
      rating: data.rating,
      date: data.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      recurring: data.recurring || false,
    };

    const expenses = [expense, ...get().expenses];
    set({ expenses });
    storage.set(expenses);
  },

  deleteExpense: (id: string) => {
    const expenses = get().expenses.filter(e => e.id !== id);
    set({ expenses });
    storage.set(expenses);
  },

  getMonthlyTotal: () => {
    const now = new Date();
    const { baseCurrency, convertAmount } = useCurrencyStore.getState();
    return get().expenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => {
        const convertedAmount = convertAmount(e.amount, e.currency, baseCurrency);
        return sum + convertedAmount;
      }, 0);
  },

  getExpensesByRating: () => {
    const { baseCurrency, convertAmount } = useCurrencyStore.getState();
    return get().expenses.reduce((acc, e) => {
      const convertedAmount = convertAmount(e.amount, e.currency, baseCurrency);
      acc[e.rating] = (acc[e.rating] || 0) + convertedAmount;
      return acc;
    }, {} as Record<ExpenseRating, number>);
  }
}));