export interface Currency {
  code: string;
  symbol: string;
  exchangeRate: number;
}

export type ExpenseRating = 'essential' | 'non_essential' | 'luxury';

// Define Account Categories (AccountType)
export type AccountType = 'cash' | 'bank' | 'exchange' | 'investment' | 'property' | 'loan' | 'credit-card' | 'mortgage' | 'other';

// Define the Structure for Balances (AccountBalance)
export interface AccountBalance {
  currency: string;
  amount: number;
}

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

// Define the Main Account Interface
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balances: AccountBalance[];
}