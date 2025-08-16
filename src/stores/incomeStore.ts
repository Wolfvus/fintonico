import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';

export type IncomeFrequency = 'one-time' | 'weekly' | 'yearly' | 'monthly';

export interface Income {
  id: string;
  source: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  date: string;
  created_at: string;
}

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
  addIncome: (income: NewIncome) => Promise<void>;
  deleteIncome: (id: string) => void;
  getMonthlyTotal: () => number;
}

const STORAGE_KEY = 'fintonico-incomes';
const FREQUENCY_MULTIPLIERS: Record<IncomeFrequency, number> = {
  monthly: 1,
  weekly: 4.33,
  yearly: 1/12,
  'one-time': 0
};

const storage = {
  get: (): Income[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const incomes = data ? JSON.parse(data) : [];
      // Migrate old data without currency field
      return incomes.map((income: any) => ({
        ...income,
        currency: income.currency || 'MXN'
      }));
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
      currency: data.currency,
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
    const { baseCurrency, convertAmount } = useCurrencyStore.getState();
    
    // Calculate regular income
    const regularIncome = get().incomes.reduce((total, income) => {
      const convertedAmount = convertAmount(income.amount, income.currency, baseCurrency);
      if (income.frequency === 'one-time') {
        const incomeDate = new Date(income.date);
        if (incomeDate.getMonth() === now.getMonth() && 
            incomeDate.getFullYear() === now.getFullYear()) {
          return total + convertedAmount;
        }
        return total;
      }
      return total + (convertedAmount * FREQUENCY_MULTIPLIERS[income.frequency]);
    }, 0);

    // Calculate investment yields
    const getInvestmentYields = () => {
      const saved = localStorage.getItem('fintonico-assets');
      const assets = saved ? JSON.parse(saved) : [];
      return assets
        .filter((asset: any) => asset.type === 'investment' && asset.yield > 0)
        .reduce((total: number, asset: any) => {
          const monthlyYield = (asset.value * asset.yield / 100) / 12;
          return total + convertAmount(monthlyYield, asset.currency, baseCurrency);
        }, 0);
    };

    return regularIncome + getInvestmentYields();
  }
}));