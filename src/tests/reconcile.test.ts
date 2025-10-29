import './setupLocalStorage';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStore, MemoryStore } from '../store/memory';
import { createFxTable, FxTable } from '../lib/fx';
import { EntriesService } from '../services/entries';
import { ReconciliationService } from '../services/reconcile';

describe('ReconciliationService', () => {
  let store: MemoryStore;
  let fx: FxTable;
  let entries: EntriesService;
  let reconcile: ReconciliationService;

  beforeEach(() => {
    store = createMemoryStore();
    fx = createFxTable();
    entries = new EntriesService(store, fx);
    reconcile = new ReconciliationService(store);

    store.accounts.create({
      id: 'acct-bank',
      userId: 'user-1',
      name: 'Bank',
      type: 'asset',
      currency: 'MXN',
      isActive: true,
    });
    store.accounts.create({
      id: 'acct-expense',
      userId: 'user-1',
      name: 'Food',
      type: 'expense',
      currency: 'MXN',
      isActive: true,
    });
  });

  const createExpense = (idPrefix: string, amount: number, date: string) =>
    entries.create({
      ledgerId: `ledger-${idPrefix}`,
      bookedAt: date,
      description: `Expense ${idPrefix}`,
      status: 'posted',
      baseCurrency: 'MXN',
      lines: [
        {
          accountId: 'acct-expense',
          nativeAmount: amount,
          nativeCurrency: 'MXN',
          direction: 'debit',
        },
        {
          accountId: 'acct-bank',
          nativeAmount: amount,
          nativeCurrency: 'MXN',
          direction: 'credit',
        },
      ],
    });

  it('auto-reconciles matching entries and statement lines', () => {
    const expense = createExpense('auto', 250, '2025-10-18');

    store.statementLines.upsert({
      id: 'stmt-1',
      accountId: 'acct-bank',
      postedAt: '2025-10-19',
      amountNative: -250,
      currency: 'MXN',
      externalId: 'ext-stmt-1',
      memo: 'Bank Debit',
    });

    const result = reconcile.auto({ accountId: 'acct-bank', windowDays: 3 });

    expect(result.linked).toBe(1);
    expect(store.entries.getById(expense.entry.id).status).toBe('reconciled');
    expect(store.reconciliations.isStatementLinked('stmt-1')).toBe(true);
    expect(result.remainingStatements).toHaveLength(0);
  });

  it('skips ambiguous matches and allows manual linking', () => {
    const expenseA = createExpense('many-1', 100, '2025-10-18');
    const expenseB = createExpense('many-2', 100, '2025-10-19');

    store.statementLines.upsert({
      id: 'stmt-ambiguous',
      accountId: 'acct-bank',
      postedAt: '2025-10-20',
      amountNative: -100,
      currency: 'MXN',
      externalId: 'ext-stmt-ambiguous',
      memo: 'Multiple matches',
    });

    const autoResult = reconcile.auto({ accountId: 'acct-bank', windowDays: 3 });
    expect(autoResult.linked).toBe(0);
    expect(autoResult.skipped).toBe(1);
    expect(store.entries.getById(expenseA.entry.id).status).toBe('posted');

    const link = reconcile.link(expenseA.entry.id, 'stmt-ambiguous');
    expect(link.manual).toBe(true);
    expect(store.entries.getById(expenseA.entry.id).status).toBe('reconciled');
    expect(store.reconciliations.isStatementLinked('stmt-ambiguous')).toBe(true);
    expect(store.reconciliations.isEntryLinked(expenseB.entry.id)).toBe(false);
  });
});
