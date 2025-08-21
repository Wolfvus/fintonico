// Repository interface for account operations (port/contract)
import type { Account, AccountNature } from '../ledger';

export interface AccountRepository {
  // Account CRUD operations
  saveAccount(account: Account): Promise<void>;
  getAccount(id: string): Promise<Account | null>;
  getAccountByCode(code: string): Promise<Account | null>;
  getAccounts(filters?: AccountFilters): Promise<Account[]>;
  updateAccount(id: string, account: Partial<Account>): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  
  // Account hierarchy
  getAccountsByNature(nature: AccountNature): Promise<Account[]>;
  getChildAccounts(parentId: string): Promise<Account[]>;
  getAccountHierarchy(): Promise<AccountHierarchy[]>;
  
  // Chart of accounts
  getChartOfAccounts(): Promise<ChartOfAccounts>;
  initializeDefaultAccounts(): Promise<void>;
}

export interface AccountFilters {
  nature?: AccountNature | AccountNature[];
  isActive?: boolean;
  parentId?: string | null; // null for root accounts
  search?: string; // Search in name, code, description
  limit?: number;
  offset?: number;
}

export interface AccountHierarchy {
  account: Account;
  children: AccountHierarchy[];
  depth: number;
}

export interface ChartOfAccounts {
  assets: AccountHierarchy[];
  liabilities: AccountHierarchy[];
  equity: AccountHierarchy[];
  income: AccountHierarchy[];
  expenses: AccountHierarchy[];
}