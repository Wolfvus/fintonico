# Fintonico — Agent Execution Guide (Local-Only v0)

> **Purpose**: This file is the step-by-step playbook your Agent follows to bring the app from “prototype” to a **locally testable** double‑entry finance system.  
> **Important**: In this phase there is **no real database**. We simulate persistence with an in-memory store (or a temporary JSON/SQLite file). You’ll wire Supabase/Postgres later.

---

## 0) Rules of Engagement

- **Deterministic first**: Double-entry rules, idempotent imports, explicit reconciliation. No “magic.”  
- **Local only**: Node 20+, pnpm preferred. No external APIs except optional FX fixture loader.  
- **Tests every step**: Each section ends with **Local Tests** you must run and pass.  
- **Single source of truth**: The server/service layer computes balances; UI never “authoritatively” sums.

Recommended stack for this phase:
- TypeScript + Node (ts-node / tsx)  
- Vitest or Jest for tests (examples use **Vitest**)  
- Zod for input validation  
- Tiny local web server (Express/Fastify) **or** pure services invoked by tests

File/Dir skeleton (local):
```
/agent-spec.md (this file)
/src/domain/types.ts
/src/domain/errors.ts
/src/lib/fx.ts
/src/lib/idempotency.ts
/src/lib/rules.ts
/src/lib/reconcile.ts
/src/store/memory.ts        # in-memory repositories
/src/services/entries.ts
/src/services/imports.ts
/src/services/reports.ts
/src/services/accounts.ts
/src/tests/**/*.test.ts
```

---

## 1) Domain Types & In-Memory Store

### Instruction
Define the minimal domain objects and repositories with **invariants** coded in TypeScript types.

- `Account { id, userId, name, type, currency, isActive }`
- `Entry { id, ledgerId, externalId?, bookedAt, description?, status }`
- `EntryLine { id, entryId, accountId, nativeAmount, nativeCurrency, baseAmount, baseCurrency, fxRate, direction }`
- `Category { id, userId, name, parentId? }`
- `EntryCategory { entryId, categoryId, confidence }`
- `StatementLine { id, accountId, postedAt, amountNative, currency, memo?, externalId }`
- `Rule { id, userId, active, priority, matcher: JSON, action: JSON }`
- `FxRate { base, quote, asOf, rate }`

Create **in-memory repositories** with CRUD and simple indexes (Maps keyed by id and composite keys).

### Local Tests
- `types.test.ts`:
  - Creating an `Account` with unknown `type` fails validation (Zod).  
  - `EntryLine.nativeCurrency` must equal referenced `Account.currency` (reject on mismatch).

---

## 2) Balancing & Currency Integrity

### Instruction
Implement a pure function `validateBalanced(entryId, lines[], baseCurrency)`:
- Ensures `sum(lines.baseAmount) === 0` (epsilon 1e-6).
- Ensures each line.direction matches sign: `debit => baseAmount > 0`, `credit => baseAmount < 0`.
- Ensures `line.baseCurrency === baseCurrency` for all lines.

### Local Tests
- `balance.test.ts`:
  - Unbalanced (+100 and -90) → throws `UnbalancedEntryError`.
  - Debit with negative baseAmount → throws `DirectionError`.
  - Mixed base currencies → throws `BaseCurrencyError`.

---

## 3) FX Snapshot Module (Local Fixture)

### Instruction
Build `fx.getRate({ base, quote, asOf }): number`:
- Uses an in-memory table (Map `<base|quote|asOf -> rate>`).  
- `fx.ensure({ base, quote, asOf, rate })` upserts a rate.  
- No network calls. Load a small fixture in tests.

### Local Tests
- `fx.test.ts`:
  - Missing rate → throws `FxMissingError`.  
  - Present rate returns deterministic value.  
  - Cross-currency transfer uses **asOf booked date** snapshot.

---

## 4) Entry Creation Service (Double-Entry Only)

