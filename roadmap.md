# Fintonico Roadmap (Local v0)

| Step | Description | Status | Notes |
| --- | --- | --- | --- |
| 1 | Domain Types & In-Memory Store | ✅ | Validated via `src/tests/types.test.ts` (Vitest run 2025‑02‑14). |
| 2 | Balancing & Currency Integrity | ✅ | `src/tests/balance.test.ts` passing ensures zero-sum and direction rules. |
| 3 | FX Snapshot Module | ✅ | `src/tests/fx.test.ts` confirms deterministic lookups and errors. |
| 4 | Entry Creation Service | ✅ | `src/tests/entries.create.test.ts` covers expense, transfer, and idempotency. |
| 5 | CSV Import Pipeline | ✅ | `src/tests/imports.test.ts` verifies insert/duplicate behaviour. |
| 6 | Rules Engine & Agent Stub | ✅ | `src/tests/rules.test.ts` confirms rule precedence and low-confidence handling. |
| 7 | Reconciliation Engine | ✅ | `src/tests/reconcile.test.ts` exercises auto/manual linking. |
| 8 | Cashflow Statement Accuracy | ✅ | Selector + dashboard wired; see `src/tests/cashflow.test.ts` (Vitest 2025‑02‑14 01:07 UTC). |
| 9 | Settings Modal & Currency Management | ✅ | Settings modal + store toggles (`src/tests/settings-modal.test.tsx`, `src/tests/currency-visibility.test.ts`). |
| 10 | Funding Mapping for Income/Expense | ✅ | Forms now source funding targets from `useAccountStore`; see `src/tests/funding-mapping.test.ts`. |
| 11 | Account Taxonomy & Month-End Close | ✅ | Month-end summary + metadata (`src/selectors/monthEnd.ts`, `src/tests/month-end.test.ts`, `src/tests/networth.test.ts`). |
| 12 | Reports API (Cashflow & Net Worth) | ☐ | Aggregate selectors into reusable reporting services. |
| 13 | Local HTTP Surface | ☐ | Optional Express/Fastify bridge with Supertest coverage. |
| 14 | Frontend Smoke Harness | ☐ | Optional UI harness exercising the HTTP endpoints. |
| 15 | Definition of Done Validation | ☐ | Confirm checklist items once Steps 10‑13 ship and tests + manual smoke pass. |
| 16 | Commands & Tooling Audit | ☐ | Ensure scripts/tooling documented in guide are present in `package.json`. |
| 17 | Gherkin Acceptance Reference | ☐ | Keep scenarios up to date with evolving behaviour/tests. |
| 18 | Next Phase Hooks (DB Ready) | ☐ | Prepare migration path from in-memory stores to Postgres/Supabase. |

**Latest test run:** `npm run test` (Vitest) ✔︎ on 2025‑10‑29 00:40 UTC.

---

# Backend Refactoring Roadmap

See [REFACTOR.md](./REFACTOR.md) for full details on the backend refactoring plan.

## Phase 1: Database Schema & Authentication ✅

**Status:** Completed (2025-12-10)

| Task | Status | Files |
| --- | --- | --- |
| Expand Supabase schema | ✅ | `supabase/migrations/002_phase1_schema.sql` |
| Accounts table with RLS | ✅ | Includes asset, liability, equity, income, expense types |
| Transactions table with RLS | ✅ | Double-entry transaction headers |
| Postings table with RLS | ✅ | Individual debits/credits linked to transactions |
| Income table with RLS | ✅ | Income entries with recurrence support |
| Exchange rates table | ✅ | Historical FX rates storage |
| Update expenses table | ✅ | Added transaction_id foreign key |
| Default accounts seed function | ✅ | Auto-creates chart of accounts for new users |
| Helper functions | ✅ | `validate_transaction_balance`, `get_account_balance` |
| Supabase client library | ✅ | `src/lib/supabase.ts` |
| Database TypeScript types | ✅ | `src/types/database.ts` |
| Real Supabase authentication | ✅ | `src/stores/authStore.ts` - replaced mock auth |

## Phase 2: Backend API Layer ✅

**Status:** Completed (2025-12-10)

| Task | Status | Files |
| --- | --- | --- |
| Server structure reorganization | ✅ | `server/routes/`, `server/services/`, `server/middleware/`, `server/types/` |
| Auth middleware | ✅ | `server/middleware/auth.ts` |
| Validation middleware | ✅ | `server/middleware/validation.ts` |
| Error handler middleware | ✅ | `server/middleware/errorHandler.ts` |
| Server Supabase client | ✅ | `server/lib/supabase.ts` |
| Server types | ✅ | `server/types/index.ts` |
| Accounts API routes | ✅ | `server/routes/accounts.ts` |
| Transactions API routes | ✅ | `server/routes/transactions.ts` |
| Income API routes | ✅ | `server/routes/income.ts` |
| Expenses API routes | ✅ | `server/routes/expenses.ts` |
| Reports API routes | ✅ | `server/routes/reports.ts` |
| Exchange rates API routes | ✅ | `server/routes/rates.ts` |
| Updated server entry point | ✅ | `server/index.ts` |

