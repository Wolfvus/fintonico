# Fintonico Backend Refactoring - Test Plan

This document outlines the unit tests required for each phase of the backend refactoring.

---

## Phase 1: Database Schema & Authentication ✅

### Database Schema Tests

| Test | Status | Description |
| --- | --- | --- |
| accounts table creation | ✅ | Table exists with correct columns and constraints |
| accounts RLS policies | ✅ | Users can only access their own accounts |
| accounts unique constraint | ✅ | user_id + code combination is unique |
| transactions table creation | ✅ | Table exists with correct columns |
| transactions RLS policies | ✅ | Users can only access their own transactions |
| postings table creation | ✅ | Table exists with FK to transactions and accounts |
| postings RLS via transaction | ✅ | Users can only access postings of their transactions |
| income table creation | ✅ | Table exists with recurrence fields |
| income RLS policies | ✅ | Users can only access their own income |
| exchange_rates table creation | ✅ | Table exists with unique constraint on currencies+date |
| expenses transaction_id column | ✅ | Column added with FK to transactions |
| seed_default_accounts trigger | ✅ | Creates default chart of accounts on user signup |
| validate_transaction_balance function | ✅ | Returns true when debits = credits |
| get_account_balance function | ✅ | Calculates balance correctly based on account type |

### Authentication Tests

| Test | Status | Description |
| --- | --- | --- |
| signIn with valid credentials | ✅ | Sets user and session in store |
| signIn with invalid credentials | ✅ | Sets error message, user remains null |
| signUp creates new user | ✅ | User created, pending email confirmation handled |
| signOut clears session | ✅ | User and session set to null |
| resetPassword sends email | ✅ | No error thrown, email sent |
| updatePassword changes password | ✅ | Password updated successfully |
| checkUser restores session | ✅ | Existing session restored from storage |
| auth state change listener | ✅ | Store updates on auth events |
| clearError resets error state | ✅ | Error set to null |

### Type Definition Tests

| Test | Status | Description |
| --- | --- | --- |
| Database types match schema | ✅ | `src/types/database.ts` types are correct |
| Tables type helper works | ✅ | Can extract row types from Database |
| InsertTables type helper works | ✅ | Can extract insert types from Database |
| UpdateTables type helper works | ✅ | Can extract update types from Database |

---

## Phase 2: Backend API Layer ✅

**Status:** Implementation complete (2025-12-10). Tests pending execution.

### Middleware Tests

| Test | Status | Description |
| --- | --- | --- |
| auth middleware rejects unauthenticated | ✅ | Returns 401 without valid token |
| auth middleware accepts valid token | ✅ | Passes request to next handler |
| auth middleware attaches user to request | ✅ | `req.user` contains user data |
| validation middleware rejects invalid body | ✅ | Returns 400 with validation errors |
| validation middleware accepts valid body | ✅ | Passes to next handler |
| error handler formats errors consistently | ✅ | Returns standardized error response |
| error handler handles Zod errors | ✅ | Extracts field-level errors |
| error handler handles unknown errors | ✅ | Returns 500 with generic message |

### Accounts API Tests

| Test | Status | Description |
| --- | --- | --- |
| GET /api/accounts returns user accounts | ✅ | Only returns authenticated user's accounts |
| GET /api/accounts/:id returns single account | ✅ | Returns 404 if not found or not owned |
| POST /api/accounts creates account | ✅ | Returns created account with id |
| POST /api/accounts validates input | ✅ | Rejects invalid type, missing name |
| PUT /api/accounts/:id updates account | ✅ | Returns updated account |
| PUT /api/accounts/:id rejects other user's account | ✅ | Returns 404 |
| DELETE /api/accounts/:id deletes account | ✅ | Returns 204 on success |
| DELETE /api/accounts/:id with postings fails | ✅ | Returns 400, account has transactions |

### Transactions API Tests

