// Repository interface for balance snapshots and closing operations (port/contract)
import type { TrialBalance, BalanceSheet, IncomeStatement } from '../ledger';
import { Money } from '../money';

export interface AccountSnapshot {
  id: string;
  accountId: string;
  balance: Money;
  date: Date;
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'closing';
  createdAt: Date;
}

export interface ClosingEntry {
  id: string;
  date: Date; // End of period being closed
  periodType: 'monthly' | 'quarterly' | 'yearly';
  retainedEarningsAccountId: string;
  netIncome: Money;
  transactionIds: string[]; // Closing transaction IDs
  createdAt: Date;
}

export interface SnapshotRepository {
  // Account snapshots
  saveSnapshot(snapshot: AccountSnapshot): Promise<void>;
  getSnapshot(accountId: string, date: Date, periodType: string): Promise<AccountSnapshot | null>;
  getSnapshots(accountId: string, fromDate: Date, toDate: Date): Promise<AccountSnapshot[]>;
  getAllSnapshots(date: Date, periodType: string): Promise<AccountSnapshot[]>;
  
  // Snapshot generation
  generateDailySnapshots(date: Date): Promise<AccountSnapshot[]>;
  generateMonthlySnapshots(year: number, month: number): Promise<AccountSnapshot[]>;
  generateYearlySnapshots(year: number): Promise<AccountSnapshot[]>;
  
  // Financial statement snapshots
  saveTrialBalance(trialBalance: TrialBalance): Promise<void>;
  saveBalanceSheet(balanceSheet: BalanceSheet): Promise<void>;
  saveIncomeStatement(incomeStatement: IncomeStatement): Promise<void>;
  
  getTrialBalanceSnapshot(date: Date): Promise<TrialBalance | null>;
  getBalanceSheetSnapshot(date: Date): Promise<BalanceSheet | null>;
  getIncomeStatementSnapshot(fromDate: Date, toDate: Date): Promise<IncomeStatement | null>;
  
  // Period closing
  closeMonth(year: number, month: number, retainedEarningsAccountId: string): Promise<ClosingEntry>;
  closeYear(year: number, retainedEarningsAccountId: string): Promise<ClosingEntry>;
  getClosingEntry(date: Date, periodType: string): Promise<ClosingEntry | null>;
  isperiodClosed(date: Date, periodType: string): Promise<boolean>;
  
  // Cleanup
  deleteOldSnapshots(beforeDate: Date): Promise<number>;
}