export interface Currency {
  code: string;
  symbol: string;
  exchangeRate: number;
}

export type ExpenseRating = 'essential' | 'non_essential' | 'luxury';

export interface BaseFinancialRecord {
  id: string;
  amount: number;
  currency: string;
  date: string;
  created_at: string;
}

export interface Expense extends BaseFinancialRecord {
  what: string;
  rating: ExpenseRating;
  recurring?: boolean;
}

export interface Income extends BaseFinancialRecord {
  source: string;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'yearly';
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  currency: string;
  type: 'cash' | 'investment' | 'property' | 'other';
  yield?: number;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  currency: string;
  type: 'loan' | 'credit-card' | 'mortgage' | 'other';
  dueDate?: string;
  isPaid?: boolean;
}

export interface FinancialAnalysisData {
  monthlyIncome: number;
  monthlyExpenses: number;
  projectedMonths: number;
  currentAge: number;
  retirementAge: number;
  assets: Asset[];
  liabilities: Liability[];
}