### API Endpoints Implemented

**Accounts:**
- `GET /api/accounts` - List accounts (paginated, filterable by type/status)
- `GET /api/accounts/:id` - Get single account
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account (if no postings)
- `GET /api/accounts/:id/balance` - Get account balance as of date

**Transactions:**
- `GET /api/transactions` - List transactions (paginated, filterable by date/type/account)
- `GET /api/transactions/:id` - Get transaction with postings
- `POST /api/transactions` - Create balanced transaction with postings
- `PUT /api/transactions/:id` - Update transaction and postings
- `DELETE /api/transactions/:id` - Delete transaction (cascades postings)

**Income:**
- `GET /api/income` - List income entries
- `GET /api/income/:id` - Get single income
- `POST /api/income` - Create income (optionally with linked transaction)
- `PUT /api/income/:id` - Update income
- `DELETE /api/income/:id` - Delete income

**Expenses:**
- `GET /api/expenses` - List expenses
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense (optionally with linked transaction)
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/categorize` - AI categorization

**Reports:**
- `GET /api/reports/trial-balance` - Trial balance report
- `GET /api/reports/balance-sheet` - Balance sheet report
- `GET /api/reports/income-statement` - Income statement report
- `GET /api/reports/account-balances` - All account balances

**Exchange Rates:**
- `GET /api/rates` - Get exchange rates
- `POST /api/rates/refresh` - Refresh rates from external APIs
- `GET /api/rates/convert` - Convert between currencies

## Phase 3: Service Layer Extraction ✅

**Status:** Completed (2025-12-10)

| Task | Status | Files |
| --- | --- | --- |
| AccountService | ✅ | `server/services/AccountService.ts` |
| TransactionService | ✅ | `server/services/TransactionService.ts` |
| ReportService | ✅ | `server/services/ReportService.ts` |
| RatesService | ✅ | `server/services/RatesService.ts` |
| Services index | ✅ | `server/services/index.ts` |
| Refactored routes to use services | ✅ | All routes now use service layer |

### Service Layer Features

**AccountService:**
- `getAccounts()` - List with filtering and pagination
- `getAccountById()` / `getAccountByCode()` - Single account lookup
- `createAccount()` / `updateAccount()` / `deleteAccount()` - CRUD operations
- `deactivateAccount()` / `reactivateAccount()` - Soft delete support
- `getAccountBalance()` / `getAllAccountBalances()` - Balance calculations
- `seedDefaultAccounts()` - Create default chart of accounts

**TransactionService:**
- `getTransactions()` - List with filtering by date, type, account
- `getTransactionById()` - Get with postings
- `createTransaction()` / `updateTransaction()` / `deleteTransaction()` - CRUD
- `createIncomeTransaction()` - Helper for income entries
- `createExpenseTransaction()` - Helper for expense entries
- `createTransferTransaction()` - Helper for transfers
- Balance validation (debits = credits)

**ReportService:**
- `getTrialBalance()` - All accounts with debit/credit totals
- `getBalanceSheet()` - Assets, liabilities, equity breakdown
- `getIncomeStatement()` - Income vs expenses for period
- `getAccountBalances()` - Simplified balance view
- `getNetWorth()` - Assets minus liabilities
- `getCashflow()` - Inflows vs outflows summary

**RatesService:**
- `getRates()` - Get rates (cached or fresh)
- `refreshRates()` - Fetch from external APIs and store
- `convert()` - Convert between currencies
- `getRate()` - Get specific currency pair rate
- `getSupportedCurrencies()` / `getBaseCurrency()` - Configuration

## Phase 4: Frontend Integration ☐

| Task | Status | Files |
| --- | --- | --- |
| API client | ☐ | `src/api/client.ts` |
| Refactor accountStore | ☐ | Remove localStorage, use API |
| Refactor ledgerStore | ☐ | Simplify, remove CRUD logic |
| Refactor expenseStore | ☐ | Remove derivation pattern |
| Refactor incomeStore | ☐ | Remove derivation pattern |
| Unify data models | ☐ | Single Account/Transaction types |

## Phase 5: Data Migration & Sync ☐

| Task | Status | Files |
| --- | --- | --- |
| Migration script | ☐ | `scripts/migrate-localStorage.ts` |
| Offline support (optional) | ☐ | Sync queue implementation |

## Phase 6: Testing & Documentation ☐

| Task | Status | Files |
| --- | --- | --- |
| Backend service tests | ☐ | `server/__tests__/services/` |
| Backend route tests | ☐ | `server/__tests__/routes/` |
| Integration tests | ☐ | `server/__tests__/integration/` |
| OpenAPI/Swagger spec | ☐ | `server/docs/openapi.yaml` |
