# Fintonico

Personal finance management application with double-entry accounting, multi-currency support, and comprehensive reporting.

## Project Status

**Version:** 2.0.0
**Last Updated:** 2025-12-10
**Status:** All core features complete, ready for UI/UX enhancements

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Stores    │  │  Selectors  │  │     Components      │  │
│  │ (Zustand)   │  │  (Finance)  │  │  (Dashboard, etc)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express + TypeScript)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │  Services   │  │    Middleware       │  │
│  │  (REST API) │  │  (Business) │  │  (Auth, Validation) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Accounts   │  │Transactions │  │    Postings         │  │
│  │  (RLS)      │  │   (RLS)     │  │    (RLS)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Accounting
- **Double-Entry Bookkeeping**: Every transaction has balanced debits and credits
- **Chart of Accounts**: Asset, Liability, Equity, Income, Expense categories
- **Multi-Currency Support**: MXN base currency with USD, EUR conversion
- **Historical Exchange Rates**: Stored rates for accurate historical reporting

### Transaction Management
- **Expense Tracking**: Categorized expenses with recurrence support
- **Income Recording**: Multiple income sources with scheduling
- **Transfers**: Inter-account transfers with automatic postings
- **CSV Import**: Import bank statements with duplicate detection

### Reporting
- **Dashboard**: Monthly summary, upcoming bills, recent transactions
- **Net Worth**: Assets minus liabilities with currency conversion
- **Trial Balance**: All accounts with debit/credit totals
- **Balance Sheet**: Assets, liabilities, equity breakdown
- **Income Statement**: Revenue vs expenses for period
- **Cashflow**: Inflows vs outflows summary

### Data Management
- **Local Storage Mode**: Works offline with localStorage
- **API Mode**: Full backend with Supabase database
- **Migration Tools**: CLI and browser utilities to migrate data
- **Backup/Restore**: Export and download localStorage data

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for API mode)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd fintonico

# Install dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Development

```bash
# Run frontend (local storage mode)
npm run dev

# Run frontend + backend
npm run dev:all

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Environment Variables

```env
# Supabase (required for API mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Mode toggle
VITE_USE_API=true

# Development
VITE_DEV_MODE=true
VITE_DEV_TOKEN=your-dev-jwt-token
```

## Project Structure

```
fintonico/
├── src/
│   ├── api/              # API client modules
│   ├── components/       # React components
│   ├── lib/              # Supabase client
│   ├── selectors/        # Data selectors (finance, cashflow)
│   ├── stores/           # Zustand stores
│   ├── tests/            # Frontend tests
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── server/
│   ├── __tests__/        # Backend tests
│   ├── docs/             # API documentation (OpenAPI)
│   ├── lib/              # Server Supabase client
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── types/            # Server types
├── supabase/
│   └── migrations/       # Database migrations
└── scripts/              # CLI utilities
```

## API Endpoints

### Accounts
- `GET /api/accounts` - List accounts (paginated, filterable)
- `GET /api/accounts/:id` - Get single account
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/balance` - Get account balance

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Get transaction with postings
- `POST /api/transactions` - Create balanced transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Income
- `GET /api/income` - List income entries
- `POST /api/income` - Create income
- `PUT /api/income/:id` - Update income
- `DELETE /api/income/:id` - Delete income

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/categorize` - AI categorization

### Reports
- `GET /api/reports/trial-balance` - Trial balance
- `GET /api/reports/balance-sheet` - Balance sheet
- `GET /api/reports/income-statement` - Income statement
- `GET /api/reports/account-balances` - All account balances

### Exchange Rates
- `GET /api/rates` - Get exchange rates
- `POST /api/rates/refresh` - Refresh from external APIs
- `GET /api/rates/convert` - Convert between currencies

Full API documentation: `server/docs/openapi.yaml`

## Data Consistency Rules

### Account Balance Storage
- **Assets**: Stored as positive values (e.g., 12000 for $12k savings)
- **Liabilities**: Stored as negative values (e.g., -1800 for $1.8k debt)

### Net Worth Calculation
```
Total Assets = Sum of all asset account balances (positive)
Total Liabilities = Sum of absolute values of liability balances
Net Worth = Total Assets - Total Liabilities
```

### Single Source of Truth
- `accountStore` (external accounts) = Balance sheet positions
- `ledgerStore` = Transaction tracking and P&L calculations
- No double-counting between ledger and external accounts

## Testing

### Test Coverage
- **Frontend**: 30+ tests for stores, selectors, components
- **AccountService**: 14 tests (CRUD, balance, soft delete)
- **ReportService**: 8 tests (trial balance, balance sheet, income statement)
- **Account Routes**: 10 tests (all API endpoints)

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- src/tests/networth.test.ts
```

## Style Guide

### Code Style
- TypeScript with strict mode
- Functional components with hooks
- Zustand for state management
- Tailwind CSS for styling

### Naming Conventions
- **Files**: kebab-case (`account-service.ts`)
- **Components**: PascalCase (`AccountsPage.tsx`)
- **Functions**: camelCase (`getAccountBalance`)
- **Types**: PascalCase (`AccountType`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CURRENCY`)

### Commit Messages
```
type(scope): description

feat(accounts): add balance history endpoint
fix(reports): correct net worth calculation
docs(api): update OpenAPI spec
test(services): add AccountService tests
```

## Development Phases Completed

| Phase | Description | Status |
| --- | --- | --- |
| 1 | Database Schema & Authentication | ✅ |
| 2 | Backend API Layer | ✅ |
| 3 | Service Layer Extraction | ✅ |
| 4 | Frontend Integration | ✅ |
| 5 | Data Migration & Sync | ✅ |
| 6 | Data Consistency & Validation | ✅ |
| 7 | Testing & Documentation | ✅ |

## License

MIT
