import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryStore, MemoryStore } from '../store/memory';
import { createFxTable, FxTable } from '../lib/fx';
import { EntriesService } from '../services/entries';
import { CategorizationService, KeywordAgent } from '../services/rules';

describe('Rules and agent categorization', () => {
  let store: MemoryStore;
  let fx: FxTable;
  let entries: EntriesService;
  let service: CategorizationService;

  beforeEach(() => {
    store = createMemoryStore();
    fx = createFxTable();
    entries = new EntriesService(store, fx);

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

    const agent = new KeywordAgent({
      uber: { categoryId: 'cat-groceries', confidence: 0.9 },
      groceries: { categoryId: 'cat-groceries', confidence: 0.72 },
    });

    service = new CategorizationService(store, agent);
  });

  const createExpense = (description: string) =>
    entries.create({
      ledgerId: 'ledger-1',
      bookedAt: '2025-10-18',
      description,
      status: 'posted',
      baseCurrency: 'MXN',
      lines: [
        {
          accountId: 'acct-expense',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'debit',
        },
        {
          accountId: 'acct-bank',
          nativeAmount: 250,
          nativeCurrency: 'MXN',
          direction: 'credit',
        },
      ],
    });

  it('applies a matching rule before considering agent suggestions', () => {
    store.rules.create({
      id: 'rule-1',
      userId: 'user-1',
      active: true,
      priority: 10,
      matcher: {
        all: [
          {
            field: 'description',
            op: 'contains',
            value: 'UBER EATS',
          },
        ],
      },
      action: {
        set_category_id: 'cat-food',
        set_confidence: 1,
      },
    });

    const aggregate = createExpense('UBER EATS 1234');
    const result = service.categorize({ userId: 'user-1', aggregate });

    expect(result.applied).toBe(true);
    expect(result.source).toBe('rule');
    expect(result.categoryId).toBe('cat-food');
    expect(result.confidence).toBeCloseTo(1);
    expect(result.needsReview).toBe(false);
  });

  it('keeps low-confidence agent suggestions as review items', () => {
    const aggregate = createExpense('Weekly Groceries');
    const result = service.categorize({ userId: 'user-1', aggregate });

    expect(result.applied).toBe(false);
    expect(result.source).toBe('agent');
    expect(result.categoryId).toBe('cat-groceries');
    expect(result.confidence).toBeCloseTo(0.72);
    expect(result.needsReview).toBe(true);
  });
});
