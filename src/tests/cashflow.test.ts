import './setupLocalStorage';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { Money } from '../domain/money';

const ensureLocalStorage = () => {
  if (typeof globalThis.localStorage !== 'undefined') {
    return;
  }

  let store = new Map<string, string>();

  const localStorageMock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map<string, string>();
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

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: false,
  });
};

ensureLocalStorage();

let getCashflowStatement!: typeof import('../selectors/finance').getCashflowStatement;
let useLedgerStoreRef!: typeof import('../stores/ledgerStore').useLedgerStore;
let useCurrencyStoreRef!: typeof import('../stores/currencyStore').useCurrencyStore;

beforeAll(async () => {
  ({ getCashflowStatement } = await import('../selectors/finance'));
  ({ useLedgerStore: useLedgerStoreRef } = await import('../stores/ledgerStore'));
  ({ useCurrencyStore: useCurrencyStoreRef } = await import('../stores/currencyStore'));
});

const resetStores = () => {
  // Ensure clean persisted state between tests
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  const ledgerState = useLedgerStoreRef.getState();
  ledgerState.clearAllData();
  useLedgerStoreRef.getState().initializeDefaultAccounts();

  const currencyState = useCurrencyStoreRef.getState();
  useCurrencyStoreRef.setState({
    ...currencyState,
    baseCurrency: 'MXN',
    exchangeRates: { MXN: 1, USD: 0.057, EUR: 0.052 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  });
};

const start = new Date('2025-01-01T00:00:00Z');
const end = new Date('2025-01-31T23:59:59Z');

describe('cashflow selectors', () => {
  beforeEach(() => {
    resetStores();
  });

  it('matches the change in cash balances for income and expenses within the period', () => {
    const ledger = useLedgerStoreRef.getState();

    ledger.addIncomeTransaction(
      'January salary',
      Money.fromMajorUnits(1000, 'MXN'),
      'cash',
      'salary',
      new Date('2025-01-05T12:00:00Z')
    );

    ledger.addExpenseTransaction(
      'Rent payment',
      Money.fromMajorUnits(400, 'MXN'),
      'housing',
      'cash',
      new Date('2025-01-10T12:00:00Z')
    );

    const statement = getCashflowStatement(start, end);

    expect(statement.inflows.toMajorUnits()).toBeCloseTo(1000, 2);
    expect(statement.outflows.toMajorUnits()).toBeCloseTo(400, 2);
    expect(statement.net.toMajorUnits()).toBeCloseTo(600, 2);

    const cashBalance = ledger.getAccountBalance('cash', end).toMajorUnits();
    expect(cashBalance).toBeCloseTo(600, 2);
  });

  it('treats expense-only periods as outflows with zero inflow', () => {
    const ledger = useLedgerStoreRef.getState();

    // Seed opening balance before the reporting window
    ledger.addIncomeTransaction(
      'December salary',
      Money.fromMajorUnits(500, 'MXN'),
      'cash',
      'salary',
      new Date('2024-12-15T12:00:00Z')
    );

    ledger.addExpenseTransaction(
      'Groceries',
      Money.fromMajorUnits(200, 'MXN'),
      'food',
      'cash',
      new Date('2025-01-08T12:00:00Z')
    );

    const statement = getCashflowStatement(start, end);

    expect(statement.inflows.toMajorUnits()).toBeCloseTo(0, 2);
    expect(statement.outflows.toMajorUnits()).toBeCloseTo(200, 2);
    expect(statement.net.toMajorUnits()).toBeCloseTo(-200, 2);

    const expenseBreakdown = statement.breakdown.find((item) => item.source === 'expense');
    expect(expenseBreakdown?.outflow.toMajorUnits()).toBeCloseTo(200, 2);
  });

  it('normalises cash movements to the active base currency using FX rates', () => {
    const ledger = useLedgerStoreRef.getState();
    const currencyState = useCurrencyStoreRef.getState();

    useCurrencyStoreRef.setState({
      ...currencyState,
      baseCurrency: 'USD',
      exchangeRates: { USD: 1, MXN: 17.5 },
      lastUpdated: Date.now(),
      loading: false,
      error: null,
    });

    ledger.addIncomeTransaction(
      'International salary',
      Money.fromMajorUnits(1750, 'MXN'),
      'cash',
      'salary',
      new Date('2025-01-04T12:00:00Z')
    );

    ledger.addExpenseTransaction(
      'Rent in MXN',
      Money.fromMajorUnits(350, 'MXN'),
      'housing',
      'cash',
      new Date('2025-01-15T12:00:00Z')
    );

    const statement = getCashflowStatement(start, end);

    expect(statement.currency).toBe('USD');
    expect(statement.inflows.toMajorUnits()).toBeCloseTo(100, 2);
    expect(statement.outflows.toMajorUnits()).toBeCloseTo(20, 2);
    expect(statement.net.toMajorUnits()).toBeCloseTo(80, 2);
  });
});
