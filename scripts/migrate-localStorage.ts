/**
 * Migration Script: localStorage to Backend API
 *
 * This script migrates data from localStorage (local mode) to the backend database.
 * It handles accounts, transactions, income, and expenses.
 *
 * Usage:
 *   npx ts-node scripts/migrate-localStorage.ts
 *
 * Or run via npm script:
 *   npm run migrate
 *
 * Environment Variables:
 *   VITE_API_URL - Backend API URL (default: http://localhost:3000/api)
 *   MIGRATION_TOKEN - Auth token for API calls (uses DEV_TOKEN if not set)
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.MIGRATION_TOKEN || 'dev-token-fintonico';
const BATCH_SIZE = 10;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// localStorage keys used by the app
const STORAGE_KEYS = {
  accounts: 'fintonico-accounts',
  ledger: 'ledger-store',
  expenses: 'fintonico-expenses',
  incomes: 'fintonico-incomes',
  snapshots: 'fintonico-snapshots',
  currency: 'fintonico-currency',
};

// Types for localStorage data
interface LocalStorageAccount {
  id: string;
  name: string;
  type: string;
  balances: Array<{ currency: string; amount: number }>;
}

interface LocalStorageLedgerAccount {
  id: string;
  code: string;
  name: string;
  nature: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LocalStoragePosting {
  id: string;
  accountId: string;
  originalDebitAmount?: { amountMinor: number; currency: string } | null;
  originalCreditAmount?: { amountMinor: number; currency: string } | null;
  bookedDebitAmount?: { amountMinor: number; currency: string } | null;
  bookedCreditAmount?: { amountMinor: number; currency: string } | null;
}

interface LocalStorageTransaction {
  id: string;
  date: string;
  description: string;
  reference?: string;
  baseCurrency?: string;
  postings: LocalStoragePosting[];
  createdAt: string;
  updatedAt: string;
}

interface LocalStorageLedger {
  state: {
    accounts: LocalStorageLedgerAccount[];
    transactions: LocalStorageTransaction[];
  };
}

interface LocalStorageExpense {
  id: string;
  what: string;
  amount: number;
  currency: string;
  rating: string;
  date: string;
  created_at: string;
  recurring?: boolean;
  fundingAccountId?: string;
}

interface LocalStorageIncome {
  id: string;
  source: string;
  amount: number;
  currency: string;
  frequency: string;
  date: string;
  created_at: string;
  depositAccountId?: string;
}

// Migration state
interface MigrationState {
  accountIdMap: Map<string, string>; // old ID -> new ID
  transactionIdMap: Map<string, string>;
  errors: Array<{ type: string; id: string; error: string }>;
  migrated: {
    accounts: number;
    transactions: number;
    expenses: number;
    incomes: number;
  };
}

// API helper
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      if (attempt === RETRY_ATTEMPTS) {
        throw error;
      }
      console.log(`  Retry ${attempt}/${RETRY_ATTEMPTS} after error: ${(error as Error).message}`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error('Unexpected error in apiRequest');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read localStorage data from a JSON file (exported from browser)
function readLocalStorageExport(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`localStorage export file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Map account type from frontend to backend format
function mapAccountType(frontendType: string): string {
  const typeMap: Record<string, string> = {
    'cash': 'asset',
    'bank': 'asset',
    'exchange': 'asset',
    'investment': 'asset',
    'property': 'asset',
    'other': 'asset',
    'loan': 'liability',
    'credit-card': 'liability',
    'mortgage': 'liability',
  };
  return typeMap[frontendType] || 'asset';
}

// Map expense rating
function mapExpenseRating(rating: string): string {
  const validRatings = ['essential', 'non_essential', 'luxury'];
  return validRatings.includes(rating) ? rating : 'non_essential';
}

// Migrate accounts
async function migrateAccounts(
  localData: Record<string, string>,
  state: MigrationState
): Promise<void> {
  console.log('\n📦 Migrating accounts...');

  // Get external accounts from accountStore
  const accountsData = localData[STORAGE_KEYS.accounts];
  if (!accountsData) {
    console.log('  No external accounts found');
    return;
  }

  const accountStore = JSON.parse(accountsData);
  const accounts: LocalStorageAccount[] = accountStore.state?.accounts || [];

  // Get ledger accounts
  const ledgerData = localData[STORAGE_KEYS.ledger];
  let ledgerAccounts: LocalStorageLedgerAccount[] = [];
  if (ledgerData) {
    const ledger: LocalStorageLedger = JSON.parse(ledgerData);
    ledgerAccounts = ledger.state?.accounts || [];
  }

  // Combine unique accounts (prefer ledger accounts as they have more metadata)
  const allAccounts = new Map<string, LocalStorageLedgerAccount | LocalStorageAccount>();

  for (const account of ledgerAccounts) {
    allAccounts.set(account.id, account);
  }

  for (const account of accounts) {
    if (!allAccounts.has(account.id)) {
      allAccounts.set(account.id, account);
    }
  }

  console.log(`  Found ${allAccounts.size} unique accounts`);

  // Migrate in batches
  const accountList = Array.from(allAccounts.values());
  for (let i = 0; i < accountList.length; i += BATCH_SIZE) {
    const batch = accountList.slice(i, i + BATCH_SIZE);

    for (const account of batch) {
      try {
        // Determine account type
        let accountType: string;
        let accountCode: string;

        if ('nature' in account) {
          // Ledger account
          accountType = account.nature;
          accountCode = account.code;
        } else {
          // External account
          accountType = mapAccountType(account.type);
          accountCode = `EXT-${account.id.slice(0, 8).toUpperCase()}`;
        }

        const newAccount = await apiRequest<{ id: string }>('/accounts', 'POST', {
          code: accountCode,
          name: account.name,
          type: accountType,
          currency: 'MXN', // Default currency
        });

        state.accountIdMap.set(account.id, newAccount.id);
        state.migrated.accounts++;
        console.log(`  ✓ Migrated account: ${account.name}`);
      } catch (error) {
        state.errors.push({
          type: 'account',
          id: account.id,
          error: (error as Error).message,
        });
        console.log(`  ✗ Failed to migrate account ${account.name}: ${(error as Error).message}`);
      }
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < accountList.length) {
      await sleep(500);
    }
  }
}

// Migrate transactions from ledger
async function migrateTransactions(
  localData: Record<string, string>,
  state: MigrationState
): Promise<void> {
  console.log('\n📝 Migrating transactions...');

  const ledgerData = localData[STORAGE_KEYS.ledger];
  if (!ledgerData) {
    console.log('  No ledger data found');
    return;
  }

  const ledger: LocalStorageLedger = JSON.parse(ledgerData);
  const transactions = ledger.state?.transactions || [];

  console.log(`  Found ${transactions.length} transactions`);

  // Migrate in batches
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);

    for (const tx of batch) {
      try {
        // Map postings to new account IDs
        const postings = tx.postings.map(posting => {
          const newAccountId = state.accountIdMap.get(posting.accountId);
          if (!newAccountId) {
            throw new Error(`Account not found for posting: ${posting.accountId}`);
          }

          // Determine amount and direction
          const debitAmount = posting.bookedDebitAmount || posting.originalDebitAmount;
          const creditAmount = posting.bookedCreditAmount || posting.originalCreditAmount;

          if (debitAmount) {
            return {
              account_id: newAccountId,
              amount_cents: debitAmount.amountMinor,
              currency: debitAmount.currency,
              is_debit: true,
            };
          } else if (creditAmount) {
            return {
              account_id: newAccountId,
              amount_cents: creditAmount.amountMinor,
              currency: creditAmount.currency,
              is_debit: false,
            };
          } else {
            throw new Error('Posting has no amount');
          }
        });

        // Determine transaction type
        let transactionType = 'adjustment';
        const hasExpenseAccount = tx.postings.some(p => {
          const account = state.accountIdMap.get(p.accountId);
          return account && p.originalDebitAmount;
        });
        const hasIncomeAccount = tx.postings.some(p => {
          const account = state.accountIdMap.get(p.accountId);
          return account && p.originalCreditAmount;
        });

        if (hasExpenseAccount) transactionType = 'expense';
        else if (hasIncomeAccount) transactionType = 'income';

        const newTx = await apiRequest<{ id: string }>('/transactions', 'POST', {
          date: tx.date.split('T')[0],
          description: tx.description,
          memo: tx.reference,
          transaction_type: transactionType,
          postings,
        });

        state.transactionIdMap.set(tx.id, newTx.id);
        state.migrated.transactions++;
        console.log(`  ✓ Migrated transaction: ${tx.description}`);
      } catch (error) {
        state.errors.push({
          type: 'transaction',
          id: tx.id,
          error: (error as Error).message,
        });
        console.log(`  ✗ Failed to migrate transaction ${tx.description}: ${(error as Error).message}`);
      }
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < transactions.length) {
      await sleep(500);
    }
  }
}

// Migrate standalone expenses (not linked to transactions)
async function migrateExpenses(
  localData: Record<string, string>,
  state: MigrationState
): Promise<void> {
  console.log('\n💸 Migrating expenses...');

  const expensesData = localData[STORAGE_KEYS.expenses];
  if (!expensesData) {
    console.log('  No expense data found');
    return;
  }

  const expenses: LocalStorageExpense[] = JSON.parse(expensesData);

  // Filter out expenses that were derived from transactions (composite IDs)
  const standaloneExpenses = expenses.filter(e => e.id.length <= 36);

  console.log(`  Found ${standaloneExpenses.length} standalone expenses`);

  for (const expense of standaloneExpenses) {
    try {
      await apiRequest('/expenses', 'POST', {
        amount: expense.amount,
        currency: expense.currency,
        description: expense.what,
        rating: mapExpenseRating(expense.rating),
        date: expense.date,
        create_transaction: false, // Already have transaction data
      });

      state.migrated.expenses++;
      console.log(`  ✓ Migrated expense: ${expense.what}`);
    } catch (error) {
      state.errors.push({
        type: 'expense',
        id: expense.id,
        error: (error as Error).message,
      });
      console.log(`  ✗ Failed to migrate expense ${expense.what}: ${(error as Error).message}`);
    }
  }
}

// Migrate standalone incomes
async function migrateIncomes(
  localData: Record<string, string>,
  state: MigrationState
): Promise<void> {
  console.log('\n💰 Migrating incomes...');

  const incomesData = localData[STORAGE_KEYS.incomes];
  if (!incomesData) {
    console.log('  No income data found');
    return;
  }

  const incomes: LocalStorageIncome[] = JSON.parse(incomesData);

  // Filter out incomes derived from transactions
  const standaloneIncomes = incomes.filter(i => i.id.length <= 36);

  console.log(`  Found ${standaloneIncomes.length} standalone incomes`);

  for (const income of standaloneIncomes) {
    try {
      await apiRequest('/income', 'POST', {
        amount: income.amount,
        currency: income.currency,
        source: income.source,
        received_date: income.date,
        is_recurring: income.frequency !== 'one-time',
        recurrence_interval: income.frequency !== 'one-time' ? income.frequency : undefined,
        create_transaction: false,
      });

      state.migrated.incomes++;
      console.log(`  ✓ Migrated income: ${income.source}`);
    } catch (error) {
      state.errors.push({
        type: 'income',
        id: income.id,
        error: (error as Error).message,
      });
      console.log(`  ✗ Failed to migrate income ${income.source}: ${(error as Error).message}`);
    }
  }
}

// Generate backup of localStorage before migration
function generateBackup(localData: Record<string, string>): string {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `localStorage-backup-${timestamp}.json`);

  fs.writeFileSync(backupPath, JSON.stringify(localData, null, 2));

  return backupPath;
}

// Main migration function
async function runMigration(localStorageExportPath: string): Promise<void> {
  console.log('🚀 Starting Fintonico Data Migration');
  console.log('====================================\n');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Export file: ${localStorageExportPath}\n`);

  // Read localStorage export
  const localData = readLocalStorageExport(localStorageExportPath);

  // Create backup
  const backupPath = generateBackup(localData);
  console.log(`📁 Backup created: ${backupPath}\n`);

  // Initialize state
  const state: MigrationState = {
    accountIdMap: new Map(),
    transactionIdMap: new Map(),
    errors: [],
    migrated: {
      accounts: 0,
      transactions: 0,
      expenses: 0,
      incomes: 0,
    },
  };

  // Run migrations in order
  await migrateAccounts(localData, state);
  await migrateTransactions(localData, state);
  await migrateExpenses(localData, state);
  await migrateIncomes(localData, state);

  // Print summary
  console.log('\n====================================');
  console.log('📊 Migration Summary');
  console.log('====================================');
  console.log(`Accounts migrated: ${state.migrated.accounts}`);
  console.log(`Transactions migrated: ${state.migrated.transactions}`);
  console.log(`Expenses migrated: ${state.migrated.expenses}`);
  console.log(`Incomes migrated: ${state.migrated.incomes}`);
  console.log(`Errors: ${state.errors.length}`);

  if (state.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const error of state.errors) {
      console.log(`  - [${error.type}] ${error.id}: ${error.error}`);
    }
  }

  // Save error log
  if (state.errors.length > 0) {
    const errorLogPath = path.join(process.cwd(), 'backups', 'migration-errors.json');
    fs.writeFileSync(errorLogPath, JSON.stringify(state.errors, null, 2));
    console.log(`\nError log saved: ${errorLogPath}`);
  }

  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Verify data in the application');
  console.log('2. Set VITE_USE_API=true in .env');
  console.log('3. Clear localStorage (optional): localStorage.clear()');
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npx ts-node scripts/migrate-localStorage.ts <localStorage-export.json>');
  console.log('\nTo export localStorage from browser:');
  console.log('  1. Open browser DevTools (F12)');
  console.log('  2. Go to Console tab');
  console.log('  3. Run: copy(JSON.stringify(localStorage))');
  console.log('  4. Paste into a file named localStorage-export.json');
  process.exit(1);
}

runMigration(args[0]).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