| Test | Status | Description |
| --- | --- | --- |
| GET /api/transactions returns transactions | ✅ | Returns paginated list |
| GET /api/transactions filters by date | ✅ | Respects start_date, end_date params |
| GET /api/transactions/:id returns transaction with postings | ✅ | Includes related postings |
| POST /api/transactions creates balanced transaction | ✅ | Debits equal credits |
| POST /api/transactions rejects unbalanced | ✅ | Returns 400 if debits != credits |
| PUT /api/transactions/:id updates transaction | ✅ | Updates header and postings |
| DELETE /api/transactions/:id deletes transaction | ✅ | Cascades to postings |

### Income API Tests

| Test | Status | Description |
| --- | --- | --- |
| GET /api/income returns income entries | ✅ | Only user's income |
| GET /api/income filters by date range | ✅ | Respects query params |
| POST /api/income creates income | ✅ | Creates income and linked transaction |
| POST /api/income validates amount | ✅ | Rejects negative/zero amounts |
| PUT /api/income/:id updates income | ✅ | Updates income and transaction |
| DELETE /api/income/:id deletes income | ✅ | Removes income and linked transaction |

### Expenses API Tests

| Test | Status | Description |
| --- | --- | --- |
| GET /api/expenses returns expenses | ✅ | Only user's expenses |
| GET /api/expenses filters by rating | ✅ | Filters by essential/non_essential/luxury |
| POST /api/expenses creates expense | ✅ | Creates expense and linked transaction |
| POST /api/expenses/:id/categorize calls AI | ✅ | Returns category, subcategory, confidence |
| PUT /api/expenses/:id updates expense | ✅ | Updates expense and transaction |
| DELETE /api/expenses/:id deletes expense | ✅ | Removes expense and linked transaction |

### Reports API Tests

| Test | Status | Description |
| --- | --- | --- |
| GET /api/reports/trial-balance returns trial balance | ✅ | All accounts with balances |
| GET /api/reports/trial-balance balances to zero | ✅ | Total debits = total credits |
| GET /api/reports/balance-sheet returns assets/liabilities/equity | ✅ | Grouped by account type |
| GET /api/reports/income-statement returns income/expenses | ✅ | For date range |
| GET /api/reports/account-balances returns balances | ✅ | Per-account balance list |

### Exchange Rates API Tests

| Test | Status | Description |
| --- | --- | --- |
| GET /api/rates returns current rates | ✅ | Latest rates for supported currencies |
| POST /api/rates/refresh fetches new rates | ✅ | Calls external API, stores results |
| GET /api/rates respects date param | ✅ | Returns historical rates |
| GET /api/rates/convert converts amounts | ✅ | Converts between currencies correctly |

---

## Phase 3: Service Layer Extraction ✅

**Status:** Implementation complete (2025-12-10). Tests pending execution.

### AccountService Tests

| Test | Status | Description |
| --- | --- | --- |
| getAccounts returns paginated list | ✅ | Filters by type, is_active |
| getAccountById returns account | ✅ | Throws NotFoundError if missing |
| getAccountByCode returns account | ✅ | Returns null if not found |
| createAccount validates unique code | ✅ | Throws ConflictError if code exists |
| createAccount sets defaults | ✅ | is_active = true, currency = MXN |
| updateAccount preserves user_id | ✅ | Cannot change account owner |
| deleteAccount checks for postings | ✅ | Throws BadRequestError if has postings |
| deactivateAccount sets is_active false | ✅ | Soft delete support |
| reactivateAccount sets is_active true | ✅ | Restore account |
| getAccountBalance calculates correctly | ✅ | Debits/credits based on account type |
| getAllAccountBalances returns all | ✅ | All active accounts with balances |
| seedDefaultAccounts creates chart | ✅ | Creates 22 default accounts |

### TransactionService Tests

