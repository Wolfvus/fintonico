import { create } from 'zustand';
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
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      
      // Validate and sanitize each expense
      return parsed.filter((expense: any) => {
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
        recurring: Boolean(expense.recurring)
      }));
    } catch (error) {
      console.error('Error loading expenses from localStorage:', error);
      return [];
    }
  },
  set: (expenses: Expense[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to localStorage:', error);
    }
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