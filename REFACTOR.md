# Fintonico Backend Refactoring Plan

## Current State Summary

The frontend is solid with a well-designed double-entry accounting domain model. The backend is minimal (~125 lines) with only a categorization endpoint. All data lives in localStorage via Zustand stores, and Supabase is configured but essentially unused.

### Key Problems
- No real backend CRUD operations
- Mock authentication (hardcoded user)
- Database disconnected from application
- Two conflicting data models (user-facing vs ledger)
- 638-line monolithic ledgerStore doing too much
- localStorage as primary storage (5-10MB limit, no sync)

---

## Phase 1: Database Schema & Authentication

**Goal**: Establish proper data persistence and real user authentication.

### 1.1 Expand Supabase Schema

Create migrations for all entities:

```sql
-- accounts table (user-defined accounts: cash, bank, credit cards)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- asset, liability, equity, income, expense
  code TEXT NOT NULL, -- accounting code (e.g., 1000, 2000)
  currency TEXT NOT NULL DEFAULT 'MXN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, code)
);

-- transactions table (double-entry transactions)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- postings table (individual debits/credits within a transaction)
CREATE TABLE postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL, -- stored in minor units
  currency TEXT NOT NULL,
  is_debit BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- income table
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- expenses table (update existing)
ALTER TABLE expenses ADD COLUMN transaction_id UUID REFERENCES transactions(id);

-- exchange_rates table
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(20, 10) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_currency, to_currency, fetched_at::date)
);
```

### 1.2 Implement Real Authentication

- Replace mock authStore with Supabase Auth
- Implement sign up, sign in, sign out, password reset
- Add auth middleware to all API routes
- Scope all queries by `user_id`

### 1.3 RLS Policies

Add Row Level Security for all new tables:

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- Repeat for transactions, postings, income, exchange_rates
```

---

## Phase 2: Backend API Layer

**Goal**: Create RESTful API endpoints for all CRUD operations.

### 2.1 API Structure

```
/api
├── /auth
│   ├── POST /signup
│   ├── POST /signin
│   ├── POST /signout
│   └── POST /reset-password
├── /accounts
│   ├── GET /              # List user accounts
│   ├── POST /             # Create account
│   ├── GET /:id           # Get single account
│   ├── PUT /:id           # Update account
│   └── DELETE /:id        # Delete account
├── /transactions
│   ├── GET /              # List transactions (with pagination)
│   ├── POST /             # Create transaction with postings
│   ├── GET /:id           # Get single transaction
│   ├── PUT /:id           # Update transaction
│   └── DELETE /:id        # Delete transaction
├── /income
│   ├── GET /              # List income entries
│   ├── POST /             # Create income
│   ├── PUT /:id           # Update income
│   └── DELETE /:id        # Delete income
├── /expenses
│   ├── GET /              # List expenses
│   ├── POST /             # Create expense
│   ├── PUT /:id           # Update expense
│   ├── DELETE /:id        # Delete expense
│   └── POST /:id/categorize  # AI categorization
├── /reports
│   ├── GET /trial-balance
│   ├── GET /balance-sheet
│   ├── GET /income-statement
│   └── GET /account-balances
└── /rates
    ├── GET /              # Get current exchange rates
    └── POST /refresh      # Fetch fresh rates from API
```

### 2.2 Request/Response Validation

- Use Zod schemas (already in `src/domain/types.ts`) for validation
- Standardize error responses:

```typescript
interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}
```

### 2.3 Server Structure

Reorganize `server/` directory:

```
server/
├── index.ts              # Express app entry
├── middleware/
│   ├── auth.ts           # Supabase auth middleware
│   ├── validation.ts     # Zod validation middleware
│   └── errorHandler.ts   # Global error handler
├── routes/
│   ├── accounts.ts
│   ├── transactions.ts
│   ├── income.ts
│   ├── expenses.ts
│   ├── reports.ts
│   └── rates.ts
├── services/
│   ├── AccountService.ts
│   ├── TransactionService.ts
│   ├── ReportService.ts
│   └── RatesService.ts
└── repositories/
    ├── AccountRepository.ts
    ├── TransactionRepository.ts
    └── RatesRepository.ts
