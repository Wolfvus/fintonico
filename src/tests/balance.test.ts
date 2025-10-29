import './setupLocalStorage';
import { describe, it, expect } from 'vitest';
import { validateBalanced } from '../lib/balance';
import { DirectionError, UnbalancedEntryError, BaseCurrencyError } from '../domain/errors';
import { EntryLine } from '../domain/types';

const makeLine = (overrides: Partial<EntryLine>): EntryLine => ({
  id: 'line',
  entryId: 'entry',
  accountId: 'acct',
  nativeAmount: 100,
  nativeCurrency: 'MXN',
  baseAmount: 100,
  baseCurrency: 'MXN',
  fxRate: 1,
  direction: 'debit',
  ...overrides,
});

describe('validateBalanced', () => {
  it('throws when entry lines do not sum to zero', () => {
    const lines: EntryLine[] = [
      makeLine({ id: 'l1', baseAmount: 100, direction: 'debit' }),
      makeLine({ id: 'l2', baseAmount: -90, direction: 'credit' }),
    ];

    expect(() => validateBalanced('entry-1', lines, 'MXN')).toThrow(UnbalancedEntryError);
  });

  it('throws when a debit has a negative base amount', () => {
    const lines: EntryLine[] = [
      makeLine({ id: 'l1', baseAmount: 100, direction: 'debit' }),
      makeLine({ id: 'l2', baseAmount: -100, direction: 'credit' }),
      makeLine({ id: 'l3', direction: 'debit', baseAmount: -10 }),
      makeLine({ id: 'l4', direction: 'credit', baseAmount: 10 }),
    ];

    expect(() => validateBalanced('entry-2', lines, 'MXN')).toThrow(DirectionError);
  });

  it('throws when line base currency differs from entry base currency', () => {
    const lines: EntryLine[] = [
      makeLine({ id: 'l1', baseAmount: 100, direction: 'debit' }),
      makeLine({ id: 'l2', baseAmount: -100, direction: 'credit', baseCurrency: 'USD' }),
    ];

    expect(() => validateBalanced('entry-3', lines, 'MXN')).toThrow(BaseCurrencyError);
  });
});