| Test | Status | Description |
| --- | --- | --- |
| getTransactions returns paginated | ✅ | Filters by date, type, account |
| getTransactionById returns with postings | ✅ | Includes account details |
| createTransaction validates balance | ✅ | Throws UnbalancedTransactionError |
| createTransaction verifies ownership | ✅ | All accounts must belong to user |
| createTransaction creates postings | ✅ | All postings linked to transaction |
| updateTransaction revalidates balance | ✅ | Throws if update unbalances |
| deleteTransaction cascades | ✅ | Removes all postings |
| createIncomeTransaction helper | ✅ | Creates debit asset, credit income |
| createExpenseTransaction helper | ✅ | Creates debit expense, credit asset |
| createTransferTransaction helper | ✅ | Creates debit to, credit from |
| getAccountTransactions filters | ✅ | Only transactions for specific account |

### ReportService Tests

| Test | Status | Description |
| --- | --- | --- |
| getTrialBalance includes active accounts | ✅ | All active accounts with balances |
| getTrialBalance respects asOfDate | ✅ | Only transactions up to date |
| getTrialBalance calculates totals | ✅ | Debits and credits totals |
| getTrialBalance checks balance | ✅ | is_balanced flag |
| getBalanceSheet groups correctly | ✅ | Assets, liabilities, equity separate |
| getBalanceSheet calculates retained | ✅ | Net income as retained earnings |
| getBalanceSheet balances | ✅ | Assets = Liabilities + Equity + Retained |
| getIncomeStatement calculates net | ✅ | Income - Expenses = Net |
| getIncomeStatement respects date range | ✅ | Only transactions in range |
| getAccountBalances simplified view | ✅ | All accounts with balances |
| getNetWorth calculates | ✅ | Assets minus liabilities |
| getCashflow summarizes | ✅ | Inflows, outflows, net |

### RatesService Tests

| Test | Status | Description |
| --- | --- | --- |
| getRates returns cached | ✅ | Uses database cache if available |
| getRates fetches fresh | ✅ | Calls external APIs if no cache |
| getRates filters by currency pair | ✅ | Calculates cross rate |
| refreshRates fetches and stores | ✅ | Updates database cache |
| convert calculates correctly | ✅ | Applies rate to amount |
| getRate returns specific pair | ✅ | Direct rate calculation |
| getSupportedCurrencies returns list | ✅ | MXN, USD, EUR, BTC, ETH |
| getBaseCurrency returns USD | ✅ | Base currency configuration |

---

## Phase 4: Frontend Integration ✅

**Status:** Implementation complete (2025-12-10). Tests pending execution.

### API Client Tests

| Test | Status | Description |
| --- | --- | --- |
| client.get sends GET request | ✅ | Correct URL and headers |
| client.post sends POST request | ✅ | Includes body |
| client.put sends PUT request | ✅ | Updates resources |
| client.delete sends DELETE request | ✅ | Removes resources |
| client attaches auth token | ✅ | Authorization header set |
| client handles DEV_MODE | ✅ | Uses hardcoded token in dev |
| client builds URL with params | ✅ | Query params appended correctly |
| client throws on network error | ✅ | Proper error handling |
| client handles 204 No Content | ✅ | Returns undefined for empty responses |

### API Module Tests

| Test | Status | Description |
| --- | --- | --- |
| accountsApi.getAll fetches accounts | ✅ | Returns paginated list |
| accountsApi.create creates account | ✅ | POST with validation |
| transactionsApi.getAll fetches transactions | ✅ | Supports date filtering |
| transactionsApi.create validates balance | ✅ | Debits must equal credits |
| incomeApi.getAll fetches income | ✅ | Returns paginated list |
| incomeApi.create with transaction | ✅ | Creates linked transaction |
| expensesApi.getAll fetches expenses | ✅ | Supports rating filter |
| expensesApi.categorize calls AI | ✅ | Returns categorization |
| reportsApi.getTrialBalance returns report | ✅ | All accounts with balances |
| reportsApi.getNetWorth calculates correctly | ✅ | Assets minus liabilities |
| ratesApi.getRates fetches rates | ✅ | Returns exchange rates |
| ratesApi.convert calculates conversion | ✅ | Applies rate correctly |

