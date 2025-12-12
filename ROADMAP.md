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

## Future Phases

See **[STYLEROADMAP.md](./STYLEROADMAP.md)** for pending style and UX improvements.

---

**Last Updated:** 2025-12-12
