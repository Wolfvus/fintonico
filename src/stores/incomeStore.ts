import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';
import { useAccountStore } from './accountStore';
import type { Income } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';

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
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      
      // Validate and sanitize each income
      return parsed.filter((income: any) => {
        if (typeof income !== 'object' || !income) return false;
        const sourceResult = sanitizeDescription(income.source || '');
        const amountResult = validateAmount(String(income.amount || ''));
        const dateResult = validateDate(income.date || '');
        return sourceResult && amountResult.isValid && dateResult.isValid;
      }).map((income: any) => ({
        id: String(income.id || crypto.randomUUID()),
        source: sanitizeDescription(income.source),
        amount: validateAmount(String(income.amount)).sanitizedValue,
        currency: String(income.currency || 'MXN'),
        frequency: String(income.frequency || 'monthly') as IncomeFrequency,
        date: income.date,
        created_at: String(income.created_at || new Date().toISOString())
      }));
    } catch (error) {
      console.error('Error loading incomes from localStorage:', error);
      return [];
    }
  },
  set: (incomes: Income[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incomes));
    } catch (error) {
      console.error('Error saving incomes to localStorage:', error);
    }
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

    // Calculate investment yields from accounts
    const getInvestmentYields = () => {
      const { accounts } = useAccountStore.getState();
      const investmentAccounts = accounts.filter(account => account.type === 'investment');
      
      return investmentAccounts.reduce((total: number, account) => {
        // Sum all balances for this investment account
        const accountTotal = account.balances.reduce((sum, balance) => {
          return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
        }, 0);
        
        // For now, assume a 5% annual yield for investment accounts
        const monthlyYield = (accountTotal * 0.05) / 12;
        return total + monthlyYield;
      }, 0);
    };

    return regularIncome + getInvestmentYields();
  },

  generateInvestmentYields: () => {
    const { accounts } = useAccountStore.getState();
    const investmentAccounts = accounts.filter(account => account.type === 'investment');
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
    
    const yieldIncomes = investmentAccounts.map(account => {
      // Calculate total value of the investment account
      const accountTotal = account.balances.reduce((sum, balance) => {
        const { convertAmount, baseCurrency } = useCurrencyStore.getState();
        return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
      }, 0);
      
      // Assume 5% annual yield, calculate monthly
      const monthlyYield = (accountTotal * 0.05) / 12;
      
      return {
        id: `investment-yield-${account.id}-${currentYear}-${currentMonth}`,
        source: `Investment yield: ${account.name}`,
        amount: monthlyYield,
        currency: useCurrencyStore.getState().baseCurrency,
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
  }
}));