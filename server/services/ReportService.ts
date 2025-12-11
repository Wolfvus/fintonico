import { supabaseAdmin } from '../lib/supabase';
import { accountService } from './AccountService';

export interface AccountBalance {
  account_id: string;
  account_name: string;
  account_type: string;
  account_code: string;
  currency: string;
  balance_cents: number;
}

export interface TrialBalance {
  as_of_date: string;
  accounts: AccountBalance[];
  totals: {
    debits_cents: number;
    credits_cents: number;
    is_balanced: boolean;
  };
}

export interface BalanceSheet {
  as_of_date: string;
  assets: {
    accounts: AccountBalance[];
    total_cents: number;
  };
  liabilities: {
    accounts: AccountBalance[];
    total_cents: number;
  };
  equity: {
    accounts: AccountBalance[];
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

export class ReportService {
  /**
   * Calculate account balances as of a specific date
   */
  private async calculateAccountBalances(userId: string, asOfDate: string): Promise<AccountBalance[]> {
    // Get all user accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id, name, type, code, currency')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('code');

    if (accountsError) throw accountsError;
    if (!accounts) return [];

    // Get all postings up to asOfDate
    const { data: postings, error: postingsError } = await supabaseAdmin
      .from('postings')
      .select('account_id, amount_cents, is_debit, transactions!inner(date, user_id)')
      .eq('transactions.user_id', userId)
      .lte('transactions.date', asOfDate);

    if (postingsError) throw postingsError;

    // Calculate balances
    const balanceMap = new Map<string, number>();
    accounts.forEach((account) => balanceMap.set(account.id, 0));

    postings?.forEach((posting: any) => {
      const account = accounts.find((a) => a.id === posting.account_id);
      if (!account) return;

      let amount = posting.amount_cents;

      // Assets & Expenses: Debits increase, Credits decrease
      // Liabilities, Equity & Income: Credits increase, Debits decrease
      if (account.type === 'asset' || account.type === 'expense') {
        amount = posting.is_debit ? amount : -amount;
      } else {
        amount = posting.is_debit ? -amount : amount;
      }

      balanceMap.set(account.id, (balanceMap.get(account.id) || 0) + amount);
    });

    return accounts.map((account) => ({
      account_id: account.id,
      account_name: account.name,
      account_type: account.type,
      account_code: account.code,
      currency: account.currency,
      balance_cents: balanceMap.get(account.id) || 0,
    }));
  }

  /**
   * Generate trial balance report
   */
  async getTrialBalance(userId: string, asOfDate?: string): Promise<TrialBalance> {
    const date = asOfDate || new Date().toISOString().split('T')[0];
    const balances = await this.calculateAccountBalances(userId, date);

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;

    balances.forEach((b) => {
      if (b.balance_cents > 0) {
        if (b.account_type === 'asset' || b.account_type === 'expense') {
          totalDebits += b.balance_cents;
        } else {
          totalCredits += b.balance_cents;
        }
      } else if (b.balance_cents < 0) {
        if (b.account_type === 'asset' || b.account_type === 'expense') {
          totalCredits += Math.abs(b.balance_cents);
        } else {
          totalDebits += Math.abs(b.balance_cents);
        }
      }
    });

    return {
      as_of_date: date,
      accounts: balances,
      totals: {
        debits_cents: totalDebits,
        credits_cents: totalCredits,
        is_balanced: totalDebits === totalCredits,
      },
    };
  }

  /**
   * Generate balance sheet report
   */
  async getBalanceSheet(userId: string, asOfDate?: string): Promise<BalanceSheet> {
    const date = asOfDate || new Date().toISOString().split('T')[0];
    const balances = await this.calculateAccountBalances(userId, date);

    // Group by type
    const assets = balances.filter((b) => b.account_type === 'asset');
    const liabilities = balances.filter((b) => b.account_type === 'liability');
    const equity = balances.filter((b) => b.account_type === 'equity');

    // Calculate totals
    const totalAssets = assets.reduce((sum, a) => sum + a.balance_cents, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance_cents, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance_cents, 0);

    // Calculate net income (retained earnings)
    const income = balances.filter((b) => b.account_type === 'income');
    const expenses = balances.filter((b) => b.account_type === 'expense');
    const totalIncome = income.reduce((sum, a) => sum + a.balance_cents, 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance_cents, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      as_of_date: date,
      assets: {
        accounts: assets,
        total_cents: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total_cents: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total_cents: totalEquity,
        retained_earnings_cents: netIncome,
        total_with_retained_cents: totalEquity + netIncome,
      },
      totals: {
        total_assets_cents: totalAssets,
        total_liabilities_equity_cents: totalLiabilities + totalEquity + netIncome,
        is_balanced: totalAssets === totalLiabilities + totalEquity + netIncome,
      },
    };
  }

  /**
   * Generate income statement for a date range
   */
  async getIncomeStatement(userId: string, startDate?: string, endDate?: string): Promise<IncomeStatement> {
    const end = endDate || new Date().toISOString().split('T')[0];
    const start =
      startDate ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Get income and expense accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id, name, type, code, currency')
      .eq('user_id', userId)
      .in('type', ['income', 'expense'])
      .order('code');

    if (accountsError) throw accountsError;
    if (!accounts) {
      return {
        period: { start_date: start, end_date: end },
        income: { accounts: [], total_cents: 0 },
        expenses: { accounts: [], total_cents: 0 },
        net_income_cents: 0,
      };
    }

    // Get postings in date range
    const { data: postings, error: postingsError } = await supabaseAdmin
      .from('postings')
      .select('account_id, amount_cents, is_debit, transactions!inner(date, user_id)')
      .eq('transactions.user_id', userId)
      .gte('transactions.date', start)
      .lte('transactions.date', end);

    if (postingsError) throw postingsError;

    // Calculate balances for period
    const balanceMap = new Map<string, number>();
    accounts.forEach((account) => balanceMap.set(account.id, 0));

    postings?.forEach((posting: any) => {
      const account = accounts.find((a) => a.id === posting.account_id);
      if (!account) return;

      let amount = posting.amount_cents;

      // Income: Credits increase, Debits decrease
      // Expenses: Debits increase, Credits decrease
      if (account.type === 'expense') {
        amount = posting.is_debit ? amount : -amount;
      } else {
        amount = posting.is_debit ? -amount : amount;
      }

      balanceMap.set(account.id, (balanceMap.get(account.id) || 0) + amount);
    });

    const incomeAccounts = accounts
      .filter((a) => a.type === 'income')
      .map((a) => ({
        account_id: a.id,
        account_name: a.name,
        account_code: a.code,
        currency: a.currency,
        amount_cents: balanceMap.get(a.id) || 0,
      }));

    const expenseAccounts = accounts
      .filter((a) => a.type === 'expense')
      .map((a) => ({
        account_id: a.id,
        account_name: a.name,
        account_code: a.code,
        currency: a.currency,
        amount_cents: balanceMap.get(a.id) || 0,
      }));

    const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.amount_cents, 0);
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.amount_cents, 0);

    return {
      period: {
        start_date: start,
        end_date: end,
      },
      income: {
        accounts: incomeAccounts,
        total_cents: totalIncome,
      },
      expenses: {
        accounts: expenseAccounts,
        total_cents: totalExpenses,
      },
      net_income_cents: totalIncome - totalExpenses,
    };
  }

