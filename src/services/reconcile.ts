import { MemoryStore } from '../store/memory';
import { ValidationError } from '../domain/errors';
import { EntryLine, StatementLine } from '../domain/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const AMOUNT_EPSILON = 0.01;

const withinWindow = (entryDateIso: string, postedAtIso: string, windowDays: number) => {
  const entryDate = new Date(entryDateIso);
  const postedDate = new Date(postedAtIso);
  const diff = Math.abs(entryDate.getTime() - postedDate.getTime());
  return diff / MS_PER_DAY <= windowDays;
};

const amountsMatch = (line: EntryLine, statement: StatementLine) => {
  const nativeDiff = Math.abs(line.nativeAmount - statement.amountNative);
  const baseDiff = Math.abs(line.baseAmount - statement.amountNative);
  return nativeDiff <= AMOUNT_EPSILON || baseDiff <= AMOUNT_EPSILON;
};

const hasMatchingAccountLine = (
  store: MemoryStore,
  entryId: string,
  accountId: string,
  statement: StatementLine,
) => {
  const lines = store.entryLines.listByEntry(entryId);
  return lines.some((line) => line.accountId === accountId && amountsMatch(line, statement));
};

export interface AutoReconcileInput {
  accountId: string;
  windowDays?: number;
}

export interface AutoReconcileResult {
  linked: number;
  skipped: number;
  remainingStatements: string[];
}

export class ReconciliationService {
  constructor(private readonly store: MemoryStore) {}

  auto({ accountId, windowDays = 3 }: AutoReconcileInput): AutoReconcileResult {
    this.store.accounts.getById(accountId); // ensure account exists
    const statements = this.store.statementLines.listByAccount(accountId);
    const entryLines = this.store.entryLines.listByAccount(accountId);

    let linked = 0;
    let skipped = 0;

    for (const statement of statements) {
      if (this.store.reconciliations.isStatementLinked(statement.id)) continue;

      const candidates = entryLines.filter((line) => {
        if (line.accountId !== accountId) return false;
        if (this.store.reconciliations.isEntryLinked(line.entryId)) return false;
        if (!amountsMatch(line, statement)) return false;
        const entry = this.store.entries.getById(line.entryId);
        if (entry.status === 'reconciled') return false;
        if (!withinWindow(entry.bookedAt, statement.postedAt, windowDays)) {
          return false;
        }
        return true;
      });

      if (candidates.length === 1) {
        const line = candidates[0];
        this.linkInternal(line.entryId, statement.id, false);
        linked += 1;
      } else if (candidates.length > 1) {
        skipped += 1;
      }
    }

    const remainingStatements = statements
      .filter((statement) => !this.store.reconciliations.isStatementLinked(statement.id))
      .map((statement) => statement.id);

    return { linked, skipped, remainingStatements };
  }

  link(entryId: string, statementLineId: string) {
    const statement = this.store.statementLines.getById(statementLineId);
    const entry = this.store.entries.getById(entryId);

    if (this.store.reconciliations.isEntryLinked(entryId)) {
      throw new ValidationError(`Entry ${entryId} is already reconciled`);
    }
    if (this.store.reconciliations.isStatementLinked(statementLineId)) {
      throw new ValidationError(`Statement line ${statementLineId} is already linked`);
    }

    const hasMatchingLine = hasMatchingAccountLine(
      this.store,
      entryId,
      statement.accountId,
      statement,
    );
    if (!hasMatchingLine) {
      throw new ValidationError('Entry does not have a matching account line');
    }

    return this.linkInternal(entry.id, statement.id, true);
  }

  private linkInternal(entryId: string, statementLineId: string, manual: boolean) {
    this.store.reconciliations.link(entryId, statementLineId, manual);
    this.store.entries.setStatus(entryId, 'reconciled');
    return this.store.reconciliations.getByEntry(entryId)!;
  }
}
