import { describe, it, expect } from 'vitest';
import { AccountsRepository, EntryLinesRepository } from '../store/memory';
import { CurrencyMismatchError, ValidationError } from '../domain/errors';

describe('Domain type invariants', () => {
  it('rejects creating an account with an unknown type', () => {
    const repo = new AccountsRepository();
    expect(() =>
      repo.create({
        id: 'acct-1',
        userId: 'user-1',
        name: 'Invalid',
        // @ts-expect-error deliberate invalid type to ensure runtime guard
        type: 'unknown',
        currency: 'MXN',
        isActive: true,
      }),
    ).toThrow(ValidationError);
  });

  it('rejects entry lines whose native currency differs from the account currency', () => {
    const accounts = new AccountsRepository();
    accounts.create({
      id: 'acct-1',
      userId: 'user-1',
      name: 'Checking',
      type: 'asset',
      currency: 'MXN',
      isActive: true,
    });

    const entryLines = new EntryLinesRepository(accounts);

    expect(() =>
      entryLines.create({
        id: 'line-1',
        entryId: 'entry-1',
        accountId: 'acct-1',
        nativeAmount: 100,
        nativeCurrency: 'USD',
        baseAmount: 100,
        baseCurrency: 'MXN',
        fxRate: 1,
        direction: 'debit',
      }),
    ).toThrow(CurrencyMismatchError);
  });
});
