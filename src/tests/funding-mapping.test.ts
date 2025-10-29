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
let useAccountStoreRef!: typeof import('../stores/accountStore').useAccountStore;

beforeAll(async () => {
  const ledgerModule = await import('../stores/ledgerStore');
  const expenseModule = await import('../stores/expenseStore');
  const incomeModule = await import('../stores/incomeStore');
  const currencyModule = await import('../stores/currencyStore');
  const accountModule = await import('../stores/accountStore');

  useLedgerStoreRef = ledgerModule.useLedgerStore;
  useExpenseStoreRef = expenseModule.useExpenseStore;
  useIncomeStoreRef = incomeModule.useIncomeStore;
  useCurrencyStoreRef = currencyModule.useCurrencyStore;
  useAccountStoreRef = accountModule.useAccountStore;
});

const resetStores = () => {
  localStorage.clear();

  const ledger = useLedgerStoreRef.getState();
  ledger.clearAllData();
  ledger.initializeDefaultAccounts();

  useExpenseStoreRef.setState({ expenses: [], loading: false });
  useIncomeStoreRef.setState({ incomes: [], loading: false });
  useAccountStoreRef.setState({ accounts: [] });

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
    const accountStore = useAccountStoreRef.getState();

    const cardAccount = accountStore.addAccount({
      name: 'Visa Credit Card',
      type: 'credit-card',
      balances: [{ currency: 'MXN', amount: -250 }],
    });

    await expenseStore.addExpense({
      what: 'Conference travel',
      amount: 250,
      currency: 'MXN',
      rating: 'important',
      date: '2025-10-05',
      fundingAccountId: cardAccount.id,
    });

    const ledger = useLedgerStoreRef.getState();
    const transaction = ledger.getTransactions().find(tx => tx.description === 'Conference travel');
    expect(transaction).toBeDefined();

    const creditPosting = transaction?.postings.find(posting => posting.accountId === cardAccount.id);
    expect(creditPosting?.bookedCreditAmount?.toMajorUnits()).toBeCloseTo(250, 2);

    const derivedExpense = expenseStore._deriveExpensesFromLedger()[0];
    expect(derivedExpense.fundingAccountId).toBe(cardAccount.id);

    const combinedExpenses = getCombinedTransactions(new Date('2025-10-01'), new Date('2025-10-31'), 'expense');
    expect(combinedExpenses[0].fundingAccountId).toBe(cardAccount.id);
    expect(combinedExpenses[0].fundingAccountName?.toLowerCase()).toContain('credit');
  });

  it('records the deposit account for income transactions', async () => {
    const incomeStore = useIncomeStoreRef.getState();
    const accountStore = useAccountStoreRef.getState();

    const checkingAccount = accountStore.addAccount({
      name: 'Checking Account',
      type: 'bank',
      balances: [{ currency: 'MXN', amount: 0 }],
    });

    await incomeStore.addIncome({
      source: 'Consulting invoice',
      amount: 500,
      currency: 'MXN',
      frequency: 'one-time',
      date: '2025-10-10',
      depositAccountId: checkingAccount.id,
    });

    const ledger = useLedgerStoreRef.getState();
    const transaction = ledger.getTransactions().find(tx => tx.description === 'Consulting invoice');
    expect(transaction).toBeDefined();
    const depositPosting = transaction?.postings.find(posting => posting.accountId === checkingAccount.id);
    expect(depositPosting?.bookedDebitAmount?.toMajorUnits()).toBeCloseTo(500, 2);

    const derivedIncome = incomeStore._deriveIncomesFromLedger()[0];
    expect(derivedIncome.depositAccountId).toBe(checkingAccount.id);

    const combinedIncome = getCombinedTransactions(new Date('2025-10-01'), new Date('2025-10-31'), 'income');
    expect(combinedIncome[0].fundingAccountId).toBe(checkingAccount.id);
    expect(combinedIncome[0].fundingAccountName?.toLowerCase()).toContain('checking');
  });
});
