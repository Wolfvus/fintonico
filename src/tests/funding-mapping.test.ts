import './setupLocalStorage';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

const ensureLocalStorage = () => {
  if (typeof globalThis.localStorage !== 'undefined') return;

  let store = new Map<string, string>();

  const mock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };

  (globalThis as unknown as { localStorage: Storage }).localStorage = mock;
};

ensureLocalStorage();

let useExpenseStoreRef!: typeof import('../stores/expenseStore').useExpenseStore;
let useIncomeStoreRef!: typeof import('../stores/incomeStore').useIncomeStore;
let useCurrencyStoreRef!: typeof import('../stores/currencyStore').useCurrencyStore;

beforeAll(async () => {
  const expenseModule = await import('../stores/expenseStore');
  const incomeModule = await import('../stores/incomeStore');
  const currencyModule = await import('../stores/currencyStore');

  useExpenseStoreRef = expenseModule.useExpenseStore;
  useIncomeStoreRef = incomeModule.useIncomeStore;
  useCurrencyStoreRef = currencyModule.useCurrencyStore;
});

const resetStores = () => {
  localStorage.clear();

  useExpenseStoreRef.setState({ expenses: [], loading: false });
  useIncomeStoreRef.setState({ incomes: [], loading: false });

  useCurrencyStoreRef.setState(state => ({
    ...state,
    baseCurrency: 'MXN',
    enabledCurrencies: ['MXN', 'USD', 'EUR', 'BTC', 'ETH'],
    exchangeRates: { MXN: 1, USD: 0.057, EUR: 0.052, BTC: 0.0000006, ETH: 0.000022 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  }));
};

describe('income and expense tracking', () => {
  beforeEach(() => {
    resetStores();
  });

  it('records expenses without requiring a funding account', async () => {
    const expenseStore = useExpenseStoreRef.getState();

    await expenseStore.addExpense({
      what: 'Conference travel',
      amount: 250,
      currency: 'MXN',
      rating: 'discretionary',
      date: '2025-10-05',
    });

    const expenses = useExpenseStoreRef.getState().expenses;
    expect(expenses).toHaveLength(1);
    expect(expenses[0].what).toBe('Conference travel');
    expect(expenses[0].amount).toBe(250);
    expect(expenses[0].currency).toBe('MXN');
    expect(expenses[0].rating).toBe('discretionary');
  });

  it('records income without requiring a deposit account', async () => {
    const incomeStore = useIncomeStoreRef.getState();

    await incomeStore.addIncome({
      source: 'Consulting invoice',
      amount: 500,
      currency: 'MXN',
      frequency: 'one-time',
      date: '2025-10-10',
    });

    const incomes = useIncomeStoreRef.getState().incomes;
    expect(incomes).toHaveLength(1);
    expect(incomes[0].source).toBe('Consulting invoice');
    expect(incomes[0].amount).toBe(500);
    expect(incomes[0].currency).toBe('MXN');
    expect(incomes[0].frequency).toBe('one-time');
  });

  it('calculates monthly totals correctly', async () => {
    const incomeStore = useIncomeStoreRef.getState();
    const expenseStore = useExpenseStoreRef.getState();

    // Add income for current month
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    await incomeStore.addIncome({
      source: 'Salary',
      amount: 1000,
      currency: 'MXN',
      frequency: 'monthly',
      date: dateStr,
    });

    await expenseStore.addExpense({
      what: 'Groceries',
      amount: 200,
      currency: 'MXN',
      rating: 'essential',
      date: dateStr,
    });

    expect(incomeStore.getMonthlyTotal()).toBeCloseTo(1000, 2);
    expect(expenseStore.getMonthlyTotal()).toBeCloseTo(200, 2);
  });
});
