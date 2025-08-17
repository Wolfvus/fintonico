import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';
import type { Income } from '../types';

export type IncomeFrequency = 'one-time' | 'weekly' | 'yearly' | 'monthly';

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
  generateInvestmentYields: () => void;
  addTestData: () => void;
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
  },

  generateInvestmentYields: () => {
    const saved = localStorage.getItem('fintonico-assets');
    const assets = saved ? JSON.parse(saved) : [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    
    // Check if we already have investment yields for this month
    const existingYields = get().incomes.filter(income => 
      income.source.startsWith('Investment yield:') && 
      income.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
    );
    
    if (existingYields.length > 0) {
      return; // Already generated for this month
    }
    
    const yieldIncomes = assets
      .filter((asset: any) => asset.type === 'investment' && asset.yield > 0)
      .map((asset: any) => {
        const monthlyYield = (asset.value * asset.yield / 100) / 12;
        return {
          id: `investment-yield-${asset.id}-${currentYear}-${currentMonth}`,
          source: `Investment yield: ${asset.name}`,
          amount: monthlyYield,
          currency: asset.currency,
          frequency: 'monthly' as IncomeFrequency,
          date: firstDayOfMonth,
          created_at: new Date().toISOString(),
        };
      });
    
    if (yieldIncomes.length > 0) {
      const allIncomes = [...yieldIncomes, ...get().incomes];
      set({ incomes: allIncomes });
      storage.set(allIncomes);
    }
  },

  addTestData: () => {
    const testIncomes = [
      { source: 'Monthly salary', amount: 4500.00, frequency: 'monthly' as IncomeFrequency },
      { source: 'Freelance web design', amount: 800.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Investment dividends', amount: 150.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Side hustle consulting', amount: 600.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Rental property income', amount: 1200.00, frequency: 'monthly' as IncomeFrequency },
      { source: 'Stock market gains', amount: 300.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Part-time job', amount: 900.00, frequency: 'weekly' as IncomeFrequency },
      { source: 'Online course sales', amount: 250.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Bonus payment', amount: 1000.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Tax refund', amount: 750.00, frequency: 'yearly' as IncomeFrequency },
      { source: 'Gift from family', amount: 200.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Cashback rewards', amount: 45.00, frequency: 'monthly' as IncomeFrequency },
      { source: 'Selling old electronics', amount: 180.00, frequency: 'one-time' as IncomeFrequency },
      { source: 'Tutoring sessions', amount: 120.00, frequency: 'weekly' as IncomeFrequency },
      { source: 'Affiliate marketing', amount: 85.00, frequency: 'monthly' as IncomeFrequency }
    ];

    const currencies = ['USD', 'MXN', 'EUR'];
    
    const incomes = testIncomes.map((income, index) => ({
      id: `test-income-${index + 1}`,
      source: income.source,
      amount: income.amount,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      frequency: income.frequency,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }));

    const allIncomes = [...incomes, ...get().incomes];
    set({ incomes: allIncomes });
    storage.set(allIncomes);
  }
}));