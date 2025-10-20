import type { ZodError } from 'zod';
import {
  Account,
  AccountInput,
  AccountSchema,
  Category,
  CategoryInput,
  CategorySchema,
  Entry,
  EntryCategory,
  EntryCategoryInput,
  EntryCategorySchema,
  EntryInput,
  EntryLine,
  EntryLineInput,
  EntryLineSchema,
  EntrySchema,
  FxRate,
  FxRateInput,
  FxRateSchema,
  Rule,
  RuleInput,
  RuleSchema,
  StatementLine,
  StatementLineInput,
  StatementLineSchema,
} from '../domain/types';
import {
  CurrencyMismatchError,
  DuplicateError,
  NotFoundError,
  ValidationError,
} from '../domain/errors';

const externalIndexKey = (scope: string, externalId: string) => `${scope}::${externalId}`;
const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => issue.message).join(', ');

export class AccountsRepository {
  private accountsById = new Map<string, Account>();
  private accountsByUser = new Map<string, Set<string>>();

  create(input: AccountInput): Account {
    const parsed = AccountSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const account = parsed.data;

    if (this.accountsById.has(account.id)) {
      throw new DuplicateError(`Account ${account.id} already exists`);
    }

    this.accountsById.set(account.id, account);
    if (!this.accountsByUser.has(account.userId)) {
      this.accountsByUser.set(account.userId, new Set());
    }
    this.accountsByUser.get(account.userId)!.add(account.id);

    return account;
  }

  upsert(input: AccountInput): Account {
    const parsed = AccountSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const account = parsed.data;
    this.accountsById.set(account.id, account);
    if (!this.accountsByUser.has(account.userId)) {
      this.accountsByUser.set(account.userId, new Set());
    }
    this.accountsByUser.get(account.userId)!.add(account.id);
    return account;
  }

  getById(id: string): Account {
    const account = this.accountsById.get(id);
    if (!account) {
      throw new NotFoundError(`Account ${id} not found`);
    }
    return account;
  }

  listByUser(userId: string): Account[] {
    const ids = this.accountsByUser.get(userId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.accountsById.get(id)!);
  }
}

export class EntriesRepository {
  private entriesById = new Map<string, Entry>();
  private entriesByLedger = new Map<string, Set<string>>();
  private entriesByExternalId = new Map<string, string>(); // compositeKey -> entryId

  create(input: EntryInput): Entry {
    const parsed = EntrySchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const entry = parsed.data;

    if (this.entriesById.has(entry.id)) {
      throw new DuplicateError(`Entry ${entry.id} already exists`);
    }

    if (entry.externalId) {
      const externalKey = externalIndexKey(entry.ledgerId, entry.externalId);
      if (this.entriesByExternalId.has(externalKey)) {
        throw new DuplicateError(
          `Entry with externalId ${entry.externalId} already exists in ledger ${entry.ledgerId}`,
        );
      }
      this.entriesByExternalId.set(externalKey, entry.id);
    }

    this.entriesById.set(entry.id, entry);
    if (!this.entriesByLedger.has(entry.ledgerId)) {
      this.entriesByLedger.set(entry.ledgerId, new Set());
    }
    this.entriesByLedger.get(entry.ledgerId)!.add(entry.id);

    return entry;
  }

  findByExternalId(ledgerId: string, externalId: string): Entry | undefined {
    const key = externalIndexKey(ledgerId, externalId);
    const entryId = this.entriesByExternalId.get(key);
    if (!entryId) return undefined;
    return this.entriesById.get(entryId);
  }

  getById(id: string): Entry {
    const entry = this.entriesById.get(id);
    if (!entry) {
      throw new NotFoundError(`Entry ${id} not found`);
    }
    return entry;
  }

  listByLedger(ledgerId: string): Entry[] {
    const ids = this.entriesByLedger.get(ledgerId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.entriesById.get(id)!);
  }
}

export class EntryLinesRepository {
  private linesById = new Map<string, EntryLine>();
  private linesByEntry = new Map<string, Set<string>>();

  constructor(private readonly accountsRepo: AccountsRepository) {}

  create(input: EntryLineInput): EntryLine {
    const parsed = EntryLineSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().formErrors.join(', '));
    }
    const line = parsed.data;

    const account = this.accountsRepo.getById(line.accountId);
    if (account.currency !== line.nativeCurrency) {
      throw new CurrencyMismatchError(
        `EntryLine currency ${line.nativeCurrency} does not match account ${account.id} currency ${account.currency}`,
      );
    }

    this.linesById.set(line.id, line);
    if (!this.linesByEntry.has(line.entryId)) {
      this.linesByEntry.set(line.entryId, new Set());
    }
    this.linesByEntry.get(line.entryId)!.add(line.id);

    return line;
  }

  listByEntry(entryId: string): EntryLine[] {
    const ids = this.linesByEntry.get(entryId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.linesById.get(id)!);
  }
}

