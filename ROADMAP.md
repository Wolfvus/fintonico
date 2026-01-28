# Fintonico Roadmap

## Completed Phases

### Phase 1: Database Schema & Authentication ✅
- Supabase database setup
- Row Level Security (RLS) policies
- User authentication flow

### Phase 2: Backend API Layer ✅
- Express + TypeScript server
- REST API endpoints
- Request validation middleware

### Phase 3: Service Layer Extraction ✅
- Business logic separation
- API client modules
- Error handling

### Phase 4: Frontend Integration ✅
- React + Vite setup
- Zustand state management
- API integration

### Phase 5: Data Migration & Sync ✅
- Local storage to API migration
- Data synchronization
- Offline fallback support

### Phase 6: Data Consistency & Validation ✅
- Input validation
- Data integrity checks
- Type safety improvements

### Phase 7: Testing & Documentation ✅
- Backend unit tests
- API documentation (OpenAPI)
- README documentation

### Phase 8: UI/UX Refresh (v2.1) ✅

#### Step 1: Modal & Item Component Standardization ✅

| Task | Status |
| --- | --- |
| Audit existing modals | ✅ |
| Create base Modal component | ✅ |
| Create base ListItem component | ✅ |
| Standardize Settings modal | ✅ |

#### Step 2: Notion-Style Editable Tables ✅

| Task | Status |
| --- | --- |
| Create EditableTable component | ✅ |
| Notion-style inline editing | ✅ |
| Type selector dropdown | ✅ |
| Payment due date (day of month) | ✅ |
| Paid status checkbox | ✅ |

#### Step 3: Separate Net Worth & Accounts Sections ✅

| Task | Status |
| --- | --- |
| Simplify Net Worth section (single currency per entry) | ✅ |
| Add "Exclude from total" toggle | ✅ |
| Create Chart of Accounts section | ✅ |
| Update navigation structure | ✅ |
| Remove legacy Assets/Liabilities sections | ✅ |

#### Step 4: Dashboard Improvements ✅

| Task | Status |
| --- | --- |
| Pending recurring section below transactions | ✅ |
| Independently collapsible pending section | ✅ |
| Pending section collapsed by default | ✅ |
| Currency badges visible on all items | ✅ |

#### Step 5: Income & Expense Table Enhancements ✅

| Task | Status |
| --- | --- |
| Currency formatting with thousand separators (1,895.00) | ✅ |
| Full header names (Currency, Frequency) | ✅ |
| Optimized column widths for UX | ✅ |
| Mini calendar date picker | ✅ |

#### Step 6: Color Palette & Theme ✅

| Task | Status |
| --- | --- |
| Unified color palette (Tailwind config) | ✅ |
| Semantic color tokens | ✅ |
| Dark/Light mode consistency | ✅ |
| Navigation CSS utility classes | ✅ |

---

## Phase 9: Table Filters & Collapsible Sections ✅

### Step 1: Income & Expense Filters ✅

**Goal:** Add simple column-based filters to Income and Expense tables.

| Task | Status |
| --- | --- |
| Filter by description/source (text search) | ✅ |
| Filter by currency (dropdown) | ✅ |
| Filter by category/frequency (dropdown) | ✅ |
| Filter by recurring status | ✅ |
| Clear filters button | ✅ |

**Columns filtered:**
- **Income:** Source, Currency, Frequency
- **Expense:** Description (What), Currency, Category (Rating), Recurring

### Step 2: Net Worth Filters & Collapsible Sections ✅

**Goal:** Add filters to Assets/Liabilities and make sections collapsible.

| Task | Status |
| --- | --- |
| Collapsible Assets section | ✅ |
| Collapsible Liabilities section | ✅ |
| Filter by name (text search) | ✅ |
| Filter by type (dropdown) | ✅ |
| Filter by currency (dropdown) | ✅ |
| Filter by paid status (liabilities) | ✅ |
| Filter by excluded status | ✅ |

### Step 3: Chart of Accounts Filters ✅

**Goal:** Simple search filters for the Accounts section.

| Task | Status |
| --- | --- |
| Filter by name (text search) | ✅ |
| Filter by type (Normal Balance: Debit/Credit) | ✅ |

---

## Phase 10: Expense Page Restructure ✅

### Step 1: Separate Recurring & One-Time Expenses ✅

**Goal:** Split the Expense page into two distinct sections for better organization.

| Task | Status |
| --- | --- |
| Create "Recurring Expenses" collapsible section | ✅ |
| Create "One-Time Expenses" section (current month) | ✅ |
| Each section has its own table | ✅ |
| Each section has independent filters | ✅ |
| Quick add form adds to appropriate section | ✅ |
| Summary shows totals for each section | ✅ |
| Recurring expenses expanded by default | ✅ |
| Added "Due Date" column to recurring expenses | ✅ |
| Category totals include recurring expenses | ✅ |

**Layout:**
- **Recurring Expenses** - Template expenses that repeat monthly (expanded by default, with due date)
- **Monthly Expenses** - One-time expenses for the selected month

---

## Phase 11: Dashboard & Navigation Simplification ✅

### Step 1: Remove Pending Recurring Feature ✅

**Goal:** Simplify Dashboard by removing the confusing "Pending Recurring" section.

| Task | Status |
| --- | --- |
| Remove pendingRecurringEntries logic | ✅ |
| Remove Add/Skip handlers | ✅ |
| Remove Pending Recurring UI section | ✅ |
| Clean up unused state variables | ✅ |
| Clean up unused icon imports | ✅ |

**Rationale:** The pending recurring feature caused confusion - users expected deleted recurring items to disappear immediately. Recurring expenses/income are now managed directly in their respective pages.

### Step 2: Page Persistence on Refresh ✅

**Goal:** Stay on the current page when refreshing instead of returning to Dashboard.

| Task | Status |
| --- | --- |
| Persist activeTab to localStorage | ✅ |
| Restore activeTab on app load | ✅ |

---

## Phase 11.5: Net Worth & Accounts Filter UI Consistency ✅

**Goal:** Make filter UI consistent across all tables. Net Worth tables (Assets/Liabilities) should use the same toggle-style filters as Income/Expense tables. Accounts section should have always-visible sticky filters for quick searching.

### Step 1: Net Worth Tables - Toggle Filter Style ✅

| Task | Status |
| --- | --- |
| Assets table: Add Filter icon button in header | ✅ |
| Assets table: Toggle filter row on click | ✅ |
| Assets table: Highlight icon when filters active | ✅ |
| Liabilities table: Add Filter icon button in header | ✅ |
| Liabilities table: Toggle filter row on click | ✅ |
| Liabilities table: Highlight icon when filters active | ✅ |

**Filter pattern (same as Income/Expense):**
- Filter icon in last column header
- Click to show/hide filter row
- Icon highlighted (green for Assets, red for Liabilities) when filters are active
- Clear button appears when filters are active

### Step 2: Accounts Section - Always-Visible Filters ✅

| Task | Status |
| --- | --- |
| Add sticky filter row to Accounts table | ✅ |
| Name search filter (always visible) | ✅ |
| Type filter dropdown (always visible) | ✅ |
| Clear filters button | ✅ |

**Rationale:** Accounts section is used for quick lookups, so filters should always be visible and sticky while scrolling.

---

## Phase 12: Income Page Enhancements ✅

**Goal:** Add bi-weekly frequency and improve income summary with expected monthly calculations.

| Task | Status |
| --- | --- |
| Add "bi-weekly" frequency option | ✅ |
| Add "Expected Monthly Income" summary card | ✅ |
| Calculate normalized monthly totals from all frequencies | ✅ |

**Rationale:** Most users have 1-2 income sources, so separating into multiple sections adds unnecessary complexity. Instead, focus on:
- Supporting common pay schedules (bi-weekly is very common)
- Showing actionable "Expected Monthly Income" that normalizes all frequencies

**Monthly Conversion Factors:**
- Weekly × 4
- Bi-weekly × 2
- Monthly × 1

---

## Phase 13: Sticky Month Navigation ✅

**Goal:** Make the month navigation/date selector sticky on Income and Expenses pages so users can always change the month while scrolling through long lists. The navigation header remains the highest priority sticky element.

| Task | Status |
| --- | --- |
| Expenses: Sticky month navigation | ✅ |
| Income: Sticky month navigation | ✅ |

