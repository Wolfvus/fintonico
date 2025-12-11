/**
 * Browser-side migration utilities
 *
 * These utilities help migrate data from localStorage to the backend API
 * directly from the browser.
 */

import { apiClient } from '../api/client';

const STORAGE_KEYS = {
  accounts: 'fintonico-accounts',
  ledger: 'ledger-store',
  expenses: 'fintonico-expenses',
  incomes: 'fintonico-incomes',
  snapshots: 'fintonico-snapshots',
};

export interface MigrationProgress {
  phase: string;
  current: number;
  total: number;
  errors: string[];
}

export interface MigrationResult {
  success: boolean;
  migrated: {
    accounts: number;
    transactions: number;
    expenses: number;
    incomes: number;
  };
  errors: string[];
  backup: string;
}

type MigrationCallback = (progress: MigrationProgress) => void;

/**
 * Export all localStorage data as a JSON string for backup
 */
export function exportLocalStorage(): string {
  const data: Record<string, string | null> = {};

  for (const key of Object.values(STORAGE_KEYS)) {
    data[key] = localStorage.getItem(key);
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Download localStorage backup as a file
 */
export function downloadBackup(): void {
  const data = exportLocalStorage();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const a = document.createElement('a');
  a.href = url;
  a.download = `fintonico-backup-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Clear all Fintonico data from localStorage
 */
export function clearLocalStorage(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}

/**
 * Check if there is data to migrate
 */
export function hasDataToMigrate(): boolean {
  for (const key of Object.values(STORAGE_KEYS)) {
    const data = localStorage.getItem(key);
    if (data && data !== '{}' && data !== '[]' && data !== 'null') {
      return true;
    }
  }
  return false;
}

/**
 * Get summary of localStorage data
 */
export function getLocalDataSummary(): {
  accounts: number;
  transactions: number;
  expenses: number;
  incomes: number;
} {
  let accounts = 0;
  let transactions = 0;
  let expenses = 0;
  let incomes = 0;

  try {
    const accountsData = localStorage.getItem(STORAGE_KEYS.accounts);
    if (accountsData) {
      const parsed = JSON.parse(accountsData);
      accounts = parsed.state?.accounts?.length || 0;
    }
  } catch {
    // Ignore parse errors
  }

  try {
    const ledgerData = localStorage.getItem(STORAGE_KEYS.ledger);
    if (ledgerData) {
      const parsed = JSON.parse(ledgerData);
      transactions = parsed.state?.transactions?.length || 0;
      // Add ledger accounts to account count
      accounts += parsed.state?.accounts?.length || 0;
    }
  } catch {
    // Ignore parse errors
  }

  try {
    const expensesData = localStorage.getItem(STORAGE_KEYS.expenses);
    if (expensesData) {
      const parsed = JSON.parse(expensesData);
      expenses = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    // Ignore parse errors
  }

  try {
    const incomesData = localStorage.getItem(STORAGE_KEYS.incomes);
    if (incomesData) {
      const parsed = JSON.parse(incomesData);
      incomes = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    // Ignore parse errors
  }

  return { accounts, transactions, expenses, incomes };
}

/**
 * Run migration from localStorage to API
 */
export async function runMigration(
  onProgress?: MigrationCallback
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated: {
      accounts: 0,
      transactions: 0,
      expenses: 0,
      incomes: 0,
    },
    errors: [],
    backup: '',
  };

  // Create backup first
  result.backup = exportLocalStorage();

  const report = (phase: string, current: number, total: number) => {
    onProgress?.({
      phase,
      current,
      total,
      errors: result.errors,
    });
  };

  // Account ID mapping (old -> new)
  const accountIdMap = new Map<string, string>();

  try {
    // Phase 1: Migrate ledger accounts
    report('Migrating accounts...', 0, 1);
    const ledgerData = localStorage.getItem(STORAGE_KEYS.ledger);
    if (ledgerData) {
      const ledger = JSON.parse(ledgerData);
      const accounts = ledger.state?.accounts || [];

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        report('Migrating accounts...', i + 1, accounts.length);

        try {
          const newAccount = await apiClient.post<{ id: string }>('/accounts', {
            code: account.code,
            name: account.name,
            type: account.nature,
            currency: 'MXN',
          });
          accountIdMap.set(account.id, newAccount.id);
          result.migrated.accounts++;
        } catch (error) {
          result.errors.push(`Account "${account.name}": ${(error as Error).message}`);
        }
      }
    }

    // Phase 2: Migrate transactions
    report('Migrating transactions...', 0, 1);
    if (ledgerData) {
      const ledger = JSON.parse(ledgerData);
      const transactions = ledger.state?.transactions || [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        report('Migrating transactions...', i + 1, transactions.length);

        try {
          const postings = tx.postings.map((p: any) => {
            const newAccountId = accountIdMap.get(p.accountId);
            if (!newAccountId) {
              throw new Error(`Account mapping not found for ${p.accountId}`);
            }

            const debit = p.bookedDebitAmount || p.originalDebitAmount;
            const credit = p.bookedCreditAmount || p.originalCreditAmount;

            if (debit) {
              return {
                account_id: newAccountId,
                amount_cents: debit.amountMinor || debit._amountMinor || 0,
                currency: debit.currency || debit._currency || 'MXN',
                is_debit: true,
              };
            } else if (credit) {
              return {
                account_id: newAccountId,
                amount_cents: credit.amountMinor || credit._amountMinor || 0,
                currency: credit.currency || credit._currency || 'MXN',
                is_debit: false,
              };
            }
            throw new Error('Posting has no amount');
          });

          await apiClient.post('/transactions', {
            date: typeof tx.date === 'string' ? tx.date.split('T')[0] : new Date(tx.date).toISOString().split('T')[0],
            description: tx.description,
            postings,
          });
          result.migrated.transactions++;
        } catch (error) {
          result.errors.push(`Transaction "${tx.description}": ${(error as Error).message}`);
        }
      }
    }

    // Phase 3: Migrate standalone expenses
    report('Migrating expenses...', 0, 1);
    const expensesData = localStorage.getItem(STORAGE_KEYS.expenses);
    if (expensesData) {
      const expenses = JSON.parse(expensesData);
      const standaloneExpenses = expenses.filter((e: any) => e.id.length <= 36);

      for (let i = 0; i < standaloneExpenses.length; i++) {
        const expense = standaloneExpenses[i];
        report('Migrating expenses...', i + 1, standaloneExpenses.length);

        try {
          await apiClient.post('/expenses', {
            amount: expense.amount,
            currency: expense.currency,
            description: expense.what,
            rating: expense.rating,
            date: expense.date,
            create_transaction: false,
          });
          result.migrated.expenses++;
        } catch (error) {
          result.errors.push(`Expense "${expense.what}": ${(error as Error).message}`);
        }
      }
    }

    // Phase 4: Migrate standalone incomes
    report('Migrating incomes...', 0, 1);
    const incomesData = localStorage.getItem(STORAGE_KEYS.incomes);
    if (incomesData) {
      const incomes = JSON.parse(incomesData);
      const standaloneIncomes = incomes.filter((i: any) => i.id.length <= 36);

      for (let i = 0; i < standaloneIncomes.length; i++) {
        const income = standaloneIncomes[i];
        report('Migrating incomes...', i + 1, standaloneIncomes.length);

        try {
          await apiClient.post('/income', {
            amount: income.amount,
            currency: income.currency,
            source: income.source,
            received_date: income.date,
            is_recurring: income.frequency !== 'one-time',
            create_transaction: false,
          });
          result.migrated.incomes++;
        } catch (error) {
          result.errors.push(`Income "${income.source}": ${(error as Error).message}`);
        }
      }
    }

    result.success = result.errors.length === 0;
    report('Complete', 1, 1);
  } catch (error) {
    result.errors.push(`Migration failed: ${(error as Error).message}`);
  }

  return result;
}

/**
 * Verify migration by comparing counts
 */
export async function verifyMigration(): Promise<{
  local: ReturnType<typeof getLocalDataSummary>;
  remote: { accounts: number; transactions: number; expenses: number; incomes: number };
  match: boolean;
}> {
  const local = getLocalDataSummary();

  // Fetch counts from API
  const [accountsRes, transactionsRes, expensesRes, incomesRes] = await Promise.all([
    apiClient.get<{ pagination: { total: number } }>('/accounts', { limit: 1 }),
    apiClient.get<{ pagination: { total: number } }>('/transactions', { limit: 1 }),
    apiClient.get<{ pagination: { total: number } }>('/expenses', { limit: 1 }),
    apiClient.get<{ pagination: { total: number } }>('/income', { limit: 1 }),
  ]);

  const remote = {
    accounts: accountsRes.pagination?.total || 0,
    transactions: transactionsRes.pagination?.total || 0,
    expenses: expensesRes.pagination?.total || 0,
    incomes: incomesRes.pagination?.total || 0,
  };

  const match =
    remote.accounts >= local.accounts &&
    remote.transactions >= local.transactions;

  return { local, remote, match };
}
