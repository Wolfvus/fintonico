# Fintonico — Agent Execution Guide (Local v0)

> **Purpose:** This guide is the playbook for agents extending Fintonico toward a reliable, locally testable double-entry finance system.  
> **Status:** Foundations through **Step 11** are complete and verified (`npm run test` on 2025‑10‑29 00:40 UTC). The next focus areas are reporting services and interface hardening.

---

## 0) Rules of Engagement

- **Deterministic first:** Enforce double-entry invariants, idempotent imports, and explicit reconciliation—no hidden magic.  
- **Local only:** Node 20+, npm (or pnpm). Avoid external APIs except the optional FX fixture loader.  
- **Tests every step:** Each section lists acceptance checks—add/extend Vitest suites accordingly.  
- **Single source of truth:** The service layer and ledger selectors own financial calculations; UI should only render derived data.

Baseline stack:
- TypeScript + Node (tsx/ts-node)
- Vitest for tests
- Zod for validation
- Express/Fastify optional for local HTTP harness

---

## Completed Foundations (Steps 1‑7)

### ~~1) Domain Types & In-Memory Store~~
Completed ✅ — Validated by `src/tests/types.test.ts`.
- **Goal:** Define core domain types (Account, Entry, EntryLine, Category, StatementLine, Rule, FxRate) with invariants enforced via Zod; back them with in-memory repositories keyed by deterministic IDs.  
- **Acceptance (met):** Invalid account types and currency mismatches are rejected at creation time.

### ~~2) Balancing & Currency Integrity~~
Completed ✅ — Covered by `src/tests/balance.test.ts`.
- **Goal:** Implement `validateBalanced(entryId, lines[], baseCurrency)` enforcing zero-sum base balances, direction/sign consistency, and base-currency alignment.  
- **Acceptance (met):** Unbalanced entries, inverted debit signs, or mixed base currencies throw typed errors.

### ~~3) FX Snapshot Module (Local Fixture)~~
Completed ✅ — Exercised in `src/tests/fx.test.ts`.
- **Goal:** Provide `fx.ensure` and `fx.getRate` utilities using in-memory storage with deterministic lookups; no network access.  
- **Acceptance (met):** Missing rates raise `FxMissingError`; stored rates return consistently; same-currency shortcuts return `1`.

### ~~4) Entry Creation Service (Double-Entry Only)~~
Completed ✅ — See `src/tests/entries.create.test.ts`.
- **Goal:** Build `entries.create` to derive base amounts via FX, validate balance, enforce `externalId` idempotency, and attach categories with full confidence.  
- **Acceptance (met):** Balanced entries persist, cross-currency transfers respect FX snapshots, duplicate `externalId`s no-op.

### ~~5) Import Pipeline (CSV → Statement Lines)~~
Completed ✅ — Verified by `src/tests/imports.test.ts`.
- **Goal:** Parse CSV files to deterministic `StatementLine`s with `externalId` hashes, upserting into the statement store.  
- **Acceptance (met):** Re-importing identical files yields duplicates without reinsertion, malformed rows are reported with reasons.

### ~~6) Rules Engine & Agent Stub~~
Completed ✅ — Confirmed in `src/tests/rules.test.ts`.
- **Goal:** Evaluate ordered rules with basic matchers before falling back to a deterministic keyword agent; apply categories only when confidence ≥ 0.85.  
- **Acceptance (met):** Rules override agent suggestions; low-confidence agent hints are surfaced for review.

### ~~7) Reconciliation Engine~~
Completed ✅ — Covered by `src/tests/reconcile.test.ts`.
- **Goal:** Implement auto/manual reconciliation between entries and statement lines using amount/date windows; update entry status on matches.  
- **Acceptance (met):** Exact matches within the window auto-link; manual linking handles unresolved cases.

### ~~8) Cashflow Statement Accuracy (Selectors + UI)~~
Completed ✅ — Verified by `src/tests/cashflow.test.ts` and the dashboard KPI integration.
- **Goal:** Drive cashflow KPIs from a selector that aggregates only cash-equivalent accounts, classifies inflows/outflows by source, and normalises amounts to the active base currency.  
- **Acceptance (met):** Net cashflow equals ledger cash balance deltas, expense-only windows report zero inflow, cross-currency scenarios respect FX rates, and the dashboard card formats the selector output without ad-hoc math.

---

### ~~9) Settings Modal & Currency Management~~
Completed ✅ — Backed by `src/tests/currency-visibility.test.ts` and `src/tests/settings-modal.test.tsx`.
- **Goal:** Provide a dedicated modal for managing visible currencies and placeholder dashboard preferences, with persistence through the currency store.  
- **Acceptance (met):** Base currency remains enforced, selecting/deselecting currencies respects persistence via `localStorage`, the modal renders with accurate toggle state, and the Currency Selector plus summary badges honour `enabledCurrencies`.