export class CategoriesRepository {
  private categoriesById = new Map<string, Category>();
  private categoriesByUser = new Map<string, Set<string>>();

  create(input: CategoryInput): Category {
    const parsed = CategorySchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const category = parsed.data;

    if (this.categoriesById.has(category.id)) {
      throw new DuplicateError(`Category ${category.id} already exists`);
    }

    this.categoriesById.set(category.id, category);
    if (!this.categoriesByUser.has(category.userId)) {
      this.categoriesByUser.set(category.userId, new Set());
    }
    this.categoriesByUser.get(category.userId)!.add(category.id);

    return category;
  }

  getById(id: string): Category {
    const category = this.categoriesById.get(id);
    if (!category) {
      throw new NotFoundError(`Category ${id} not found`);
    }
    return category;
  }
}

export class EntryCategoriesRepository {
  private categoriesByEntry = new Map<string, EntryCategory>();

  upsert(input: EntryCategoryInput): EntryCategory {
    const parsed = EntryCategorySchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const entryCategory = parsed.data;
    this.categoriesByEntry.set(entryCategory.entryId, entryCategory as EntryCategory);
    return entryCategory as EntryCategory;
  }

  getByEntry(entryId: string): EntryCategory | undefined {
    return this.categoriesByEntry.get(entryId);
  }
}

export class StatementLinesRepository {
  private linesById = new Map<string, StatementLine>();
  private linesByAccount = new Map<string, Set<string>>();
  private uniqueness = new Map<string, string>(); // compositeKey -> id

  upsert(input: StatementLineInput): { line: StatementLine; isDuplicate: boolean } {
    const parsed = StatementLineSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const line = parsed.data;
    const compositeKey = externalIndexKey(line.accountId, line.externalId);

    const existingId = this.uniqueness.get(compositeKey);
    if (existingId) {
      return { line: this.linesById.get(existingId)!, isDuplicate: true };
    }

    this.uniqueness.set(compositeKey, line.id);
    this.linesById.set(line.id, line);
    if (!this.linesByAccount.has(line.accountId)) {
      this.linesByAccount.set(line.accountId, new Set());
    }
    this.linesByAccount.get(line.accountId)!.add(line.id);

    return { line, isDuplicate: false };
  }

  listByAccount(accountId: string): StatementLine[] {
    const ids = this.linesByAccount.get(accountId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.linesById.get(id)!);
  }
}

export class RulesRepository {
  private rulesById = new Map<string, Rule>();
  private rulesByUser = new Map<string, Set<string>>();

  create(input: RuleInput): Rule {
    const parsed = RuleSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const rule = parsed.data;
    if (this.rulesById.has(rule.id)) {
      throw new DuplicateError(`Rule ${rule.id} already exists`);
    }
    this.rulesById.set(rule.id, rule);
    if (!this.rulesByUser.has(rule.userId)) {
      this.rulesByUser.set(rule.userId, new Set());
    }
    this.rulesByUser.get(rule.userId)!.add(rule.id);
    return rule;
  }

  listByUser(userId: string): Rule[] {
    const ids = this.rulesByUser.get(userId);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.rulesById.get(id)!)
      .sort((a, b) => b.priority - a.priority);
  }
}

export class FxRatesRepository {
  private rates = new Map<string, FxRate>();

  private static key(base: string, quote: string, asOf: string) {
    return `${base}::${quote}::${asOf}`;
  }

  ensure(input: FxRateInput): FxRate {
    const parsed = FxRateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }
    const rate = parsed.data;
    this.rates.set(
      FxRatesRepository.key(rate.base, rate.quote, rate.asOf),
      rate,
    );
    return rate;
  }

  get(base: string, quote: string, asOf: string): FxRate | undefined {
    return this.rates.get(FxRatesRepository.key(base, quote, asOf));
  }
}

export class MemoryStore {
  readonly accounts = new AccountsRepository();
  readonly entries = new EntriesRepository();
  readonly entryLines = new EntryLinesRepository(this.accounts);
  readonly categories = new CategoriesRepository();
  readonly entryCategories = new EntryCategoriesRepository();
  readonly statementLines = new StatementLinesRepository();
  readonly rules = new RulesRepository();
  readonly fxRates = new FxRatesRepository();
}

export const createMemoryStore = () => new MemoryStore();
