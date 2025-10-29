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

  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
    writable: false,
  });
};

ensureLocalStorage();

let useCurrencyStoreRef!: typeof import('../stores/currencyStore').useCurrencyStore;
let SUPPORTED_CURRENCIES_REF!: typeof import('../stores/currencyStore').SUPPORTED_CURRENCIES;

beforeAll(async () => {
  const module = await import('../stores/currencyStore');
  useCurrencyStoreRef = module.useCurrencyStore;
  SUPPORTED_CURRENCIES_REF = module.SUPPORTED_CURRENCIES;
});

const resetStore = async () => {
  localStorage.clear();
  const { resetEnabledCurrencies, setBaseCurrency } = useCurrencyStoreRef.getState();
  resetEnabledCurrencies();
  await setBaseCurrency('MXN');
};

describe('currency visibility controls', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('keeps base currency enabled when toggling others off', () => {
    const { toggleCurrency, getVisibleCurrencies } = useCurrencyStoreRef.getState();

    // Disable all optional currencies
    SUPPORTED_CURRENCIES_REF.forEach((currency) => {
      if (currency.code !== 'MXN') {
        toggleCurrency(currency.code);
      }
    });

    const visible = getVisibleCurrencies();
    expect(visible).toEqual(['MXN']);
  });

  it('persists enabled currencies to localStorage', () => {
    const { toggleCurrency } = useCurrencyStoreRef.getState();
    toggleCurrency('USD');
    const snapshot = localStorage.getItem('fintonico-currency');
    expect(snapshot).toBeTruthy();

    const parsed = JSON.parse(snapshot as string);
    expect(parsed.state.enabledCurrencies).not.toContain('USD');
  });

  it('restores enabled currencies on rehydrate', async () => {
    const { toggleCurrency } = useCurrencyStoreRef.getState();
    toggleCurrency('EUR');

    // Simulate new session
    const snapshot = localStorage.getItem('fintonico-currency');
    expect(snapshot).toBeTruthy();

    // Clear the in-memory store and rehydrate
    useCurrencyStoreRef.setState((state) => ({
      ...state,
      enabledCurrencies: [],
    }));
    await useCurrencyStoreRef.persist.rehydrate();

    const { enabledCurrencies } = useCurrencyStoreRef.getState();
    expect(enabledCurrencies).not.toContain('EUR');
  });
});
