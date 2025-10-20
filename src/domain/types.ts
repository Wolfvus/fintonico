import { z } from 'zod';

export const accountTypes = ['asset', 'liability', 'income', 'expense', 'equity'] as const;
export type AccountType = (typeof accountTypes)[number];

export const entryStatuses = ['draft', 'posted', 'reconciled'] as const;
export type EntryStatus = (typeof entryStatuses)[number];

export const lineDirections = ['debit', 'credit'] as const;
export type LineDirection = (typeof lineDirections)[number];

const currencyCode = z
  .string()
  .min(3, 'Currency code must have at least 3 characters')
  .max(6, 'Currency code must have at most 6 characters')
  .toUpperCase();

export const AccountSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(accountTypes),
  currency: currencyCode,
  isActive: z.boolean().default(true),
});
export type Account = z.infer<typeof AccountSchema>;
export type AccountInput = z.input<typeof AccountSchema>;

export const EntrySchema = z.object({
  id: z.string().min(1),
  ledgerId: z.string().min(1),
  externalId: z.string().min(1).optional(),
  bookedAt: z.coerce
    .date()
    .transform((date) => date.toISOString()),
  description: z.string().optional(),
  status: z.enum(entryStatuses),
  baseCurrency: currencyCode,
});
export type Entry = z.infer<typeof EntrySchema>;
export type EntryInput = z.input<typeof EntrySchema>;

export const EntryLineSchema = z.object({
  id: z.string().min(1),
  entryId: z.string().min(1),
  accountId: z.string().min(1),
  nativeAmount: z.number(),
  nativeCurrency: currencyCode,
  baseAmount: z.number(),
  baseCurrency: currencyCode,
  fxRate: z.number().positive(),
  direction: z.enum(lineDirections),
});
export type EntryLine = z.infer<typeof EntryLineSchema>;
export type EntryLineInput = z.input<typeof EntryLineSchema>;

export const CategorySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().min(1).optional(),
});
export type Category = z.infer<typeof CategorySchema>;
export type CategoryInput = z.input<typeof CategorySchema>;

export const EntryCategorySchema = z.object({
  entryId: z.string().min(1),
  categoryId: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
export type EntryCategory = z.infer<typeof EntryCategorySchema>;
export type EntryCategoryInput = z.input<typeof EntryCategorySchema>;

export const StatementLineSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  postedAt: z.coerce
    .date()
    .transform((date) => date.toISOString()),
  amountNative: z.number(),
  currency: currencyCode,
  memo: z.string().optional(),
  externalId: z.string().min(1),
});
export type StatementLine = z.infer<typeof StatementLineSchema>;
export type StatementLineInput = z.input<typeof StatementLineSchema>;

export const RuleSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  active: z.boolean().default(true),
  priority: z.number().int(),
  matcher: z.unknown(),
  action: z.unknown(),
});
export type Rule = z.infer<typeof RuleSchema>;
export type RuleInput = z.input<typeof RuleSchema>;

export const FxRateSchema = z.object({
  base: currencyCode,
  quote: currencyCode,
  asOf: z.coerce
    .date()
    .transform((date) => date.toISOString()),
  rate: z.number().positive(),
});
export type FxRate = z.infer<typeof FxRateSchema>;
export type FxRateInput = z.input<typeof FxRateSchema>;