### Instruction
Implement `entries.create({ bookedAt, description?, externalId?, lines[], categoryId?, status })`:
- For each line missing `baseAmount`/`fxRate`, derive using `fx.getRate` and `baseCurrency`.  
- Validate currency integrity and **balance** via module in §2.  
- If `externalId` present, enforce **idempotency** in the repository (unique per ledger).  
- If `categoryId` provided, attach `EntryCategory` with `confidence=1.0`.

### Local Tests
- `entries.create.test.ts`:
  - Expense: Checking credit -250 MXN, Food debit +250 MXN → **passes**; sum(base)=0.  
  - Transfer USD→MXN with rate fixture → **passes**, two lines, balanced.  
  - Duplicate `externalId` → second call is **no-op** (returns existing).

---

## 5) Import Pipeline (CSV → Statement Lines)

### Instruction
Implement `imports.fromCsv({ accountId, csv, mapping })`:
- Parse CSV (use `papaparse` or a tiny custom parser).  
- Normalize records to `StatementLine` with deterministic `externalId = hash(accountId, postedAt, amountNative, memo?)`.  
- Upsert with uniqueness on `(accountId, externalId)`. Return `{ inserted, duplicates, failed[] }`.

### Local Tests
- `imports.test.ts`:
  - First upload inserts N lines.  
  - Second upload of same file → `duplicates=N, inserted=0`.  
  - Malformed row → listed in `failed[]` with reason.

---

## 6) Rules Engine (Deterministic) & Agent Suggestion Stub

### Instruction
- **Rules**: `evaluateRules(entry): { categoryId?, confidence }`
  - Support ops: `contains`, `equals`, `regex`, `amount_between`.  
  - Order by `priority ASC`. Apply first match; set `confidence=1.0`.
- **Agent Stub**: `agent.categorize(entry): { categoryId, confidence }`
  - For now: a simple keyword -> category map (no LLM).  
  - Only auto-apply if `confidence >= 0.85`. Else mark as “needs review”.

### Local Tests
- `rules.test.ts`:
  - A rule “description contains UBER EATS → Food” overrides agent.  
  - Without matching rules, agent returns Groceries @0.72 → **not applied**.

---

## 7) Reconciliation Engine

### Instruction
Implement `reconcile.auto({ accountId, windowDays=3 })`:
- Match unreconciled `Entry` ↔ unmatched `StatementLine` by:
  - same `accountId`
  - exact native amount (sign-aware) **or** base-amount equal within 0.01
  - `|bookedAt - postedAt| <= windowDays`
- On 1:1 exact match → create link and set `entry.status='reconciled'`.

Manual link: `reconcile.link(entryId, statementLineId)`.

### Local Tests
- `reconcile.test.ts`:
  - Exact amount/date ±2 → auto-linked; status becomes `reconciled`.  
  - Many-to-one case → **not auto**; manual link succeeds.

---

## 8) Reports (Local, In-Memory)

### Instruction
- `reports.cashflow({ from, to, period='monthly' })`:
  - Sum `EntryLine.baseAmount` by category & month (use `entry_category`).  
  - Expenses negative, income positive; present absolute by convention.
- `reports.networth({ asOf })`:
  - Running balance per account from all entries `<= asOf`, sum in base.

### Local Tests
- `reports.test.ts`:
  - Known fixture with 6 entries → expected monthly totals.  
  - Net worth as of date equals manual calculation in fixture.

---

## 9) Minimal Local HTTP Surface (Optional)

### Instruction
Expose minimal endpoints via Fastify/Express (no auth yet):
- `POST /entries` → `entries.create`
- `GET /reports/cashflow`
- `POST /imports/csv`
- `POST /reconcile/auto`

### Local Tests
- `http.test.ts` (supertest):
  - 201 on balanced entry; 400 on unbalanced.  
  - Import same CSV twice → duplicates reported.  
  - Reconcile returns linked_count > 0 on exact matches.

