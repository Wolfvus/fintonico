// Repository interface for ledger operations (port/contract)
import type { Transaction, Posting, AccountBalance, TrialBalance, BalanceSheet, IncomeStatement } from '../ledger';
import { Money } from '../money';

export interface LedgerRepository {
  // Transaction operations
  saveTransaction(transaction: Transaction): Promise<void>;
  getTransaction(id: string): Promise<Transaction | null>;
  getTransactions(filters?: TransactionFilters): Promise<Transaction[]>;
  updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  
  // Posting operations
  getPostingsByAccount(accountId: string, filters?: PostingFilters): Promise<Posting[]>;
  getPostingsByTransaction(transactionId: string): Promise<Posting[]>;
  
  // Balance calculations
  getAccountBalance(accountId: string, asOfDate?: Date): Promise<Money>;
  getAccountBalances(accountIds: string[], asOfDate?: Date): Promise<AccountBalance[]>;
  getAllAccountBalances(asOfDate?: Date): Promise<AccountBalance[]>;
  
  // Financial statements
  getTrialBalance(asOfDate: Date): Promise<TrialBalance>;
  getBalanceSheet(asOfDate: Date, baseCurrency: string): Promise<BalanceSheet>;
  getIncomeStatement(fromDate: Date, toDate: Date, baseCurrency: string): Promise<IncomeStatement>;
  
  // Bulk operations
  saveTransactions(transactions: Transaction[]): Promise<void>;
  bulkReconcile(postingIds: string[], reconciledAt: Date): Promise<void>;
}

export interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  accountIds?: string[];
  description?: string;
  reference?: string;
  tags?: string[];
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface PostingFilters {
  dateFrom?: Date;
  dateTo?: Date;
  reconciled?: boolean;
  minAmount?: Money;
  maxAmount?: Money;
  limit?: number;
  offset?: number;
}