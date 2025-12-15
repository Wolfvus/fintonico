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

## Phase 16: Net Worth History & Tracking (Planned)

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

## Phase 17: Table Sorting & Liability Enhancements (Planned)

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

## Phase 18: Net Worth Monthly View & Chart Improvements (Planned)

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

## Phase 20: Sticky Header & Layout Fix (Planned)

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

### Step 4: Expense Category Color Buttons ⬜

**Goal:** Restore colored category buttons in Expenses Quick Add form.

| Task | Status |
| --- | --- |
| Replace category dropdown with colored button group | ⬜ |
| Essential = green, Discretionary = yellow, Luxury = red | ⬜ |
| Compact button style fitting in Quick Add form | ⬜ |

### Step 5: Compact Design Polish ⬜

**Goal:** Make sticky sections compact so they don't take too much viewport space.

| Task | Status |
| --- | --- |
| Reduce padding on sticky sections | ⬜ |
| Use smaller fonts where appropriate | ⬜ |
| Ensure mobile responsiveness | ⬜ |

---

## Future Phases

See **[STYLEROADMAP.md](./STYLEROADMAP.md)** for pending style and UX improvements.

---

**Last Updated:** 2025-12-14 (Phase 20 planned)
