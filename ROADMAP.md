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

**Layout:**
- **Recurring Expenses** - Template expenses that repeat monthly (collapsed by default)
- **Monthly Expenses** - One-time expenses for the selected month

---

## Future Phases

See **[STYLEROADMAP.md](./STYLEROADMAP.md)** for pending style and UX improvements.

---

**Last Updated:** 2025-12-12
