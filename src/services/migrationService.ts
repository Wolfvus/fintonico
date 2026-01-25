import { supabase } from '../lib/supabase';
import type { Expense, Income, Account, LedgerAccount } from '../types';
import type { NetWorthSnapshot, AccountSnapshot } from '../stores/snapshotStore';

// Dev mode check - skip actual migration in dev mode
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export interface MigrationProgress {
  step: 'idle' | 'checking' | 'expenses' | 'income' | 'accounts' | 'ledger' | 'snapshots' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

export interface MigrationResult {
  success: boolean;
  migratedCounts: {
    expenses: number;
    income: number;
    accounts: number;
    ledgerAccounts: number;
    snapshots: number;
  };
  errors: string[];
}

export interface LocalStorageData {
  expenses: Expense[];
  income: Income[];
  accounts: Account[];
  ledgerAccounts: LedgerAccount[];
  snapshots: NetWorthSnapshot[];
}

// Read all data from localStorage stores
export function readLocalStorageData(): LocalStorageData {
  const parseStore = <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      // Zustand stores wrap data in a "state" object
      return parsed.state?.expenses || parsed.state?.incomes || parsed.state?.accounts ||
             parsed.state?.snapshots || parsed.expenses || parsed.incomes || parsed.accounts ||
             parsed.snapshots || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Parse each store carefully
  let expenses: Expense[] = [];
  let income: Income[] = [];
  let accounts: Account[] = [];
  let ledgerAccounts: LedgerAccount[] = [];
  let snapshots: NetWorthSnapshot[] = [];

  try {
    const expenseData = localStorage.getItem('fintonico-expenses');
    if (expenseData) {
      const parsed = JSON.parse(expenseData);
      expenses = parsed.state?.expenses || [];
    }
  } catch {
    expenses = [];
  }

  try {
    const incomeData = localStorage.getItem('fintonico-incomes');
    if (incomeData) {
      const parsed = JSON.parse(incomeData);
      income = parsed.state?.incomes || [];
    }
  } catch {
    income = [];
  }

  try {
    const accountData = localStorage.getItem('fintonico-accounts');
    if (accountData) {
      const parsed = JSON.parse(accountData);
      accounts = parsed.state?.accounts || [];
    }
  } catch {
    accounts = [];
  }

  try {
    const ledgerData = localStorage.getItem('fintonico-ledger-accounts');
    if (ledgerData) {
      const parsed = JSON.parse(ledgerData);
      ledgerAccounts = parsed.state?.accounts || [];
    }
  } catch {
    ledgerAccounts = [];
  }

  try {
    const snapshotData = localStorage.getItem('fintonico-snapshots');
    if (snapshotData) {
      const parsed = JSON.parse(snapshotData);
      snapshots = parsed.state?.snapshots || [];
    }
  } catch {
    snapshots = [];
  }

  return { expenses, income, accounts, ledgerAccounts, snapshots };
}

// Check if user has existing data in Supabase
export async function checkExistingSupabaseData(): Promise<{
  hasData: boolean;
  counts: { expenses: number; income: number; accounts: number; ledgerAccounts: number; snapshots: number };
}> {
  if (DEV_MODE) {
    return { hasData: false, counts: { expenses: 0, income: 0, accounts: 0, ledgerAccounts: 0, snapshots: 0 } };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const [expenseResult, incomeResult, accountResult, ledgerResult, snapshotResult] = await Promise.all([
    supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('income').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('net_worth_accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('ledger_accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('net_worth_snapshots').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const counts = {
    expenses: expenseResult.count || 0,
    income: incomeResult.count || 0,
    accounts: accountResult.count || 0,
    ledgerAccounts: ledgerResult.count || 0,
    snapshots: snapshotResult.count || 0,
  };

  const hasData = Object.values(counts).some(c => c > 0);

  return { hasData, counts };
}

// Migrate all localStorage data to Supabase
export async function migrateToSupabase(
  data: LocalStorageData,
  onProgress: (progress: MigrationProgress) => void,
  options: { overwrite: boolean } = { overwrite: false }
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCounts: { expenses: 0, income: 0, accounts: 0, ledgerAccounts: 0, snapshots: 0 },
    errors: [],
  };

  if (DEV_MODE) {
    onProgress({ step: 'error', current: 0, total: 0, message: 'Migration not available in dev mode' });
    result.errors.push('Migration not available in dev mode');
    return result;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    onProgress({ step: 'error', current: 0, total: 0, message: 'Not authenticated' });
    result.errors.push('Not authenticated');
    return result;
  }

  const totalItems = data.expenses.length + data.income.length + data.accounts.length +
                     data.ledgerAccounts.length + data.snapshots.length;
  let processedItems = 0;

  try {
    // Check for existing data
    onProgress({ step: 'checking', current: 0, total: totalItems, message: 'Checking existing data...' });

    const { hasData } = await checkExistingSupabaseData();
    if (hasData && !options.overwrite) {
      onProgress({ step: 'error', current: 0, total: totalItems, message: 'User already has data in Supabase' });
      result.errors.push('User already has data in Supabase. Choose overwrite option to replace.');
      return result;
    }

    // If overwriting, delete existing data first
    if (hasData && options.overwrite) {
      onProgress({ step: 'checking', current: 0, total: totalItems, message: 'Clearing existing data...' });
      await Promise.all([
        supabase.from('account_snapshots').delete().eq('user_id', user.id),
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('income').delete().eq('user_id', user.id),
      ]);
      // These depend on foreign keys, do after
      await supabase.from('net_worth_snapshots').delete().eq('user_id', user.id);
      await supabase.from('net_worth_accounts').delete().eq('user_id', user.id);
      await supabase.from('ledger_accounts').delete().eq('user_id', user.id);
    }

    // Migrate Expenses
    if (data.expenses.length > 0) {
      onProgress({ step: 'expenses', current: processedItems, total: totalItems, message: `Migrating ${data.expenses.length} expenses...` });

      const expenseRows = data.expenses.map(e => ({
        user_id: user.id,
        what: e.what,
        amount: e.amount,
        currency: e.currency || 'MXN',
        rating: e.rating,
        date: e.date,
        recurring: e.recurring || false,
        created_at: e.created_at || new Date().toISOString(),
      }));

      const { error } = await supabase.from('expenses').insert(expenseRows);
      if (error) {
        result.errors.push(`Expenses: ${error.message}`);
      } else {
        result.migratedCounts.expenses = data.expenses.length;
      }
      processedItems += data.expenses.length;
    }

    // Migrate Income
    if (data.income.length > 0) {
      onProgress({ step: 'income', current: processedItems, total: totalItems, message: `Migrating ${data.income.length} income records...` });

      const incomeRows = data.income.map(i => ({
        user_id: user.id,
        source: i.source,
        amount: i.amount,
        currency: i.currency || 'MXN',
        frequency: i.frequency || 'one-time',
        date: i.date,
        created_at: i.created_at || new Date().toISOString(),
      }));

      const { error } = await supabase.from('income').insert(incomeRows);
      if (error) {
        result.errors.push(`Income: ${error.message}`);
      } else {
        result.migratedCounts.income = data.income.length;
      }
      processedItems += data.income.length;
    }

    // Migrate Net Worth Accounts
    if (data.accounts.length > 0) {
      onProgress({ step: 'accounts', current: processedItems, total: totalItems, message: `Migrating ${data.accounts.length} accounts...` });

      const accountRows = data.accounts.map(a => ({
        user_id: user.id,
        name: a.name,
        account_type: a.type,
        currency: a.currency || 'MXN',
        balance: a.balance,
        exclude_from_total: a.excludeFromTotal || false,
        recurring_due_date: a.recurringDueDate || null,
        is_paid_this_month: a.isPaidThisMonth || false,
        last_paid_date: a.lastPaidDate || null,
        estimated_yield: a.estimatedYield || null,
        min_monthly_payment: a.minMonthlyPayment || null,
        payment_to_avoid_interest: a.paymentToAvoidInterest || null,
        last_updated: a.lastUpdated || new Date().toISOString().split('T')[0],
      }));

      const { error } = await supabase.from('net_worth_accounts').insert(accountRows);
      if (error) {
        result.errors.push(`Accounts: ${error.message}`);
      } else {
        result.migratedCounts.accounts = data.accounts.length;
      }
      processedItems += data.accounts.length;
    }

    // Migrate Ledger Accounts
    if (data.ledgerAccounts.length > 0) {
      onProgress({ step: 'ledger', current: processedItems, total: totalItems, message: `Migrating ${data.ledgerAccounts.length} ledger accounts...` });

      const ledgerRows = data.ledgerAccounts.map(l => ({
        user_id: user.id,
        name: l.name,
        account_number: l.accountNumber || null,
        clabe: l.clabe || null,
        normal_balance: l.normalBalance,
        is_active: l.isActive,
      }));

      const { error } = await supabase.from('ledger_accounts').insert(ledgerRows);
      if (error) {
        result.errors.push(`Ledger Accounts: ${error.message}`);
      } else {
        result.migratedCounts.ledgerAccounts = data.ledgerAccounts.length;
      }
      processedItems += data.ledgerAccounts.length;
    }

    // Migrate Snapshots (with account snapshots)
    if (data.snapshots.length > 0) {
      onProgress({ step: 'snapshots', current: processedItems, total: totalItems, message: `Migrating ${data.snapshots.length} snapshots...` });

      for (const snapshot of data.snapshots) {
        // Insert snapshot first
        const { data: insertedSnapshot, error: snapshotError } = await supabase
          .from('net_worth_snapshots')
          .insert({
            user_id: user.id,
            month_end_local: snapshot.monthEndLocal,
            net_worth_base: snapshot.netWorthBase,
            total_assets: snapshot.totalsByNature?.asset || 0,
            total_liabilities: snapshot.totalsByNature?.liability || 0,
            base_currency: 'MXN', // Default, could be from settings
            created_at: snapshot.createdAt,
          })
          .select('id')
          .single();

        if (snapshotError) {
          result.errors.push(`Snapshot ${snapshot.monthEndLocal}: ${snapshotError.message}`);
          continue;
        }

        // Insert account snapshots if present
        if (snapshot.accountSnapshots && snapshot.accountSnapshots.length > 0 && insertedSnapshot) {
          const accountSnapshotRows = snapshot.accountSnapshots.map((as: AccountSnapshot) => ({
            snapshot_id: insertedSnapshot.id,
            user_id: user.id,
            account_name: as.accountName,
            account_type: as.accountType,
            currency: as.currency,
            balance: as.balance,
            balance_base: as.balanceBase,
            nature: as.nature,
          }));

          const { error: asError } = await supabase.from('account_snapshots').insert(accountSnapshotRows);
          if (asError) {
            result.errors.push(`Account snapshots for ${snapshot.monthEndLocal}: ${asError.message}`);
          }
        }

        result.migratedCounts.snapshots++;
        processedItems++;
      }
    }

    // Complete
    onProgress({ step: 'complete', current: totalItems, total: totalItems, message: 'Migration complete!' });
    result.success = result.errors.length === 0;

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    onProgress({ step: 'error', current: processedItems, total: totalItems, message });
    result.errors.push(message);
  }

  return result;
}

// Clear localStorage data after successful migration
export function clearLocalStorageData(): void {
  const keysToRemove = [
    'fintonico-expenses',
    'fintonico-incomes',
    'fintonico-accounts',
    'fintonico-ledger-accounts',
    'fintonico-snapshots',
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Export for testing
export const migrationService = {
  readLocalStorageData,
  checkExistingSupabaseData,
  migrateToSupabase,
  clearLocalStorageData,
};
