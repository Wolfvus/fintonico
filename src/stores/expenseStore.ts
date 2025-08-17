import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';
import type { Expense, ExpenseRating } from '../types';

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
  addTestData: () => void;
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
  },

  addTestData: () => {
    const testExpenses = [
      { what: 'Grocery shopping at Walmart', rating: 'essential' as ExpenseRating, amount: 125.50, currency: 'USD' },
      { what: 'Coffee at Starbucks', rating: 'non_essential' as ExpenseRating, amount: 5.75, currency: 'USD' },
      { what: 'Gas station fill-up', rating: 'essential' as ExpenseRating, amount: 45.00, currency: 'USD' },
      { what: 'Netflix subscription', rating: 'non_essential' as ExpenseRating, amount: 15.99, currency: 'USD' },
      { what: 'Dinner at fancy restaurant', rating: 'luxury' as ExpenseRating, amount: 85.00, currency: 'USD' },
      { what: 'Monthly rent payment', rating: 'essential' as ExpenseRating, amount: 1250.00, currency: 'USD', recurring: true },
      { what: 'Internet bill', rating: 'essential' as ExpenseRating, amount: 79.99, currency: 'USD', recurring: true },
      { what: 'Designer sneakers', rating: 'luxury' as ExpenseRating, amount: 180.00, currency: 'USD' },
      { what: 'Uber ride to work', rating: 'non_essential' as ExpenseRating, amount: 12.50, currency: 'USD' },
      { what: 'Pharmacy prescription', rating: 'essential' as ExpenseRating, amount: 25.00, currency: 'USD' },
      { what: 'Movie tickets', rating: 'non_essential' as ExpenseRating, amount: 24.00, currency: 'USD' },
      { what: 'Gym membership', rating: 'non_essential' as ExpenseRating, amount: 39.99, currency: 'USD', recurring: true },
      { what: 'Electric bill', rating: 'essential' as ExpenseRating, amount: 95.50, currency: 'USD', recurring: true },
      { what: 'Lunch at food truck', rating: 'non_essential' as ExpenseRating, amount: 8.50, currency: 'USD' },
      { what: 'Car insurance', rating: 'essential' as ExpenseRating, amount: 120.00, currency: 'USD', recurring: true },
      { what: 'Books from Amazon', rating: 'non_essential' as ExpenseRating, amount: 32.99, currency: 'USD' },
      { what: 'Spa treatment', rating: 'luxury' as ExpenseRating, amount: 150.00, currency: 'USD' },
      { what: 'Phone bill', rating: 'essential' as ExpenseRating, amount: 65.00, currency: 'USD', recurring: true },
      { what: 'Concert tickets', rating: 'luxury' as ExpenseRating, amount: 125.00, currency: 'USD' },
      { what: 'Takeout pizza', rating: 'non_essential' as ExpenseRating, amount: 18.75, currency: 'USD' },
      { what: 'Car maintenance', rating: 'essential' as ExpenseRating, amount: 250.00, currency: 'USD' },
      { what: 'Video game purchase', rating: 'luxury' as ExpenseRating, amount: 59.99, currency: 'USD' },
      { what: 'Dentist appointment', rating: 'essential' as ExpenseRating, amount: 180.00, currency: 'USD' },
      { what: 'Clothing shopping', rating: 'non_essential' as ExpenseRating, amount: 75.50, currency: 'USD' },
      { what: 'Wine tasting event', rating: 'luxury' as ExpenseRating, amount: 95.00, currency: 'USD' },
      { what: 'Home insurance', rating: 'essential' as ExpenseRating, amount: 150.00, currency: 'USD', recurring: true },
      { what: 'Fast food lunch', rating: 'non_essential' as ExpenseRating, amount: 9.99, currency: 'USD' },
      { what: 'Spotify premium', rating: 'non_essential' as ExpenseRating, amount: 9.99, currency: 'USD', recurring: true },
      { what: 'Emergency vet visit', rating: 'essential' as ExpenseRating, amount: 300.00, currency: 'USD' },
      { what: 'Weekend getaway hotel', rating: 'luxury' as ExpenseRating, amount: 220.00, currency: 'USD' }
    ];

    const currencies = ['USD', 'MXN', 'EUR'];
    
    const expenses = testExpenses.map((expense, index) => ({
      id: `test-expense-${index + 1}`,
      what: expense.what,
      amount: expense.amount,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      rating: expense.rating,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      recurring: expense.recurring || false
    }));

    const allExpenses = [...expenses, ...get().expenses];
    set({ expenses: allExpenses });
    storage.set(allExpenses);
  }
}));