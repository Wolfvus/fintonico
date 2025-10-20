import { randomUUID } from 'node:crypto';
import { BaseCurrencyError, ValidationError } from '../domain/errors';
import { Entry, EntryCategory, EntryLine, EntryStatus, LineDirection } from '../domain/types';
import { MemoryStore } from '../store/memory';
import { FxTable } from '../lib/fx';
import { validateBalanced } from '../lib/balance';

interface CreateEntryLineInput {
  accountId: string;
  nativeAmount: number;
  nativeCurrency: string;
  direction: LineDirection;
  baseAmount?: number;
  baseCurrency?: string;
  fxRate?: number;
}

interface CreateEntryInput {
  ledgerId: string;
  bookedAt: string | Date;
  description?: string;
  externalId?: string;
  baseCurrency: string;
  lines: CreateEntryLineInput[];
  categoryId?: string;
  status: EntryStatus;
}

export interface EntryAggregate {
  entry: Entry;
  lines: EntryLine[];
  category?: EntryCategory;
}

export class EntriesService {
  constructor(
    private readonly store: MemoryStore,
    private readonly fxTable: FxTable,
  ) {}

  create(input: CreateEntryInput): EntryAggregate {
    if (input.lines.length < 2) {
      throw new ValidationError('Entries require at least two lines');
    }

    const baseCurrency = input.baseCurrency.toUpperCase();
    const bookedAtIso = new Date(input.bookedAt).toISOString();

    if (input.externalId) {
      const existing = this.store.entries.findByExternalId(input.ledgerId, input.externalId);
      if (existing) {
        return this.assembleAggregate(existing.id);
      }
    }

    const entryId = randomUUID();
    const lines = input.lines.map((line) =>
      this.buildLine({
        entryId,
        bookedAt: bookedAtIso,
        baseCurrency,
        line,
      }),
    );

    validateBalanced(entryId, lines, baseCurrency);

    const entry = this.store.entries.create({
      id: entryId,
      ledgerId: input.ledgerId,
      externalId: input.externalId,
      bookedAt: bookedAtIso,
      description: input.description,
      status: input.status,
      baseCurrency,
    });

    for (const line of lines) {
      this.store.entryLines.create(line);
    }

    if (input.categoryId) {
      this.store.entryCategories.upsert({
        entryId,
        categoryId: input.categoryId,
        confidence: 1,
      });
    }

    return this.assembleAggregate(entryId);
  }

  private assembleAggregate(entryId: string): EntryAggregate {
    const entry = this.store.entries.getById(entryId);
    const lines = this.store.entryLines.listByEntry(entryId);
    const category = this.store.entryCategories.getByEntry(entryId);
    return { entry, lines, category };
  }

  private buildLine({
    entryId,
    bookedAt,
    baseCurrency,
    line,
  }: {
    entryId: string;
    bookedAt: string;
    baseCurrency: string;
    line: CreateEntryLineInput;
  }): EntryLine {
    const nativeCurrency = line.nativeCurrency.toUpperCase();
    const normalizedBase = baseCurrency.toUpperCase();

    if (line.baseCurrency && line.baseCurrency.toUpperCase() !== normalizedBase) {
      throw new BaseCurrencyError(
        `Line baseCurrency ${line.baseCurrency} does not match entry base ${normalizedBase}`,
      );
    }

    if (line.nativeAmount === 0) {
      throw new ValidationError('nativeAmount must be non-zero');
    }

    const magnitudeNative = Math.abs(line.nativeAmount);

    let fxRate: number;
    if (nativeCurrency === normalizedBase) {
      fxRate = 1;
    } else if (line.fxRate) {
      fxRate = line.fxRate;
    } else {
      fxRate = this.fxTable.getRate({
        base: normalizedBase,
        quote: nativeCurrency,
        asOf: bookedAt,
      });
    }

    if (fxRate <= 0) {
      throw new ValidationError('fxRate must be positive');
    }

    let baseAmount: number;
    if (line.baseAmount !== undefined) {
      baseAmount = line.baseAmount;
    } else {
      const converted = magnitudeNative * fxRate;
      baseAmount =
        line.direction === 'debit' ? Math.abs(converted) : -Math.abs(converted);
    }

    if (line.direction === 'debit' && baseAmount <= 0) {
      throw new ValidationError('Debit lines require positive baseAmount');
    }
    if (line.direction === 'credit' && baseAmount >= 0) {
      throw new ValidationError('Credit lines require negative baseAmount');
    }

    return {
      id: randomUUID(),
      entryId,
      accountId: line.accountId,
      nativeAmount: magnitudeNative,
      nativeCurrency,
      baseAmount,
      baseCurrency: normalizedBase,
      fxRate,
      direction: line.direction,
    };
  }
}
