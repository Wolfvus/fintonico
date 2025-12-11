// API request/response types
// These types represent the shape of data sent to/from the backend API

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Account types
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  user_id: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  is_active: boolean;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountRequest {
  code: string;
  name: string;
  type: AccountType;
  currency?: string;
  parent_id?: string;
}

export interface UpdateAccountRequest {
  code?: string;
  name?: string;
  type?: AccountType;
  currency?: string;
  is_active?: boolean;
  parent_id?: string | null;
}

export interface AccountBalance {
  account_id: string;
  balance_cents: number;
  as_of_date: string;
}

// Transaction types
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface Posting {
  id?: string;
  account_id: string;
  amount_cents: number;
  currency: string;
  is_debit: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  description: string;
  memo?: string | null;
  transaction_type?: TransactionType;
  reference?: string | null;
  created_at: string;
  updated_at: string;
  postings?: Posting[];
}

export interface CreateTransactionRequest {
  date: string;
  description: string;
  memo?: string;
  transaction_type?: TransactionType;
  postings: Omit<Posting, 'id'>[];
}

export interface UpdateTransactionRequest {
  date?: string;
  description?: string;
  memo?: string;
  transaction_type?: TransactionType;
  postings?: Omit<Posting, 'id'>[];
}

export interface TransactionFilters extends PaginationParams, DateRangeParams {
  type?: TransactionType;
  account_id?: string;
}

// Income types
export interface Income {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  source: string;
  description?: string | null;
  received_date: string;
  is_recurring: boolean;
  recurrence_interval?: string | null;
  recurrence_day?: number | null;
  transaction_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeRequest {
  amount: number;
  currency?: string;
  source: string;
  description?: string;
  received_date: string;
  is_recurring?: boolean;
  recurrence_interval?: string;
  recurrence_day?: number;
  create_transaction?: boolean;
  deposit_account_id?: string;
}

export interface UpdateIncomeRequest {
  amount?: number;
  currency?: string;
  source?: string;
  description?: string;
  received_date?: string;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_day?: number | null;
}

// Expense types
export type ExpenseRating = 'essential' | 'non_essential' | 'luxury';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  category?: string | null;
  subcategory?: string | null;
  rating?: ExpenseRating | null;
  date: string;
  transaction_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  amount: number;
  currency?: string;
  description: string;
  category?: string;
  subcategory?: string;
  rating?: ExpenseRating;
  date: string;
  create_transaction?: boolean;
  funding_account_id?: string;
}

export interface UpdateExpenseRequest {
  amount?: number;
  currency?: string;
  description?: string;
  category?: string | null;
  subcategory?: string | null;
  rating?: ExpenseRating | null;
  date?: string;
}

export interface ExpenseFilters extends PaginationParams, DateRangeParams {
  rating?: ExpenseRating;
  category?: string;
}

export interface CategorizationResult {
  category: string;
  subcategory: string;
  confidence: number;
  suggested_rating: ExpenseRating;
}

// Report types
export interface TrialBalance {
  as_of_date: string;
  accounts: Array<{
    account_id: string;
    account_name: string;
    account_type: string;
    account_code: string;
    currency: string;
    balance_cents: number;
  }>;
  totals: {
    debits_cents: number;
    credits_cents: number;
    is_balanced: boolean;
  };
}

export interface BalanceSheet {
  as_of_date: string;
  assets: {
    accounts: Array<{
      account_id: string;
      account_name: string;
      account_code: string;
      currency: string;
      balance_cents: number;
    }>;
    total_cents: number;
  };
  liabilities: {
    accounts: Array<{
      account_id: string;
      account_name: string;
      account_code: string;
      currency: string;
      balance_cents: number;
    }>;
    total_cents: number;
  };
  equity: {
    accounts: Array<{
      account_id: string;
      account_name: string;
      account_code: string;
      currency: string;
      balance_cents: number;
    }>;
    total_cents: number;
    retained_earnings_cents: number;
    total_with_retained_cents: number;
  };
  totals: {
    total_assets_cents: number;
    total_liabilities_equity_cents: number;
    is_balanced: boolean;
  };
}

export interface IncomeStatement {
  period: {
    start_date: string;
    end_date: string;
  };
  income: {
    accounts: Array<{
      account_id: string;
      account_name: string;
      account_code: string;
      currency: string;
      amount_cents: number;
    }>;
    total_cents: number;
  };
  expenses: {
    accounts: Array<{
      account_id: string;
      account_name: string;
      account_code: string;
      currency: string;
      amount_cents: number;
    }>;
    total_cents: number;
  };
  net_income_cents: number;
}

export interface NetWorth {
  as_of_date: string;
  net_worth_cents: number;
  assets_cents: number;
  liabilities_cents: number;
}

export interface Cashflow {
  period: {
    start_date: string;
    end_date: string;
  };
  inflows_cents: number;
  outflows_cents: number;
  net_cashflow_cents: number;
}

// Exchange rate types
export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
}

export interface ConvertResult {
  from_amount: number;
  from_currency: string;
  to_amount: number;
  to_currency: string;
  rate: number;
}

export interface SupportedCurrencies {
  supported: string[];
  base: string;
}