---

## 10) Frontend Smoke (Optional Local Harness)

### Instruction
Add a tiny React page that hits the local HTTP surface:
- “Add Expense”, “Add Transfer”, “Run Import”, “Auto-Reconcile”, “View Cashflow”.  
This is **not** production UI—just a harness to verify end-to-end locally.

### Local Tests
- Manual: run `pnpm dev:local` and perform the flows without console errors.  
- Automated: minimal Playwright that posts entries and checks JSON responses.

---

## 11) Definition of Done (Local v0)

You are done when **all** are true:

1. Balance validator rejects bad entries; accepts cross-currency with snapshots.  
2. FX rates loaded from fixture and used deterministically.  
3. Idempotent `externalId` enforced on `entries` and `statement_line`.  
4. Import pipeline reports `{inserted, duplicates, failed}` correctly.  
5. Auto-reconcile links exact matches; manual link works for edge cases.  
6. Rules apply before agent; agent gated by confidence.  
7. Cashflow and net worth match fixtures.  
8. Optional HTTP layer passes supertest suite.  
9. All tests pass locally (`pnpm test`).

---

## 12) Commands & Tooling

### Suggested scripts (package.json)
```json
{
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "test": "vitest run --reporter=verbose",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### Recommended libs
- `zod`, `vitest`, `tsx` (or `ts-node`), `papaparse` (or `csv-parse`), `fastify`/`express` + `supertest`

---

## 13) Gherkin Acceptance (Local Parity)

**Create expense**
```
Given baseCurrency = "MXN" and an account "Checking" (MXN)
When create entry with lines:
  - Checking credit -250 MXN
  - Food debit +250 MXN
Then sum(baseAmount)=0 and status="unreconciled"
```

**Cross-currency transfer**
```
Given Account A USD, Account B MXN, baseCurrency=MXN
And fx(MXN,USD, 2025-10-18)=18.50
When transfer $100 USD A→B bookedAt 2025-10-18
Then two lines with fxRate snapshots and sum(base)=0
```

**Import idempotency**
```
Given a CSV with 3 lines for account X
When import file
Then inserted=3, duplicates=0
When import same file again
Then inserted=0, duplicates=3
```

**Auto-reconcile**
```
Given entry -250.00 MXN on 2025-10-18
And statement -250.00 MXN on 2025-10-19 (same account)
When auto-reconcile with window=3
Then linked_count=1 and entry status='reconciled'
```

**Rules before agent**
```
Given rule: description contains "UBER EATS" -> Food (confidence=1.0)
When create entry "UBER EATS 1234"
Then category=Food and agent not applied
```

**Agent threshold**
```
Given no matching rules
And agent suggests Groceries @0.72
When create entry
Then no category is applied and it is flagged for review
```

---

## 14) Next Phase Hooks (when DB arrives)

- Replace `/src/store/memory.ts` with repository interfaces backed by Postgres.  
- Transform `validateBalanced` into a DB trigger **plus** service-side check.  
- Replace FX fixture with real backfill endpoint and persistent `fx_rate` table.  
- Keep all tests; add integration tests hitting a test database.

---

### Appendix — Minimal Data Fixtures (YAML)

```yaml
baseCurrency: MXN
fx:
  - { base: MXN, quote: USD, asOf: 2025-10-18, rate: 18.50 }
accounts:
  - { id: A1, userId: U1, name: "Checking", type: checking, currency: MXN, isActive: true }
  - { id: A2, userId: U1, name: "Savings USD", type: savings, currency: USD, isActive: true }
categories:
  - { id: C1, userId: U1, name: "Food" }
rules:
  - { id: R1, userId: U1, active: true, priority: 10,
      matcher: { all: [ { field: "description", op: "contains", value: "UBER EATS" } ] },
      action: { set_category_id: "C1", set_confidence: 1.0 } }
```