  /**
   * Get all account balances (simplified view)
   */
  async getAccountBalances(userId: string, asOfDate?: string): Promise<{ as_of_date: string; accounts: AccountBalance[] }> {
    const date = asOfDate || new Date().toISOString().split('T')[0];
    const balances = await this.calculateAccountBalances(userId, date);

    return {
      as_of_date: date,
      accounts: balances,
    };
  }

  /**
   * Get net worth (assets - liabilities)
   */
  async getNetWorth(userId: string, asOfDate?: string): Promise<{ as_of_date: string; net_worth_cents: number; assets_cents: number; liabilities_cents: number }> {
    const date = asOfDate || new Date().toISOString().split('T')[0];
    const balances = await this.calculateAccountBalances(userId, date);

    const totalAssets = balances
      .filter((b) => b.account_type === 'asset')
      .reduce((sum, a) => sum + a.balance_cents, 0);

    const totalLiabilities = balances
      .filter((b) => b.account_type === 'liability')
      .reduce((sum, a) => sum + a.balance_cents, 0);

    return {
      as_of_date: date,
      net_worth_cents: totalAssets - totalLiabilities,
      assets_cents: totalAssets,
      liabilities_cents: totalLiabilities,
    };
  }

  /**
   * Get cashflow summary for a period
   */
  async getCashflow(userId: string, startDate?: string, endDate?: string): Promise<{
    period: { start_date: string; end_date: string };
    inflows_cents: number;
    outflows_cents: number;
    net_cashflow_cents: number;
  }> {
    const incomeStatement = await this.getIncomeStatement(userId, startDate, endDate);

    return {
      period: incomeStatement.period,
      inflows_cents: incomeStatement.income.total_cents,
      outflows_cents: incomeStatement.expenses.total_cents,
      net_cashflow_cents: incomeStatement.net_income_cents,
    };
  }
}

export const reportService = new ReportService();
