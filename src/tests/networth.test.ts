import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { getNetWorthAt, getBalancesAt } from '../selectors/finance';
import { useLedgerStore } from '../stores/ledgerStore';
import { useAccountStore } from '../stores/accountStore';
import { useCurrencyStore } from '../stores/currencyStore';

const resetState = () => {
  localStorage.clear();

  const ledger = useLedgerStore.getState();
  ledger.clearAllData();
  ledger.initializeDefaultAccounts();

  useAccountStore.setState({ accounts: [] });

  useCurrencyStore.setState((state) => ({
    ...state,
    baseCurrency: 'MXN',
    enabledCurrencies: ['MXN', 'USD', 'EUR', 'BTC', 'ETH'],
    exchangeRates: { MXN: 1, USD: 20 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  }));
};

describe('net worth selector', () => {
  beforeEach(() => {
    resetState();
  });

  it('uses only external accounts (accountStore) for net worth calculation', () => {
    // Net worth is calculated solely from accountStore (external accounts)
    // Ledger transactions do NOT affect the net worth calculation
    const accountStore = useAccountStore.getState();

    accountStore.addAccount({
      name: 'Savings Account',
      type: 'bank',
      currency: 'MXN',
      balance: 50000,
    });

    accountStore.addAccount({
      name: 'Brokerage',
      type: 'investment',
      currency: 'MXN',
      balance: 10000,
    });

    accountStore.addAccount({
      name: 'Visa Credit Card',
      type: 'credit-card',
      currency: 'MXN',
      balance: -1800,
    });

    const snapshot = getNetWorthAt(new Date('2025-10-31'));

    // Assets: 50000 + 10000 = 60000
    expect(snapshot.totalAssets.toMajorUnits()).toBeCloseTo(60000, 2);
    // Liabilities: abs(-1800) = 1800
    expect(snapshot.totalLiabilities.toMajorUnits()).toBeCloseTo(1800, 2);
    // Net Worth: 60000 - 1800 = 58200
    expect(snapshot.netWorth.toMajorUnits()).toBeCloseTo(58200, 2);
  });

  it('normalizes liability balances (stored as negative) to positive values', () => {
    const accountStore = useAccountStore.getState();

    accountStore.addAccount({
      name: 'Credit Card',
      type: 'credit-card',
      currency: 'MXN',
      balance: -5000, // Debt stored as negative
    });

    accountStore.addAccount({
      name: 'Mortgage',
      type: 'mortgage',
      currency: 'MXN',
      balance: -200000, // Debt stored as negative
    });

    const snapshot = getNetWorthAt(new Date());

    // Liabilities should be positive: 5000 + 200000 = 205000
    expect(snapshot.totalLiabilities.toMajorUnits()).toBeCloseTo(205000, 2);
    // Net Worth: 0 - 205000 = -205000
    expect(snapshot.netWorth.toMajorUnits()).toBeCloseTo(-205000, 2);
  });

  it('converts multi-currency balances to base currency', () => {
    // The currency store uses rates in format: 1 base = X foreign
    // So for MXN base with USD rate of 0.05 means 1 MXN = 0.05 USD
    // To convert USD to MXN: amount / rate = 1000 / 0.05 = 20000 MXN
    useCurrencyStore.setState((state) => ({
      ...state,
      baseCurrency: 'MXN',
      exchangeRates: { MXN: 1, USD: 0.05 }, // 1 MXN = 0.05 USD, so 1 USD = 20 MXN
    }));

    const accountStore = useAccountStore.getState();

    // USD account: $1000 / 0.05 = 20000 MXN
    accountStore.addAccount({
      name: 'US Bank Account',
      type: 'bank',
      currency: 'USD',
      balance: 1000,
    });

    // MXN account: 5000 MXN
    accountStore.addAccount({
      name: 'Local Bank',
      type: 'bank',
      currency: 'MXN',
      balance: 5000,
    });

    const snapshot = getNetWorthAt(new Date());

    // Total Assets: 20000 + 5000 = 25000 MXN
    expect(snapshot.totalAssets.toMajorUnits()).toBeCloseTo(25000, 2);
    expect(snapshot.netWorth.toMajorUnits()).toBeCloseTo(25000, 2);
  });

  it('getBalancesAt returns only external accounts, not ledger accounts', () => {
    const accountStore = useAccountStore.getState();

    accountStore.addAccount({
      name: 'External Account',
      type: 'bank',
      currency: 'MXN',
      balance: 10000,
    });

    const balances = getBalancesAt(new Date());

    // ledgerBalances should be empty (ledger accounts not included)
    expect(balances.ledgerBalances).toHaveLength(0);
    // externalBalances should have our account
    expect(balances.externalBalances).toHaveLength(1);
    expect(balances.externalBalances[0].accountName).toBe('External Account');
    expect(balances.externalBalances[0].balance.toMajorUnits()).toBe(10000);
  });

  it('correctly categorizes account types as assets or liabilities', () => {
    const accountStore = useAccountStore.getState();

    // Asset types
    accountStore.addAccount({ name: 'Cash', type: 'cash', currency: 'MXN', balance: 1000 });
    accountStore.addAccount({ name: 'Bank', type: 'bank', currency: 'MXN', balance: 2000 });
    accountStore.addAccount({ name: 'Exchange', type: 'exchange', currency: 'MXN', balance: 3000 });
    accountStore.addAccount({ name: 'Investment', type: 'investment', currency: 'MXN', balance: 4000 });
    accountStore.addAccount({ name: 'Property', type: 'property', currency: 'MXN', balance: 5000 });
    accountStore.addAccount({ name: 'Other', type: 'other', currency: 'MXN', balance: 6000 });

    // Liability types (stored as negative)
    accountStore.addAccount({ name: 'Loan', type: 'loan', currency: 'MXN', balance: -100 });
    accountStore.addAccount({ name: 'Credit Card', type: 'credit-card', currency: 'MXN', balance: -200 });
    accountStore.addAccount({ name: 'Mortgage', type: 'mortgage', currency: 'MXN', balance: -300 });

    const snapshot = getNetWorthAt(new Date());

    // Assets: 1000 + 2000 + 3000 + 4000 + 5000 + 6000 = 21000
    expect(snapshot.totalAssets.toMajorUnits()).toBeCloseTo(21000, 2);
    // Liabilities: 100 + 200 + 300 = 600
    expect(snapshot.totalLiabilities.toMajorUnits()).toBeCloseTo(600, 2);
    // Net Worth: 21000 - 600 = 20400
    expect(snapshot.netWorth.toMajorUnits()).toBeCloseTo(20400, 2);
  });
});
