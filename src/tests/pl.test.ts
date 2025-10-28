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

let getPL!: typeof import('../selectors/finance').getPL;
let useLedgerStoreRef!: typeof import('../stores/ledgerStore').useLedgerStore;

beforeAll(async () => {
  ({ getPL } = await import('../selectors/finance'));
  ({ useLedgerStore: useLedgerStoreRef } = await import('../stores/ledgerStore'));
});

const resetLedger = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  const ledger = useLedgerStoreRef.getState();
  ledger.clearAllData();
  useLedgerStoreRef.getState().initializeDefaultAccounts();
};

describe('Profit & Loss selector respects date range', () => {
  beforeEach(() => {
    resetLedger();
  });

  it('excludes expenses booked before the period start', () => {
    const ledger = useLedgerStoreRef.getState();

    ledger.addExpenseTransaction(
      'September groceries',
      Money.fromMajorUnits(150, 'MXN'),
      'food',
      'cash',
      new Date('2025-09-15T12:00:00Z')
    );

    ledger.addExpenseTransaction(
      'October rent',
      Money.fromMajorUnits(400, 'MXN'),
      'housing',
      'cash',
      new Date('2025-10-05T12:00:00Z')
    );

    const start = new Date('2025-10-01T00:00:00Z');
    const end = new Date('2025-10-31T23:59:59Z');

    const pl = getPL(start, end);

    expect(pl.totalExpenses.toMajorUnits()).toBeCloseTo(400, 2);
    expect(pl.expenseBreakdown).toHaveLength(1);
    expect(pl.expenseBreakdown[0].accountName).toContain('Housing');
  });
});