**Implementation Notes:**
- Navigation header takes priority - sticky elements positioned below it with `top-16`
- Month selector uses `position: sticky` with `z-20` (below header's z-30)
- Applied background color matching page background (`bg-gray-100 dark:bg-gray-900`)
- Summary cards are NOT sticky - only the month navigation

---

## Phase 14: CSV Import/Export ✅

**Goal:** Allow users to import and export data to/from CSV files for backup, migration, and bulk data entry.

| Task | Status |
| --- | --- |
| Create CSV utility functions (parse/generate) | ✅ |
| Expenses: Export/Import CSV | ✅ |
| Income: Export/Import CSV | ✅ |
| Net Worth (Accounts): Export/Import CSV | ✅ |
| Chart of Accounts: Export/Import CSV | ✅ |

**Implementation Notes:**
- Created `src/utils/csv.ts` with generic CSV parsing and generation functions
- Created `src/components/Shared/CSVActions.tsx` reusable component with Export/Import buttons
- Import shows validation errors in a modal dialog
- Export downloads file with date-stamped filename (e.g., `fintonico-expenses-2025-12-11.csv`)

**CSV Formats:**

**Expenses:**
```
date,description,amount,currency,category,recurring
2025-01-15,Groceries,150.00,MXN,essential,false
```

**Income:**
```
date,source,amount,currency,frequency
2025-01-01,Salary,50000.00,MXN,monthly
```

**Accounts (Net Worth):**
```
name,type,nature,currency,balance,yield,due_date,min_payment,no_interest_payment,excluded
Savings,bank,asset,MXN,100000,5.5,,,,false
Credit Card,credit-card,liability,USD,-5000,,15,200,5000,false
```

**Chart of Accounts:**
```
name,account_number,clabe,normal_balance,active
Bank Account,1234567890,012345678901234567,debit,true
```

---

## Phase 15: Code & Data Cleanup ✅

**Goal:** Review and clean up unused code, deprecated stores, and technical debt before adding new features.

### Step 1: Store Audit ✅

| Task | Status |
| --- | --- |
| Audit all Zustand stores for unused state/actions | ✅ |
| Remove unused functions from stores | ✅ |
| Remove unused useMoney hook | ✅ |

**Stores Audited & Cleaned:**
- `authStore.ts` - Removed: `resetPassword`, `updatePassword`, `clearError`, `getAccessToken`
- `currencyStore.ts` - Removed: `formatMoney`, `createMoney`, `convertMoney`
- `expenseStore.ts` - Removed: `getExpensesByRating`, `clearError`
- `incomeStore.ts` - Removed: `clearError`
- `accountStore.ts` - Removed: `updateAccountBalance`
- `ledgerStore.ts` - Removed: `createAccount`, `updateAccount`, `deleteAccount`, `updateTransaction`, `deleteTransaction`, `getTransaction`, `getAllAccountBalances`, `getTrialBalance`, `getBalanceSheet`, `addTransferTransaction`, `syncExternalAccount`, `reset`
- `ledgerAccountStore.ts` - All functions in use
- `snapshotStore.ts` - Removed: `deleteSnapshot`, `getAllSnapshots`
- `themeStore.ts` - All functions in use

**Also Removed:**
- `src/hooks/finance/useMoney.ts` - Unused hook file

### Step 2: Component Cleanup ✅

| Task | Status |
| --- | --- |
| Identify unused components | ✅ |
| Remove dead code paths | ✅ |
| Clean up unused imports | ✅ |
| Remove commented-out code | ✅ |

**Deleted Files:**

*Unused Components:*
- `src/components/Shared/DataList.tsx`
- `src/components/Shared/TransactionItem.tsx`
- `src/components/ui/` (entire folder: Card, Pagination, SectionHeader, Tabs)
- `src/components/common/EditableTable.tsx`
- `src/components/common/ListItem.tsx`

*Unused Hooks:*
- `src/hooks/finance/useAccountsSummary.ts`
- `src/hooks/finance/useCombinedTransactions.ts`
- `src/hooks/finance/useFilteredTransactions.ts`

*Unused Services & Lib (test-only code):*
- `src/services/` (entire folder: entries.ts, imports.ts, reconcile.ts, rules.ts)
- `src/lib/balance.ts`
- `src/lib/fx.ts`
- `src/lib/cn.ts`
- `src/store/` (entire folder)

*Unused API Layer:*
- `src/api/` (entire folder)

*Unused Domain Code:*
- `src/domain/ports/` (entire folder)
- `src/domain/services/` (entire folder)

*Unused Utils & Config:*
- `src/utils/migration.ts`
- `src/utils/accountClassifications.ts`
- `src/config/accountRegistry.ts`
- `src/selectors/monthEnd.ts`

*Deleted Tests (for deleted code):*
- `src/tests/balance.test.ts`
- `src/tests/entries.create.test.ts`
- `src/tests/fx.test.ts`
- `src/tests/imports.test.ts`
- `src/tests/reconcile.test.ts`
- `src/tests/rules.test.ts`
- `src/tests/types.test.ts`

**Fixed Issues:**
- Replaced Card, SectionHeader, Tabs, Pagination in Dashboard with inline equivalents
- Removed unused `cashflowNet` variable
- Removed unused `FilterBarProps` interface
- Removed commented-out investment yields code block

### Step 3: Type & Utility Review ✅

| Task | Status |
| --- | --- |
| Review types/index.ts for unused types | ✅ |
| Check utils folder for unused utilities | ✅ |
| Remove backwards-compatibility code that's no longer needed | ✅ |

**Deleted Files:**
- `src/utils/testData.ts` - Unused test data generator
- `src/utils/validation.ts` - Unused validation wrapper (sanitization.ts used directly)
- `src/domain/types.ts` - Completely unused domain types
- `src/domain/errors.ts` - Completely unused domain errors

**Types Cleaned Up:**
- Removed `BaseFinancialRecord` interface (unused)
- Removed `AccountBalance` interface (unused backwards-compatibility)
- Added `IncomeFrequency` type to consolidate frequency definitions
- Simplified `Expense` and `Income` interfaces (removed unused fields)

**Backwards-Compatibility Code Removed:**
- `_deriveIncomesFromLedger()` from incomeStore.ts
- `_deriveExpensesFromLedger()` from expenseStore.ts
- `formatCreditCardDueDate()` from dateFormat.ts (unused)

**Type Fixes:**
- Fixed IncomeForm.tsx frequency type (removed 'yearly', added 'bi-weekly')
- Fixed resetData.ts expense ratings ('non_essential' → 'discretionary')
- Fixed Dashboard.tsx onNavigate type (removed unused 'assets'/'liabilities')
- Fixed csv.ts type casting issues

### Step 4: Data Integrity ✅

| Task | Status |
| --- | --- |
| Validate localStorage data structure | ✅ |
| Check for data inconsistencies | ✅ |
| Document current data schema | ✅ |

**Data Inconsistencies Fixed:**
- `expenseStore.ts`: Fixed rating default from 'non_essential' to validated 'discretionary'
- `incomeStore.ts`: Added validation for invalid frequency values (fallback to 'one-time')

**Current Data Schema (localStorage keys):**

| Key | Store | Description |
| --- | --- | --- |
| `fintonico-expenses` | expenseStore | Expense records |
| `fintonico-incomes` | incomeStore | Income records |
| `fintonico-accounts` | accountStore | Net Worth accounts |
| `fintonico-ledger-accounts` | ledgerAccountStore | Chart of Accounts |
| `fintonico-currency` | currencyStore | Currency settings & rates |
| `fintonico-snapshots` | snapshotStore | Net worth snapshots |
| `fintonico-theme` | themeStore | Theme preference (dark/light) |
| `fintonico-dev-session` | authStore | Dev authentication flag |
| `fintonico-active-tab` | App.tsx | Current active navigation tab |
| `fintonico-last-recurring-check` | recurringUtils | Last recurring generation date |

**Data Structures:**

```typescript
// Expense
{
  id: string;
  what: string;
  amount: number;
  currency: string;
  rating: 'essential' | 'discretionary' | 'luxury';
  date: string; // YYYY-MM-DD
  created_at: string; // ISO timestamp
  recurring?: boolean;
}

// Income
{
  id: string;
  source: string;
  amount: number;
  currency: string;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  date: string; // YYYY-MM-DD
  created_at: string; // ISO timestamp
}

// Account (Net Worth)
{
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'exchange' | 'investment' | 'property' | 'loan' | 'credit-card' | 'mortgage' | 'other';
  currency: string;
  balance: number;
  excludeFromTotal?: boolean;
  dueDate?: string;
  recurringDueDate?: number; // day of month
  isPaidThisMonth?: boolean;
  lastPaidDate?: string;
  estimatedYield?: number;
  lastUpdated?: string;
}

// LedgerAccount (Chart of Accounts)
{
  id: string;
  name: string;
  accountNumber?: string;
  clabe?: string;
  normalBalance: 'debit' | 'credit';
  isActive: boolean;
}

// Currency Settings
{
  baseCurrency: string;
  exchangeRates: Record<string, number>;
  lastUpdated: number;
  enabledCurrencies: string[];
}
```

---

## Phase 16: Net Worth History & Tracking ✅

**Goal:** Track net worth changes over time so users can see how their financial position evolves month-to-month.

### Design Considerations

**What to Track:**
- Monthly snapshots of total net worth (assets - liabilities)
- Optionally: breakdown by account for detailed analysis

**When to Snapshot:**
- Option A: Automatic monthly snapshot (e.g., on 1st of each month)
- Option B: Manual snapshot button ("Save current snapshot")
- Option C: Track every account change with timestamp (more data, more complexity)

**Storage Approach:**
- New Zustand store: `netWorthHistoryStore`
- Persist snapshots: `{ date: string, netWorth: number, assets: number, liabilities: number }`

### Step 1: Net Worth Snapshot Store ✅

| Task | Status |
| --- | --- |
| Create `netWorthHistoryStore` with snapshot data structure | ✅ (already existed as `snapshotStore`) |
| Add `takeSnapshot()` function | ✅ (already existed as `createSnapshot`) |
| Add `getHistory(startDate, endDate)` function | ✅ |
| Auto-snapshot on first visit of each month | ✅ |

**Implementation Notes:**
- The snapshot store already existed at `src/stores/snapshotStore.ts` with most functionality
- Added `getHistory(startMonth?, endMonth?)` to filter snapshots by date range
- Wired up `ensureCurrentMonthSnapshot()` in App.tsx to auto-create snapshot on first visit each month
- Existing `getMoMChange()` selector in `finance.ts` calculates month-over-month changes

### Step 2: Dashboard Net Worth Change Display ✅

| Task | Status |
| --- | --- |
| Show month-over-month change ($ and %) | ✅ |
| Show trend indicator (up/down arrow, color) | ✅ |
| Handle case when no previous snapshot exists | ✅ |

**Implementation Notes:**
- Enhanced existing net worth display to show both absolute change ($) and percentage change (%)
- Uses `TrendingUp`/`TrendingDown` icons with green/red color coding
- Shows "— No previous data" when no snapshot exists for comparison
- Added "vs last month" label for clarity
- Works on both mobile and desktop layouts

### Step 3: Net Worth History View ✅

| Task | Status |
| --- | --- |
| Simple line chart showing net worth over time | ✅ |
| Table view of historical snapshots | ✅ |
| Filter by date range | ✅ |

**Implementation Notes:**
- Created `NetWorthHistory.tsx` component with:
  - SVG line chart with area fill showing net worth trend over time
  - Interactive hover tooltips on data points
  - Color-coded based on trend direction (green for growth, red for decline)
- Table view showing month, net worth, assets, liabilities, and month-over-month change
- Filter buttons: 6 months, 12 months, 24 months, All time
- Period summary banner showing total change ($) and percentage
- Collapsible section (collapsed by default) added to NetWorthPage
- Empty state with helpful message when no history exists

**Design Decisions Made:**
1. Snapshots are automatic (created on first visit each month) - no manual button needed
2. Store asset/liability breakdown per snapshot (via `totalsByNature`)
3. No hard limit on history - localStorage will naturally limit storage

---

## Phase 17: Table Sorting & Liability Enhancements ✅

**Goal:** Add column sorting to all data tables and enhance liability tracking with minimum payment and payment-to-avoid-interest fields.

### Step 1: Liability Data Model Enhancement ✅

**Goal:** Add new fields to liabilities for better debt tracking.

| Task | Status |
| --- | --- |
| Add `minMonthlyPayment` field to Account type | ✅ |
| Add `paymentToAvoidInterest` field to Account type | ✅ |
| Update accountStore with migration for existing data | ✅ |
| Update NetWorthPage UI to show/edit new fields | ✅ |
| Update CSV import/export for new fields | ✅ |

**New Fields:**
```typescript
// Added to Account interface (for liability types only)
minMonthlyPayment?: number;        // Minimum required payment
paymentToAvoidInterest?: number;   // Amount to pay to avoid interest charges
```

**Implementation Notes:**
- Added new columns to liabilities table: "Min Pay" and "No Interest"
- Fields are editable inline using the same EditableCell component as other currency fields
- Colors: Min Pay in orange, No Interest in yellow for visual distinction
- CSV export includes `min_payment` and `no_interest_payment` columns
- CSV import parses these fields with validation (must be > 0)
- Store migration preserves existing liability-specific fields

### Step 2: Income Table Sorting ✅

**Goal:** Add sortable columns to Income tables.

| Task | Status |
| --- | --- |
| Add sort state (column, direction) to IncomePage | ✅ |
| Implement sort by Amount (asc/desc) | ✅ |
| Implement sort by Date (asc/desc) | ✅ |
| Add sort indicators to column headers | ✅ |

**Sortable Columns:**
- Amount (numeric sort, converted to base currency)
- Date (date sort)

**Implementation Notes:**
- Created `SortableHeader` component with arrow icons (ArrowUpDown, ArrowUp, ArrowDown)
- Click toggles between ascending/descending; clicking a different column resets to descending
- Sort by Amount converts to base currency for consistent comparison across currencies
- Default sort (no column selected) groups recurring first, then sorts by date descending
- Sort state is local to the component (not persisted)

### Step 3: Expense Table Sorting ✅

**Goal:** Add sortable columns to Expense tables (both recurring and one-time).

| Task | Status |
| --- | --- |
| Add sort state to ExpensePage (for both tables) | ✅ |
| Implement sort by Amount (asc/desc) | ✅ |
| Implement sort by Date (asc/desc) | ✅ |
| Add sort indicators to column headers | ✅ |

**Sortable Columns:**
- Amount (numeric sort, converted to base currency)
- Date (date sort)

**Implementation Notes:**
- Both Recurring and Monthly expense tables have independent sort state
- Reused SortableHeader component pattern from IncomePage (red accent color)
- Sort by Amount converts to base currency for accurate comparison
- Default sort: Recurring = alphabetical by description, Monthly = date descending

### Step 4: Assets Table Sorting ✅

**Goal:** Add sortable columns to Assets table in NetWorthPage.

| Task | Status |
| --- | --- |
| Add sort state for assets table | ✅ |
| Implement sort by Value/Balance (asc/desc) | ✅ |
| Implement sort by Yield (asc/desc) | ✅ |
| Add sort indicators to column headers | ✅ |

**Sortable Columns:**
- Value/Balance (numeric sort, converted to base currency)
- Yield % (numeric sort)

**Implementation Notes:**
- Created `AssetSortableHeader` component with green accent color
- Sort by Value converts to base currency for accurate comparison across currencies
- Sort by Yield compares percentage values (defaults to 0 if undefined)
- Default sort: alphabetically by account name

### Step 5: Liabilities Table Sorting ✅

**Goal:** Add sortable columns to Liabilities table in NetWorthPage.

| Task | Status |
| --- | --- |
| Add sort state for liabilities table | ✅ |
| Implement sort by Value/Balance (asc/desc) | ✅ |
| Implement sort by Due Date (asc/desc) | ✅ |
| Add sort indicators to column headers | ✅ |

**Sortable Columns:**
- Value/Balance (numeric sort, converted to base currency)
- Due Date (day-of-month sort, no due date sorts to end)

**Implementation Notes:**
- Created `LiabilitySortableHeader` component with red accent color
- Sort by Balance uses absolute value for consistent comparison (liabilities are stored negative)
- Sort by Due Date compares recurringDueDate (1-31), accounts without due date sort to end
- Default sort: alphabetically by account name

### Step 6: Separate Assets & Liabilities CSV Export/Import ✅

**Goal:** Fix CSV export/import to properly handle assets and liabilities as separate entities.

**Problem Solved:**
- Assets and liabilities were exported together without clear distinction
- Import relied on type field which didn't handle 'other' type correctly
- Liability-specific fields could be incorrectly applied to assets

| Task | Status |
| --- | --- |
| Add "nature" column to CSV (asset/liability) | ✅ |
| Update `exportAccountsToCSV` to include nature field | ✅ |
| Update `parseAccountCSV` to read nature field | ✅ |
| Validate liability-specific fields only for liabilities | ✅ |
| Auto-detect nature from type if nature column missing (backwards compat) | ✅ |
| Ensure negative balances for liabilities on import | ✅ |

**CSV Format:**
```
name,type,nature,currency,balance,yield,due_date,min_payment,no_interest_payment,excluded
Savings,bank,asset,MXN,100000,5.5,,,,false
Credit Card,credit-card,liability,USD,-5000,,15,200,5000,false
```

**Type-to-Nature Mapping (for backwards compatibility):**
- Asset types: `cash`, `bank`, `exchange`, `investment`, `property`
- Liability types: `loan`, `credit-card`, `mortgage`
- Ambiguous: `other` (inferred from balance sign if nature column missing)

**Implementation Notes:**
- Added `inferNatureFromType()` helper function in csv.ts
- Export always includes nature column for clarity
- Import validates nature or infers from type/balance if missing
- Asset-specific field: `estimatedYield` (only applied for assets)
- Liability-specific fields: `recurringDueDate`, `minMonthlyPayment`, `paymentToAvoidInterest`
- Balances for liabilities automatically converted to negative on import

---

## Phase 18: Net Worth Monthly View & Chart Improvements ✅

**Goal:** Add month selector to Net Worth page for viewing/editing historical account balances, while maintaining data integrity. Improve the net worth history chart.

### Design Considerations

**Current State:**
- Net Worth page shows CURRENT account balances only
- Snapshots store monthly totals (net worth, assets, liabilities) but NOT per-account breakdown
- No way to view or edit "what was my bank balance in October?"

**Key Design Decisions:**

1. **Month Selector Behavior:**
   - View mode: See historical snapshot totals for any month
   - Edit mode: Only current month accounts are editable
   - Past months are read-only (view snapshot data only)

2. **Account Balance History:**
   - Store monthly balance snapshots per account (not just totals)
   - `lastUpdated` remains system-managed (not user-editable)
   - When user edits an account, it updates current balance AND creates/updates current month snapshot

3. **Snapshot Enhancement:**
   - Extend snapshot store to include per-account balances
   - Allows viewing "which accounts made up this month's net worth"

### Step 1: Account Balance History Store ✅

**Goal:** Track historical account balances by month.

| Task | Status |
| --- | --- |
| Extend `snapshotStore` with `AccountSnapshot` interface | ✅ |
| Store monthly account balances with currency conversion | ✅ |
| Auto-capture account balances when snapshot is created | ✅ |
| Migration v1→v2: add empty accountSnapshots to existing data | ✅ |
| Update mock data with historical account snapshots | ✅ |

**Data Structure:**
```typescript
interface AccountSnapshot {
  accountId: string;
  balance: number;        // Balance in original currency
  balanceBase: number;    // Balance converted to base currency
  accountName: string;    // Preserved in case account is deleted
  accountType: AccountType;
  currency: string;
  nature: 'asset' | 'liability';
}

interface NetWorthSnapshot {
  monthEndLocal: string;
  netWorthBase: number;
  totalsByNature: Record<AccountNature, number>;
  accountSnapshots?: AccountSnapshot[]; // Per-account breakdown
  createdAt: string;
}
```

**Implementation Notes:**
- Extended `snapshotStore.ts` with `AccountSnapshot` interface
- `createSnapshot()` now captures all non-excluded accounts
- Each account snapshot includes both original and base currency balances
- Nature (asset/liability) is determined by account type
- Mock data includes 5 months of historical account snapshots showing growth

### Step 2: Month Selector UI ✅

**Goal:** Add month navigation to Net Worth page.

| Task | Status |
| --- | --- |
| Add sticky month selector (same style as Income/Expenses) | ✅ |
| Current month: Show live editable accounts | ✅ |
| Past months: Show read-only account snapshot | ✅ |
| Visual indicator for view-only mode (past months) | ✅ |
| Summary cards update based on selected month | ✅ |

**UI Behavior:**
- **Current month selected:** Tables are editable, shows live data
- **Past month selected:** Tables are read-only, shows snapshot data
- **Future month selected:** Not allowed (disabled in selector)

**Implementation Notes:**
- Added month selector state using `useState(new Date())` with navigation functions
- Created `getMonthString()` and `isCurrentMonth()` helper functions
- `snapshotAccounts` useMemo converts `AccountSnapshot[]` to `Account[]` for display
- `displayAccounts` switches between live accounts and snapshot accounts
- Summary totals use snapshot data for past months, live calculation for current month
- Sticky month selector UI with:
  - Left: CSV actions (current month only) / "View Only" indicator (past months)
  - Center: Month navigation with prev/next arrows
  - Right: Balanced spacer
- "Historical" badge shown when viewing past months
- "No Data" message displayed for months without snapshots
- AccountRow component accepts `readOnly` prop to disable all inputs
- AddAccountRow hidden when viewing past months
- Delete button hidden in read-only mode

### Step 3: Net Worth Chart Improvements ✅

**Goal:** Enhance the history chart with better visualization.

| Task | Status |
| --- | --- |
| Add Y-axis labels with formatted amounts | ✅ |
| Add intermediate X-axis labels for longer ranges | ✅ |
| Show assets/liabilities as separate lines (toggle) | ✅ |
| Improve tooltip positioning (follow mouse) | ✅ |
| Add responsive breakpoints for chart height | ✅ |
| Optional: Bar chart toggle for monthly comparison | ⬜ (deferred) |

**Chart Enhancements:**
- Green line for assets trend
- Red line for liabilities trend
- Blue line for net worth (assets - liabilities)
- Toggle to show/hide individual lines
- Proper axis scaling and grid lines

**Implementation Notes:**
- Added `formatCompactAmount()` for Y-axis labels (e.g., "500K", "1.2M")
- Added `formatMonthShort()` for X-axis labels (e.g., "Jan '25")
- Y-axis shows 5 evenly spaced labels with horizontal grid lines
- X-axis shows up to 6 evenly spaced labels for longer time ranges
- Chart mode toggle: "Net Worth only" (single line) vs "Breakdown" (3 lines)
- Breakdown mode shows assets (green), liabilities (red), and net worth (blue)
- Responsive height: `h-48 sm:h-56 md:h-64` for taller charts on larger screens
- Tooltip follows mouse horizontally with clamping to prevent overflow
- Hover shows vertical indicator line and data points for all visible series
- Legend displayed in breakdown mode showing line colors

### Step 4: Data Integrity & Edge Cases ✅

**Goal:** Handle edge cases gracefully.

| Task | Status |
| --- | --- |
| Prevent manual `lastUpdated` edits (system-only field) | ✅ |
| Handle deleted accounts in historical snapshots | ✅ |
| Handle currency changes (store original currency in snapshot) | ✅ |
| "No data for this month" empty state | ✅ |

**Integrity Rules:**
- `lastUpdated` is set automatically when balance changes
- Historical snapshots are immutable (cannot edit past months)
- If account was deleted, historical snapshot still shows its data
- Currency conversion uses current rates (historical rates not tracked)

**Implementation Notes:**
- `lastUpdated` column is display-only (not an EditableCell)
- `accountStore.updateAccount()` and `toggleExcludeFromTotal()` auto-set `lastUpdated` to current date
- AccountSnapshot stores account data independently (accountName, accountType, currency, balance)
- Snapshot data persists even if the original account is deleted
- ExcludeToggle disabled in read-only mode (historical view)
- "No Data for [Month]" empty state displays when viewing a month with no snapshot

---

## Phase 19: UI/UX Tweaks & Sticky Headers ✅

**Goal:** Improve navigation consistency across all pages with sticky headers, and improve CSV import workflow (exports disabled).

### Step 1: Disable CSV Exports ✅

**Goal:** Hide export functionality to encourage data retention.

| Task | Status |
| --- | --- |
| Hide/remove Export button from CSVActions component | ✅ |
| Remove export buttons from all pages (Income, Expenses, Net Worth, Accounts) | ✅ |
| Keep export utility functions for potential future admin use | ✅ |

**Implementation Notes:**
- Removed Export button from CSVActions component
- Made `onExport` prop optional (for backward compatibility)
- Commented out `handleExportCSV` functions in all 4 pages (kept for future use)
- Export utility functions in `csv.ts` remain available for potential admin features

### Step 2: CSV Template Generators ✅

**Goal:** Create downloadable CSV templates with example data for each data type.

| Task | Status |
| --- | --- |
| Add `generateTemplate(type)` function to csv.ts | ✅ |
| Generate template for Expenses (with example rows) | ✅ |
| Generate template for Income (with example rows) | ✅ |
| Generate template for Accounts/Net Worth (with example rows) | ✅ |
| Generate template for Chart of Accounts (with example rows) | ✅ |

**Implementation Notes:**
- Added `CSVTemplateType` union type: `'expenses' | 'income' | 'accounts' | 'ledger-accounts'`
- Added `CSVTemplateInfo` interface with headers, description, exampleRows, and notes
- `getCSVTemplateInfo(type)` returns template metadata for each type
- `generateCSVTemplate(type)` creates CSV string with headers + example rows
- `downloadCSVTemplate(type)` downloads template file as `fintonico-{type}-template.csv`
- Each template includes 2-4 realistic example rows with proper formatting

### Step 3: Import Modal Component ✅

**Goal:** Create unified ImportModal with template view, upload, and preview.

| Task | Status |
| --- | --- |
| Create ImportModal component structure | ✅ |
| Tab 1: Template view (format + example + download button) | ✅ |
| Tab 2: Upload zone (drag-drop + file picker) | ✅ |
| Tab 3: Preview table (parsed rows with status icons) | ✅ |
| Footer: Import controls (import all / skip invalid toggle) | ✅ |

**Implementation Notes:**
- Created `src/components/Shared/ImportModal.tsx` with 3 tabs (Template, Upload, Preview)
- Template tab shows field reference, example table, and download button
- Upload tab has drag-and-drop zone with file picker
- Preview tab shows parsed data with per-row validation status
- Footer has "Skip invalid rows" checkbox and Import button

### Step 4: Enhanced Validation ✅

**Goal:** Improve validation with per-row status and better error messages.

| Task | Status |
| --- | --- |
| Per-row validation status (✅ valid / ❌ error) | ✅ |
| Show validation errors in preview | ✅ |
| "Import valid only" option to skip invalid rows | ✅ |

**Implementation Notes:**
- Each parsed row shows green checkmark (valid) or red X (invalid)
- Invalid rows show error messages on hover
- "Skip invalid rows" checkbox defaults to true
- Import button shows count of rows to be imported

### Step 5: Wire Up Import Modal ✅

**Goal:** Replace current import flow with new ImportModal across all pages.

| Task | Status |
| --- | --- |
| Wire up Expenses page import | ✅ |
| Wire up Income page import | ✅ |
| Wire up Net Worth page import | ✅ |
| Wire up Chart of Accounts page import | ✅ |
| Replace CSVActions with Import button | ✅ |

**Implementation Notes:**
- Replaced CSVActions component with Import CSV button on all pages
- Each page has validateRow and handleImportRows callbacks for the modal
- Removed unused CSVActions component imports

### Step 6: Sticky Headers ✅

**Goal:** Verify sticky headers are working on all pages.

| Task | Status |
| --- | --- |
| Income page month selector sticky | ✅ |
| Expenses page month selector sticky | ✅ |
| Net Worth page month selector sticky | ✅ |
| Dashboard time period controls sticky | ✅ |

**Implementation Notes:**
- All pages use `sticky top-16 z-20` on navigation/control sections
- Background color matches page theme to hide scrolling content
- Proper z-index layering with main nav (z-30)

---

## Phase 20: Sticky Header & Layout Fix ✅

**Goal:** Fix sticky headers on Income/Expenses pages and restore compact Quick Add layout with proper sticky behavior.

### Step 1: Revert Income Page Layout ✅

**Goal:** Restore original grid layout (Quick Add + Summary Cards side by side).

| Task | Status |
| --- | --- |
| Revert to grid layout: Quick Add (1/3) + Summary Cards (2/3) | ✅ |
| Make entire top section compact (smaller padding, tighter spacing) | ✅ |
| Keep Import button in accessible location | ✅ |
| Wrap entire top section in sticky container | ✅ |
| Add frequency selector to Quick Add form | ✅ |

### Step 2: Revert Expenses Page Layout ✅

**Goal:** Restore original grid layout matching Income page design.

| Task | Status |
| --- | --- |
| Revert to grid layout: Quick Add (1/3) + Summary Cards (2/3) | ✅ |
| Make entire top section compact (smaller padding, tighter spacing) | ✅ |
| Keep Import button in accessible location | ✅ |
| Wrap entire top section in sticky container | ✅ |
| Add category selector to Quick Add form | ✅ |
| Add recurring toggle to Quick Add form | ✅ |
| Match Income page design pattern | ✅ |

### Step 3: Fix Dashboard Sticky ✅

**Goal:** Ensure Dashboard top section is properly sticky.

| Task | Status |
| --- | --- |
| Verify/fix sticky on Time Period Controls | ✅ |
| Make compact to match Income/Expenses style | ✅ |
| Include Net Worth hero (Total Net Worth, Assets, Liabilities) in sticky | ✅ |
| Include KPI summary cards in sticky | ✅ |

### Step 4: Expense Category Color Buttons ✅

**Goal:** Restore colored category buttons in Expenses Quick Add form.

| Task | Status |
| --- | --- |
| Replace category dropdown with colored button group | ✅ |
| Essential = green, Discretionary = yellow, Luxury = red | ✅ |
| Compact button style fitting in Quick Add form | ✅ |

### Step 5: Compact Design Polish ✅

**Goal:** Make sticky sections compact so they don't take too much viewport space.

| Task | Status |
| --- | --- |
| Reduce padding on sticky sections | ✅ |
| Use smaller fonts where appropriate | ✅ |
| Ensure mobile responsiveness | ✅ |
| Consistent styling across all pages | ✅ |

---

## Phase 21: Super Admin Panel ✅

**Goal:** Implement a Super Admin Panel for managing user accounts, their financial data, and system-wide configuration. Admin panel accessible via new Admin tab visible only to super_admin and admin roles.

### Step 1: Database Schema Updates ✅

| Task | Status |
| --- | --- |
| Create `user_profiles` table with role field | ✅ |
| Create `system_config` table for global settings | ✅ |
| Create `admin_audit_log` table for tracking | ✅ |
| Add RLS policies for admin access | ✅ |
| Create trigger to auto-create profile on registration | ✅ |
| Seed default system config values | ✅ |

**File Created:** `supabase/migrations/003_admin_schema.sql`

### Step 2: Type Definitions ✅

| Task | Status |
| --- | --- |
| Create `UserRole` type (super_admin, admin, user) | ✅ |
| Create `UserProfile` interface | ✅ |
| Create `SystemConfig` interface | ✅ |
| Create `AdminAuditLog` interface | ✅ |

**File Created:** `src/types/admin.ts`

### Step 3: Auth Store Updates ✅

| Task | Status |
| --- | --- |
| Add `userProfile` to auth state | ✅ |
| Add `role` to auth state | ✅ |
| Add `fetchUserProfile()` method | ✅ |
| Add `isAdmin()`, `isSuperAdmin()`, `canAccessAdmin()` helpers | ✅ |
| Update DEV_MODE with super_admin role | ✅ |

**File Modified:** `src/stores/authStore.ts`

### Step 4: Admin Store & Service ✅

| Task | Status |
| --- | --- |
| Create `adminStore.ts` with user management | ✅ |
| Create `adminService.ts` with API methods | ✅ |
| Add system config management | ✅ |
| Add audit logging | ✅ |

**Files Created:**
- `src/stores/adminStore.ts`
- `src/services/adminService.ts`

### Step 5: Server Admin Routes ✅

| Task | Status |
| --- | --- |
| Create `server/routes/admin.ts` | ✅ |
| Create `server/middleware/adminAuth.ts` | ✅ |
| Add admin routes to server index | ✅ |
| User CRUD endpoints | ✅ |
| System config endpoints | ✅ |

**Files Created:**
- `server/routes/admin.ts`
- `server/middleware/adminAuth.ts`

**File Modified:** `server/index.ts`

### Step 6: Navigation Updates ✅

| Task | Status |
| --- | --- |
| Add 'admin' to activeTab type | ✅ |
| Add AdminPage import and conditional render | ✅ |
| Add Shield icon admin nav item | ✅ |
| Show admin tab only for admin/super_admin roles | ✅ |

**Files Modified:**
- `src/App.tsx`
- `src/components/Navigation/Navigation.tsx`

### Step 7: Admin Page Structure ✅

| Task | Status |
| --- | --- |
| Create `AdminPage.tsx` with sub-navigation | ✅ |
| Sub-nav tabs: Users, Financial Data, System Config | ✅ |

**File Created:** `src/components/Admin/AdminPage.tsx`

### Step 8: Users Management Section ✅

| Task | Status |
| --- | --- |
| Create `UsersSection.tsx` with user list table | ✅ |
| Create `UserDetailModal.tsx` for viewing/editing | ✅ |
| Create `CreateUserModal.tsx` for adding users | ✅ |
| Search/filter functionality | ✅ |
| Role dropdown (super_admin only) | ✅ |
| Delete with confirmation | ✅ |

**Files Created:**
- `src/components/Admin/UsersSection.tsx`
- `src/components/Admin/UserDetailModal.tsx`
- `src/components/Admin/CreateUserModal.tsx`

### Step 9: Financial Data Section ✅

| Task | Status |
| --- | --- |
| Create `FinancialDataSection.tsx` | ✅ |
| User selector dropdown | ✅ |
| Tabs: Accounts, Expenses, Incomes | ✅ |
| Read-only data tables | ✅ |
| Export to CSV functionality | ✅ |

**File Created:** `src/components/Admin/FinancialDataSection.tsx`

### Step 10: System Configuration Section ✅

| Task | Status |
| --- | --- |
| Create `SystemConfigSection.tsx` | ✅ |
| Default currency selector | ✅ |
| Supported currencies multi-select | ✅ |
| Expense categories editable list | ✅ |
| Save with confirmation | ✅ |
| Reset to defaults option | ✅ |

**File Created:** `src/components/Admin/SystemConfigSection.tsx`

**Implementation Notes:**
- Admin tab appears in navigation only for users with `admin` or `super_admin` roles
- In dev mode, test user has `super_admin` role for testing
- All admin actions are logged to `admin_audit_log` table
- System config changes require `super_admin` role
- User creation/deletion requires `super_admin` role
- User viewing/editing available to both `admin` and `super_admin` roles

---

## Phase 22: XLSX Import (Replace CSV) ✅

**Goal:** Replace CSV import with XLSX (Excel) format for easier template usage and better user experience. Excel files support formatting, validation hints, and are more familiar to users.

### Step 1: Add XLSX Library & Core Utilities ✅

| Task | Status |
| --- | --- |
| Install `xlsx` package (SheetJS) | ✅ |
| Create `src/utils/xlsx.ts` utility module | ✅ |
| Implement `readXLSXFile(file)` - parse Excel to row arrays | ✅ |
| Implement `generateXLSX(headers, rows)` - create Excel buffer | ✅ |
| Implement `downloadXLSX(filename, buffer)` - download helper | ✅ |

**Library Choice:** SheetJS (`xlsx` package) - most popular, no dependencies, works in browser.

**Implementation Notes:**
- Created `src/utils/xlsx.ts` with all core functions
- `readXLSXFile()` handles Excel date serial conversion automatically
- `generateXLSX()` creates workbooks with auto-sized columns
- Added entity-specific parsers: `parseExpenseXLSX`, `parseIncomeXLSX`, `parseAccountXLSX`, `parseLedgerAccountXLSX`
- Added template generators with Instructions sheet included

### Step 2: XLSX Template Generation ✅

| Task | Status |
| --- | --- |
| Create `generateXLSXTemplate(type)` for all entity types | ✅ |
| Expenses template with headers + example rows | ✅ |
| Income template with headers + example rows | ✅ |
| Accounts (Net Worth) template with headers + example rows | ✅ |
| Chart of Accounts template with headers + example rows | ✅ |
| Add column formatting (date columns, number columns) | ✅ |
| Add header row styling (bold, background color) | ⬜ (deferred - requires xlsx-style) |

**Template Features:**
- Headers in first row with formatting
- 2-3 example rows showing correct format
- Column widths auto-sized
- Instructions sheet with field descriptions

**Implementation Notes:**
- `generateXLSXTemplate(type)` creates 2-sheet workbook (Data + Instructions)
- `downloadXLSXTemplate(type)` downloads as `fintonico-{type}-template.xlsx`
- `getXLSXTemplateInfo(type)` returns template metadata for UI display

### Step 3: XLSX Parsing Functions ✅

| Task | Status |
| --- | --- |
| Create `parseExpenseXLSX(file)` | ✅ |
| Create `parseIncomeXLSX(file)` | ✅ |
| Create `parseAccountXLSX(file)` | ✅ |
| Create `parseLedgerAccountXLSX(file)` | ✅ |
| Handle Excel date format conversion | ✅ |
| Handle number/currency format parsing | ✅ |
| Validate required columns exist | ✅ |

**Implementation Notes:**
- All parsers use async/await pattern (File → ArrayBuffer → XLSX.read)
- Excel date serial numbers automatically converted to YYYY-MM-DD
- Headers normalized to lowercase for flexible matching
- Required column validation with clear error messages
- Account nature auto-inferred from type if not provided

### Step 4: Update ImportModal Component ✅

| Task | Status |
| --- | --- |
| Change file accept filter from `.csv` to `.xlsx,.xls` | ✅ |
| Update Template tab to download XLSX templates | ✅ |
| Update Upload tab file type messaging | ✅ |
| Update parsing logic to use XLSX functions | ✅ |
| Keep Preview and Validation flow unchanged | ✅ |

**Implementation Notes:**
- Changed `parseCSV` prop to `parseFile` (async function accepting File)
- Added `isParsing` state for loading indicator during file processing
- Template download button now green with "Download Excel Template" text
- Processing spinner shown while parsing large files

### Step 5: Wire Up All Pages ✅

| Task | Status |
| --- | --- |
| Update ExpensePage to use XLSX import | ✅ |
| Update IncomePage to use XLSX import | ✅ |
| Update NetWorthPage to use XLSX import | ✅ |
| Update ChartOfAccountsPage to use XLSX import | ✅ |
| Remove CSV import references | ✅ |
| Keep CSV utility functions (for admin export only) | ✅ |

**Implementation Notes:**
- Each page now imports `parse{Entity}XLSX` from `xlsx.ts`
- `parseFileForModal` wrapper converts async XLSX parser to expected interface
- CSV utility functions preserved in `csv.ts` for potential admin features

### Step 6: Testing & Edge Cases ✅

| Task | Status |
| --- | --- |
| Test with Excel-generated files | ✅ |
| Test with Numbers-generated files (Mac) | ✅ |
| Test with LibreOffice-generated files | ✅ |
| Handle files with multiple sheets (use first) | ✅ |
| Handle files with merged cells gracefully | ✅ |
| Error messages for unsupported formats | ✅ |

**Files to Modify:**
- `src/utils/xlsx.ts` (new)
- `src/components/Shared/ImportModal.tsx`
- `src/components/Expense/ExpensePage.tsx`
- `src/components/Income/IncomePage.tsx`
- `src/components/NetWorth/NetWorthPage.tsx`
- `src/components/ChartOfAccounts/ChartOfAccountsPage.tsx`

**Files to Keep (for reference/admin):**
- `src/utils/csv.ts` - Keep for potential admin export features

---

## Phase 23: Supabase Backend Integration ✅

**Goal:** Migrate from localStorage to Supabase database for persistent cloud storage, multi-device sync, and production readiness.

### Current State

**What's working (localStorage):**
- All CRUD operations for Expenses, Income, Accounts, Ledger Accounts
- Snapshots and history tracking
- XLSX import/export
- Admin panel (mock/dev mode)

**What needs Supabase:**
- User data persistence across devices
- Real authentication (not dev mode)
- Admin panel with real user management
- Data backup and recovery

### Step 1: Database Schema Review ✅

| Task | Status |
| --- | --- |
| Audit existing Supabase schema vs current data types | ✅ |
| Create/update `expenses` table | ✅ |
| Create/update `incomes` table | ✅ |
| Create/update `accounts` (net worth) table | ✅ |
| Create/update `ledger_accounts` table | ✅ |
| Create/update `net_worth_snapshots` table | ✅ |
| Add proper RLS policies for user data isolation | ✅ |

**Migration File:** `supabase/migrations/004_app_schema_sync.sql`

**Changes Made:**
1. **expenses** - Added `currency`, `recurring`; fixed rating constraint (`non_essential` → `discretionary`)
2. **income** - Added `amount` (decimal), `frequency` column; migrates from `amount_cents`
3. **net_worth_accounts** - New table for Account interface (assets/liabilities with balances)
4. **ledger_accounts** - New table for LedgerAccount interface (Chart of Accounts)
5. **net_worth_snapshots** - New table for monthly net worth history
6. **account_snapshots** - New table for per-account breakdown within snapshots
7. **Helper functions** - `get_account_nature()`, `calculate_user_net_worth()`

### Step 2: API Service Layer ✅

| Task | Status |
| --- | --- |
| Create `supabaseClient.ts` configuration | ✅ (already existed at `src/lib/supabase.ts`) |
| Create `expenseService.ts` (CRUD with Supabase) | ✅ |
| Create `incomeService.ts` (CRUD with Supabase) | ✅ |
| Create `netWorthAccountService.ts` (CRUD with Supabase) | ✅ |
| Create `ledgerAccountService.ts` (CRUD with Supabase) | ✅ |
| Create `snapshotService.ts` (CRUD with Supabase) | ✅ |

**Files Created:**
- `src/services/expenseService.ts` - Expense CRUD with bulk import
- `src/services/incomeService.ts` - Income CRUD with bulk import
- `src/services/netWorthAccountService.ts` - Net worth account CRUD
- `src/services/ledgerAccountService.ts` - Chart of Accounts CRUD
- `src/services/snapshotService.ts` - Net worth snapshot CRUD
- `src/services/index.ts` - Central export for all services
- `src/types/database.ts` - Updated with all new table types

**Service Features:**
- All services have DEV_MODE flag for localStorage fallback
- Full CRUD operations (getAll, getById, create, update, delete)
- Bulk create for imports
- Proper type mapping between DB rows and app types
- User authentication checks on all operations

### Step 3: Store Migration ✅

| Task | Status |
| --- | --- |
| Update `expenseStore.ts` to use Supabase service | ✅ |
| Update `incomeStore.ts` to use Supabase service | ✅ |
| Update `accountStore.ts` to use Supabase service | ✅ |
| Update `ledgerAccountStore.ts` to use Supabase service | ✅ |
| Update `snapshotStore.ts` to use Supabase service | ✅ |
| Add loading states and error handling | ✅ |
| Add optimistic updates for better UX | ✅ (local state updates immediately) |

**Store Updates:**
- All stores now have `fetchAll()` method to load data from Supabase on app init
- All stores have `loading`, `error`, `initialized`, and `clearError()` states
- DEV_MODE fallback: localStorage persistence when Supabase not configured
- `partialize` ensures only data (not state) is persisted to localStorage
- Added `bulkImport()` for XLSX import functionality
- Added `updateExpense/Income` methods for editing

### Step 4: Authentication Integration ✅

| Task | Status |
| --- | --- |
| Wire up real Supabase Auth (replace dev mode) | ✅ |
| Google OAuth sign-in | ✅ |
| Login/Signup pages with proper validation | ✅ |
| Password reset flow | ✅ |
| Session persistence | ✅ (via Supabase `persistSession: true`) |
| Fetch user profile on login | ✅ |

**Auth Updates:**
- Added `signInWithGoogle()` method using Supabase OAuth
- Added `resetPassword()` method for password recovery
- Added `clearError()` helper
- AuthForm now has Google sign-in button with proper icon
- AuthForm supports three modes: signin, signup, reset
- "Forgot password?" link on sign-in form
- Dev mode indicator when Supabase not configured

**To Enable Google OAuth in Production:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth Client ID and Secret
4. Set redirect URL in Google Cloud Console: `https://xvcmnpezakcmwffcnhmw.supabase.co/auth/v1/callback`

### Step 5: Data Migration Tool ✅

| Task | Status |
| --- | --- |
| Create localStorage → Supabase migration utility | ✅ |
| One-click "Upload my data" for existing users | ✅ |
| Conflict resolution (if data exists in both) | ✅ |
| Migration progress indicator | ✅ |

**Files Created:**
- `src/services/migrationService.ts` - Migration utility with progress tracking
- `src/components/Settings/DataMigration.tsx` - UI component for migration

**Features:**
- Reads all localStorage stores (expenses, income, accounts, ledger, snapshots)
- Checks for existing Supabase data before migration
- Optional "overwrite" mode for replacing existing cloud data
- Step-by-step progress indicator showing current entity being migrated
- Error handling with detailed per-entity error messages
- "Clear local data" option after successful migration
- Integrated into Settings modal under "Cloud Sync" section

### Step 6: Admin Panel Production ✅

| Task | Status |
| --- | --- |
| Wire admin service to real Supabase endpoints | ✅ |
| User management with real data | ✅ |
| View user financial data (read-only) | ✅ |
| System config stored in Supabase | ✅ |
| Audit log persistence | ✅ |

**Files Modified:**
- `src/services/adminService.ts` - Fixed table names, added ledger accounts and snapshots methods
- `src/stores/adminStore.ts` - Added ledger accounts and snapshots to user data fetching
- `src/types/admin.ts` - Added ledgerAccountCount, snapshotCount, updated FinancialDataTab
- `src/components/Admin/FinancialDataSection.tsx` - Added Ledger and Snapshots tabs

**Admin Service Updates:**
- `getUserAccounts()` now uses `net_worth_accounts` table with all fields
- `getUserExpenses()` uses correct `recurring` column
- `getUserIncomes()` uses `amount` and `frequency` columns
- Added `getUserLedgerAccounts()` method
- Added `getUserSnapshots()` with nested account_snapshots

### Step 7: Vercel Deployment & OAuth Setup ✅

| Task | Status |
| --- | --- |
| Create Vercel account and import project | ✅ |
| Configure build settings (Vite preset) | ✅ |
| Add environment variables in Vercel | ✅ |
| Deploy to Vercel | ✅ |
| Create Google Cloud project | ✅ |
| Configure OAuth consent screen | ✅ |
| Create OAuth credentials | ✅ |
| Configure Google provider in Supabase | ✅ |
| Set Site URL and redirect URLs in Supabase | ✅ |

**Production URL:** https://fintonico.vercel.app

**Guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Step 8: Testing & Production Bug Fixes ✅

| Task | Status |
| --- | --- |
| Test Google OAuth sign in/out | ✅ |
| Test all CRUD operations with Supabase | ✅ |
| Fix: fetchAll() never called in production | ✅ |
| Fix: Silent error swallowing in forms | ✅ |
| Fix: App crash before auth completes | ✅ |
| Fix: Re-render loop causing page unresponsive | ✅ |
| Fix: income table amount_cents NOT NULL constraint | ✅ |
| Test RLS policies (user isolation) | ✅ |
| Test admin panel functionality | ✅ |

**Bugs Found & Fixed:**
1. `fetchAll()` was defined in every store but never called from any component
2. Expense Quick Add form didn't await `addExpense()`, errors were swallowed
3. `ensureCurrentMonthSnapshot()` ran before auth, causing crash
4. `useSnapshotStore()` hook in App.tsx subscribed to all state, causing infinite re-renders
5. `income` table had `amount_cents BIGINT NOT NULL` from migration 002, but service sends `amount` (added in migration 004) — fixed with migration 008

### Step 9: Code Audit & Performance Optimization ✅

| Task | Status |
| --- | --- |
| Comprehensive code audit (14 issues identified) | ✅ |
| Fix: App.tsx unhandled promise + error handling | ✅ |
| Fix: recurringUtils.ts production mode guard | ✅ |
| Fix: snapshotService.ts partial save error handling | ✅ |
| Performance: Replace getUser() with getSessionUser() | ✅ |
| Performance: Enable localStorage caching in production | ✅ |

**Performance Improvements:**
- Eliminated 5+ redundant `supabase.auth.getUser()` HTTP calls per page load (~1.5-2.5s saved)
- Created `getSessionUser()` helper — reads from local session (zero network)
- Enabled Zustand persist in production — cached data displays instantly on refresh
- Wrapped `recurringUtils.ts` in DEV_MODE guard and try-catch
- Added user-visible error banner in App.tsx for data loading failures

**Files Modified:**
- `src/lib/supabase.ts` — Added `getSessionUser()` helper
- `src/services/*.ts` (all 5) — Replaced `getUser()` with `getSessionUser()`
- `src/stores/*.ts` (all 5) — Changed `partialize` to always cache data
- `src/utils/recurringUtils.ts` — Added DEV_MODE guard and try-catch
- `src/App.tsx` — Error handling for data fetch, error banner UI
- `src/services/snapshotService.ts` — Throw on partial snapshot save failure
- `supabase/migrations/008_fix_income_amount_cents.sql` — Schema fix

**Design Decisions:**
- localStorage serves as both offline cache and instant-display mechanism
- Fresh data from Supabase overwrites cache on each login
- RLS ensures users can only access their own data
- Admin roles bypass RLS for user management

---

## Phase 24: UI Bug Fixes & Polish ✅

**Goal:** Fix reported UI bugs and improve component usability across Income Quick Add, Net Worth type selector, sorting, and Settings controls.

### Step 1: Income Quick Add Layout Fix ✅

**Goal:** Enlarge the amount input field and move frequency selector below to match the Expenses Quick Add style.

| Task | Status |
| --- | --- |
| Enlarge amount input field (changed `w-20` to `flex-1`) | ✅ |
| Move frequency selector to a row below the amount/currency row | ✅ |
| Match layout style with Expenses Quick Add (category buttons below) | ✅ |
| Verify mobile responsiveness | ✅ |

**Implementation Notes:**
- Changed amount input from fixed `w-20` (80px) to `flex-1` (fills available space)
- Moved frequency selector to its own row with `w-full` width
- Layout now: Source → Amount + Currency → Frequency → Submit

### Step 2: Net Worth Type Selector Fix ✅

**Goal:** Fix the account type dropdown that behaves strangely when adding multiple entries — it jumps to the bottom of the page instead of staying anchored.

| Task | Status |
| --- | --- |
| Fix DropdownSelector portal positioning when multiple rows exist | ✅ |
| Ensure dropdown always shows full list of options | ✅ |
| Dropdown should open upward if near page bottom | ✅ |
| Test with 10+ account entries to verify stability | ✅ |

**Root Cause:** The `DropdownSelector` portal used `position: fixed` but added `window.scrollY`/`window.scrollX` to viewport-relative `getBoundingClientRect()` coordinates. Fixed positioning is relative to the viewport, so adding scroll offsets was incorrect.

**Fix:** Removed `window.scrollY` and `window.scrollX` from position calculation.

### Step 3: Net Worth Sorting — Add Name Column ✅

**Goal:** Allow sorting assets and liabilities back to alphabetical (A-Z) by name after sorting by another column like Yield or Value.

| Task | Status |
| --- | --- |
| Add `name` as a sortable column for Assets table | ✅ |
| Add `name` as a sortable column for Liabilities table | ✅ |
| Clicking Name toggles A-Z / Z-A | ✅ |
| Default sort remains Name A-Z | ✅ |

**Implementation Notes:**
- Added `'name'` to `AssetSortColumn` and `LiabilitySortColumn` union types
- Updated `AssetSortableHeader` and `LiabilitySortableHeader` to accept `'name'` column
- Replaced static `<th>Name</th>` with sortable headers in both `AssetsTableHeader` and `LiabilitiesTableHeader`
- Name sort defaults to ascending (A-Z) on first click; other columns default to descending

### Step 4: Settings — Hide Dev Controls for Non-Admins ✅

**Goal:** Remove mock data display and "Clear Local Data" controls from Settings for regular (non-admin) users. These are dev/admin tools only.

| Task | Status |
| --- | --- |
| Hide "Mock Data" / local storage summary for non-admin users | ✅ |
| Hide "Clear Local Data" button for non-admin users | ✅ |
| Hide entire Data Migration section for non-admin users | ✅ |
| Verify admin users still see all controls | ✅ |

**Implementation Notes:**
- Added `canAccessAdmin()` check from `authStore`
- Entire `DataMigration` component returns `null` for non-admin users
- Admin/super_admin users see the full migration interface
- Dev mode users still see the "Dev Mode Active" banner

---

## Phase 25: Light Mode & Style Overhaul ✅

**Goal:** Improve light mode readability and visual contrast. Create a style reference document. The current light mode uses white backgrounds that make green/red amount text hard to read.

### Step 1: Create style.md Reference ✅

**Goal:** Replace `STYLEROADMAP.md` with `style.md` — a concise reference document summarizing the app's design system.

| Task | Status |
| --- | --- |
| Document color palette (primary teal, accent gold, navy, surfaces) | ✅ |
| Document dark mode colors | ✅ |
| Document light mode colors (current + updated) | ✅ |
| Document typography scale and font choices | ✅ |
| Document spacing system and component patterns | ✅ |
| Document semantic colors (success green, error red, warning yellow) | ✅ |
| Delete `STYLEROADMAP.md` after `style.md` is complete | ✅ |

**File Changes:**
- Created: `style.md`
- Deleted: `STYLEROADMAP.md`

### Step 2: Light Mode Navbar & Menu ✅

**Goal:** Change the light mode navbar and sidebar from white/gray to a light blue tone for better visual hierarchy and readability.

| Task | Status |
| --- | --- |
| Change sidebar background to light blue (`#DBEAFE` blue-100) | ✅ |
| Change mobile header to matching light blue | ✅ |
| Ensure nav icons and text contrast on light blue background | ✅ |
| Active nav item should remain clearly distinguishable | ✅ |
| Update `style.md` with new nav colors | ✅ |

**Implementation Notes:**
- Created `--color-nav-bg` CSS custom property in `index.css`
- Light mode: `#DBEAFE` (blue-100) — soft blue that provides visual hierarchy
- Dark mode: `#334155` (slate-700) — matches elevated surface
- `.nav-sidebar` class uses `var(--color-nav-bg)` for theme-aware background

### Step 3: Light Mode Amount Contrast ✅

**Goal:** Improve readability of green (income/assets) and red (expense/liabilities) amounts on light backgrounds.

| Task | Status |
| --- | --- |
| Darken green amount text (`text-green-600` → `text-green-700`) | ✅ |
| Darken red amount text (`text-red-600` → `text-red-700`) | ✅ |
| Check contrast ratio meets WCAG AA (4.5:1 minimum) | ✅ |
| Test on white and light blue backgrounds | ✅ |
| Update summary cards, table cells, and dashboard amounts | ✅ |
| Update `style.md` with finalized amount colors | ✅ |

**Implementation Notes:**
- Replaced all `text-green-600` → `text-green-700` across 14+ .tsx files (90+ occurrences)
- Replaced all `text-red-600` → `text-red-700` across 14+ .tsx files (90+ occurrences)
- `text-green-700` (#15803d) on white: ~5.3:1 contrast (passes WCAG AA 4.5:1)
- `text-red-700` (#b91c1c) on white: ~5.7:1 contrast (passes WCAG AA 4.5:1)

### Step 4: Overall Light Mode Polish ✅

**Goal:** Ensure consistent, readable light mode across all pages.

| Task | Status |
| --- | --- |
| Review all pages in light mode | ✅ |
| Fix remaining low-contrast elements (yellow-600, orange-600) | ✅ |
| Ensure cards/surfaces have subtle separation (borders or shadows) | ✅ |
| Verify filter dropdowns and modals are readable | ✅ |
| Test on both mobile and desktop | ✅ |

**Implementation Notes:**
- Replaced `text-yellow-600` → `text-yellow-700` (9 occurrences across 5 files)
- Replaced `text-orange-600` → `text-orange-700` (1 occurrence)
- `text-yellow-700` (#a16207) on white: ~4.9:1 contrast (passes WCAG AA)
- `text-orange-700` (#c2410c) on white: ~4.5:1 contrast (passes WCAG AA)
- Blue-600 and purple-600 already pass WCAG AA (4.6:1+), left unchanged
- Updated `style.md` with discretionary/warning and min payment color entries

---

## Phase 26: Admin Panel Rework ✅

**Goal:** Rework admin panel to use real Supabase data only (remove DEV_MODE mock data), remove broken user create/delete (requires service role key), add user summary stats, tier column, and Audit Log viewer tab.

**Decision:** Users self-register via magic link / Google OAuth. Admin only manages existing user profiles (role, tier, active status).

### Step 1: Update Types ✅

| Task | Status |
| --- | --- |
| Remove `CreateUserRequest` interface | ✅ |
| Remove `user.create` and `user.delete` from `AdminAction` | ✅ |
| Add `audit-log` to `AdminSection` type | ✅ |
| Add `UserCounts` interface | ✅ |

### Step 2: Clean Up Admin Service ✅

| Task | Status |
| --- | --- |
| Delete `DEV_MODE` constant and `MOCK_USERS` / `MOCK_SYSTEM_CONFIG` arrays | ✅ |
| Remove all `if (DEV_MODE)` blocks (~20) | ✅ |
| Delete `createUser()` and `deleteUser()` methods | ✅ |
| Add `getUserCounts()` method | ✅ |

### Step 3: Update Admin Store ✅

| Task | Status |
| --- | --- |
| Remove `createUser` / `deleteUser` from state & implementation | ✅ |
| Add `userCounts` and `auditError` to state | ✅ |
| Update `fetchUsers()` to compute and set `userCounts` | ✅ |
| Update `fetchAuditLog()` to accept `action` filter and set `auditError` | ✅ |

### Step 4: Update UsersSection ✅

| Task | Status |
| --- | --- |
| Remove Create User button, delete button, delete confirmation | ✅ |
| Add `getTierBadge()` helper (Crown icon for pro) | ✅ |
| Add summary cards row (Total, By Role, By Tier, Active/Inactive) | ✅ |
| Add Tier column to user table | ✅ |

### Step 5: Delete CreateUserModal ✅

| Task | Status |
| --- | --- |
| Delete `CreateUserModal.tsx` file | ✅ |

### Step 6: Build AuditLogSection ✅

| Task | Status |
| --- | --- |
| Create `AuditLogSection.tsx` with audit log table | ✅ |
| Filter dropdown by action type | ✅ |
| Limit selector (25, 50, 100) | ✅ |
| Refresh button | ✅ |
| Loading/empty/error states | ✅ |
| Resolve UUIDs to emails via users array | ✅ |
| Expandable JSON details per row | ✅ |

### Step 7: Update AdminPage ✅

| Task | Status |
| --- | --- |
| Add ClipboardList icon and AuditLogSection import | ✅ |
| Add 4th tab: Audit Log | ✅ |
| Add conditional render for AuditLogSection | ✅ |

### Step 8: Polish FinancialDataSection ✅

| Task | Status |
| --- | --- |
| Add summary cards above tabs (Accounts, Expenses, Incomes, Ledger, Snapshots) | ✅ |
| Color-coded cards per data type | ✅ |

**Files Changed:**
- `src/types/admin.ts` — Modified (removed CreateUserRequest, added UserCounts, audit-log section)
- `src/services/adminService.ts` — Modified (removed DEV_MODE, mocks, createUser, deleteUser; added getUserCounts)
- `src/stores/adminStore.ts` — Modified (removed createUser/deleteUser, added userCounts/auditError)
- `src/components/Admin/UsersSection.tsx` — Modified (summary cards, tier column, removed create/delete)
- `src/components/Admin/CreateUserModal.tsx` — **Deleted**
- `src/components/Admin/AuditLogSection.tsx` — **Created**
- `src/components/Admin/AdminPage.tsx` — Modified (added Audit Log tab)
- `src/components/Admin/FinancialDataSection.tsx` — Modified (added summary cards)

---

## Phase 27: Internationalization (i18n) ✅

**Goal:** Add multilanguage support starting with Spanish. This is a full-app effort touching every UI string.

### Step 1: i18n Framework Setup ✅

**Goal:** Install and configure an i18n library.

| Task | Status |
| --- | --- |
| Install `react-i18next`, `i18next`, and `i18next-browser-languagedetector` | ✅ |
| Configure i18n with language detection (localStorage key: `fintonico-language`) | ✅ |
| Inline English & Spanish translations in `src/i18n.ts` (single-file approach) | ✅ |
| Side-effect import in `main.tsx` initializes i18n before React renders | ✅ |
| Default language: English, fallback: English | ✅ |

### Step 2: Extract UI Strings ✅

**Goal:** Replace all hardcoded strings with translation keys.

| Task | Status |
| --- | --- |
| Extract Navigation labels | ✅ |
| Extract Dashboard text (~40 keys) | ✅ |
| Extract Income page text (~25 keys) | ✅ |
| Extract Expenses page text (~30 keys) | ✅ |
| Extract Net Worth page text (~50 keys) | ✅ |
| Extract Net Worth History text (~20 keys) | ✅ |
| Extract Chart of Accounts page text (~20 keys) | ✅ |
| Extract Settings modal text (~30 keys) | ✅ |
| Extract Auth forms text (~15 keys) | ✅ |
| Extract Data Migration text (~22 keys) | ✅ |
| Extract Import Modal text (~30 keys) | ✅ |
| Admin panel intentionally kept English-only | ✅ |

### Step 3: Spanish Translation ✅

**Goal:** Complete Spanish translation for all extracted strings.

| Task | Status |
| --- | --- |
| Translate all keys to Spanish (inline in `src/i18n.ts`) | ✅ |
| Review financial terminology (Latin American Spanish) | ✅ |
| Review button labels and form placeholders | ✅ |
| Review error messages | ✅ |

### Step 4: Language Selector in Settings ✅

**Goal:** Allow users to switch language from the Settings modal.

| Task | Status |
| --- | --- |
| Add language selector dropdown in Settings (top section) | ✅ |
| Options: English, Español | ✅ |
| Persist language choice via `i18next-browser-languagedetector` (localStorage) | ✅ |
| Apply language change without page reload (`i18next.changeLanguage()`) | ✅ |

### Step 5: Date & Number Format Localization ✅

**Goal:** Format dates and numbers according to the selected locale.

| Task | Status |
| --- | --- |
| `formatDate()` uses `Intl.DateTimeFormat` with `i18n.language` | ✅ |
| Number formatting uses `toLocaleString(i18n.language)` | ✅ |
| Currency display respects locale | ✅ |
| Month names in date selectors use current locale | ✅ |

---

## Phase 28: Fix Loading Crashes & Add Time Travel Feature

**Goal:** Fix critical loading failures on first data entry and add time travel feature for admin testing.

### Step 1: Store Initialization State Machine ✅

**Goal:** Replace boolean `initialized` flag with status-based state to properly track loading failures.

| Task | Status |
| --- | --- |
| Replace `initialized: boolean` with `initializationStatus` in accountStore | ✅ |
| Replace `initialized: boolean` with `initializationStatus` in expenseStore | ✅ |
| Replace `initialized: boolean` with `initializationStatus` in incomeStore | ✅ |
| Replace `initialized: boolean` with `initializationStatus` in ledgerAccountStore | ✅ |
| Replace `initialized: boolean` with `initializationStatus` in snapshotStore | ✅ |
| Add `errorDetails: string \| null` to each store | ✅ |
| Add `isReady()` helper to each store | ✅ |

**Initialization Status:** `'idle' | 'loading' | 'success' | 'error'`

### Step 2: Defensive Selectors ✅

**Goal:** Add null/empty checks to finance selectors to prevent crashes.

| Task | Status |
| --- | --- |
| Add guards to `getBalancesAt()` — return zero Money if accounts not ready | ✅ |
| Add guards to `getNetWorthAt()` — use safe defaults from getBalancesAt | ✅ |
| Add null checks before Money operations | ✅ |

### Step 3: Snapshot Creation Guards ✅

**Goal:** Block snapshot creation until all dependencies are ready.

| Task | Status |
| --- | --- |
| Add `accountStore.isReady()` check to `ensureCurrentMonthSnapshot()` | ✅ |
| Add empty accounts check to `ensureCurrentMonthSnapshot()` | ✅ |
| Add guard to `createSnapshot()` — throw if no accounts available | ✅ |
| Log warnings when operations are skipped | ✅ |

### Step 4: App Loading Orchestration ✅

**Goal:** Structured data loading with proper error handling and retry logic.

| Task | Status |
| --- | --- |
| Replace `Promise.allSettled` with sequential loading in App.tsx | ✅ |
| Add `getFailedStores()` helper to check initialization status | ✅ |
| Only fetch snapshots after accounts are ready | ✅ |
| Add `dataLoadError` state for user-visible errors | ✅ |
| Update error banner to show specific failed stores | ✅ |
| Add "Retry" button to error banner | ✅ |
| Implement `retryFailedStores()` method | ✅ |

### Step 5: Date Override Store ✅

**Goal:** Create time travel infrastructure for admin testing.

| Task | Status |
| --- | --- |
| Create `dateOverrideStore.ts` with override state | ✅ |
| Add `setOverride()`, `resetToToday()` actions | ✅ |
| Add `adjustDays()`, `adjustMonths()` helpers | ✅ |
| Only functional when `isDevMode === true` | ✅ |

### Step 6: Date Utilities ✅

**Goal:** Centralize date access with override support.

| Task | Status |
| --- | --- |
| Create `dateUtils.ts` with `getCurrentDate()` function | ✅ |
| Check override store, fall back to `new Date()` | ✅ |
| Add `getTodayLocalString()` helper | ✅ |
| Replace `new Date()` in finance.ts (7 locations) | ✅ |
| Replace `new Date()` in dateFormat.ts | ✅ |
| Replace `new Date()` in useMonthNavigation.ts (3 locations) | ✅ |
| Replace `new Date()` in snapshotStore.ts (2 locations) | ✅ |
| Replace `new Date()` in App.tsx (1 location) | ✅ |

### Step 7: Time Travel UI ✅

**Goal:** Add admin controls for date override.

| Task | Status |
| --- | --- |
| Create `TimeTravelBanner.tsx` — purple banner when override active | ✅ |
| Add Time Travel section to `SystemConfigSection.tsx` | ✅ |
| Add date picker input | ✅ |
| Add quick navigation buttons (±1 day, ±1 month) | ✅ |
| Add "Reset to Real Today" button | ✅ |
| Show "ACTIVE" badge when override enabled | ✅ |
| Add TimeTravelBanner to App.tsx layout | ✅ |
| Only visible when `isDevMode === true` | ✅ |

### Step 8: Testing & Verification ✅

**Goal:** Verify all fixes work correctly.

| Task | Status |
| --- | --- |
| Test: First login with no data — no crash | 🔄 Pending QA |
| Test: Network failure — error banner shows failed stores | 🔄 Pending QA |
| Test: Retry button re-attempts failed fetches | 🔄 Pending QA |
| Test: First expense creation doesn't crash | 🔄 Pending QA |
| Test: Time travel override — purple banner appears | 🔄 Pending QA |
| Test: Month navigation respects override date | 🔄 Pending QA |
| Test: Snapshot creation uses override date | 🔄 Pending QA |
| Test: Reset returns to real date | 🔄 Pending QA |
| Verify: Time travel hidden in production mode | 🔄 Pending QA |

**Files Created:**
- `src/stores/dateOverrideStore.ts`
- `src/utils/dateUtils.ts`
- `src/components/Admin/TimeTravelBanner.tsx`

**Files Modified:**
- `src/stores/accountStore.ts`
- `src/stores/expenseStore.ts`
- `src/stores/incomeStore.ts`
- `src/stores/ledgerAccountStore.ts`
- `src/stores/snapshotStore.ts`
- `src/selectors/finance.ts`
- `src/utils/dateFormat.ts`
- `src/hooks/useMonthNavigation.ts`
- `src/App.tsx`
- `src/components/Admin/SystemConfigSection.tsx`

---

## Future Phases

**Subscription Tiers (Freemium/Pro):** Feature gating for import/export. See plan file for details.

**Stripe Integration:** Payment processing for pro tier upgrades.

**Data Visualization:** Charts for expense categories, income trends, savings rate.

**Mobile App:** React Native or PWA for native mobile experience.

---

**Last Updated:** 2026-01-27 (Phase 28 complete — Loading crashes & Time travel — QA pending)
