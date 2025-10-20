import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryStore, MemoryStore } from '../store/memory';
import { ImportsService } from '../services/imports';

describe('ImportsService.fromCsv', () => {
  let store: MemoryStore;
  let service: ImportsService;

  beforeEach(() => {
    store = createMemoryStore();
    service = new ImportsService(store);
    store.accounts.create({
      id: 'acct-bank',
      userId: 'user-1',
      name: 'Bank',
      type: 'asset',
      currency: 'MXN',
      isActive: true,
    });
  });

  it('imports CSV data and reports duplicates on re-upload', () => {
    const csv = `date,amount,memo
2025-10-18,-250,Uber Eats
2025-10-19,100,Salary`;

    const mapping = { postedAt: 'date', amount: 'amount', memo: 'memo' };

    const first = service.fromCsv({ accountId: 'acct-bank', csv, mapping });
    expect(first.inserted).toBe(2);
    expect(first.duplicates).toBe(0);
    expect(first.failed).toHaveLength(0);

    const second = service.fromCsv({ accountId: 'acct-bank', csv, mapping });
    expect(second.inserted).toBe(0);
    expect(second.duplicates).toBe(2);
    expect(second.failed).toHaveLength(0);
  });

  it('captures malformed rows in the failed list', () => {
    const csv = `date,amount,memo
2025-10-18,not-a-number,Uber Eats`;

    const mapping = { postedAt: 'date', amount: 'amount', memo: 'memo' };

    const result = service.fromCsv({ accountId: 'acct-bank', csv, mapping });
    expect(result.inserted).toBe(0);
    expect(result.duplicates).toBe(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].reason).toContain('Invalid amount');
  });
});