```

---

## Phase 3: Service Layer Extraction

**Goal**: Move business logic from frontend stores to backend services.

### 3.1 Split ledgerStore (638 lines → services)

Current ledgerStore responsibilities to extract:

| Responsibility | New Location |
|----------------|--------------|
| Account CRUD | `AccountService` |
| Transaction CRUD | `TransactionService` |
| Balance calculations | `ReportService` |
| Financial statements | `ReportService` |
| Default account creation | `AccountService.seedDefaults()` |

### 3.2 Backend Services

**AccountService**
- `createAccount(data)` - with validation
- `updateAccount(id, data)`
- `deleteAccount(id)` - check for existing postings
- `getAccountBalance(id, asOfDate)`
- `seedDefaultAccounts(userId)` - create default chart of accounts

**TransactionService**
- `createTransaction(data)` - validate double-entry balance
- `updateTransaction(id, data)`
- `deleteTransaction(id)`
- `getTransactionsByDateRange(start, end)`

**ReportService**
- `getTrialBalance(asOfDate)`
- `getBalanceSheet(asOfDate)`
- `getIncomeStatement(startDate, endDate)`
- `getAccountLedger(accountId, startDate, endDate)`

### 3.3 Domain Logic Reuse

Move `src/domain/ledger.ts` logic to server:
- `LedgerValidator` → use in `TransactionService`
- `TransactionBuilder` → use in transaction creation
- Financial statement calculations → `ReportService`

---

## Phase 4: Frontend Integration

**Goal**: Connect frontend stores to backend API instead of localStorage.

### 4.1 Create API Client

```typescript
// src/api/client.ts
class ApiClient {
  private baseUrl: string;
  private token: string | null;

  async get<T>(path: string): Promise<T>;
  async post<T>(path: string, data: unknown): Promise<T>;
  async put<T>(path: string, data: unknown): Promise<T>;
  async delete(path: string): Promise<void>;
}
```

### 4.2 Refactor Stores

**authStore**
- Replace mock auth with Supabase Auth client
- Store JWT token for API calls
- Handle session refresh

**accountStore**
- Replace localStorage persistence with API calls
- Keep Zustand for UI state caching
- Add loading/error states

**ledgerStore → simplify**
- Remove CRUD logic (now in backend)
- Keep only client-side caching
- Fetch data from `/api/transactions` and `/api/reports`

**expenseStore / incomeStore**
- Remove `_deriveFromLedger()` pattern
- Fetch directly from `/api/expenses` and `/api/income`
- Simpler, flatter data structure

### 4.3 Unify Data Models

Resolve the two `Account` types:

```typescript
// Single Account interface used everywhere
interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  code: string;
  currency: string;
  isActive: boolean;
  balance?: number; // computed on read
}
```

---

## Phase 5: Data Migration & Sync

**Goal**: Migrate existing localStorage data to database.

### 5.1 Migration Script

Create one-time migration for existing users:
1. Read localStorage data
2. Transform to new schema
3. POST to backend in batches
4. Clear localStorage after successful migration

### 5.2 Offline Support (Optional)

If offline-first is needed:
- Keep Zustand + localStorage as cache
- Implement sync queue for offline changes
- Resolve conflicts on reconnection

---

## Phase 6: Testing & Documentation

**Goal**: Ensure reliability and maintainability.

### 6.1 Backend Tests

```
server/__tests__/
├── services/
│   ├── AccountService.test.ts
│   ├── TransactionService.test.ts
│   └── ReportService.test.ts
├── routes/
│   ├── accounts.test.ts
│   ├── transactions.test.ts
│   └── reports.test.ts
└── integration/
    └── ledger.integration.test.ts
```

### 6.2 API Documentation

- Add OpenAPI/Swagger spec
- Generate from Zod schemas
- Serve at `/api/docs`

---

## Summary

| Phase | Focus | Outcome |
|-------|-------|---------|
| 1 | Database & Auth | Real persistence, real users |
| 2 | API Layer | RESTful endpoints for all operations |
| 3 | Service Layer | Business logic on server |
| 4 | Frontend Integration | Stores use API instead of localStorage |
| 5 | Migration | Move existing data to database |
| 6 | Testing | Backend test coverage, API docs |

### Files to Keep (Frontend)
- `src/components/*` - All UI components
- `src/domain/money.ts` - Money value object (useful client-side)
- `src/hooks/*` - React hooks
- `src/utils/*` - UI utilities
- `src/config/*` - Client configuration

### Files to Refactor
- `src/stores/*` - Simplify, remove business logic
- `src/domain/ledger.ts` - Move to server
- `server/index.ts` - Expand significantly

### Files to Remove (Eventually)
- `netlify/functions/categorize.ts` - Consolidate into server
- Duplicate categorization logic in `server/index.ts`
