import { BaseCurrencyError, DirectionError, UnbalancedEntryError } from '../domain/errors';
import { EntryLine } from '../domain/types';

const EPSILON = 1e-6;

export function validateBalanced(entryId: string, lines: EntryLine[], baseCurrency: string): void {
  let sum = 0;
  const normalizedBase = baseCurrency.toUpperCase();

  for (const line of lines) {
    if (line.baseCurrency !== normalizedBase) {
      throw new BaseCurrencyError(
        `Entry ${entryId} has mismatched base currency: expected ${normalizedBase}, received ${line.baseCurrency}`,
      );
    }

    if (line.direction === 'debit' && line.baseAmount <= 0) {
      throw new DirectionError(
        `Entry ${entryId} line ${line.id} is debit but baseAmount ${line.baseAmount} is not positive`,
      );
    }

    if (line.direction === 'credit' && line.baseAmount >= 0) {
      throw new DirectionError(
        `Entry ${entryId} line ${line.id} is credit but baseAmount ${line.baseAmount} is not negative`,
      );
    }

    sum += line.baseAmount;
  }

  if (Math.abs(sum) > EPSILON) {
    throw new UnbalancedEntryError(
      `Entry ${entryId} does not balance. Sum of base amounts: ${sum.toFixed(6)}`,
    );
  }
}
