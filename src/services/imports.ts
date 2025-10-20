import { createHash, randomUUID } from 'node:crypto';
import { MemoryStore } from '../store/memory';
import { ValidationError } from '../domain/errors';

interface CsvMapping {
  postedAt: string;
  amount: string;
  memo?: string;
  externalId?: string;
}

export interface ImportResult {
  inserted: number;
  duplicates: number;
  failed: Array<{ row: number; reason: string }>;
}

export interface ImportCsvInput {
  accountId: string;
  csv: string;
  mapping: CsvMapping;
}

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const computeExternalId = (
  accountId: string,
  postedAt: string,
  amountNative: number,
  memo?: string,
) =>
  createHash('sha256')
    .update([accountId, postedAt, amountNative.toFixed(2), memo ?? ''].join('|'))
    .digest('hex');

export class ImportsService {
  constructor(private readonly store: MemoryStore) {}

  fromCsv(input: ImportCsvInput): ImportResult {
    const account = this.store.accounts.getById(input.accountId);
    const trimmed = input.csv.trim();
    if (!trimmed) {
      throw new ValidationError('CSV payload is empty');
    }

    const lines = trimmed.split(/\r?\n/).filter((line) => line.length > 0);
    if (lines.length < 2) {
      throw new ValidationError('CSV must include a header and at least one row');
    }

    const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
    const indexOf = (column: string) => {
      const idx = headers.indexOf(column.toLowerCase());
      return idx;
    };

    const postedAtIdx = indexOf(input.mapping.postedAt);
    const amountIdx = indexOf(input.mapping.amount);
    if (postedAtIdx === -1 || amountIdx === -1) {
      throw new ValidationError('Mapping columns missing in CSV header');
    }
    const memoIdx =
      input.mapping.memo !== undefined ? indexOf(input.mapping.memo) : -1;
    const externalIdIdx =
      input.mapping.externalId !== undefined
        ? indexOf(input.mapping.externalId)
        : -1;

    let inserted = 0;
    let duplicates = 0;
    const failed: Array<{ row: number; reason: string }> = [];

    for (let rowIdx = 1; rowIdx < lines.length; rowIdx += 1) {
      const rawLine = lines[rowIdx];
      if (!rawLine.trim()) continue;

      try {
        const columns = splitCsvLine(rawLine);
        const postedAtRaw = columns[postedAtIdx];
        const amountRaw = columns[amountIdx];
        if (!postedAtRaw || !amountRaw) {
          throw new ValidationError('Required column missing');
        }

        const postedAt = new Date(postedAtRaw);
        if (Number.isNaN(postedAt.getTime())) {
          throw new ValidationError(`Invalid date: ${postedAtRaw}`);
        }

        const amount = Number(amountRaw.replace(/,/g, ''));
        if (!Number.isFinite(amount)) {
          throw new ValidationError(`Invalid amount: ${amountRaw}`);
        }

        const memo =
          memoIdx >= 0 && columns[memoIdx] ? columns[memoIdx].trim() : undefined;
        const externalIdRaw =
          externalIdIdx >= 0 && columns[externalIdIdx]
            ? columns[externalIdIdx].trim()
            : undefined;

        const statementId = randomUUID();
        const externalId =
          externalIdRaw ??
          computeExternalId(account.id, postedAt.toISOString(), amount, memo);

        const { isDuplicate } = this.store.statementLines.upsert({
          id: statementId,
          accountId: account.id,
          postedAt: postedAt.toISOString(),
          amountNative: amount,
          currency: account.currency,
          memo,
          externalId,
        });

        if (isDuplicate) {
          duplicates += 1;
        } else {
          inserted += 1;
        }
      } catch (error) {
        const reason =
          error instanceof ValidationError ? error.message : 'Unknown error';
        failed.push({ row: rowIdx + 1, reason });
      }
    }

    return { inserted, duplicates, failed };
  }
}