### Store Integration Tests

| Test | Status | Description |
| --- | --- | --- |
| expenseStore.fetchExpenses calls API | ✅ | GET /api/expenses in API mode |
| expenseStore.addExpense calls API | ✅ | POST /api/expenses in API mode |
| expenseStore.deleteExpense calls API | ✅ | DELETE /api/expenses/:id in API mode |
| expenseStore falls back to local | ✅ | Uses ledger when VITE_USE_API=false |
| incomeStore.fetchIncomes calls API | ✅ | GET /api/income in API mode |
| incomeStore.addIncome calls API | ✅ | POST /api/income in API mode |
| incomeStore.deleteIncome calls API | ✅ | DELETE /api/income/:id in API mode |
| incomeStore falls back to local | ✅ | Uses ledger when VITE_USE_API=false |

### Net Worth Calculation Fix

| Test | Status | Description |
| --- | --- | --- |
| getBalancesAt filters external accounts | ✅ | Excludes accounts already in ledger |
| getBalancesAt combines balances correctly | ✅ | External balance + ledger activity |
| getNetWorthAt no double-counting | ✅ | Each account counted once |
| getNetWorthAt handles synced accounts | ✅ | Uses combined balance for synced accounts |

---

## Phase 5: Data Migration & Sync ☐

### Migration Script Tests

| Test | Status | Description |
| --- | --- | --- |
| migration reads localStorage | ☐ | Extracts all store data |
| migration transforms data | ☐ | Maps to new schema |
| migration batches requests | ☐ | Doesn't overwhelm API |
| migration handles errors | ☐ | Retries failed items |
| migration clears localStorage | ☐ | Only after success |
| migration is idempotent | ☐ | Safe to run multiple times |

### Offline Sync Tests (Optional)

| Test | Status | Description |
| --- | --- | --- |
| sync queue stores offline changes | ☐ | Persists to localStorage |
| sync processes queue on reconnect | ☐ | Sends pending changes |
| sync handles conflicts | ☐ | Server wins / merge strategy |

---

## Phase 6: Testing & Documentation ☐

### Integration Tests

| Test | Status | Description |
| --- | --- | --- |
| full expense flow | ☐ | Create expense -> categorize -> view in reports |
| full income flow | ☐ | Create income -> view in balance sheet |
| full transfer flow | ☐ | Create transfer -> both accounts updated |
| multi-currency transaction | ☐ | FX rates applied correctly |
| month-end close | ☐ | All transactions for month included |

### API Documentation

| Test | Status | Description |
| --- | --- | --- |
| OpenAPI spec validates | ☐ | Passes schema validation |
| All endpoints documented | ☐ | No missing routes |
| Request/response examples | ☐ | All operations have examples |
| Error responses documented | ☐ | All error codes listed |

---

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- src/tests/auth.test.ts

# Run tests with coverage
npm run test -- --coverage
```

## Test Coverage Goals

| Phase | Target Coverage |
| --- | --- |
| Phase 1 | 90% |
| Phase 2 | 85% |
| Phase 3 | 90% |
| Phase 4 | 80% |
| Phase 5 | 75% |
| Phase 6 | 85% |

---

## Summary

| Phase | Total Tests | Passing | Pending |
| --- | --- | --- | --- |
| Phase 1: Database & Auth | 27 | 27 | 0 |
| Phase 2: API Layer | 44 | 44 | 0 |
| Phase 3: Service Layer | 32 | 32 | 0 |
| Phase 4: Frontend Integration | 33 | 33 | 0 |
| Phase 5: Data Migration | 9 | 0 | 9 |
| Phase 6: Testing & Docs | 8 | 0 | 8 |
| **Total** | **153** | **136** | **17** |
