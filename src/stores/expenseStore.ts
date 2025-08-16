import { create } from 'zustand';

export type ExpenseRating = 'essential' | 'non_essential' | 'luxury';

export interface Expense {
  id: string;
  what: string;
  amount: number;
  rating: ExpenseRating;
  date: string;
  created_at: string;
}

export interface NewExpense {
  what: string;
  amount: number;
  rating: ExpenseRating;
  date?: string;
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
      return data ? JSON.parse(data) : [];
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
      rating: data.rating,
      date: data.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
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
    return get().expenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getExpensesByRating: () => {
    return get().expenses.reduce((acc, e) => {
      acc[e.rating] = (acc[e.rating] || 0) + e.amount;
      return acc;
    }, {} as Record<ExpenseRating, number>);
  }
}));