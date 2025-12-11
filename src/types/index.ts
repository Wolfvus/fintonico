export interface Currency {
  code: string;
  symbol: string;
  exchangeRate: number;
}

export type ExpenseRating = 'essential' | 'important' | 'non_essential' | 'luxury';

// Define Account Categories for Net Worth tracking
export type AccountType = 'cash' | 'bank' | 'exchange' | 'investment' | 'property' | 'loan' | 'credit-card' | 'mortgage' | 'other';

// Define the Structure for Balances (AccountBalance) - kept for backwards compatibility
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
  fundingAccountId?: string;
  fundingAccountName?: string;
  fundingAccountNature?: 'asset' | 'liability';
}

export interface Income extends BaseFinancialRecord {
  source: string;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'yearly';
  depositAccountId?: string;
  depositAccountName?: string;
  depositAccountNature?: 'asset' | 'liability';
}

// Net Worth Account - for tracking personal assets and liabilities
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;                // Single currency per account
  balance: number;                 // Single balance amount
  excludeFromTotal?: boolean;      // Exclude from net worth calculation
  dueDate?: string;                // Optional due date for credit cards and loans
  recurringDueDate?: number;       // Day of month (1-31) for recurring payments
  isPaidThisMonth?: boolean;       // Whether this month's payment has been made
  lastPaidDate?: string;           // Date of last payment (YYYY-MM-DD)
  estimatedYield?: number;         // Annual yield percentage (e.g., 5.5 for 5.5%)
  lastUpdated?: string;            // Auto-updated timestamp when account is modified (YYYY-MM-DD)
  // Kept for backwards compatibility during migration
  balances?: AccountBalance[];
}

// Ledger Account - for reference/lookup of bank accounts
export type LedgerAccountNormalBalance = 'debit' | 'credit';

export interface LedgerAccount {
  id: string;
  name: string;
  accountNumber?: string;                    // Bank account number
  clabe?: string;                            // CLABE (Mexican interbank code, 18 digits)
  normalBalance: LedgerAccountNormalBalance; // Debit or Credit card
  isActive: boolean;                         // Whether account is active
}
