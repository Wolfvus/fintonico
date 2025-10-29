import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { useLedgerStore } from '../stores/ledgerStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useIncomeStore } from '../stores/incomeStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useAccountStore } from '../stores/accountStore';
import { getMonthEndSummary } from '../selectors/monthEnd';

const resetState = () => {
  localStorage.clear();

  const ledger = useLedgerStore.getState();
  ledger.clearAllData();
  ledger.initializeDefaultAccounts();

  useExpenseStore.setState({ expenses: [], loading: false });
  useIncomeStore.setState({ incomes: [], loading: false });
  useAccountStore.setState({ accounts: [] });

  useCurrencyStore.setState((state) => ({
    ...state,
    baseCurrency: 'MXN',
    exchangeRates: { MXN: 1 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  }));
};

describe('month-end summary', () => {
  beforeEach(() => {
    resetState();
  });

  it('summarises cash and liabilities as of month end', async () => {
    const incomeStore = useIncomeStore.getState();
    const expenseStore = useExpenseStore.getState();
    const accountStore = useAccountStore.getState();

    const checkingAccount = accountStore.addAccount({
      name: 'Checking Account',
      type: 'bank',
      balances: [{ currency: 'MXN', amount: 0 }],
    });

    const creditCardAccount = accountStore.addAccount({
      name: 'Visa Credit Card',
      type: 'credit-card',
      balances: [{ currency: 'MXN', amount: -200 }],
    });

    accountStore.addAccount({
      name: 'Beach House',
      type: 'property',
      balances: [{ currency: 'MXN', amount: 500000 }],
    });

    await incomeStore.addIncome({
      source: 'Consulting',
      amount: 1000,
      currency: 'MXN',
      frequency: 'one-time',
      date: '2025-10-01',
      depositAccountId: checkingAccount.id,
    });

    await expenseStore.addExpense({
      what: 'Conference travel',
      amount: 200,
      currency: 'MXN',
      rating: 'non_essential',
      date: '2025-10-05',
      fundingAccountId: creditCardAccount.id,
    });

    const summary = getMonthEndSummary(new Date('2025-10-31'));

    expect(summary.totalCash.toMajorUnits()).toBeCloseTo(1000, 2);
    expect(summary.totalLiabilities.toMajorUnits()).toBeCloseTo(200, 2);

    const creditCard = summary.liabilityAccounts.find((item) => item.accountId === creditCardAccount.id);
    expect(creditCard).toBeDefined();
    expect(creditCard?.balance.toMajorUnits()).toBeCloseTo(200, 2);
    expect(creditCard?.recommendedAction).toBe('paydown');

    const checking = summary.cashAccounts.find((item) => item.accountId === checkingAccount.id);
    expect(checking).toBeDefined();
    expect(checking?.balance.toMajorUnits()).toBeCloseTo(1000, 2);

    const longTermAsset = summary.cashAccounts.find((item) => item.accountName === 'Beach House');
    expect(longTermAsset).toBeUndefined();
  });
});
