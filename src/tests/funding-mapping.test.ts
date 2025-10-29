import './setupLocalStorage';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { getCombinedTransactions } from '../selectors/finance';

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

let useLedgerStoreRef!: typeof import('../stores/ledgerStore').useLedgerStore;
let useExpenseStoreRef!: typeof import('../stores/expenseStore').useExpenseStore;
let useIncomeStoreRef!: typeof import('../stores/incomeStore').useIncomeStore;
let useCurrencyStoreRef!: typeof import('../stores/currencyStore').useCurrencyStore;

beforeAll(async () => {
  const ledgerModule = await import('../stores/ledgerStore');
  const expenseModule = await import('../stores/expenseStore');
  const incomeModule = await import('../stores/incomeStore');
  const currencyModule = await import('../stores/currencyStore');

  useLedgerStoreRef = ledgerModule.useLedgerStore;
  useExpenseStoreRef = expenseModule.useExpenseStore;
  useIncomeStoreRef = incomeModule.useIncomeStore;
  useCurrencyStoreRef = currencyModule.useCurrencyStore;
});

const resetStores = () => {
  localStorage.clear();

  const ledger = useLedgerStoreRef.getState();
  ledger.clearAllData();
  ledger.initializeDefaultAccounts();

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

describe('funding mapping for income and expenses', () => {
  beforeEach(() => {
    resetStores();
  });

  it('records the funding account for expense transactions', async () => {
    const expenseStore = useExpenseStoreRef.getState();

    await expenseStore.addExpense({
      what: 'Conference travel',
      amount: 250,
      currency: 'MXN',
      rating: 'important',
      date: '2025-10-05',
      fundingAccountId: 'credit-card',
    });

    const ledger = useLedgerStoreRef.getState();
    const transaction = ledger.getTransactions().find(tx => tx.description === 'Conference travel');
    expect(transaction).toBeDefined();

    const creditPosting = transaction?.postings.find(posting => posting.accountId === 'credit-card');
    expect(creditPosting?.bookedCreditAmount?.toMajorUnits()).toBeCloseTo(250, 2);

    const derivedExpense = expenseStore._deriveExpensesFromLedger()[0];
    expect(derivedExpense.fundingAccountId).toBe('credit-card');

    const combinedExpenses = getCombinedTransactions(new Date('2025-10-01'), new Date('2025-10-31'), 'expense');
    expect(combinedExpenses[0].fundingAccountId).toBe('credit-card');
    expect(combinedExpenses[0].fundingAccountName?.toLowerCase()).toContain('credit');
  });

  it('records the deposit account for income transactions', async () => {
    const incomeStore = useIncomeStoreRef.getState();

    await incomeStore.addIncome({
      source: 'Consulting invoice',
      amount: 500,
      currency: 'MXN',
      frequency: 'one-time',
      date: '2025-10-10',
      depositAccountId: 'checking',
    });

    const ledger = useLedgerStoreRef.getState();
    const transaction = ledger.getTransactions().find(tx => tx.description === 'Consulting invoice');
    expect(transaction).toBeDefined();
    const depositPosting = transaction?.postings.find(posting => posting.accountId === 'checking');
    expect(depositPosting?.bookedDebitAmount?.toMajorUnits()).toBeCloseTo(500, 2);

    const derivedIncome = incomeStore._deriveIncomesFromLedger()[0];
    expect(derivedIncome.depositAccountId).toBe('checking');

    const combinedIncome = getCombinedTransactions(new Date('2025-10-01'), new Date('2025-10-31'), 'income');
    expect(combinedIncome[0].fundingAccountId).toBe('checking');
    expect(combinedIncome[0].fundingAccountName?.toLowerCase()).toContain('checking');
  });
});
