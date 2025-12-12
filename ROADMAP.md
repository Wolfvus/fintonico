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
name,type,currency,balance,yield,due_date,excluded
Savings,bank,MXN,100000,5.5,,false
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

### Step 4: Data Integrity

| Task | Status |
| --- | --- |
| Validate localStorage data structure | Planned |
| Check for data inconsistencies | Planned |
| Document current data schema | Planned |

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

### Step 1: Net Worth Snapshot Store

| Task | Status |
| --- | --- |
| Create `netWorthHistoryStore` with snapshot data structure | Planned |
| Add `takeSnapshot()` function | Planned |
| Add `getHistory(startDate, endDate)` function | Planned |
| Auto-snapshot on first visit of each month | Planned |

### Step 2: Dashboard Net Worth Change Display

| Task | Status |
| --- | --- |
| Show month-over-month change ($ and %) | Planned |
| Show trend indicator (up/down arrow, color) | Planned |
| Handle case when no previous snapshot exists | Planned |

### Step 3: Net Worth History View (Optional)

| Task | Status |
| --- | --- |
| Simple line chart showing net worth over time | Planned |
| Table view of historical snapshots | Planned |
| Filter by date range | Planned |

**Data Structure:**
```typescript
interface NetWorthSnapshot {
  id: string;
  date: string;           // YYYY-MM-DD
  netWorth: number;       // In base currency
  totalAssets: number;
  totalLiabilities: number;
  baseCurrency: string;   // Currency at time of snapshot
}
```

**Questions to Resolve:**
1. Should snapshots be automatic or manual?
2. Should we store account-level breakdown for each snapshot?
3. How far back should history go? (Storage limits)

---

## Future Phases

See **[STYLEROADMAP.md](./STYLEROADMAP.md)** for pending style and UX improvements.

---

**Last Updated:** 2025-12-12 (Phase 15 Steps 1-3 completed)
