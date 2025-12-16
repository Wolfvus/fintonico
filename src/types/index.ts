// Re-export admin types
export * from './admin';

export interface Currency {
  code: string;
  symbol: string;
  exchangeRate: number;
}

export type ExpenseRating = 'essential' | 'discretionary' | 'luxury';

export type IncomeFrequency = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';

// Define Account Categories for Net Worth tracking
export type AccountType = 'cash' | 'bank' | 'exchange' | 'investment' | 'property' | 'loan' | 'credit-card' | 'mortgage' | 'other';

export type LedgerAccountNormalBalance = 'debit' | 'credit';

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

export interface Income {
  id: string;
  source: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  date: string;
  created_at: string;
}

// Net Worth Account - for tracking personal assets and liabilities
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  excludeFromTotal?: boolean;
  dueDate?: string;
  recurringDueDate?: number;
  isPaidThisMonth?: boolean;
  lastPaidDate?: string;
  estimatedYield?: number;
  lastUpdated?: string;
  // Liability-specific fields
  minMonthlyPayment?: number;        // Minimum required monthly payment
  paymentToAvoidInterest?: number;   // Amount to pay to avoid interest charges
}

// Ledger Account - for reference/lookup of bank accounts
export interface LedgerAccount {
  id: string;
  name: string;
  accountNumber?: string;
  clabe?: string;
  normalBalance: LedgerAccountNormalBalance;
  isActive: boolean;
}
