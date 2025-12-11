// Reports API
import { apiClient } from './client';
import type {
  TrialBalance,
  BalanceSheet,
  IncomeStatement,
  NetWorth,
  Cashflow,
} from './types';

export interface ReportDateParams {
  asOfDate?: string;
  startDate?: string;
  endDate?: string;
}

export const reportsApi = {
  /**
   * Get trial balance report
   */
  async getTrialBalance(asOfDate?: string): Promise<TrialBalance> {
    return apiClient.get<TrialBalance>('/reports/trial-balance', { asOfDate });
  },

  /**
   * Get balance sheet report
   */
  async getBalanceSheet(asOfDate?: string): Promise<BalanceSheet> {
    return apiClient.get<BalanceSheet>('/reports/balance-sheet', { asOfDate });
  },

  /**
   * Get income statement report
   */
  async getIncomeStatement(startDate?: string, endDate?: string): Promise<IncomeStatement> {
    return apiClient.get<IncomeStatement>('/reports/income-statement', { startDate, endDate });
  },

  /**
   * Get all account balances
   */
  async getAccountBalances(asOfDate?: string): Promise<{ as_of_date: string; accounts: Array<{
    account_id: string;
    account_name: string;
    account_type: string;
    account_code: string;
    currency: string;
    balance_cents: number;
  }>}> {
    return apiClient.get('/reports/account-balances', { asOfDate });
  },

  /**
   * Get net worth
   */
  async getNetWorth(asOfDate?: string): Promise<NetWorth> {
    return apiClient.get<NetWorth>('/reports/net-worth', { asOfDate });
  },

  /**
   * Get cashflow summary
   */
  async getCashflow(startDate?: string, endDate?: string): Promise<Cashflow> {
    return apiClient.get<Cashflow>('/reports/cashflow', { startDate, endDate });
  },
};
