import { create } from 'zustand';

export type IncomeFrequency = 'monthly' | 'weekly' | 'biweekly' | 'yearly' | 'one-time';

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: IncomeFrequency;
  date: string;
  created_at: string;
}

export interface NewIncome {
  source: string;
  amount: number;
  frequency: IncomeFrequency;
  date?: string;
}

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  addIncome: (income: NewIncome) => Promise<void>;
  deleteIncome: (id: string) => void;
  getMonthlyTotal: () => number;
}

const STORAGE_KEY = 'fintonico-incomes';
const FREQUENCY_MULTIPLIERS: Record<IncomeFrequency, number> = {
  monthly: 1,
  weekly: 4.33,
  biweekly: 2.17,
  yearly: 1/12,
  'one-time': 0
};

const storage = {
  get: (): Income[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  set: (incomes: Income[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incomes));
  }
};

export const useIncomeStore = create<IncomeState>((set, get) => ({
  incomes: storage.get(),
  loading: false,

  addIncome: async (data: NewIncome) => {
    const income: Income = {
      id: crypto.randomUUID(),
      source: data.source,
      amount: data.amount,
      frequency: data.frequency,
      date: data.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const incomes = [income, ...get().incomes];
    set({ incomes });
    storage.set(incomes);
  },

  deleteIncome: (id: string) => {
    const incomes = get().incomes.filter(i => i.id !== id);
    set({ incomes });
    storage.set(incomes);
  },

  getMonthlyTotal: () => {
    const now = new Date();
    return get().incomes.reduce((total, income) => {
      if (income.frequency === 'one-time') {
        const incomeDate = new Date(income.date);
        if (incomeDate.getMonth() === now.getMonth() && 
            incomeDate.getFullYear() === now.getFullYear()) {
          return total + income.amount;
        }
        return total;
      }
      return total + (income.amount * FREQUENCY_MULTIPLIERS[income.frequency]);
    }, 0);
  }
}));