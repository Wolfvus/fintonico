import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { getNetWorthAt } from '../selectors/finance';
import { useLedgerStore } from '../stores/ledgerStore';
import { useAccountStore } from '../stores/accountStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { Money } from '../domain/money';

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
    exchangeRates: { MXN: 1 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  }));
};

describe('net worth selector', () => {
  beforeEach(() => {
    resetState();
  });

  it('treats liabilities as positive contributions even when stored as negatives', () => {
    const ledger = useLedgerStore.getState();

    ledger.addIncomeTransaction(
      'Salary',
      Money.fromMajorUnits(5000, 'MXN'),
      'cash',
      'salary',
      new Date('2025-10-01'),
    );

    ledger.addExpenseTransaction(
      'Travel spend',
      Money.fromMajorUnits(300, 'MXN'),
      'entertainment',
      'credit-card',
      new Date('2025-10-05'),
    );

    const accountStore = useAccountStore.getState();
    accountStore.addAccount({
      name: 'Brokerage',
      type: 'investment',
      balances: [{ currency: 'MXN', amount: 10000 }],
    });

    accountStore.addAccount({
      name: 'Visa Credit Card',
      type: 'credit-card',
      balances: [{ currency: 'MXN', amount: -1800 }],
    });

    const snapshot = getNetWorthAt(new Date('2025-10-31'));

    expect(snapshot.totalAssets.toMajorUnits()).toBeCloseTo(15000, 2);
    expect(snapshot.totalLiabilities.toMajorUnits()).toBeCloseTo(2100, 2);
    expect(snapshot.netWorth.toMajorUnits()).toBeCloseTo(12900, 2);
  });
});
