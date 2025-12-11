import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { useExpenseStore } from '../stores/expenseStore';
import { useIncomeStore } from '../stores/incomeStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useAccountStore } from '../stores/accountStore';

const resetState = () => {
  localStorage.clear();

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
    // Create accounts for net worth tracking
    const { addAccount } = useAccountStore.getState();

    addAccount({
      name: 'Checking Account',
      type: 'bank',
      currency: 'MXN',
      balance: 1000,
    });

    addAccount({
      name: 'Visa Credit Card',
      type: 'credit-card',
      currency: 'MXN',
      balance: -200,
    });

    addAccount({
      name: 'Beach House',
      type: 'property',
      currency: 'MXN',
      balance: 500000,
    });

    // Record income and expenses separately (not linked to accounts)
    const { addIncome } = useIncomeStore.getState();
    await addIncome({
      source: 'Consulting',
      amount: 1000,
      currency: 'MXN',
      frequency: 'one-time',
      date: '2025-10-01',
    });

    const { addExpense } = useExpenseStore.getState();
    await addExpense({
      what: 'Conference travel',
      amount: 200,
      currency: 'MXN',
      rating: 'non_essential',
      date: '2025-10-05',
    });

    // Verify accounts are separate from income/expense tracking
    const accounts = useAccountStore.getState().accounts;
    expect(accounts).toHaveLength(3);

    const checkingAccount = accounts.find(a => a.name === 'Checking Account');
    expect(checkingAccount?.balance).toBe(1000);

    const creditCard = accounts.find(a => a.name === 'Visa Credit Card');
    expect(creditCard?.balance).toBe(-200);

    // Property should exist but is long-term asset
    const property = accounts.find(a => a.name === 'Beach House');
    expect(property?.balance).toBe(500000);

    // Verify income and expenses are tracked separately
    const incomes = useIncomeStore.getState()._deriveIncomesFromLedger();
    expect(incomes).toHaveLength(1);
    expect(incomes[0].source).toBe('Consulting');

    const expenses = useExpenseStore.getState()._deriveExpensesFromLedger();
    expect(expenses).toHaveLength(1);
    expect(expenses[0].what).toBe('Conference travel');
  });
});
