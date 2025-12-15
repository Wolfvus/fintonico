# Fintonico

Personal finance management application with multi-currency support, expense tracking, income management, and comprehensive net worth reporting.

## Project Status

**Version:** 2.2.0
**Last Updated:** 2025-12-14
**Status:** Core features complete through Phase 18

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

### Dashboard
- **Monthly Overview**: Income, expenses, and cashflow for selected period
- **Savings Rate**: Calculated savings percentage
- **Recent Transactions**: Table view with type, amount, currency, and date
- **Net Worth Change**: Month-over-month change with trend indicators
- **Period Navigation**: Month/Year/Custom date range selection

### Income & Expense Management
- **Quick Add Forms**: Fast entry with description, amount, currency selection
- **Notion-Style Tables**: Inline editing with click-to-edit cells
- **3 Expense Categories**: Essential, Discretionary, Luxury
- **Income Frequencies**: One-time, Weekly, Bi-weekly, Monthly
- **Recurring Support**: Mark entries as recurring for easy month-to-month tracking
- **Mini Calendar Date Picker**: Visual calendar dropdown for date selection
- **Currency Formatting**: Proper thousand separators (1,895.00)
- **Column Sorting**: Sort by Amount or Date (ascending/descending)
- **Sticky Month Navigation**: Month selector stays visible while scrolling
- **Table Filters**: Filter by description, currency, category, and recurring status
- **CSV Import/Export**: Backup and restore data via CSV files

### Net Worth Tracking
- **Assets & Liabilities**: Unified tables with account types
- **Account Types**: Cash, Bank, Exchange, Investment, Property, Credit Card, Loan, Mortgage
- **Due Date Tracking**: Day-of-month selector for liability payments
- **Paid Status**: Checkbox to mark monthly payments as complete
- **Exclude Toggle**: Hide accounts from net worth totals
- **Estimated Yield**: Track annual yield for investment accounts
- **Min Payment & No Interest**: Track minimum payments and amounts to avoid interest
- **Column Sorting**: Sort by Balance, Yield, or Due Date
- **Table Filters**: Filter by name, type, currency, paid status
- **Collapsible Sections**: Expand/collapse Assets and Liabilities independently
- **Month Selector**: View historical account balances (read-only for past months)
- **CSV Import/Export**: Backup and restore accounts with nature (asset/liability) field

### Net Worth History
- **Monthly Snapshots**: Automatic monthly net worth tracking
- **Interactive Chart**: Line chart with Y-axis labels and hover tooltips
- **Breakdown Mode**: Toggle to show Assets, Liabilities, and Net Worth lines
- **Time Range Filters**: View 6, 12, 24 months, or all time
- **Period Summary**: Total change and percentage over selected period
- **Historical Table**: Monthly breakdown with change indicators

### Chart of Accounts
- **Ledger Accounts**: Reference accounts with account numbers and CLABE
- **Copy to Clipboard**: Quick copy for account numbers and CLABE codes
- **Normal Balance**: Debit/Credit classification
- **Active/Inactive**: Toggle account status

### Multi-Currency Support
- **Base Currency**: MXN, USD, EUR, BTC, ETH
- **Live Exchange Rates**: Automatic rate fetching
- **Currency Conversion**: All amounts shown in base currency equivalent
- **Per-Entry Currency**: Each income/expense can have its own currency

### Data Management
- **Local Storage Mode**: Works offline with localStorage
- **API Mode**: Full backend with Supabase database
- **Theme Support**: Light/Dark mode with system preference detection

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
│   │   ├── Auth/         # Authentication
│   │   ├── ChartOfAccounts/  # Ledger accounts management
│   │   ├── Currency/     # Currency selector
│   │   ├── Dashboard/    # Main dashboard
│   │   ├── Expense/      # Expense tracking
│   │   ├── Income/       # Income tracking
│   │   ├── Navigation/   # App navigation
│   │   ├── NetWorth/     # Assets & liabilities
│   │   ├── Settings/     # User settings modal
│   │   └── Shared/       # Reusable components
│   ├── config/           # App configuration
│   ├── domain/           # Domain models (Money class)
│   ├── lib/              # Supabase client
│   ├── stores/           # Zustand stores
│   ├── styles/           # CSS and style utilities
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

## Data Types

### Expense
```typescript
interface Expense {
  id: string;
  what: string;
  amount: number;
  currency: string;
  rating: 'essential' | 'discretionary' | 'luxury';
  date: string;
  recurring?: boolean;
}
```

### Income
```typescript
interface Income {
  id: string;
  source: string;
  amount: number;
  currency: string;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  date: string;
}
```

### Account (Net Worth)
```typescript
interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'exchange' | 'investment' | 'property' | 'loan' | 'credit-card' | 'mortgage' | 'other';
  currency: string;
  balance: number;
  excludeFromTotal?: boolean;
  recurringDueDate?: number;
  isPaidThisMonth?: boolean;
  estimatedYield?: number;
  minMonthlyPayment?: number;
  paymentToAvoidInterest?: number;
  lastUpdated?: string;
}
```

## Development Phases

| Phase | Description | Status |
| --- | --- | --- |
| 1 | Database Schema & Authentication | ✅ |
| 2 | Backend API Layer | ✅ |
| 3 | Service Layer Extraction | ✅ |
| 4 | Frontend Integration | ✅ |
| 5 | Data Migration & Sync | ✅ |
| 6 | Data Consistency & Validation | ✅ |
| 7 | Testing & Documentation | ✅ |
| 8 | UI/UX Refresh (v2.1) | ✅ |
| 9 | Table Filters & Collapsible Sections | ✅ |
| 10 | Expense Page Restructure | ✅ |
| 11 | Dashboard & Navigation Simplification | ✅ |
| 11.5 | Net Worth & Accounts Filter UI Consistency | ✅ |
| 12 | Income Page Enhancements (Bi-weekly) | ✅ |
| 13 | Sticky Month Navigation | ✅ |
| 14 | CSV Import/Export | ✅ |
| 15 | Code & Data Cleanup | ✅ |
| 16 | Net Worth History & Tracking | ✅ |
| 17 | Table Sorting & Liability Enhancements | ✅ |
| 18 | Net Worth Monthly View & Chart Improvements | ✅ |

## Documentation

- **[ROADMAP.md](./ROADMAP.md)** - Feature roadmap and completed work
- **[NEWFEATURES.md](./NEWFEATURES.md)** - Planned features backlog (prioritized)
- **[STYLEROADMAP.md](./STYLEROADMAP.md)** - UI/UX style improvements roadmap

## License

MIT
