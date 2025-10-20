import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryStore, MemoryStore } from '../store/memory';
import { createFxTable, FxTable } from '../lib/fx';
import { EntriesService } from '../services/entries';
import { EntryAggregate } from '../services/entries';

const setupStore = (): { store: MemoryStore; fx: FxTable; service: EntriesService } => {
  const store = createMemoryStore();
  const fx = createFxTable();
  const service = new EntriesService(store, fx);
  return { store, fx, service };
};

describe('EntriesService.create', () => {
  let store: MemoryStore;
  let fx: FxTable;
  let service: EntriesService;

  beforeEach(() => {
    ({ store, fx, service } = setupStore());
  });

  const sumBase = (aggregate: EntryAggregate) =>
    aggregate.lines.reduce((acc, line) => acc + line.baseAmount, 0);

  it('creates a balanced MXN expense entry', () => {
    store.accounts.create({
      id: 'acct-checking',
      userId: 'user-1',
      name: 'Checking',
      type: 'asset',
      currency: 'MXN',
      isActive: true,
    });
    store.accounts.create({
      id: 'acct-food',
      userId: 'user-1',
      name: 'Food',
      type: 'expense',
      currency: 'MXN',
      isActive: true,
    });

    const aggregate = service.create({
      ledgerId: 'ledger-1',
      bookedAt: '2025-10-18',
      description: 'Dinner',
      status: 'posted',
      baseCurrency: 'MXN',
      lines: [
        {
          accountId: 'acct-food',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'debit',
        },
        {
          accountId: 'acct-checking',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'credit',
        },
      ],
      categoryId: 'cat-food',
    });

    expect(aggregate.entry.baseCurrency).toBe('MXN');
    expect(aggregate.lines).toHaveLength(2);
    expect(sumBase(aggregate)).toBeCloseTo(0);
    expect(aggregate.category?.categoryId).toBe('cat-food');
    const checkingLine = aggregate.lines.find((line) => line.accountId === 'acct-checking');
    expect(checkingLine?.nativeAmount).toBeCloseTo(-250);
  });

  it('creates a balanced cross-currency transfer using FX snapshots', () => {
    store.accounts.create({
      id: 'acct-mxn',
      userId: 'user-1',
      name: 'MXN Savings',
      type: 'asset',
      currency: 'MXN',
      isActive: true,
    });
    store.accounts.create({
      id: 'acct-usd',
      userId: 'user-1',
      name: 'USD Checking',
      type: 'asset',
      currency: 'USD',
      isActive: true,
    });
    fx.ensure({ base: 'MXN', quote: 'USD', asOf: '2025-10-18', rate: 18.5 });

    const aggregate = service.create({
      ledgerId: 'ledger-1',
      bookedAt: '2025-10-18',
      status: 'posted',
      baseCurrency: 'MXN',
      lines: [
        {
          accountId: 'acct-mxn',
          nativeAmount: 1850,
          nativeCurrency: 'MXN',
          direction: 'debit',
        },
        {
          accountId: 'acct-usd',
          nativeAmount: 100,
          nativeCurrency: 'USD',
          direction: 'credit',
        },
      ],
    });

    expect(aggregate.lines).toHaveLength(2);
    const usdLine = aggregate.lines.find((line) => line.accountId === 'acct-usd');
    expect(usdLine?.fxRate).toBe(18.5);
    expect(usdLine?.baseAmount).toBeCloseTo(-1850);
    expect(usdLine?.nativeAmount).toBeCloseTo(-100);
    expect(sumBase(aggregate)).toBeCloseTo(0);
  });

  it('enforces idempotency with external identifiers', () => {
    store.accounts.create({
      id: 'acct-checking',
      userId: 'user-1',
      name: 'Checking',
      type: 'asset',
      currency: 'MXN',
      isActive: true,
    });
    store.accounts.create({
      id: 'acct-food',
      userId: 'user-1',
      name: 'Food',
      type: 'expense',
      currency: 'MXN',
      isActive: true,
    });

    const first = service.create({
      ledgerId: 'ledger-1',
      bookedAt: '2025-10-18',
      status: 'posted',
      baseCurrency: 'MXN',
      externalId: 'ext-123',
      lines: [
        {
          accountId: 'acct-food',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'debit',
        },
        {
          accountId: 'acct-checking',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'credit',
        },
      ],
    });

    const second = service.create({
      ledgerId: 'ledger-1',
      bookedAt: '2025-10-19',
      status: 'posted',
      baseCurrency: 'MXN',
      externalId: 'ext-123',
      lines: [
        {
          accountId: 'acct-food',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'debit',
        },
        {
          accountId: 'acct-checking',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'credit',
        },
      ],
    });

    expect(second.entry.id).toBe(first.entry.id);
    expect(store.entries.listByLedger('ledger-1')).toHaveLength(1);
    expect(store.entryLines.listByEntry(first.entry.id)).toHaveLength(2);
  });
});