### ~~10) Income/Expense Funding Mapping~~
Completed ✅ — Validated by `src/tests/funding-mapping.test.ts` and the enriched dashboard transaction display.
- **Goal:** Capture which asset or liability account funds each income/expense entry so balance-sheet movements reconcile with P&L and net-worth views.  
- **Acceptance (met):** Income and expense forms require user-created asset/liability accounts (mirrored into the ledger on demand), selectors expose the linked account metadata, and ledger postings credit/debit the chosen asset or liability so UI cards show “Paid from / Deposited to …”.

### ~~11) Account Taxonomy & Month-End Close~~
Completed ✅ — Covered by `src/selectors/monthEnd.ts`, `src/tests/month-end.test.ts`, and `src/tests/networth.test.ts`.
- **Goal:** Stabilise asset/liability metadata and provide a lightweight month-end summary so net-worth snapshots stay accurate without manual juggling.  
- **Acceptance (met):** Account metadata supplies subtypes/defaults, balance-sheet accounts sync from `useAccountStore`, and the month-end summary surfaces cash vs. liabilities with recommended paydown actions plus liability normalisation for net-worth calculations.

---

## Upcoming Work

### 12) Reports API (Cashflow & Net Worth)

**Goal:** Expose repeatable reporting services for cashflow timelines and point-in-time net worth, using the improved selectors.

**Implementation Notes**
- Build `reports.cashflow({ from, to, interval })` aggregating `getCashflowStatement` by interval (monthly default).
- Implement `reports.networth({ asOf })` leveraging ledger balances for assets/liabilities, converting to base currency.
- Ensure services accept optional filters (account IDs, categories) for future dashboards.

**Acceptance Criteria**
- `src/tests/reports.test.ts`:
  - Fixture-driven expectations for cashflow buckets across multiple months.
  - Net worth at `asOf` matches manual ledger tally.
- Updated documentation in `docs/reports.md` (or inline comments) describing API usage.

---

### 13) Minimal Local HTTP Surface (Optional but Recommended)

**Goal:** Offer a thin Express/Fastify layer for manual and automated regression checks.

**Implementation Notes**
- Endpoints: `POST /entries`, `POST /imports/csv`, `POST /reconcile/auto`, `GET /reports/cashflow`.
- Validate payloads with Zod; return structured errors mirroring service exceptions.
- Wire to in-memory services; no authentication yet.

**Acceptance Criteria**
- `src/tests/http.test.ts` (Supertest):
  - Balanced entry → 201 + entry payload.
  - Unbalanced entry → 400 with error code.
  - Re-imported CSV yields duplicates summary.
  - Auto-reconcile returns counts > 0 for eligible matches.

---

### 14) Frontend Smoke Harness (Optional)

**Goal:** Build a minimal React page (outside production app) exercising the HTTP surface for manual verification.

**Implementation Notes**
- Components: Add Expense, Add Transfer, Run Import (CSV upload), Auto-Reconcile, View Cashflow.
- Use deterministic fixtures seeded from the in-memory store.
- Optionally gate behind `npm run dev:local`.

**Acceptance Criteria**
- Manual: Run harness, complete flows without console errors.
- Optional Playwright smoke asserting success toasts/responses.

---

## 15) Definition of Done (Local v0)

All items below must be true to sign off Local v0:

1. Balance validator gate-keeps incorrect entries; cross-currency entries remain deterministic.  
2. FX rates are fixture-driven with graceful fallbacks.  
3. Entry creation, imports, rules, and reconciliation services pass their Vitest suites.  
4. Cashflow selector powers dashboard KPIs with tested fixtures.  
5. Settings modal persists currency visibility and preferences across reloads.  
6. Reporting services expose cashflow/net worth with regression tests.  
7. Optional HTTP layer passes Supertest coverage when enabled.  
8. `npm run test` succeeds (Vitest).  
9. Manual smoke confirms dashboard cashflow aligns with ledger fixtures.

---

## 16) Commands & Tooling

Suggested `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "nodemon --exec tsx server/index.ts",
    "dev:all": "npm run dev:server & npm run dev",
    "test": "vitest run --reporter=tap",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

Recommended libraries: `zod`, `vitest`, `tsx`, `papaparse` (or `csv-parse`), `supertest`, `@testing-library/react`, `playwright` (optional).

---

## 17) Gherkin Acceptance Reference

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

---

## 18) Next Phase Hooks (When Database Arrives)

- Replace in-memory repositories with interfaces backed by Postgres/Supabase.  
- Enforce balance checks via DB constraints/triggers in addition to service validation.  
- Persist FX tables with historical backfill endpoints.  
- Retain all Vitest suites; add integration tests targeting the database.
