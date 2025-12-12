// @vitest-environment jsdom
import React from 'react';
import './setupLocalStorage';

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

vi.mock('../utils/resetData', () => ({
  clearMockData: vi.fn(() => Promise.resolve()),
  seedMockData: vi.fn(() => Promise.resolve()),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearMockData, seedMockData } from '../utils/resetData';
import { SettingsModal } from '../components/Settings/SettingsModal';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

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

beforeAll(async () => {
  ({ useCurrencyStore: useCurrencyStoreRef } = await import('../stores/currencyStore'));
});

const resetStore = async () => {
  localStorage.clear();
  const { resetEnabledCurrencies, setBaseCurrency } = useCurrencyStoreRef.getState();
  resetEnabledCurrencies();
  await setBaseCurrency('MXN');
};

describe('SettingsModal', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetStore();
  });

  const CurrencyProbe: React.FC = () => {
    const { currency } = useCurrencyInput();
    return <span data-testid="currency-probe">{currency}</span>;
  };

  it('reflects current visibility choices and saves updates', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SettingsModal isOpen onClose={onClose} />);

    const baseSelect = screen.getByLabelText(/base currency/i) as HTMLSelectElement;
    expect(baseSelect.value).toBe('MXN');

    const baseToggle = screen.getByLabelText('MXN visibility toggle') as HTMLInputElement;
    expect(baseToggle.disabled).toBe(true);

    const usdToggle = screen.getByLabelText('USD visibility toggle') as HTMLInputElement;
    expect(usdToggle.checked).toBe(true);

    await user.click(usdToggle);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { enabledCurrencies } = useCurrencyStoreRef.getState();
    expect(enabledCurrencies).not.toContain('USD');
  });

  it('reset button restores defaults before saving', async () => {
    const user = userEvent.setup();

    render(<SettingsModal isOpen onClose={() => {}} />);

    const eurToggle = screen.getByLabelText('EUR visibility toggle') as HTMLInputElement;
    await user.click(eurToggle); // disable
    expect(eurToggle.checked).toBe(false);

    const resetButton = screen.getByRole('button', { name: /reset defaults/i });
    await user.click(resetButton);

    expect((screen.getByLabelText('EUR visibility toggle') as HTMLInputElement).checked).toBe(true);
  });

  it('allows selecting a new base currency', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SettingsModal isOpen onClose={onClose} />);

    const baseSelect = screen.getByLabelText(/base currency/i) as HTMLSelectElement;
    await user.selectOptions(baseSelect, 'USD');
    expect(baseSelect.value).toBe('USD');

    const usdToggle = screen.getByLabelText('USD visibility toggle') as HTMLInputElement;
    expect(usdToggle.disabled).toBe(true);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { baseCurrency } = useCurrencyStoreRef.getState();
    expect(baseCurrency).toBe('USD');
  });

  it('clears local data when the clear button is pressed', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SettingsModal isOpen onClose={() => {}} />);

    const clearButton = screen.getByRole('button', { name: /clear local data/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(vi.mocked(clearMockData)).toHaveBeenCalledTimes(1);
    });

    confirmSpy.mockRestore();
  });

  it('seeds mock data when the seed button is pressed', async () => {
    const user = userEvent.setup();

    render(<SettingsModal isOpen onClose={() => {}} />);

    const seedButton = screen.getByRole('button', { name: /seed mock data/i });
    await user.click(seedButton);

    await waitFor(() => {
      expect(vi.mocked(seedMockData)).toHaveBeenCalledTimes(1);
    });
  });

  it('updates currency inputs when the base currency changes', async () => {
    const user = userEvent.setup();

    render(
      <>
        <SettingsModal isOpen onClose={() => {}} />
        <CurrencyProbe />
      </>
    );

    expect(screen.getByTestId('currency-probe')).toHaveTextContent('MXN');

    const baseSelect = screen.getByLabelText(/base currency/i) as HTMLSelectElement;
    await user.selectOptions(baseSelect, 'USD');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('currency-probe')).toHaveTextContent('USD');
    });
  });
});
