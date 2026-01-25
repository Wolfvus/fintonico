/**
 * Services Index
 * Central export for all Supabase API services
 */

export { adminService } from './adminService';
export { expenseService } from './expenseService';
export type { CreateExpenseData, UpdateExpenseData } from './expenseService';
export { incomeService } from './incomeService';
export type { CreateIncomeData, UpdateIncomeData } from './incomeService';
export { netWorthAccountService } from './netWorthAccountService';
export type { CreateAccountData, UpdateAccountData } from './netWorthAccountService';
export { ledgerAccountService } from './ledgerAccountService';
export type { CreateLedgerAccountData, UpdateLedgerAccountData } from './ledgerAccountService';
export { snapshotService } from './snapshotService';
export type { AccountSnapshot, NetWorthSnapshot, CreateSnapshotData } from './snapshotService';
