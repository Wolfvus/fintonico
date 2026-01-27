# Fintonico Code Audit Plan

A comprehensive step-by-step audit checklist for the Fintonico codebase.

**Created:** 2025-12-17
**Last Updated:** 2026-01-26

---

## Recent Production Issues (2026-01-26)

### Issue Summary

After deploying the subscription tier and auth overhaul features to production (https://fintonico.vercel.app), users were unable to add or save data. The admin panel also could not modify data. Multiple cascading issues were identified and fixed.

### Root Causes Identified

1. **Data not loading from Supabase** (CRITICAL)
   - **Problem**: Every store defined a `fetchAll()` method but no component ever called it
   - **Impact**: In production mode, stores remained empty (no data loaded from Supabase)
   - **Why it was hidden**: In DEV_MODE, Zustand persist middleware loads data from localStorage, masking the bug
   - **Fix** (commit `90896ba`): Added `useEffect` in `App.tsx` to call `fetchAll()` on all 5 data stores when user authenticates
   - **Status**: ✅ FIXED

2. **Silent error swallowing in forms** (HIGH)
   - **Problem**: `addExpense()` called without `await` in Quick Add form's `onSubmit` handler
   - **Impact**: Save failures were unhandled promise rejections (no user feedback)
   - **Fix** (commit `dc38d4b`): Made handler `async`, added try/catch, added red error banner UI
   - **Status**: ✅ FIXED

3. **App crash on load** (CRITICAL)
   - **Problem**: `ensureCurrentMonthSnapshot()` ran at app init before auth completed
   - **Impact**: In production, it called `supabase.auth.getUser()` before session existed → threw "Not authenticated"
   - **Fix** (commit `f904872`): Moved `ensureCurrentMonthSnapshot()` to run only after auth and data fetch
   - **Status**: ✅ FIXED

4. **Page unresponsive** (CRITICAL)
   - **Problem**: `useSnapshotStore()` hook in App.tsx subscribed to ALL snapshot store state changes
   - **Impact**: When fetchAll and ensureCurrentMonthSnapshot updated store, App re-rendered repeatedly
   - **Fix** (commit `5f4cb12`): Replaced hook with `useRef` guard and `getState()` to avoid subscription
   - **Status**: ✅ FIXED

### Production Verification Status

| Test | Status | Notes |
| --- | --- | --- |
| Page loads without crashing | ❓ PENDING | User needs to test latest deploy |
| Page remains responsive | ❓ PENDING | User needs to verify after hard refresh |
| Can add expenses via Quick Add | ❓ PENDING | Error messages now visible if it fails |
| Admin can modify user data | ❓ PENDING | RLS policies verified correct in DB |
| Data persists to Supabase | ❓ PENDING | Service methods verified correct |

### Comprehensive Code Audit Results (2026-01-26)

A thorough code audit was performed focusing on production/Supabase mode issues. **14 issues identified** ranging from CRITICAL to LOW severity.

#### CRITICAL Issues

**1. Unhandled Promise Rejection in App.tsx**
- **File**: `src/App.tsx:62-70`
- **Problem**: `Promise.allSettled()` chain has no error handling; `ensureCurrentMonthSnapshot()` errors silently swallowed with `.catch(() => {})`
- **Impact**: Users won't know if snapshot creation fails; silent data inconsistencies
- **Priority**: 🔴 CRITICAL - Fix immediately

**2. localStorage in production (recurringUtils.ts)**
- **File**: `src/utils/recurringUtils.ts:19-20, 58-59, 99-106`
- **Problem**: `checkAndGenerateRecurring()` reads from localStorage assuming DEV_MODE data; in production, Supabase stores have data but localStorage is empty
- **Impact**: Recurring transactions won't generate; app can crash if localStorage throws
- **Priority**: 🔴 CRITICAL - Fix immediately

#### HIGH Severity Issues

**3. Partial Error Handling in snapshotService.ts**
- **File**: `src/services/snapshotService.ts:216-222`
- **Problem**: Account snapshots can fail silently; parent snapshot exists but detail data missing; only logs error, doesn't throw
- **Impact**: Incomplete data without user notification
- **Priority**: 🟠 HIGH - Fix soon

**4. Missing try-catch in recurringUtils.ts**
- **File**: `src/utils/recurringUtils.ts:20, 52, 93`
- **Problem**: `JSON.parse()` and `localStorage.setItem()` can throw; no error handling
- **Impact**: App crash on startup or silent failures
- **Priority**: 🟠 HIGH - Fix soon

#### MEDIUM Severity Issues

**5. Missing Error Handling in adminStore.ts**
- **File**: `src/stores/adminStore.ts:117-121, 180-196`
- **Problem**: `usersLoading` state not reset on success; `setUserRole` missing loading state management
- **Impact**: Admin panel can enter stuck loading states
- **Priority**: 🟡 MEDIUM

**6. Auth State Race Conditions in Services**
- **Files**: All service files (expenseService.ts, incomeService.ts, etc.)
- **Problem**: `supabase.auth.getUser()` can return null even if user authenticated; no retry or token refresh; generic error messages
- **Impact**: Users get "Not authenticated" errors when actually logged in
- **Priority**: 🟡 MEDIUM

**7. Snapshot Creation Race Conditions**
- **File**: `src/stores/snapshotStore.ts:199-207`
- **Problem**: Between checking snapshot exists and creating it, another process can create one; no locking mechanism
- **Impact**: Duplicate snapshots, "duplicate key" errors in Supabase
- **Priority**: 🟡 MEDIUM

**8. Missing Initialization Check in App.tsx**
- **File**: `src/App.tsx:69`
- **Problem**: `ensureCurrentMonthSnapshot()` called immediately after `Promise.allSettled()` without waiting; accounts/expenses may not be loaded
- **Impact**: Snapshots fail if data fetches are slow
- **Priority**: 🟡 MEDIUM

**9. Dynamic Imports in Production (adminStore.ts)**
- **File**: `src/stores/adminStore.ts:288-290, 328-329`
- **Problem**: `await import('./authStore')` inside store methods; creates circular dependency risk
- **Impact**: Could crash admin actions unexpectedly
- **Priority**: 🟡 MEDIUM

**10. Data Fetching Race Condition in App.tsx**
- **File**: `src/App.tsx:59-72`
- **Problem**: `dataFetched.current` not React-managed; multiple tabs can both fetch; no cleanup on unmount
- **Impact**: Duplicate data fetches, inconsistent state
- **Priority**: 🟡 MEDIUM

**11. Auth Store Session Validation**
- **File**: `src/stores/authStore.ts:199-257`
- **Problem**: `fetchUserProfile()` errors silently caught in auth listener; no cleanup of listeners; can stack on reloads
- **Impact**: Memory leaks, silent profile load failures
- **Priority**: 🟡 MEDIUM

**12. Missing Snapshot User ID Check**
- **File**: `src/services/snapshotService.ts:146-169`
- **Problem**: Inserts account snapshots with `snapshot_id` that might not exist if previous insert failed
- **Impact**: FK constraint violations
- **Priority**: 🟡 MEDIUM

#### LOW Severity Issues

**13. Missing Null Checks in accountStore.ts**
- **File**: `src/stores/accountStore.ts:319-321`
- **Problem**: Optimistic state update before validation; throws error but state already modified
- **Impact**: Inconsistent state after errors
- **Priority**: 🟢 LOW-MEDIUM

**14. Zustand Store Subscriptions**
- **Files**: Dashboard.tsx and other components
- **Problem**: Potential re-render loops if selectors return new objects
- **Impact**: Performance degradation (currently mitigated by `useShallow`)
- **Priority**: 🟢 LOW - Already using `useShallow` correctly

#### Summary Table

| Issue | Severity | Files | Impact |
|-------|----------|-------|--------|
| Unhandled Promise in App.tsx | 🔴 CRITICAL | App.tsx:69 | Silent snapshot failures |
| localStorage in production | 🔴 CRITICAL | recurringUtils.ts | Missing recurring transactions, crashes |
| Partial snapshot saves | 🟠 HIGH | snapshotService.ts:216-222 | Incomplete data |
| Missing try-catch localStorage | 🟠 HIGH | recurringUtils.ts | App crash on startup |
| Admin store loading states | 🟡 MEDIUM | adminStore.ts | Stuck loading states |
| Auth state race conditions | 🟡 MEDIUM | All services | False "Not authenticated" errors |
| Snapshot creation race | 🟡 MEDIUM | snapshotStore.ts:199-207 | Duplicate snapshots |
| Missing snapshot init check | 🟡 MEDIUM | App.tsx:69 | Snapshot failures |
| Dynamic imports in production | 🟡 MEDIUM | adminStore.ts | Unexpected crashes |
| Data fetch race condition | 🟡 MEDIUM | App.tsx:59-72 | Duplicate API calls |
| Auth listener cleanup | 🟡 MEDIUM | authStore.ts | Memory leaks |
| Snapshot FK violations | 🟡 MEDIUM | snapshotService.ts | FK errors |
| Account store state | 🟢 LOW-MEDIUM | accountStore.ts | State inconsistency |
| Zustand subscriptions | 🟢 LOW | Various components | Already mitigated |

### Recommended Fix Priority

1. **Immediate** (CRITICAL):
   - Add proper error handling to `Promise.allSettled()` chain in App.tsx
   - Add try-catch to `recurringUtils.ts` localStorage access OR disable it in production mode
   - Show user-visible error messages for snapshot creation failures

2. **Soon** (HIGH):
   - Fix `snapshotService.ts` to throw errors when account snapshots fail
   - Implement proper initialization guards before creating snapshots

3. **Next Sprint** (MEDIUM):
   - Convert dynamic imports in adminStore to static imports
   - Add atomic operations for snapshot creation or pessimistic locking
   - Implement proper auth listener cleanup
   - Add retry logic for auth state checks in services

4. **Backlog** (LOW):
   - Review all optimistic updates for consistency
   - Add comprehensive error logging service

### Next Steps

1. ✅ User to test production site with hard refresh (Cmd+Shift+R)
2. ✅ Comprehensive code audit completed
3. ❓ Fix CRITICAL issues (issues #1 and #2)
4. ❓ Fix HIGH severity issues (issues #3 and #4)
5. ❓ Consider fixing MEDIUM severity issues based on priority

---

## Audit Overview

This document outlines a systematic approach to auditing the Fintonico codebase for security, quality, performance, and maintainability issues.

### Audit Categories

| Category | Priority | Status |
| --- | --- | --- |
| 1. Security Audit | High | ✅ |
| 2. Type Safety Audit | High | ✅ |
| 3. Data Integrity Audit | High | ✅ |
| 4. Dependency Audit | Medium | ✅ |
| 5. Code Quality Audit | Medium | ✅ |
| 6. Performance Audit | Medium | ✅ |
| 7. Testing Coverage Audit | Medium | ✅ |
| 8. Accessibility Audit | Low | ✅ |
| 9. Documentation Audit | Low | ✅ |

---

## 1. Security Audit

### 1.1 Authentication & Authorization

| Task | Files | Status |
| --- | --- | --- |
| Review Supabase RLS policies | `supabase/migrations/*.sql` | ✅ |
| Verify user session handling | `src/stores/authStore.ts` | ✅ |
| Check admin role enforcement | `src/stores/authStore.ts`, `server/middleware/adminAuth.ts` | ✅ |
| Review dev mode token security | `src/stores/authStore.ts` | ⚠️ |
| Audit API route authentication | `server/routes/*.ts` | ✅ |

**1.1 Findings:**

✅ **RLS Policies (PASS):** All tables have proper RLS enabled with user_id isolation:
- `expenses`, `accounts`, `transactions`, `income`: Filter by `user_id = auth.uid()`
- `postings`: Uses EXISTS subquery to verify parent transaction ownership
- `user_profiles`, `system_config`, `admin_audit_log`: Role-based access for admins

✅ **Session Handling (PASS):** authStore.ts properly manages:
- Supabase session with auth state change listener
- Profile fetching after successful authentication
- Session persistence via localStorage (dev mode) / Supabase (prod)

✅ **Admin Role Enforcement (PASS):** Server middleware properly validates:
- `requireAdmin()`: Checks for admin or super_admin role
- `requireSuperAdmin()`: Checks for super_admin role only
- Both verify is_active status before granting access

⚠️ **Dev Mode Token Security (MEDIUM):**
- Hardcoded token: `dev-token-fintonico`
- Weak credential acceptance: any email with password >= 1 character
- Recommendation: Ensure DEV_MODE is false in production builds

✅ **API Route Authentication (PASS):**
- All routes use `authMiddleware` for authentication
- Admin routes additionally use `requireAdmin` or `requireSuperAdmin`
- All queries filter by `req.userId` for user isolation

### 1.2 Input Validation & Sanitization

| Task | Files | Status |
| --- | --- | --- |
| Review form input sanitization | `src/utils/sanitization.ts` | ✅ |
| Check API request validation | `server/middleware/*.ts` | ✅ |
| Verify file upload validation | `src/utils/xlsx.ts`, `src/utils/csv.ts` | ⚠️ |
| Check for XSS vulnerabilities | All components with user input | ✅ |
| Review SQL/NoSQL injection points | `server/services/*.ts` | ✅ |

**1.2 Findings:**

✅ **Form Input Sanitization (PASS):**
- `sanitization.ts` provides comprehensive XSS prevention
- Removes: `<>`, `javascript:`, `onclick=`, `script`, `iframe`, `object`, `embed`
- Applied in ExpenseForm, IncomeForm, and corresponding stores
- Amount validation with range checks (0.01 to $1B)
- Date validation with reasonable range (-100 to +10 years)

✅ **API Request Validation (PASS):**
- Zod schemas used for body, query, and params validation
- UUID validation on all ID parameters
- Pagination limits enforced (max 100)
- Date format validation (YYYY-MM-DD)
- Proper error responses with field-level details

⚠️ **File Upload Validation (MEDIUM):**
- Header validation ensures required columns exist
- Data parsed through controlled functions, not executed
- Missing: explicit file size limit (server config may handle)
- Missing: file type validation beyond extension

✅ **XSS Vulnerabilities (PASS):**
- No `dangerouslySetInnerHTML` usage found
- React's default JSX escaping handles user content
- Sanitization applied before storage in stores

✅ **SQL/NoSQL Injection (PASS):**
- Supabase client uses parameterized queries
- No raw SQL with user input concatenation
- Query builders (.eq(), .in(), etc.) prevent injection

### 1.3 Data Exposure

| Task | Files | Status |
| --- | --- | --- |
| Check for sensitive data in logs | All files with `console.log` | ❌ |
| Review localStorage data security | All stores with `persist` | ⚠️ |
| Verify API response data filtering | `server/routes/*.ts` | ✅ |
| Check for credentials in code | All files | ⚠️ |
| Review error message exposure | Error handlers | ✅ |

**1.3 Findings:**

❌ **Sensitive Data in Logs (HIGH - CRITICAL FIX NEEDED):**
- `AuthForm.tsx:33`: `console.log('Form submitted with:', data);` **LOGS EMAIL AND PASSWORD**
- This exposes user credentials in browser console
- IMMEDIATE ACTION: Remove or redact this log statement

⚠️ **localStorage Data Security (MEDIUM):**
- Financial data stored in localStorage via Zustand persist:
  - `expense-store`: All expenses with amounts, dates, descriptions
  - `account-store`: All accounts with balances
  - `income-store`: All income records
  - `snapshot-store`: Net worth history
- Data is NOT encrypted - accessible via browser dev tools
- Acceptable for local-first app, but users should be aware

✅ **API Response Filtering (PASS):**
- Error handler returns sanitized responses
- Unknown errors return generic "Internal server error"
- No stack traces exposed to clients
- Supabase error codes mapped to user-friendly messages

⚠️ **Credentials in Code (MEDIUM - Dev Only):**
- `dev-token-fintonico` hardcoded in authStore.ts:8 and auth.ts:17
- `dev-refresh-token` hardcoded in authStore.ts:22
- Only active when DEV_MODE=true (acceptable for development)

✅ **Error Message Exposure (PASS):**
- `errorHandler.ts` properly sanitizes error responses
- AppError subclasses provide structured, safe error messages
- Server-side logging preserved for debugging

### 1.4 CORS & Headers

| Task | Files | Status |
| --- | --- | --- |
| Review CORS configuration | `server/index.ts` | ❌ |
| Check security headers | `server/middleware/*.ts` | ❌ |
| Verify CSP policy | `index.html` | ⚠️ |

**1.4 Findings:**

❌ **CORS Configuration (HIGH - NEEDS FIX):**
- `server/index.ts:24`: `app.use(cors())` with NO configuration
- Allows requests from ANY origin (wildcard `*`)
- Production should restrict to specific allowed origins
- Example fix: `cors({ origin: ['https://fintonico.com'], credentials: true })`

❌ **Security Headers (HIGH - NEEDS FIX):**
- No `helmet` middleware installed or configured
- Missing critical security headers:
  - `X-Frame-Options`: Not set (clickjacking vulnerability)
  - `X-Content-Type-Options`: Not set (MIME sniffing)
  - `Strict-Transport-Security`: Not set (HTTPS enforcement)
  - `X-XSS-Protection`: Not set (legacy XSS filter)
  - `Referrer-Policy`: Not set
- Recommendation: Install and configure `helmet` middleware

⚠️ **CSP Policy (MEDIUM):**
- No Content-Security-Policy in `index.html`
- No CSP header set by server
- Should define allowed script/style/connect sources
- Vite dev server has no security headers configured

---

## 2. Type Safety Audit

### 2.1 TypeScript Strictness

| Task | Files | Status |
| --- | --- | --- |
| Review `any` type usage | All `.ts` and `.tsx` files | ⚠️ |
| Check type assertions (`as`) | All files with type casting | ⚠️ |
| Verify interface completeness | `src/types/*.ts` | ✅ |
| Review optional chaining overuse | All components | ✅ |
| Check null/undefined handling | State management files | ✅ |

**2.1 Findings:**

✅ **TypeScript Strict Mode (PASS):**
- `tsconfig.app.json` has `"strict": true`
- Additional checks enabled: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`

⚠️ **`any` Type Usage (MEDIUM - 80+ instances):**

| Location | Count | Context | Severity |
| --- | --- | --- | --- |
| `adminService.ts` | 12 | Supabase query results | Medium |
| `authStore.ts` | 1 | Profile data cast | Low |
| `expenseStore.ts`, `incomeStore.ts` | 4 | Migration code | Low (intentional) |
| `accountStore.ts` | 1 | Migration function param | Low (intentional) |
| `ledgerStore.ts` | 6 | Migration/serialization | Low (intentional) |
| `server/routes/*.ts` | 30+ | `authMiddleware as any`, `req.query as any` | Medium |
| `server/services/*.ts` | 6 | Supabase postings iteration | Medium |
| `server/__tests__/*.ts` | 30+ | Mock typings | Low (tests) |

⚠️ **Type Assertions (MEDIUM):**
- Pattern: `data as any[]` then `.map()` - loses type safety
- Pattern: `authMiddleware as any` - middleware type mismatch
- Pattern: `req.query as any` - query parsing without validation types

✅ **Interface Completeness (PASS):**
- `src/types/index.ts`: Core types (Expense, Income, Account, etc.)
- `src/types/admin.ts`: Admin types (UserProfile, SystemConfig, etc.)
- `src/types/database.ts`: Full Supabase schema types (Row, Insert, Update)
- Helper types: `Tables<T>`, `InsertTables<T>`, `UpdateTables<T>`

✅ **Optional Chaining (PASS):**
- Used appropriately for nullable fields
- No excessive chaining patterns found

✅ **Null/Undefined Handling (PASS):**
- Stores have proper initial states
- Default values provided in migrations

### 2.2 API Type Safety

| Task | Files | Status |
| --- | --- | --- |
| Verify Supabase query types | `src/services/*.ts` | ⚠️ |
| Check API response typing | `server/routes/*.ts` | ⚠️ |
| Review store action types | `src/stores/*.ts` | ✅ |

**2.2 Findings:**

⚠️ **Supabase Query Types (MEDIUM):**
- Database types exist in `src/types/database.ts`
- Not consistently used in services - many `as any` casts
- Pattern: Query results cast to `any` before mapping
- Improvement: Use `Tables<'tablename'>` helper type

⚠️ **API Response Typing (MEDIUM):**
- Server has typed interfaces in `server/types/index.ts`:
  - `AuthenticatedRequest` extends Express Request
  - `PaginatedResponse<T>` generic for list responses
  - `ApiError` for error responses
- Issue: `authMiddleware as any` cast in all routes
- Issue: `req.query as any` loses type safety

✅ **Store Action Types (PASS):**
- All stores have typed state interfaces
- Actions properly typed with return values
- Zustand persist configured with proper state types

### 2.3 Component Props

| Task | Files | Status |
| --- | --- | --- |
| Verify all props are typed | `src/components/**/*.tsx` | ✅ |
| Check for missing required props | All component usages | ✅ |
| Review event handler types | Form and button handlers | ✅ |

**2.3 Findings:**

✅ **Props Typing (PASS):**
- All components have `interface *Props` definitions
- 30+ Props interfaces found across components
- Consistent naming pattern: `ComponentNameProps`

✅ **Required Props (PASS):**
- TypeScript strict mode catches missing props
- Optional props marked with `?`

✅ **Event Handler Types (PASS):**
- Form handlers use React's built-in types
- Custom handlers have proper type definitions

---

## 3. Data Integrity Audit

### 3.1 Store Consistency

| Task | Files | Status |
| --- | --- | --- |
| Review store persist configurations | All stores with zustand persist | ⚠️ |
| Check data migration logic | Store version migrations | ⚠️ |
| Verify default value handling | Store initial states | ✅ |
| Review store reset functions | All stores | ⚠️ |

**3.1 Findings:**

⚠️ **Persist Configurations (MEDIUM - Inconsistencies):**

| Store | Key | Version | Migration |
| --- | --- | --- | --- |
| snapshotStore | `fintonico-snapshots` | 2 | ✅ migrate() |
| accountStore | `fintonico-accounts` | - | ❌ None |
| incomeStore | `fintonico-incomes` | - | onRehydrateStorage |
| expenseStore | `fintonico-expenses` | - | onRehydrateStorage |
| currencyStore | `fintonico-currency` | - | ❌ None |
| ledgerStore | `ledger-store` | 1 | Custom storage |
| ledgerAccountStore | `fintonico-ledger-accounts` | - | ❌ None |

Issues:
- Inconsistent naming: `ledger-store` vs `fintonico-*` pattern
- Only 2/7 stores have version numbers
- Mixed migration patterns (migrate vs onRehydrateStorage)

⚠️ **Data Migration Logic (MEDIUM):**
- snapshotStore: Proper v1→v2 migration (adds accountSnapshots)
- incomeStore: Migrates `yearly` → `monthly` frequency in onRehydrateStorage
- expenseStore: Validates/sanitizes data in onRehydrateStorage
- Others: No migration - data format changes could cause issues

✅ **Default Value Handling (PASS):**
- All stores have proper initial state definitions
- ledgerStore has `createDefaultAccounts()` for seeding
- Fallback values provided in migrations (e.g., `'MXN'` default)

⚠️ **Store Reset Functions (MEDIUM):**
- `ledgerStore.clearAllData()`: Clears 5 localStorage keys (cross-store)
- `currencyStore.resetEnabledCurrencies()`: Resets to defaults
- `adminStore.clearUserData()` / `clearErrors()`: Partial reset
- Missing: No centralized reset-all function
- Issue: clearAllData() manipulates other stores' data directly

### 3.2 Data Validation

| Task | Files | Status |
| --- | --- | --- |
| Check expense validation rules | `src/stores/expenseStore.ts` | ✅ |
| Check income validation rules | `src/stores/incomeStore.ts` | ✅ |
| Check account validation rules | `src/stores/accountStore.ts` | ❌ |
| Review currency validation | `src/stores/currencyStore.ts` | ⚠️ |
| Verify date format consistency | All date handling | ✅ |

**3.2 Findings:**

✅ **Expense Validation (PASS):**
- Uses `sanitizeDescription()` - max 30 chars, XSS protection
- Uses `validateAmount()` - range $0.01 to $1B, 2 decimal places
- Rating validated against enum: essential, discretionary, luxury
- Date validated with `validateDate()` - YYYY-MM-DD format

✅ **Income Validation (PASS):**
- Same sanitization/validation as expenses
- Frequency validated: one-time, weekly, bi-weekly, monthly
- `yearly` frequency migrated to `monthly` in onRehydrateStorage

❌ **Account Validation (HIGH - Missing):**
- accountStore.addAccount() has NO input validation
- No sanitization on account name
- No amount/balance validation
- No type validation against enum
- Data directly stored without checks

⚠️ **Currency Validation (MEDIUM - Incomplete):**
- `validateCurrency()` only accepts: USD, MXN, EUR
- App supports additional currencies: BTC, ETH
- Whitelist should be expanded or made configurable

✅ **Date Format Consistency (PASS):**
- Consistent YYYY-MM-DD format throughout
- `validateDate()` enforces format and range
- Excel date serial numbers converted properly in xlsx.ts

### 3.3 Import/Export Integrity

| Task | Files | Status |
| --- | --- | --- |
| Review XLSX parsing edge cases | `src/utils/xlsx.ts` | ✅ |
| Check CSV parsing edge cases | `src/utils/csv.ts` | ✅ |
| Verify data transformation accuracy | Import handlers in pages | ✅ |
| Test round-trip export/import | All entity types | ⚠️ |

**3.3 Findings:**

✅ **XLSX Parsing (PASS):**
- Uses SheetJS library for robust parsing
- Handles Excel date serial numbers (36526-73415 range)
- Normalizes headers to lowercase
- Empty cells default to empty string
- Scientific notation handled for long numbers (CLABE)

✅ **CSV Parsing (PASS):**
- Custom parser handles quoted values with commas
- Escaped quotes (`""`) properly unescaped
- Line breaks within quotes handled
- Header validation before processing

✅ **Data Transformation (PASS):**
- Import limits per entity type:
  - Expenses: 500 rows max
  - Income: 500 rows max
  - Accounts: 100 rows max
  - Ledger Accounts: 50 rows max
- Duplicate detection in all import handlers
- Required column validation
- Nature field inferred from account type if missing

⚠️ **Round-Trip (MEDIUM - Potential Issues):**
- Export uses native types (numbers), import expects strings
- Boolean fields: export as true/false, import should handle variations
- Date format preserved (YYYY-MM-DD)
- Long numbers (CLABE) may lose precision in Excel

---

## 4. Dependency Audit

### 4.1 Package Security

| Task | Command/Files | Status |
| --- | --- | --- |
| Run npm audit | `npm audit` | ❌ |
| Check for outdated packages | `npm outdated` | ⚠️ |
| Review high-severity vulnerabilities | `npm audit --audit-level=high` | ❌ |
| Check unused dependencies | `npx depcheck` | ⚠️ |

**4.1 Findings:**

❌ **npm audit (5 vulnerabilities):**

| Package | Severity | Vulnerability | Fix Available |
| --- | --- | --- | --- |
| xlsx | **HIGH** | Prototype Pollution (GHSA-4r6h-8v6p-xvw6) | ❌ No fix |
| xlsx | **HIGH** | ReDoS vulnerability | ❌ No fix |
| vite | Moderate | 3 vulnerabilities | ✅ npm audit fix |
| body-parser | Moderate | Via express | ✅ npm audit fix |
| glob, js-yaml | Low | Transitive | ✅ npm audit fix |

**Critical: xlsx package has known HIGH vulnerabilities with NO FIX AVAILABLE**
- Consider alternatives: ExcelJS, Papa Parse (CSV only), or server-side processing
- Current mitigation: validate file input, limit file size, process in sandbox

⚠️ **Outdated Packages (29 packages):**

| Package | Current | Latest | Type |
| --- | --- | --- | --- |
| react | 19.1.1 | 19.2.3 | Dependency |
| react-dom | 19.1.1 | 19.2.3 | Dependency |
| typescript | 5.8.3 | 5.9.3 | DevDependency |
| eslint | 9.33.0 | 9.38.0 | DevDependency |
| vite | 7.1.2 | 7.3.2 | DevDependency |
| vitest | 3.2.4 | 3.4.0 | DevDependency |
| zod | 4.0.17 | 4.1.0 | Dependency |
| zustand | 5.0.7 | 5.0.5 | Already ahead |
| ...21 more | - | - | Various |

⚠️ **Unused Dependencies (4 packages):**

| Package | Type | Recommendation |
| --- | --- | --- |
| @netlify/functions | devDependency | Remove if not using Netlify |
| autoprefixer | devDependency | Keep if using PostCSS |
| postcss | devDependency | Keep if using TailwindCSS |
| tailwindcss | devDependency | Required - used in build |

Note: autoprefixer, postcss, tailwindcss are needed for TailwindCSS build pipeline even if not directly imported.

### 4.2 License Compliance

| Task | Files | Status |
| --- | --- | --- |
| Review package licenses | `package.json`, `server/package.json` | ✅ |
| Check for GPL contamination | License analysis | ✅ |

**4.2 Findings:**

✅ **License Compliance (PASS):**
- All dependencies use permissive licenses (MIT, Apache-2.0, ISC, BSD)
- xlsx: Apache-2.0 (compatible with commercial use)
- React ecosystem: MIT
- Supabase: Apache-2.0
- Express: MIT
- Zustand: MIT
- No GPL/LGPL contamination detected

### 4.3 Bundle Size

| Task | Command | Status |
| --- | --- | --- |
| Analyze bundle size | `npm run build && npx vite-bundle-analyzer` | ⚠️ |
| Identify large dependencies | Bundle analysis | ⚠️ |
| Check for tree-shaking issues | Build output | ✅ |

**4.3 Findings:**

⚠️ **Large Dependencies (estimated):**

| Package | Est. Size | Impact |
| --- | --- | --- |
| xlsx (SheetJS) | ~500KB | Largest - consider lazy loading |
| @supabase/supabase-js | ~150KB | Required for auth/DB |
| lucide-react | ~50KB+ | Tree-shakeable, imports all icons |
| react-hook-form | ~30KB | Required for forms |

**Recommendations:**
- Lazy-load xlsx only when import modal opens
- Review lucide-react imports - use specific icon imports
- Consider code splitting for admin panel

✅ **Tree-shaking (PASS):**
- Vite handles tree-shaking automatically
- ES modules used throughout (`"type": "module"`)
- No CommonJS imports that would prevent tree-shaking

---

## 5. Code Quality Audit

### 5.1 Code Organization

| Task | Files | Status |
| --- | --- | --- |
| Review component file sizes | Components > 500 lines | ⚠️ |
| Check for code duplication | All components | ⚠️ |
| Verify separation of concerns | Stores, services, components | ✅ |
| Review import organization | All files | ✅ |

**5.1 Findings:**

⚠️ **Large Files (>500 lines) - 7 files need refactoring:**

| File | Lines | Concern |
| --- | --- | --- |
| `NetWorthPage.tsx` | 1,992 | **Needs split** - combine page + tables + forms |
| `ExpensePage.tsx` | 1,555 | **Needs split** - combine page + tables + forms |
| `IncomePage.tsx` | 1,211 | **Needs split** - similar structure |
| `Dashboard.tsx` | 835 | Borderline - could extract cards |
| `ChartOfAccountsPage.tsx` | 726 | Borderline - similar pattern |
| `finance.ts` (selectors) | 626 | Acceptable - utility module |
| `NetWorthHistory.tsx` | 596 | Borderline - complex chart logic |

⚠️ **Code Duplication:**
- Similar table patterns in ExpensePage, IncomePage, NetWorthPage
- Sort/filter logic repeated in each page component
- Month navigation repeated across pages
- Consider: Generic table component with sort/filter hooks

✅ **Separation of Concerns (PASS):**
- Clean architecture: stores → selectors → components
- Domain logic in `src/domain/` (ledger.ts, money.ts)
- API calls isolated in stores and services
- Shared UI in `src/components/Shared/`

✅ **Import Organization (PASS):**
- React imports first
- External packages second
- Internal imports last
- Consistent pattern across files

### 5.2 Naming Conventions

| Task | Files | Status |
| --- | --- | --- |
| Check component naming | All `.tsx` files | ✅ |
| Check function naming | All functions | ✅ |
| Verify constant naming (UPPER_CASE) | Config and constants | ✅ |
| Check for ambiguous names | All files | ⚠️ |

**5.2 Findings:**

✅ **Component Naming (PASS):**
- All components use PascalCase
- Consistent pattern: `ComponentNamePage.tsx`, `ComponentNameForm.tsx`
- Directory names match component names

✅ **Function Naming (PASS):**
- camelCase used consistently
- Descriptive names: `handleImportRows`, `validateAmount`, `sanitizeDescription`
- Hook names follow `use*` convention

✅ **Constant Naming (PASS):**
- UPPER_SNAKE_CASE for constants: `DEV_MODE`, `MAX_AMOUNT`, `LIABILITY_TYPES`
- Consistent across stores and utilities

⚠️ **Directory Naming (MEDIUM):**
- Inconsistency: `common/` vs `Shared/` directories
- Both contain shared components
- Recommendation: Merge into single `shared/` (lowercase)

### 5.3 Error Handling

| Task | Files | Status |
| --- | --- | --- |
| Review try/catch blocks | All async functions | ✅ |
| Check error boundary usage | React error boundaries | ✅ |
| Verify user error messaging | Error display components | ✅ |
| Review error logging | All catch blocks | ⚠️ |

**5.3 Findings:**

✅ **Try/Catch Coverage (PASS):**
- 39 try/catch blocks across 17 files
- All async operations properly wrapped
- Consistent pattern: try action, catch log + user feedback

✅ **Error Boundary Usage (PASS):**
- `ErrorBoundary` component wraps each page in App.tsx
- Proper fallback UI with "Try Again" and "Reload Page" options
- Development mode shows error details
- componentDidCatch logs errors for debugging

✅ **User Error Messaging (PASS):**
- Error states displayed in UI (loading spinners, error messages)
- Forms show field-level validation errors
- Admin actions show success/failure toasts

⚠️ **Error Logging (MEDIUM):**
- `console.error` used throughout - fine for dev, consider structured logging for prod
- No error reporting service integration (Sentry, etc.)
- adminStore has 13 catch blocks - all log errors

### 5.4 Comments & Documentation

| Task | Files | Status |
| --- | --- | --- |
| Check for outdated comments | All files | ✅ |
| Verify JSDoc on public functions | Exported functions | ⚠️ |
| Review TODO/FIXME items | All files | ✅ |
| Check commented-out code | All files | ✅ |

**5.4 Findings:**

✅ **Comment Quality (PASS):**
- Comments explain "why" not "what"
- No outdated or misleading comments found
- Complex logic (finance.ts, ledger.ts) well-documented

⚠️ **JSDoc Coverage (MEDIUM):**
- 28 JSDoc comments for 113 exports = ~25% coverage
- Well-documented: xlsx.ts (9), csv.ts (4), sanitization.ts (6)
- Missing: Most store actions, selector functions

✅ **TODO/FIXME Items (PASS):**
- No TODO or FIXME comments found
- Codebase is clean of technical debt markers

✅ **Commented-Out Code (PASS):**
- No significant commented-out code blocks
- Comments are explanatory, not dead code

---

## 6. Performance Audit

### 6.1 React Performance

| Task | Files | Status |
| --- | --- | --- |
| Review useMemo/useCallback usage | All components | ✅ |
| Check for unnecessary re-renders | Complex components | ⚠️ |
| Verify list virtualization | Long lists | ❌ |
| Review component memoization | Heavy components | ❌ |

**6.1 Findings:**

✅ **useMemo/useCallback Usage (PASS):**
- 71 total usages across 12 files
- useMemo used for: filtered data, computed totals, date calculations
- useCallback used for: import handlers, form submissions
- Good coverage in complex components (ExpensePage, Dashboard, NetWorthPage)

⚠️ **Re-render Prevention (MEDIUM):**
- Dashboard.tsx uses `useShallow` for selective subscriptions - good pattern
- Other components directly destructure stores without selectors
- Pattern inconsistent: only 1 component uses useShallow, 12+ could benefit

❌ **List Virtualization (HIGH - Missing):**
- No virtualization library installed (react-window, react-virtual)
- ExpensePage renders all 500 expenses without windowing
- NetWorthPage renders all accounts without virtualization
- Impact: Performance degradation with large datasets

❌ **Component Memoization (HIGH - Missing):**
- No React.memo usage found in entire codebase
- Table row components re-render on any parent state change
- Heavy components not memoized: tables, charts, forms

### 6.2 State Management

| Task | Files | Status |
| --- | --- | --- |
| Check store selector granularity | Store consumers | ⚠️ |
| Review subscription patterns | useXxxStore calls | ⚠️ |
| Verify state normalization | Store structures | ✅ |

**6.2 Findings:**

⚠️ **Store Selector Granularity (MEDIUM):**
- Most components select entire store slices
- Example: `const { expenses, addExpense, deleteExpense } = useExpenseStore()`
- Better: Use individual selectors or useShallow for needed values only

⚠️ **Subscription Patterns (MEDIUM):**
- Only Dashboard.tsx uses `useShallow` pattern:
  ```typescript
  const { expenses } = useExpenseStore(useShallow((state) => ({ expenses: state.expenses })));
  ```
- Other 12+ components directly destructure - causes re-renders on any store change

✅ **State Normalization (PASS):**
- Arrays used for expenses, incomes, accounts (appropriate for size)
- No deeply nested state structures
- Clean separation between stores

### 6.3 Network & Data

| Task | Files | Status |
| --- | --- | --- |
| Review API call frequency | API consumers | ✅ |
| Check for N+1 query patterns | Data fetching | ✅ |
| Verify data caching strategy | Store persist config | ✅ |
| Review exchange rate fetching | Currency store | ✅ |

**6.3 Findings:**

✅ **API Call Frequency (PASS):**
- Local-first architecture - minimal API calls
- Supabase calls only for auth and admin features
- No unnecessary refetching patterns

✅ **N+1 Query Patterns (PASS):**
- Batch operations used where applicable
- No loops calling individual API endpoints
- Admin user fetch gets all users in single call

✅ **Data Caching Strategy (PASS):**
- All stores use localStorage persistence
- Exchange rates cached with 5-minute TTL
- No redundant data fetching

✅ **Exchange Rate Fetching (PASS):**
- 5-minute cache prevents excessive API calls
- Fallback rates provided if API fails
- Rate refresh only when cache expires

### 6.4 Bundle & Load Time

| Task | Files | Status |
| --- | --- | --- |
| Check code splitting | Route-level splitting | ❌ |
| Review lazy loading | Heavy components | ❌ |
| Verify asset optimization | Images and icons | ⚠️ |

**6.4 Findings:**

❌ **Code Splitting (HIGH - Missing):**
- No React.lazy() or dynamic imports found
- All pages loaded upfront in single bundle
- Admin panel loaded even for regular users
- Recommendation: Lazy-load Admin, ChartOfAccounts, NetWorthHistory

❌ **Lazy Loading (HIGH - Missing):**
- xlsx library (~500KB) imported synchronously in xlsx.ts
- All icons imported upfront from lucide-react
- No dynamic imports for heavy components
- Recommendation: Dynamic import xlsx when import modal opens

⚠️ **Asset Optimization (MEDIUM):**
- Only 1 asset: react.svg (4KB)
- lucide-react icons tree-shakeable but many imports per file
- Vite config has basic vendor chunk splitting only:
  ```javascript
  manualChunks: { vendor: ['react', 'react-dom'] }
  ```
- Recommendation: Add chunks for xlsx, supabase, lucide

---

## 7. Testing Coverage Audit

### 7.1 Unit Tests

| Task | Files | Status |
| --- | --- | --- |
| Review existing test coverage | `src/tests/*.test.ts` | ⚠️ |
| Identify untested utilities | `src/utils/*.ts` | ❌ |
| Check store test coverage | `src/stores/*.ts` | ❌ |
| Verify service test coverage | `server/services/*.ts` | ⚠️ |

**7.1 Findings:**

⚠️ **Existing Test Coverage (MEDIUM - 49 tests pass):**

| Location | Test Files | Tests | Coverage |
| --- | --- | --- | --- |
| `src/tests/` | 9 files | 34 tests | Selectors, components |
| `server/__tests__/` | 3 files | 56 tests | Services, routes |
| **Total** | 12 files | 90 tests | Partial |

Frontend test files:
- `networth.test.ts` - 6 tests (selector logic)
- `cashflow.test.ts` - 4 tests
- `currency-visibility.test.ts` - 4 tests
- `funding-mapping.test.ts` - 5 tests
- `settings-modal.test.tsx` - 7 tests (component)
- `amount-currency-input.test.tsx` - 2 tests
- `month-end.test.ts`, `pl.test.ts`, `transactions-filter.test.ts` - misc

❌ **Untested Utilities (HIGH - 0% coverage):**

| Utility | Lines | Tests | Critical Functions |
| --- | --- | --- | --- |
| `sanitization.ts` | 180+ | ❌ None | `sanitizeText`, `validateAmount`, `validateDate` |
| `xlsx.ts` | 550+ | ❌ None | `parseXlsx`, `exportToXlsx` |
| `csv.ts` | 585+ | ❌ None | `parseCsv`, `exportToCsv` |
| `dateFormat.ts` | 50+ | ❌ None | `formatDate`, `getTodayLocalString` |
| `recurringUtils.ts` | 100+ | ❌ None | Recurring logic |
| `resetData.ts` | 310+ | ❌ None | Data seeding |
| `currency.ts` | 20+ | ❌ None | Currency formatting |

❌ **Untested Stores (HIGH - 0% coverage):**

| Store | Actions | Tests |
| --- | --- | --- |
| `expenseStore` | add, delete, getMonthlyTotal | ❌ None |
| `incomeStore` | add, delete | ❌ None |
| `accountStore` | add, update, delete, toggle | ❌ None |
| `currencyStore` | setBase, fetchRates, convert | ❌ None |
| `authStore` | signIn, signUp, signOut | ❌ None |
| `adminStore` | CRUD users, config | ❌ None |
| `snapshotStore` | create, get, history | ❌ None |
| `ledgerStore` | transactions, accounts | ❌ None |
| `ledgerAccountStore` | CRUD accounts | ❌ None |
| `themeStore` | toggle theme | ❌ None |

⚠️ **Service Test Coverage (MEDIUM - 2/5 tested):**

| Service | Tests | Status |
| --- | --- | --- |
| `AccountService` | 24 tests | ✅ Tested |
| `ReportService` | 15 tests | ✅ Tested |
| `TransactionService` | 0 tests | ❌ None |
| `RatesService` | 0 tests | ❌ None |
| `index.ts` (exports) | N/A | N/A |

### 7.2 Integration Tests

| Task | Files | Status |
| --- | --- | --- |
| Review API endpoint tests | `server/__tests__/*.test.ts` | ⚠️ |
| Check component integration tests | Component tests | ❌ |
| Verify store integration tests | Store + component tests | ⚠️ |

**7.2 Findings:**

⚠️ **API Endpoint Tests (MEDIUM - 1/7 routes tested):**

| Route | Endpoints | Tests |
| --- | --- | --- |
| `/api/accounts` | CRUD | ✅ 17 tests |
| `/api/expenses` | CRUD | ❌ None |
| `/api/income` | CRUD | ❌ None |
| `/api/transactions` | CRUD | ❌ None |
| `/api/rates` | GET | ❌ None |
| `/api/reports` | GET | ❌ None |
| `/api/admin` | CRUD | ❌ None |

❌ **Component Integration Tests (HIGH - Missing):**
- No component render tests with user interactions
- Only 2 component test files exist (settings-modal, amount-currency-input)
- No tests for: ExpensePage, IncomePage, NetWorthPage, Dashboard

⚠️ **Store Integration (MEDIUM - Partial):**
- Some tests use stores directly (networth.test.ts)
- Tests verify selector behavior with store data
- Missing: store action → UI update verification

### 7.3 Test Quality

| Task | Files | Status |
| --- | --- | --- |
| Check test isolation | All test files | ✅ |
| Review mock quality | Test mocks | ✅ |
| Verify assertion completeness | Test assertions | ✅ |
| Check for flaky tests | CI/CD history | ✅ |

**7.3 Findings:**

✅ **Test Isolation (PASS):**
- `beforeEach` with state reset in selector tests
- `vi.clearAllMocks()` in service tests
- localStorage cleared between tests
- No shared mutable state

✅ **Mock Quality (PASS):**
- Supabase client properly mocked
- Mocks return typed responses
- Both success and error cases covered

✅ **Assertion Completeness (PASS):**
- Tests verify specific values (not just truthy)
- Edge cases tested (multi-currency, negative balances)
- Error handling assertions present

✅ **No Flaky Tests (PASS):**
- All 49 tests pass consistently
- No timing-dependent tests
- No network-dependent tests (all mocked)

---

## 8. Accessibility Audit

### 8.1 Semantic HTML

| Task | Files | Status |
| --- | --- | --- |
| Check heading hierarchy | All pages | ⚠️ |
| Verify form labels | All forms | ❌ |
| Review button vs link usage | Interactive elements | ✅ |
| Check landmark regions | Layout components | ✅ |

**8.1 Findings:**

✅ **Landmark Regions (PASS):**
- `<main>` used in App.tsx for main content area
- `<nav>` used in Navigation.tsx (sidebar and mobile navigation)
- `<header>` used in Modal.tsx and Navigation.tsx
- `<aside>` used for sidebar navigation
- `<section>` used in SettingsModal for grouping

⚠️ **Heading Hierarchy (MEDIUM - Inconsistencies):**

| Level | Count | Usage |
| --- | --- | --- |
| h1 | 4 | AuthForm, Navigation, ChartOfAccountsPage, AdminPage |
| h2 | 14 | Page sections, Modals, Tables |
| h3 | 18 | Subsections, Cards, History |
| h4 | 4 | Dashboard sections, Config |

Issues:
- Some pages skip from h1 to h3 (missing h2)
- Dashboard uses h4 for "Expense Breakdown" without parent h3
- NetWorthPage has multiple h3 without parent h2

❌ **Form Labels (HIGH - Missing):**
- Only 1 `htmlFor` attribute found in entire codebase
- Location: `SettingsModal.tsx:158` (base-currency-select)
- Most form inputs rely on placeholder text only
- Missing explicit label associations for:
  - ExpenseForm fields
  - IncomeForm fields
  - Account forms
  - Filter inputs

✅ **Button vs Link Usage (PASS):**
- Buttons used for actions (submit, delete, toggle)
- Links used for navigation (pages)
- No semantic misuse found

### 8.2 Keyboard Navigation

| Task | Files | Status |
| --- | --- | --- |
| Verify focus management | Modal and dialog components | ✅ |
| Check tab order | All pages | ✅ |
| Review keyboard shortcuts | Navigation and actions | ⚠️ |
| Test skip links | Navigation | ❌ |

**8.2 Findings:**

✅ **Focus Management (PASS):**
- Modal.tsx traps focus with Escape key handling
- Modal closes on overlay click or Escape key
- Dialog has proper `role="dialog"` and `aria-modal="true"`

✅ **Tab Order (PASS):**
- No `tabIndex` manipulation found (natural DOM order)
- Interactive elements are naturally focusable
- Logical tab flow through forms

⚠️ **Keyboard Shortcuts (MEDIUM - Limited):**
- `onKeyDown` handlers found in 6 components:
  - NetWorthPage (3 inputs) - Enter key handling
  - ChartOfAccountsPage (4 inputs) - Enter key handling
  - ExpensePage (1 input)
  - IncomePage (1 input)
  - SystemConfigSection (1 input)
- Missing: Global keyboard shortcuts for navigation
- Missing: Escape key to close dropdowns

❌ **Skip Links (HIGH - Missing):**
- No skip-to-content links found
- Keyboard users must tab through entire navigation
- Recommendation: Add "Skip to main content" link at top

### 8.3 ARIA & Screen Readers

| Task | Files | Status |
| --- | --- | --- |
| Check ARIA labels | Interactive elements | ⚠️ |
| Verify live regions | Dynamic content | ❌ |
| Review icon accessibility | Icon-only buttons | ❌ |
| Check error announcements | Form validation | ❌ |

**8.3 Findings:**

⚠️ **ARIA Labels (MEDIUM - Insufficient):**

| Usage | Count | Location |
| --- | --- | --- |
| `aria-label` | 6 | App, Modal, Settings, ToggleSwitch, Navigation |
| `aria-labelledby` | 1 | Modal.tsx (modal-title) |
| `aria-modal` | 1 | Modal.tsx |
| `role="dialog"` | 1 | Modal.tsx |

Good examples:
- Modal: `aria-label="Close modal"`, `aria-labelledby="modal-title"`
- ToggleSwitch: Dynamic `aria-label` for each toggle
- Settings: `aria-label="Open settings"`

Missing:
- Table column headers lack `scope` attribute
- Sortable columns lack `aria-sort`
- Many interactive elements lack labels

❌ **Live Regions (HIGH - Missing):**
- **0** `aria-live` regions in entire codebase
- Dynamic content changes not announced:
  - Form submission success/failure
  - Data loading states
  - Filter results count
  - Toast notifications

❌ **Icon Accessibility (HIGH - title vs aria-label):**
- **30+** icon-only buttons use `title` instead of `aria-label`
- `title` is NOT announced by most screen readers
- Examples of problematic patterns:

| File | Line | Element | Issue |
| --- | --- | --- | --- |
| CurrencySelector.tsx | 81 | Refresh button | Uses `title` |
| FinancialDataSection.tsx | 147 | Refresh button | Uses `title` |
| UsersSection.tsx | 162 | Edit user button | Uses `title` |
| IncomePage.tsx | 604 | Delete button | Uses `title` |
| ExpensePage.tsx | 632 | Delete button | Uses `title` |
| NetWorthPage.tsx | 730 | Delete button | Uses `title` |
| ...and 25+ more | - | Various | Uses `title` |

❌ **Error Announcements (HIGH - Missing):**
- Form validation errors not announced to screen readers
- No `aria-invalid` on invalid inputs
- No `aria-describedby` linking errors to inputs
- No `role="alert"` for error messages

### 8.4 Visual Accessibility

| Task | Files | Status |
| --- | --- | --- |
| Check color contrast | All themes | ⚠️ |
| Verify focus indicators | Interactive elements | ✅ |
| Review text sizing | Responsive text | ✅ |
| Check motion preferences | Animations | ❌ |

**8.4 Findings:**

⚠️ **Color Contrast (NEEDS MANUAL TESTING):**
- Uses CSS custom properties for theming
- Both light and dark themes defined
- Muted text colors may have low contrast:
  - `text-gray-500` on white background
  - `text-gray-400` in dark mode
- Recommendation: Run automated contrast checker (Lighthouse, axe)

✅ **Focus Indicators (PASS):**
- `focus-visible` styles defined in index.css:100
- Uses CSS custom property: `--color-focus-ring`
- Visible focus ring on interactive elements

✅ **Text Sizing (PASS):**
- Uses TailwindCSS relative units
- Text scales with user preferences
- No fixed pixel sizes for body text

❌ **Motion Preferences (HIGH - Missing):**
- **0** `prefers-reduced-motion` media queries
- Animations run regardless of user preference
- Transitions/animations found:
  - Navigation transitions
  - Modal open/close
  - Loading spinners
  - Chart animations

**Screen Reader Support Summary:**

| Feature | Support | Priority |
| --- | --- | --- |
| Landmarks | ✅ Good | - |
| Headings | ⚠️ Partial | Low |
| Form labels | ❌ Missing | High |
| Skip links | ❌ Missing | High |
| ARIA labels | ⚠️ Partial | Medium |
| Live regions | ❌ Missing | High |
| Icon buttons | ❌ Poor | High |
| Error announcements | ❌ Missing | High |
| Motion preferences | ❌ Missing | Medium |

---

## 9. Documentation Audit

### 9.1 Code Documentation

| Task | Files | Status |
| --- | --- | --- |
| Review README.md accuracy | `README.md` | ⚠️ |
| Check ROADMAP.md updates | `ROADMAP.md` | ✅ |
| Verify API documentation | `server/docs/openapi.yaml` | ⚠️ |
| Review inline documentation | Complex functions | ⚠️ |

**9.1 Findings:**

⚠️ **README.md Accuracy (MEDIUM - Minor Issues):**

| Section | Status | Notes |
| --- | --- | --- |
| Project description | ✅ | Accurate |
| Architecture diagram | ✅ | Well-designed ASCII diagram |
| Features list | ✅ | Comprehensive, up-to-date |
| Quick Start | ✅ | Clear installation steps |
| Environment variables | ⚠️ | Incomplete variable list |
| Project structure | ✅ | Accurate directory layout |
| Data types | ✅ | TypeScript interfaces documented |
| Development phases | ✅ | All 22 phases listed |
| Documentation links | ✅ | Links to ROADMAP, NEWFEATURES, etc. |

Issues found:
- **Version mismatch**: README shows "2.3.0", package.json shows "0.0.0"
- Missing production deployment instructions
- Missing contributing guidelines
- Missing license file (only "MIT" mention in README)
- Server-side environment variables not documented

✅ **ROADMAP.md Updates (PASS):**
- 48KB comprehensive roadmap
- All 22 phases documented with task checklists
- Status indicators (✅, ☐) consistently used
- Historical record of completed work

⚠️ **API Documentation (MEDIUM - Partial):**

| Aspect | Status | Notes |
| --- | --- | --- |
| OpenAPI version | ✅ | 3.1.0 |
| Endpoints documented | ✅ | /accounts, /transactions, /income, /expenses, /reports, /rates |
| Request schemas | ✅ | All CRUD operations defined |
| Response schemas | ✅ | Success and error responses |
| Authentication | ✅ | BearerAuth scheme documented |
| Pagination | ✅ | Standard pagination schema |

Issues found:
- **Admin routes not documented** (/api/admin/*)
- Schema mismatch: `ExpenseRating` uses `non_essential` but frontend uses `discretionary`
- Server URL uses port 3000, actual server runs on 3001

⚠️ **Inline Documentation (MEDIUM - Partial):**
- ~25% JSDoc coverage (see Category 5)
- Well-documented: xlsx.ts, csv.ts, sanitization.ts
- Missing: Store actions, selector functions

### 9.2 User Documentation

| Task | Files | Status |
| --- | --- | --- |
| Check feature documentation | README features section | ✅ |
| Verify setup instructions | README quick start | ✅ |
| Review environment variables | `.env.example` | ❌ |

**9.2 Findings:**

✅ **Feature Documentation (PASS):**
- All major features documented in README
- Organized by category (Dashboard, Income/Expense, Net Worth, etc.)
- Each feature has sub-bullet details

✅ **Setup Instructions (PASS):**
- Prerequisites listed (Node.js 18+)
- Installation commands provided
- Development commands documented
- Both local and server modes explained

❌ **Environment Variables (HIGH - Incomplete):**

**.env.example contents (only 3 variables):**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

**Missing environment variables used in code:**

| Variable | Used In | Purpose |
| --- | --- | --- |
| `VITE_USE_API` | README mentions | Toggle API/local mode |
| `VITE_DEV_MODE` | authStore.ts | Enable dev authentication |
| `VITE_DEV_TOKEN` | README mentions | Dev JWT token |
| `PORT` | server/index.ts | Server port (default 3001) |
| `SUPABASE_URL` | server/lib | Server-side Supabase URL |
| `SUPABASE_SERVICE_KEY` | server/lib | Server-side service key |

**Additional Documentation Files:**

| File | Size | Status | Notes |
| --- | --- | --- | --- |
| ROADMAP.md | 48KB | ✅ Good | Comprehensive phase documentation |
| NEWFEATURES.md | 1KB | ❌ Empty | Template file, no actual features |
| STYLEROADMAP.md | 3.5KB | ✅ Good | Future UI/UX improvements planned |
| AUDIT.md | 83KB | ✅ Active | This audit document |

**Missing Documentation:**

| Document | Priority | Purpose |
| --- | --- | --- |
| LICENSE | High | Legal requirements |
| CONTRIBUTING.md | Medium | Contribution guidelines |
| CHANGELOG.md | Medium | Version history |
| DEPLOYMENT.md | Medium | Production deployment guide |
| Server README | Low | Backend-specific documentation |

---

## Audit Execution Log

Track audit progress here:

| Date | Category | Section | Findings | Actions |
| --- | --- | --- | --- | --- |
| 2025-12-17 | Security | 1.1 Auth & Authorization | 4 PASS, 1 MEDIUM issue (dev mode security) | Ensure DEV_MODE=false in production |
| 2025-12-17 | Security | 1.2 Input Validation | 4 PASS, 1 MEDIUM issue (file upload limits) | Add file size/type validation |
| 2025-12-17 | Security | 1.3 Data Exposure | 2 PASS, 2 MEDIUM, 1 HIGH issue (password logging) | Remove console.log in AuthForm.tsx:33 |
| 2025-12-17 | Security | 1.4 CORS & Headers | 0 PASS, 1 MEDIUM, 2 HIGH issues | Add helmet, configure CORS, add CSP |
| 2025-12-17 | Type Safety | 2.1 TS Strictness | 3 PASS, 2 MEDIUM (any usage) | Reduce `any` usage, add proper types |
| 2025-12-17 | Type Safety | 2.2 API Types | 1 PASS, 2 MEDIUM | Use Database types, fix middleware types |
| 2025-12-17 | Type Safety | 2.3 Component Props | 3 PASS | All components properly typed |
| 2025-12-17 | Data Integrity | 3.1 Store Consistency | 1 PASS, 3 MEDIUM | Standardize persist configs, add versions |
| 2025-12-17 | Data Integrity | 3.2 Data Validation | 3 PASS, 1 MEDIUM, 1 HIGH | Add validation to accountStore |
| 2025-12-17 | Data Integrity | 3.3 Import/Export | 3 PASS, 1 MEDIUM | Test round-trip for edge cases |
| 2025-12-17 | Dependency | 4.1 Package Security | 2 HIGH (xlsx), 3 Moderate (vite) | Consider xlsx alternatives, run npm audit fix |
| 2025-12-17 | Dependency | 4.2 License Compliance | 2 PASS | No GPL contamination |
| 2025-12-17 | Dependency | 4.3 Bundle Size | 1 PASS, 2 MEDIUM | Lazy-load xlsx, code-split admin |
| 2025-12-17 | Code Quality | 5.1 Code Organization | 2 PASS, 2 MEDIUM | Split large page components |
| 2025-12-17 | Code Quality | 5.2 Naming Conventions | 3 PASS, 1 MEDIUM | Merge common/ and Shared/ |
| 2025-12-17 | Code Quality | 5.3 Error Handling | 3 PASS, 1 MEDIUM | Consider structured logging |
| 2025-12-17 | Code Quality | 5.4 Comments & Docs | 3 PASS, 1 MEDIUM | Increase JSDoc coverage |
| 2025-12-17 | Performance | 6.1 React Performance | 1 PASS, 1 MEDIUM, 2 HIGH | Add virtualization, React.memo |
| 2025-12-17 | Performance | 6.2 State Management | 1 PASS, 2 MEDIUM | Use useShallow consistently |
| 2025-12-17 | Performance | 6.3 Network & Data | 4 PASS | Good caching strategy |
| 2025-12-17 | Performance | 6.4 Bundle & Load Time | 0 PASS, 1 MEDIUM, 2 HIGH | Add code splitting, lazy loading |
| 2025-12-17 | Testing | 7.1 Unit Tests | 0 PASS, 2 MEDIUM, 2 HIGH | Add utility and store tests |
| 2025-12-17 | Testing | 7.2 Integration Tests | 0 PASS, 2 MEDIUM, 1 HIGH | Add component and route tests |
| 2025-12-17 | Testing | 7.3 Test Quality | 4 PASS | Good isolation, mocks, assertions |
| 2025-12-17 | Accessibility | 8.1 Semantic HTML | 2 PASS, 1 MEDIUM, 1 HIGH | Add form labels, fix heading hierarchy |
| 2025-12-17 | Accessibility | 8.2 Keyboard Navigation | 2 PASS, 1 MEDIUM, 1 HIGH | Add skip links |
| 2025-12-17 | Accessibility | 8.3 ARIA & Screen Readers | 0 PASS, 1 MEDIUM, 3 HIGH | Add aria-labels, live regions, error announcements |
| 2025-12-17 | Accessibility | 8.4 Visual Accessibility | 2 PASS, 1 MEDIUM, 1 HIGH | Add prefers-reduced-motion |
| 2025-12-17 | Documentation | 9.1 Code Documentation | 1 PASS, 3 MEDIUM | Fix version mismatch, add admin API docs |
| 2025-12-17 | Documentation | 9.2 User Documentation | 2 PASS, 1 HIGH | Complete .env.example |

---

## Critical Issues Found

Track critical issues requiring immediate attention:

| ID | Category | Description | Severity | Status |
| --- | --- | --- | --- | --- |
| SEC-003 | Security | AuthForm.tsx:33 logs email and password to console | **High** | Open |
| SEC-005 | Security | CORS allows all origins - no origin restriction configured | **High** | Open |
| SEC-006 | Security | No security headers (helmet not installed) - clickjacking/MIME sniffing risk | **High** | Open |
| DEP-001 | Dependency | xlsx package has Prototype Pollution vulnerability (no fix available) | **High** | Open |
| DEP-002 | Dependency | xlsx package has ReDoS vulnerability (no fix available) | **High** | Open |
| SEC-001 | Security | Dev mode accepts weak credentials (any email + 1-char password) | Medium | Open |
| SEC-002 | Security | File uploads lack explicit size limit and MIME type validation | Medium | Open |
| SEC-004 | Security | Financial data in localStorage is not encrypted | Medium | Open |
| SEC-007 | Security | No Content-Security-Policy configured | Medium | Open |
| TYPE-001 | Type Safety | 80+ uses of `any` type - reduces type safety benefits | Medium | Partial |
| TYPE-002 | Type Safety | `authMiddleware as any` cast in all server routes | Medium | ✅ Fixed |
| DATA-001 | Data Integrity | Store persist configs inconsistent (naming, versions, migrations) | Medium | Open |
| DATA-002 | Data Integrity | accountStore has NO input validation - accepts any data | **High** | ✅ Fixed |
| DATA-003 | Data Integrity | validateCurrency() missing BTC, ETH from whitelist | Medium | ✅ Fixed |
| DEP-003 | Dependency | 3 moderate vulnerabilities in vite (fix available via npm audit fix) | Medium | Open |
| DEP-004 | Dependency | 29 outdated packages (react, typescript, eslint, etc.) | Medium | Open |
| DEP-005 | Dependency | xlsx is ~500KB - should be lazy-loaded for bundle optimization | Medium | Open |
| CODE-001 | Code Quality | NetWorthPage.tsx is 1,992 lines - needs component extraction | Medium | Open |
| CODE-002 | Code Quality | ExpensePage.tsx is 1,555 lines - needs component extraction | Medium | Open |
| CODE-003 | Code Quality | Duplicate table/filter logic across page components | Medium | Open |
| CODE-004 | Code Quality | Directory naming inconsistency (common/ vs Shared/) | Low | Open |
| CODE-005 | Code Quality | JSDoc coverage is only ~25% of exports | Low | Open |
| PERF-001 | Performance | No list virtualization - renders all 500 items | **High** | Open |
| PERF-002 | Performance | No React.memo - table rows re-render on any change | **High** | Open |
| PERF-003 | Performance | No code splitting - all pages in single bundle | **High** | Open |
| PERF-004 | Performance | No lazy loading - xlsx (~500KB) loaded synchronously | **High** | Open |
| PERF-005 | Performance | Only 1/13 components uses useShallow for selectors | Medium | Open |
| PERF-006 | Performance | Basic Vite chunk config - missing xlsx, supabase chunks | Medium | Open |
| TEST-001 | Testing | All 7 utility files have 0% test coverage | **High** | Partial |
| TEST-002 | Testing | All 10 stores have 0% test coverage | **High** | Partial |
| TEST-003 | Testing | No component integration tests for main pages | **High** | Open |
| TEST-004 | Testing | Only 1/7 API routes has tests | Medium | Open |
| TEST-005 | Testing | 3/5 server services have no tests | Medium | Open |
| A11Y-001 | Accessibility | No skip links - keyboard users must tab through entire navigation | **High** | Open |
| A11Y-002 | Accessibility | 30+ icon-only buttons use title= instead of aria-label= (not screen reader accessible) | **High** | Open |
| A11Y-003 | Accessibility | No aria-live regions - dynamic content changes not announced | **High** | Open |
| A11Y-004 | Accessibility | Form validation errors not announced - missing aria-invalid, role="alert" | **High** | Open |
| A11Y-005 | Accessibility | Only 1 form label with htmlFor - most inputs lack explicit labels | **High** | Open |
| A11Y-006 | Accessibility | No prefers-reduced-motion support - animations run regardless | **High** | Open |
| A11Y-007 | Accessibility | Heading hierarchy inconsistencies - skips levels in some pages | Medium | Open |
| A11Y-008 | Accessibility | Limited ARIA support - only 6 aria-labels in entire codebase | Medium | Open |
| A11Y-009 | Accessibility | Color contrast needs manual testing with Lighthouse/axe | Low | Open |
| DOC-001 | Documentation | .env.example missing 6+ environment variables used in code | **High** | Open |
| DOC-002 | Documentation | Missing LICENSE file (only MIT mentioned in README) | Medium | Open |
| DOC-003 | Documentation | Admin API routes not documented in OpenAPI spec | Medium | Open |
| DOC-004 | Documentation | Version mismatch: README shows 2.3.0, package.json shows 0.0.0 | Medium | Open |
| DOC-005 | Documentation | OpenAPI ExpenseRating schema uses 'non_essential', frontend uses 'discretionary' | Medium | Open |
| DOC-006 | Documentation | NEWFEATURES.md is empty template with no actual features | Low | Open |

**Severity Levels:**
- **Critical**: Security vulnerability or data loss risk
- **High**: Significant bug or performance issue
- **Medium**: Code quality or maintainability issue
- **Low**: Minor improvement or nice-to-have

---

## Audit Summary

**Total Items:** 112
**Completed:** 112 (All 9 Categories) - **AUDIT COMPLETE**
**Critical Issues:** 0
**High Priority Issues:** 17 open, 2 partial (TEST-001, TEST-002) - 1 fixed (DATA-002)
**Medium Priority Issues:** 22 open, 3 fixed (TYPE-002 ✅, DATA-003 ✅, TYPE-001 partial)

### Testing Progress
- **Before**: 49 tests
- **After**: 179 tests (+130 new tests)
- **Coverage added**: sanitization.ts, accountStore, expenseStore, incomeStore
**Low Priority Issues:** 4 (CODE-004, CODE-005, A11Y-009, DOC-006)

### Fix Log

| Date | Issue | Fix Description |
| --- | --- | --- |
| 2025-12-18 | DATA-002 | Added `validateAccountData()` to accountStore with full input validation |
| 2025-12-18 | DATA-003 | Added BTC, ETH to `VALID_CURRENCIES` in sanitization.ts |
| 2025-12-18 | TYPE-002 | Created Express type augmentation, removed 32 `authMiddleware as any` casts |
| 2025-12-18 | TYPE-001 | Partial - reduced `any` usage in auth middleware and types |
| 2025-12-18 | TEST-001 | Added 59 tests for sanitization.ts (sanitizeText, validateAmount, validateCurrency, etc.) |
| 2025-12-18 | TEST-002 | Added 26 tests for accountStore (addAccount, updateAccount, deleteAccount, validation) |
| 2025-12-18 | TEST-002 | Added 23 tests for expenseStore (addExpense, deleteExpense, getMonthlyTotal, validation) |
| 2025-12-18 | TEST-002 | Added 22 tests for incomeStore (addIncome, deleteIncome, getMonthlyTotal, validation) |
| 2025-12-18 | FEATURE | Added currency selector to quick add forms in ExpensePage and IncomePage |
| 2025-12-18 | CODE-001 | Moved Modal.tsx from common/ to Shared/, removed common/ directory |
| 2025-12-18 | CODE-002 | Created useMonthNavigation hook to eliminate duplicated month navigation logic |
| 2025-12-18 | CODE-002 | Refactored Dashboard, ExpensePage, IncomePage, NetWorthPage to use useMonthNavigation |
| 2025-12-18 | PERF-001 | Added useShallow to store subscriptions in Dashboard, ExpensePage, IncomePage, NetWorthPage |
| 2025-12-18 | PERF-002 | Configured Vite manual chunks: xlsx (425KB), supabase (189KB), forms (66KB), zustand (0.6KB) |

---

## Next Steps

**Audit Complete!** All 9 categories have been audited. Recommended fix priority:

### Immediate (Security - HIGH)
1. **SEC-003**: Remove `console.log` in AuthForm.tsx:33 that logs passwords
2. **SEC-005**: Configure CORS to restrict allowed origins
3. **SEC-006**: Install and configure `helmet` middleware

### Short-term (Performance & Testing - HIGH)
4. **PERF-001/002**: Add list virtualization (react-window) and React.memo
5. **PERF-003/004**: Add code splitting with React.lazy for pages
6. **TEST-001/002**: Add tests for utilities and stores

### Medium-term (Accessibility - HIGH)
7. **A11Y-001**: Add skip-to-content link
8. **A11Y-002**: Replace `title=` with `aria-label=` on icon buttons
9. **A11Y-003/004**: Add aria-live regions and form error announcements
10. **A11Y-005**: Add form labels with htmlFor

### Documentation Quick Wins
11. **DOC-001**: Complete .env.example with all variables
12. **DOC-002**: Add LICENSE file
13. **DOC-004**: Sync version in package.json with README

---

## Detailed Audit Notes

### Section 1.1 - Authentication & Authorization (2025-12-17)

**Files Reviewed:**
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_phase1_schema.sql`
- `supabase/migrations/003_admin_schema.sql`
- `src/stores/authStore.ts`
- `server/middleware/adminAuth.ts`
- `server/routes/admin.ts`
- `server/routes/expenses.ts`

**RLS Policy Analysis:**

| Table | Policy | Evaluation |
| --- | --- | --- |
| expenses | `user_id = auth.uid()` | ✅ Secure |
| accounts | `user_id = auth.uid()` | ✅ Secure |
| transactions | `user_id = auth.uid()` | ✅ Secure |
| income | `user_id = auth.uid()` | ✅ Secure |
| postings | EXISTS subquery on transaction.user_id | ✅ Secure |
| user_profiles | Own profile only + admin read | ✅ Secure |
| system_config | Auth read, admin write | ✅ Secure |
| admin_audit_log | Admin read only | ✅ Secure |

**Auth Flow Analysis:**
1. User signs in via Supabase Auth
2. authStore receives session and sets user/session state
3. fetchUserProfile() retrieves role from user_profiles table
4. Role helpers (isAdmin, isSuperAdmin, canAccessAdmin) check userProfile.role
5. Server middleware validates JWT and checks role in database

**Dev Mode Concerns:**
- Location: `src/stores/authStore.ts:70-86`
- DEV_MODE enabled when: `!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true'`
- Accepts credentials: `(email === 'admin' && password === 'admin') || (email.includes('@') && password.length >= 1)`
- Mitigation: Ensure production builds have VITE_SUPABASE_URL set and VITE_DEV_MODE !== 'true'

---

### Section 1.2 - Input Validation & Sanitization (2025-12-17)

**Files Reviewed:**
- `src/utils/sanitization.ts`
- `server/middleware/validation.ts`
- `src/utils/xlsx.ts`
- `src/utils/csv.ts`
- `src/stores/expenseStore.ts`
- `src/components/ExpenseForm/ExpenseForm.tsx`
- `server/services/AccountService.ts`

**Sanitization Functions Analysis:**

| Function | Purpose | Protection |
| --- | --- | --- |
| `sanitizeText()` | General text sanitization | Removes XSS vectors, 1000 char limit |
| `sanitizeDescription()` | Description fields | Same as sanitizeText, 30 char limit |
| `validateAmount()` | Numeric validation | Range: $0.01 - $1B, 2 decimal places |
| `validateDate()` | Date validation | Format: YYYY-MM-DD, -100 to +10 years |
| `validateCurrency()` | Currency codes | Whitelist: USD, MXN, EUR |

**API Validation Middleware:**

| Middleware | Schema Type | Usage |
| --- | --- | --- |
| `validate()` | Request body | POST/PUT endpoints |
| `validateQuery()` | Query parameters | GET with filters |
| `validateParams()` | URL parameters | All :id routes |

**Zod Schemas Used:**
- `createExpenseSchema`: what (1-255), amount (positive), rating (enum), date (ISO)
- `updateExpenseSchema`: Same fields, all optional
- `paginationSchema`: page (int, min 1), limit (int, 1-100)
- `idParamSchema`: UUID format validation

**File Upload Analysis:**
- XLSX: Uses SheetJS library for parsing
- CSV: Custom parser with proper quote handling
- Both validate required headers before processing
- Data is type-converted, not executed
- Gap: No explicit file size limit in application code
- Gap: Only file extension check (.xlsx, .xls), no MIME verification

**XSS Prevention:**
- Search for `dangerouslySetInnerHTML`: 0 results
- User input rendered via React JSX (auto-escaped)
- Sanitization applied at storage time in Zustand stores

**SQL Injection Prevention:**
- Supabase client uses parameterized queries internally
- All queries use method chaining: `.eq()`, `.in()`, `.gte()`, `.lte()`
- No string concatenation for query building
- Example safe pattern: `query.eq('user_id', req.userId)`

---

### Section 1.3 - Data Exposure (2025-12-17)

**Files Reviewed:**
- `src/components/Auth/AuthForm.tsx`
- `src/stores/expenseStore.ts`
- `src/stores/accountStore.ts`
- `src/stores/incomeStore.ts`
- `src/stores/snapshotStore.ts`
- `server/middleware/errorHandler.ts`

**Console Log Analysis:**

| File | Line | Content | Risk |
| --- | --- | --- | --- |
| `AuthForm.tsx` | 33 | `console.log('Form submitted with:', data)` | **HIGH - logs password** |
| `AuthForm.tsx` | 37-43 | Dev flow logs (signup, signin, success) | Low - no sensitive data |
| `currencyStore.ts` | 131-164 | API URL and rate logs | Low - public data |
| `ledgerStore.ts` | 303-314 | Clear data confirmation | Low |
| Various stores | Error handlers | Error logging | Low - expected |

**localStorage Persistence Analysis:**

| Store | Key | Data Stored | Encryption |
| --- | --- | --- | --- |
| `expenseStore` | `expense-store` | Expense records | None |
| `accountStore` | `account-store` | Account balances | None |
| `incomeStore` | `income-store` | Income records | None |
| `snapshotStore` | `snapshot-store` | Net worth history | None |
| `currencyStore` | `currency-store` | Exchange rates | None |
| `ledgerStore` | `ledger-store` | Transactions | None |
| `ledgerAccountStore` | `ledger-account-store` | Ledger accounts | None |

**Error Handler Review:**
- Location: `server/middleware/errorHandler.ts`
- Proper error class hierarchy (AppError, NotFoundError, etc.)
- Generic 500 response for unexpected errors
- Supabase error codes mapped to safe messages
- No stack traces in client responses

**Hardcoded Credentials Found:**
```
server/middleware/auth.ts:17  - DEV_TOKEN = 'dev-token-fintonico'
src/stores/authStore.ts:8     - DEV_TOKEN = 'dev-token-fintonico'
src/stores/authStore.ts:22    - refresh_token: 'dev-refresh-token'
```
Note: These are only active when DEV_MODE=true

---

### Section 1.4 - CORS & Headers (2025-12-17)

**Files Reviewed:**
- `server/index.ts`
- `server/package.json`
- `index.html`
- `vite.config.ts`

**CORS Configuration Analysis:**
```javascript
// server/index.ts:24
app.use(cors());  // NO OPTIONS - allows ALL origins!
```

**Current State:**
- CORS middleware installed but not configured
- Default behavior: `Access-Control-Allow-Origin: *`
- Credentials not enabled
- All HTTP methods allowed

**Recommended Fix:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Security Headers Missing:**

| Header | Purpose | Risk Without |
| --- | --- | --- |
| `X-Frame-Options` | Prevent clickjacking | Page can be embedded in malicious iframe |
| `X-Content-Type-Options` | Prevent MIME sniffing | Browser may misinterpret file types |
| `Strict-Transport-Security` | Enforce HTTPS | Downgrade attacks possible |
| `X-XSS-Protection` | Legacy XSS filter | Older browsers vulnerable |
| `Referrer-Policy` | Control referrer info | Leaks URLs to third parties |
| `Content-Security-Policy` | Restrict resource loading | XSS, injection attacks |

**Recommended Fix:**
```bash
cd server && npm install helmet
```
```javascript
import helmet from 'helmet';
app.use(helmet());
```

**CSP Analysis:**
- `index.html`: No `<meta http-equiv="Content-Security-Policy">` tag
- Server: No CSP header set
- Vite config: No headers configuration

**Recommended CSP (example):**
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.exchangerate-api.com https://*.supabase.co
```

---

### Category 2 - Type Safety Audit (2025-12-17)

**Files Reviewed:**
- `tsconfig.app.json`
- `src/types/*.ts` (index.ts, admin.ts, database.ts)
- `server/types/index.ts`
- All stores and components (grep search)

**TypeScript Configuration:**
```json
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
Note: Server lacks dedicated tsconfig - inherits from root

**`any` Type Hotspots:**

| File | Pattern | Recommended Fix |
| --- | --- | --- |
| `adminService.ts` | `data as any[]` | Use `Tables<'user_profiles'>[]` |
| `server/routes/*.ts` | `authMiddleware as any` | Fix middleware type signature |
| `server/routes/*.ts` | `req.query as any` | Create typed query interfaces |
| `AccountService.ts` | `posting: any` | Use `Tables<'postings'>` |

**Type System Strengths:**
- Comprehensive database types with Row/Insert/Update variants
- All React components have Props interfaces
- Admin types well-defined with union types for roles/actions
- Helper types: `Tables<T>`, `InsertTables<T>`, `UpdateTables<T>`

**Middleware Type Issue:**
```typescript
// Current (all routes):
router.get('/', authMiddleware as any, ...)

// Problem: AuthenticatedRequest not compatible with Express middleware
// Solution: Fix middleware type signature or create wrapper
```

**Query Type Issue:**
```typescript
// Current:
const { page, limit } = req.query as any;

// Better:
interface ListQueryParams extends PaginationParams, DateRangeParams {
  // route-specific params
}
const params = req.query as ListQueryParams;
```

---

### Section 3.1 - Store Consistency (2025-12-17)

**Files Reviewed:**
- `src/stores/snapshotStore.ts`
- `src/stores/accountStore.ts`
- `src/stores/incomeStore.ts`
- `src/stores/expenseStore.ts`
- `src/stores/currencyStore.ts`
- `src/stores/ledgerStore.ts`
- `src/stores/ledgerAccountStore.ts`

**Persist Configuration Summary:**

| Store | localStorage Key | Version | Storage Type |
| --- | --- | --- | --- |
| snapshotStore | `fintonico-snapshots` | v2 | Default |
| accountStore | `fintonico-accounts` | None | Default |
| incomeStore | `fintonico-incomes` | None | Default |
| expenseStore | `fintonico-expenses` | None | Default |
| currencyStore | `fintonico-currency` | None | Default |
| ledgerStore | `ledger-store` | v1 | Custom (Money serialization) |
| ledgerAccountStore | `fintonico-ledger-accounts` | None | Default |

**Migration Patterns Found:**

1. **snapshotStore - Proper migrate() function:**
```typescript
migrate: (persistedState, version) => {
  if (version < 2) {
    state.snapshots = state.snapshots.map(s => ({
      ...s,
      accountSnapshots: s.accountSnapshots || [],
    }));
  }
  return state;
}
```

2. **expenseStore/incomeStore - onRehydrateStorage:**
- Validates and sanitizes data on load
- Filters invalid entries, applies defaults
- incomeStore migrates `yearly` → `monthly`

3. **ledgerStore - Custom storage:**
- Serializes Money objects to JSON
- Reconstructs Money objects on load
- Uses BigInt for precision

**Reset Function Analysis:**

| Function | Store | Scope |
| --- | --- | --- |
| `clearAllData()` | ledgerStore | Clears 5 stores' localStorage |
| `resetEnabledCurrencies()` | currencyStore | Resets only currencies |
| `clearUserData()` | adminStore | Clears admin state |
| `clearErrors()` | adminStore | Clears error states |

**Issue: Cross-Store Manipulation**
```typescript
// ledgerStore.ts:302-313
clearAllData: () => {
  set({ accounts: [], transactions: [] });
  localStorage.removeItem('ledger-store');
  localStorage.removeItem('fintonico-incomes');    // Other store!
  localStorage.removeItem('fintonico-expenses');   // Other store!
  localStorage.removeItem('fintonico-snapshots');  // Other store!
  localStorage.removeItem('fintonico-ledger');
}
```
This bypasses Zustand's state management for other stores.

---

### Section 3.2 - Data Validation (2025-12-17)

**Files Reviewed:**
- `src/utils/sanitization.ts`
- `src/stores/expenseStore.ts`
- `src/stores/incomeStore.ts`
- `src/stores/accountStore.ts`
- `src/stores/currencyStore.ts`

**Validation Functions Available:**

| Function | Purpose | Limits |
| --- | --- | --- |
| `sanitizeText()` | XSS prevention | 1000 chars max |
| `sanitizeDescription()` | Field sanitization | 30 chars max |
| `validateAmount()` | Number validation | $0.01 - $1B |
| `validateDate()` | Date validation | YYYY-MM-DD, ±100/+10 years |
| `validateCurrency()` | Currency whitelist | USD, MXN, EUR only |

**Store Validation Comparison:**

| Store | Sanitization | Amount Check | Type Check | Date Check |
| --- | --- | --- | --- | --- |
| expenseStore | ✅ sanitizeDescription | ✅ validateAmount | ✅ Enum | ✅ validateDate |
| incomeStore | ✅ sanitizeDescription | ✅ validateAmount | ✅ Enum | ✅ validateDate |
| accountStore | ❌ None | ❌ None | ❌ None | ❌ None |
| ledgerAccountStore | ❌ None | N/A | ❌ None | N/A |

**Critical Gap - accountStore:**
```typescript
// accountStore.ts:73-86 - NO VALIDATION
addAccount: (newAccount) => {
  const completeAccount: Account = {
    ...newAccount,  // Accepts anything!
    id: crypto.randomUUID(),
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  set((state) => ({ accounts: [...state.accounts, completeAccount] }));
  return completeAccount;
}
```

**Currency Whitelist Issue:**
```typescript
// sanitization.ts:173
const validCurrencies = ['USD', 'MXN', 'EUR'];
// Missing: BTC, ETH which are supported in currencyStore
```

---

### Section 3.3 - Import/Export Integrity (2025-12-17)

**Files Reviewed:**
- `src/utils/xlsx.ts`
- `src/utils/csv.ts`
- `src/components/*/handleImportRows` functions

**Import Limits by Entity:**

| Entity | Max Rows | File |
| --- | --- | --- |
| Expenses | 500 | ExpensePage.tsx:1199 |
| Income | 500 | IncomePage.tsx:956 |
| Accounts | 100 | NetWorthPage.tsx:1599 |
| Ledger Accounts | 50 | ChartOfAccountsPage.tsx:592 |

**XLSX Edge Cases Handled:**

| Case | Solution | Location |
| --- | --- | --- |
| Excel date serial | `XLSX.SSF.parse_date_code()` | xlsx.ts:103-109 |
| Scientific notation | `parseFloat().toFixed(0)` | xlsx.ts:391-398 |
| Leading apostrophe | Strip from value | xlsx.ts:388 |
| Empty cells | Default to empty string | xlsx.ts:60 |
| Multiple sheets | Use first sheet only | xlsx.ts:49 |

**CSV Edge Cases Handled:**

| Case | Solution | Location |
| --- | --- | --- |
| Quoted commas | State machine parser | csv.ts:28-66 |
| Escaped quotes (`""`) | Unescape to `"` | csv.ts:38-40 |
| Line breaks in quotes | Tracked with `inQuotes` | csv.ts:37-48 |
| Header normalization | Lowercase + trim | csv.ts:99 |

**Import Validation Flow:**
1. Parse file → get raw data
2. Validate required headers
3. Transform data to typed rows
4. Check row count limit
5. Detect duplicates (by date+description/source/name)
6. Add to store

---

### Category 4 - Dependency Audit (2025-12-17)

**Commands Run:**
- `npm audit`
- `npm outdated`
- `npx depcheck`

**npm audit Results:**

```
5 vulnerabilities (3 moderate, 2 high)

HIGH:
- xlsx: Prototype Pollution in sheetjs (GHSA-4r6h-8v6p-xvw6)
- xlsx: ReDoS vulnerability

MODERATE:
- vite (3 vulnerabilities)
- body-parser (via express)

LOW:
- glob, js-yaml (transitive)

To address issues that do not require attention:
  npm audit fix

Some issues need review and manual intervention.
```

**xlsx Vulnerability Details:**

| CVE | Type | Impact | Mitigation |
| --- | --- | --- | --- |
| GHSA-4r6h-8v6p-xvw6 | Prototype Pollution | Attacker can inject properties | Validate input files |
| - | ReDoS | Denial of Service via crafted file | Limit file size, timeout |

**Alternatives to xlsx:**
1. **ExcelJS** - More actively maintained, similar API
2. **Papa Parse** - CSV only, very fast
3. **Server-side processing** - Move xlsx parsing to backend

**npm outdated Results (29 packages):**

```
Package                            Current   Wanted    Latest
@hookform/resolvers                5.2.1     5.2.1     6.0.1
@supabase/supabase-js              2.87.1    2.87.1    2.99.0
@testing-library/react             16.1.0    16.1.0    16.4.0
@types/express                     5.0.3     5.0.3     5.0.6
eslint                             9.33.0    9.33.0    9.38.0
lucide-react                       0.539.0   0.539.0   0.541.0
react                              19.1.1    19.1.1    19.2.3
react-dom                          19.1.1    19.1.1    19.2.3
react-hook-form                    7.62.0    7.62.0    7.62.0
typescript                         5.8.3     5.8.3     5.9.3
vite                               7.1.2     7.1.2     7.3.2
vitest                             3.2.4     3.2.4     3.4.0
zod                                4.0.17    4.0.17    4.1.0
... and 16 more
```

**npx depcheck Results:**

```
Unused dependencies
* @netlify/functions

Unused devDependencies
* autoprefixer
* postcss
* tailwindcss
```

**Analysis of "Unused" Dependencies:**

| Package | Actually Used? | Notes |
| --- | --- | --- |
| @netlify/functions | ❌ No | Can be removed if not using Netlify Functions |
| autoprefixer | ✅ Yes | Used in PostCSS config for TailwindCSS |
| postcss | ✅ Yes | Required by TailwindCSS build pipeline |
| tailwindcss | ✅ Yes | Core styling framework - used extensively |

Note: depcheck marks TailwindCSS dependencies as "unused" because they're config-based, not imported in code.

**Bundle Size Concerns:**

| Dependency | Approx Size | Category | Action |
| --- | --- | --- | --- |
| xlsx (SheetJS) | ~500KB | Import feature | Lazy-load on modal open |
| @supabase/supabase-js | ~150KB | Core | Required |
| lucide-react | ~50KB+ | Icons | Use specific imports |
| react-hook-form | ~30KB | Forms | Required |
| zod | ~20KB | Validation | Required |

**Recommended Actions:**

1. **Immediate (Security):**
   - Run `npm audit fix` to resolve vite vulnerabilities
   - Evaluate xlsx alternatives (ExcelJS most promising)
   - Add file size limits for XLSX imports

2. **Short-term (Maintenance):**
   - Update React 19.1.1 → 19.2.3
   - Update TypeScript 5.8.3 → 5.9.3
   - Update vite 7.1.2 → 7.3.2
   - Remove @netlify/functions if not used

3. **Optimization:**
   - Implement dynamic import for xlsx module
   - Add code splitting for Admin panel
   - Consider replacing lucide-react with direct SVG imports

---

### Category 5 - Code Quality Audit (2025-12-17)

**Files Analyzed:**
- All components in `src/components/`
- All stores in `src/stores/`
- Server routes in `server/routes/`

**Large File Analysis:**

| File | Lines | Hook Usage | Recommended Action |
| --- | --- | --- | --- |
| NetWorthPage.tsx | 1,992 | 49 hooks | Extract: AssetTable, LiabilityTable, AccountForm |
| ExpensePage.tsx | 1,555 | 46 hooks | Extract: ExpenseTable, MonthlyFilter, RecurringTable |
| IncomePage.tsx | 1,211 | ~40 hooks | Extract: IncomeTable, MonthlyFilter |
| Dashboard.tsx | 835 | ~25 hooks | Consider: SummaryCards component |
| ChartOfAccountsPage.tsx | 726 | ~20 hooks | Consider: AccountTable component |

**Component Architecture:**

```
src/components/
├── Admin/           (8 files - well-organized)
├── Auth/            (1 file)
├── ChartOfAccounts/ (1 large file)
├── common/          (1 file - Modal.tsx)  ← Should merge with Shared
├── Currency/        (1 file)
├── Dashboard/       (1 large file)
├── ErrorBoundary/   (1 file)
├── Expense/         (1 large file)
├── ExpenseForm/     (1 file)
├── Income/          (1 large file)
├── IncomeForm/      (1 file)
├── Navigation/      (1 file)
├── NetWorth/        (2 large files)
├── Settings/        (1 file)
└── Shared/          (6 files - good pattern)
```

**Duplication Patterns Found:**

1. **Sort/Filter State Pattern** (repeated in 3+ pages):
```typescript
const [sortColumn, setSortColumn] = useState<SortColumn>(null);
const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
const [filters, setFilters] = useState<Filters>({...});
```

2. **Month Navigation Pattern** (repeated in 3+ pages):
```typescript
const [selectedDate, setSelectedDate] = useState(new Date());
const navigateMonth = (direction: 'prev' | 'next') => {...}
```

3. **Table Header Pattern** (repeated in 5+ tables):
```typescript
const handleSort = (column: string) => {...}
<th onClick={() => handleSort('amount')} className="...">
```

**Recommended Refactoring:**

1. **Create Generic Table Component:**
```typescript
// src/components/Shared/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  sortable?: boolean;
  filterable?: boolean;
}
```

2. **Create useSortFilter Hook:**
```typescript
// src/hooks/useSortFilter.ts
const useSortFilter = <T>(data: T[], defaultSort?: string) => {
  // Encapsulate sort/filter state and handlers
}
```

3. **Create useMonthNavigation Hook:**
```typescript
// src/hooks/useMonthNavigation.ts
const useMonthNavigation = (initialDate?: Date) => {
  // Encapsulate month navigation logic
}
```

**Error Handling Patterns:**

| Store | try/catch Count | Pattern |
| --- | --- | --- |
| adminStore | 13 | Consistent - logs + sets error state |
| authStore | 5 | Consistent - logs + returns false |
| ledgerStore | 2 | Uses custom storage serialization |
| Others | 1-3 each | Standard pattern |

**Import Organization Pattern (Consistent):**
```typescript
// 1. React
import { useState, useEffect } from 'react';
// 2. External libraries
import { SomeIcon } from 'lucide-react';
// 3. Internal - stores
import { useExpenseStore } from '../../stores/expenseStore';
// 4. Internal - utils
import { formatDate } from '../../utils/dateFormat';
// 5. Internal - types
import type { Expense } from '../../types';
```

**Naming Conventions Analysis:**

| Pattern | Examples | Status |
| --- | --- | --- |
| Components | PascalCase: `ExpensePage`, `IncomeForm` | ✅ |
| Functions | camelCase: `handleSubmit`, `validateAmount` | ✅ |
| Constants | UPPER_SNAKE: `DEV_MODE`, `MAX_AMOUNT` | ✅ |
| Hooks | use prefix: `useCurrencyInput`, `useAuthStore` | ✅ |
| Types | PascalCase: `ExpenseRating`, `AccountType` | ✅ |
| Directories | Mixed: `common/` vs `Shared/` | ⚠️ |

**JSDoc Coverage by Area:**

| Area | Total Exports | With JSDoc | Coverage |
| --- | --- | --- | --- |
| utils/xlsx.ts | 14 | 9 | 64% |
| utils/sanitization.ts | 6 | 6 | 100% |
| utils/csv.ts | 20 | 4 | 20% |
| stores/*.ts | 30+ | 0 | 0% |
| selectors/finance.ts | 12 | 0 | 0% |
| **Total** | ~113 | 28 | ~25% |

---

### Category 6 - Performance Audit (2025-12-17)

**Tools/Methods Used:**
- Grep analysis for hook usage patterns
- Code review for memoization and virtualization
- Vite config analysis for bundle optimization

**React Performance Analysis:**

| Metric | Finding |
| --- | --- |
| useMemo usage | 71 occurrences across 12 files |
| useCallback usage | Present in import handlers |
| React.memo | **0 usages** - not implemented |
| useShallow | 1 component (Dashboard.tsx only) |

**Hook Usage by Component:**

| Component | useMemo | useCallback | useShallow |
| --- | --- | --- | --- |
| Dashboard.tsx | 11 | 0 | ✅ |
| ExpensePage.tsx | 11 | 3 | ❌ |
| NetWorthPage.tsx | 12 | 3 | ❌ |
| IncomePage.tsx | 7 | 3 | ❌ |
| ImportModal.tsx | 10 | 7 | ❌ |
| ChartOfAccountsPage.tsx | 5 | 3 | ❌ |
| NetWorthHistory.tsx | 3 | 0 | ❌ |

**State Subscription Patterns:**

```typescript
// GOOD (Dashboard.tsx) - Only re-renders when expenses change:
const { expenses } = useExpenseStore(
  useShallow((state) => ({ expenses: state.expenses }))
);

// BAD (Most components) - Re-renders on ANY store change:
const { expenses, addExpense, deleteExpense } = useExpenseStore();
```

**Virtualization Gap:**

| Table | Max Items | Virtualized? | Impact |
| --- | --- | --- | --- |
| Expenses | 500 | ❌ No | High - user can import 500 expenses |
| Income | 500 | ❌ No | High - user can import 500 incomes |
| Accounts | 100 | ❌ No | Medium - smaller dataset |
| Net Worth History | Unlimited | ❌ No | Medium - grows over time |

**Bundle Analysis:**

Current Vite config:
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
      },
    },
  },
}
```

Recommended config:
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        xlsx: ['xlsx'],
        supabase: ['@supabase/supabase-js'],
        forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
      },
    },
  },
}
```

**Lazy Loading Recommendations:**

1. **Admin Panel** (only needed for admins):
```typescript
const AdminPage = React.lazy(() => import('./components/Admin/AdminPage'));
```

2. **xlsx Library** (only needed when importing):
```typescript
// In ImportModal.tsx
const loadXlsx = async () => {
  const XLSX = await import('xlsx');
  // Use XLSX...
};
```

3. **Net Worth History** (chart is heavy):
```typescript
const NetWorthHistory = React.lazy(() =>
  import('./components/NetWorth/NetWorthHistory')
);
```

**Performance Improvement Priorities:**

| Priority | Issue | Fix | Impact |
| --- | --- | --- | --- |
| 1 | No code splitting | Add React.lazy for pages | Initial load time |
| 2 | xlsx sync import | Dynamic import | Bundle size -500KB |
| 3 | No virtualization | Add react-window | Large list performance |
| 4 | No React.memo | Memoize table rows | Re-render reduction |
| 5 | Missing useShallow | Add to all store consumers | Subscription optimization |

**Estimated Bundle Impact:**

| Change | Current | After | Savings |
| --- | --- | --- | --- |
| Lazy-load xlsx | ~500KB in main | 0 in main | ~500KB |
| Lazy-load Admin | ~50KB in main | 0 for users | ~50KB |
| Code split pages | 1 bundle | 5+ chunks | Better caching |

---

### Category 7 - Testing Coverage Audit (2025-12-17)

**Test Framework:** Vitest
**Test Runner:** `npm test`
**Result:** All 49 tests pass (10 test files)

**Test File Inventory:**

Frontend (`src/tests/`):
```
cashflow.test.ts           - 4 tests (cashflow calculations)
currency-visibility.test.ts - 4 tests (currency toggle)
amount-currency-input.test.tsx - 2 tests (component)
funding-mapping.test.ts    - 5 tests (account mapping)
networth.test.ts           - 6 tests (net worth selector)
month-end.test.ts          - 2 tests (month boundaries)
transactions-filter.test.ts - 2 tests (transaction filtering)
pl.test.ts                 - 2 tests (P&L calculations)
settings-modal.test.tsx    - 7 tests (component)
```

Backend (`server/__tests__/`):
```
routes/accounts.test.ts         - 17 tests (CRUD endpoints)
services/AccountService.test.ts - 24 tests (service layer)
services/ReportService.test.ts  - 15 tests (reporting)
```

**Coverage Gap Analysis:**

| Category | Total | Tested | Gap |
| --- | --- | --- | --- |
| Utilities | 7 files | 0 | **7 untested** |
| Stores | 10 files | 0 | **10 untested** |
| Server Services | 5 files | 2 | 3 untested |
| Server Routes | 7 files | 1 | 6 untested |
| Components | 17 dirs | 2 | 15 untested |
| Selectors | 1 file | Partial | Some coverage |

**Priority Testing Recommendations:**

1. **Critical - Security-related:**
```typescript
// src/utils/sanitization.test.ts
describe('sanitizeText', () => {
  it('removes XSS vectors', () => {...});
  it('enforces max length', () => {...});
});
describe('validateAmount', () => {
  it('rejects negative amounts', () => {...});
  it('enforces max amount', () => {...});
});
```

2. **High - Core business logic:**
```typescript
// src/stores/expenseStore.test.ts
describe('expenseStore', () => {
  it('adds expense with sanitization', () => {...});
  it('calculates monthly total correctly', () => {...});
});
```

3. **Medium - Import/Export:**
```typescript
// src/utils/xlsx.test.ts
describe('parseXlsx', () => {
  it('handles Excel date serial numbers', () => {...});
  it('validates required headers', () => {...});
  it('limits row count', () => {...});
});
```

**Test Quality Assessment:**

| Metric | Score | Notes |
| --- | --- | --- |
| Isolation | ✅ Good | State reset between tests |
| Mocking | ✅ Good | Supabase properly mocked |
| Assertions | ✅ Good | Specific value checks |
| Edge cases | ✅ Good | Multi-currency, negatives |
| Stability | ✅ Good | No flaky tests |

**Example of Good Test Pattern (from codebase):**

```typescript
// networth.test.ts - demonstrates proper test structure
describe('net worth selector', () => {
  beforeEach(() => {
    resetState();  // Clean state
  });

  it('uses only external accounts for net worth calculation', () => {
    // Arrange
    const accountStore = useAccountStore.getState();
    accountStore.addAccount({...});

    // Act
    const snapshot = getNetWorthAt(new Date());

    // Assert
    expect(snapshot.totalAssets.toMajorUnits()).toBeCloseTo(60000, 2);
  });
});
```

**Recommended Test Structure:**

```
src/tests/
├── utils/
│   ├── sanitization.test.ts   ← Priority 1
│   ├── xlsx.test.ts           ← Priority 2
│   ├── csv.test.ts            ← Priority 3
│   └── dateFormat.test.ts
├── stores/
│   ├── expenseStore.test.ts   ← Priority 1
│   ├── incomeStore.test.ts
│   ├── accountStore.test.ts   ← Priority 1
│   └── authStore.test.ts
├── components/
│   ├── ExpensePage.test.tsx
│   ├── IncomePage.test.tsx
│   └── Dashboard.test.tsx
└── selectors/
    └── finance.test.ts        ← Already partial

server/__tests__/
├── routes/
│   ├── expenses.test.ts       ← Priority 1
│   ├── income.test.ts
│   └── admin.test.ts
└── services/
    ├── TransactionService.test.ts
    └── RatesService.test.ts
```

**Estimated Effort:**

| Area | Files | Est. Tests | Priority |
| --- | --- | --- | --- |
| sanitization.ts | 1 | 20+ | P1 |
| expenseStore | 1 | 10 | P1 |
| accountStore | 1 | 10 | P1 |
| xlsx.ts | 1 | 15 | P2 |
| csv.ts | 1 | 15 | P2 |
| Server routes | 6 | 60+ | P2 |
| Components | 5 | 30+ | P3 |

---

### Category 8 - Accessibility Audit (2025-12-17)

**Tools/Methods Used:**
- Grep analysis for ARIA attributes and semantic elements
- Code review for keyboard navigation patterns
- Manual review of form label associations

**Semantic HTML Inventory:**

| Element | Count | Files |
| --- | --- | --- |
| `<main>` | 1 | App.tsx |
| `<nav>` | 2 | Navigation.tsx |
| `<header>` | 2 | Modal.tsx, Navigation.tsx |
| `<aside>` | 1 | Navigation.tsx |
| `<section>` | 4 | SettingsModal.tsx |
| `role="dialog"` | 1 | Modal.tsx |

**Heading Usage Analysis:**

| Level | Count | Examples |
| --- | --- | --- |
| h1 | 4 | "FINTONICO", "Admin Panel", page titles |
| h2 | 14 | Modal titles, table section headers |
| h3 | 18 | Card titles, subsection headers |
| h4 | 4 | Dashboard breakdown sections |

**Issues:**
- NetWorthPage: Uses h3 directly without h2 wrapper
- Dashboard: h4 "Expense Breakdown" without h3 parent
- Some pages skip heading levels

**ARIA Attribute Usage:**

```
aria-label: 6 usages
  - App.tsx:113 "Open settings"
  - Modal.tsx:100 "Close modal"
  - SettingsModal.tsx:230 currency toggles
  - ToggleSwitch.tsx:43 dynamic label
  - Navigation.tsx:191 "Open settings"

aria-labelledby: 1 usage
  - Modal.tsx:69 "modal-title"

aria-modal: 1 usage
  - Modal.tsx:67 "true"

role: 1 usage
  - Modal.tsx:67 "dialog"
```

**Form Label Analysis:**

| Pattern | Count | Issue |
| --- | --- | --- |
| `htmlFor` | 1 | Only SettingsModal has explicit label |
| Input with label | ~20 | Most use placeholder only |
| Icon buttons | 30+ | Use title= instead of aria-label= |

**Keyboard Navigation:**

Implemented (`onKeyDown`):
```
NetWorthPage.tsx - 3 handlers (Enter key)
ChartOfAccountsPage.tsx - 4 handlers (Enter key)
ExpensePage.tsx - 1 handler
IncomePage.tsx - 1 handler
SystemConfigSection.tsx - 1 handler
Modal.tsx - Escape key to close
```

Missing:
- No skip-to-content link
- No global keyboard shortcuts
- No arrow key navigation in dropdowns

**Screen Reader Support Gaps:**

1. **Live Regions (Critical):**
   - 0 `aria-live` regions
   - Form submissions not announced
   - Filter changes not announced
   - Loading states not announced

2. **Icon Buttons (Critical):**
   - Pattern found: `title="Delete expense"` on icon-only buttons
   - `title` is NOT read by screen readers
   - Should use: `aria-label="Delete expense"`

   Files affected:
   - CurrencySelector.tsx
   - FinancialDataSection.tsx
   - UsersSection.tsx
   - IncomePage.tsx
   - ExpensePage.tsx
   - NetWorthPage.tsx
   - ChartOfAccountsPage.tsx
   - CSVActions.tsx
   - ImportModal.tsx

3. **Form Errors (Critical):**
   - No `aria-invalid` on invalid inputs
   - No `aria-describedby` linking errors
   - No `role="alert"` for error messages

**Visual Accessibility:**

Focus Styles (index.css:100):
```css
button:focus-visible {
  @apply outline-none;
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
```

Motion Preferences:
- 0 `prefers-reduced-motion` media queries
- Animations always play

**Recommended Fixes by Priority:**

**P1 - Critical (Screen Reader Accessibility):**

1. Add aria-labels to icon buttons:
```typescript
// Before:
<button title="Delete expense">
  <Trash2 className="w-4 h-4" />
</button>

// After:
<button aria-label="Delete expense" title="Delete expense">
  <Trash2 className="w-4 h-4" aria-hidden="true" />
</button>
```

2. Add aria-live for dynamic content:
```typescript
// Status announcements
<div aria-live="polite" className="sr-only">
  {message}
</div>
```

3. Add form error announcements:
```typescript
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
{error && (
  <span id={`${id}-error`} role="alert">
    {error}
  </span>
)}
```

**P2 - High (Keyboard Navigation):**

1. Add skip link:
```typescript
// In App.tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
...
<main id="main-content">
```

2. Add form labels:
```typescript
// Before:
<input placeholder="Description" />

// After:
<label htmlFor="description" className="sr-only">Description</label>
<input id="description" placeholder="Description" />
```

**P3 - Medium (Motion & Contrast):**

1. Add reduced motion support:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

2. Run Lighthouse accessibility audit for contrast issues

**Accessibility Checklist for Future Development:**

| Requirement | Check |
| --- | --- |
| All images have alt text | N/A (no user images) |
| All form inputs have labels | ❌ Needs work |
| All buttons have accessible names | ❌ Needs work |
| Color is not only indicator | ✅ Icons used |
| Focus visible on all interactive | ✅ Has focus ring |
| Skip link exists | ❌ Missing |
| Headings follow hierarchy | ⚠️ Some issues |
| aria-live for dynamic content | ❌ Missing |
| Reduced motion respected | ❌ Missing |
| Error messages announced | ❌ Missing |

---

### Category 9 - Documentation Audit (2025-12-17)

**Files Reviewed:**
- README.md (291 lines)
- ROADMAP.md (48KB)
- NEWFEATURES.md (71 lines)
- STYLEROADMAP.md (158 lines)
- .env.example (3 lines)
- server/docs/openapi.yaml (1249 lines)

**Documentation File Inventory:**

| File | Size | Purpose | Quality |
| --- | --- | --- | --- |
| README.md | 11.9KB | Main project documentation | ✅ Good |
| ROADMAP.md | 48KB | Development roadmap | ✅ Comprehensive |
| NEWFEATURES.md | 1.2KB | Feature backlog | ❌ Empty template |
| STYLEROADMAP.md | 3.5KB | UI/UX improvements | ✅ Well-organized |
| AUDIT.md | 90KB+ | Code audit (this file) | ✅ Active |
| openapi.yaml | 1249 lines | API specification | ⚠️ Partial |

**README.md Analysis:**

Strengths:
- Clear ASCII architecture diagram
- Comprehensive features list with 6 major sections
- Well-documented data types (TypeScript interfaces)
- Complete development phase history
- Links to related documentation files

Weaknesses:
- Version mismatch (README: 2.3.0 vs package.json: 0.0.0)
- Environment variables section incomplete
- No production deployment guide
- No contributing guidelines
- License file missing (only MIT mention)

**Environment Variable Gap Analysis:**

.env.example contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

Missing variables found in code:

| Variable | File | Default | Description |
| --- | --- | --- | --- |
| VITE_USE_API | - | false | Toggle API vs localStorage mode |
| VITE_DEV_MODE | authStore.ts | false | Enable dev authentication |
| VITE_DEV_TOKEN | authStore.ts | - | Dev JWT token |
| PORT | server/index.ts | 3001 | Express server port |
| SUPABASE_URL | server/lib | - | Server-side Supabase URL |
| SUPABASE_SERVICE_KEY | server/lib | - | Server-side service key |

Recommended .env.example update:
```env
# === Frontend (Vite) ===
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Mode Configuration
VITE_USE_API=true
VITE_DEV_MODE=false

# Development Only (when VITE_DEV_MODE=true)
VITE_DEV_TOKEN=your-dev-jwt-token

# === Backend (Express) ===
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Optional - AI Features
OPENAI_API_KEY=your-openai-api-key
```

**OpenAPI Specification Analysis:**

Documented endpoints:
- /health (GET)
- /accounts (CRUD)
- /transactions (CRUD)
- /income (CRUD)
- /expenses (CRUD)
- /reports (trial-balance, balance-sheet, income-statement)
- /rates (get, refresh, convert)

Missing endpoints:
- /api/admin/users (CRUD)
- /api/admin/config (CRUD)
- /api/admin/audit-log (GET)

Schema inconsistencies:
```yaml
# OpenAPI (openapi.yaml:708)
ExpenseRating:
  enum: [essential, non_essential, luxury]

# Frontend (types/index.ts)
type ExpenseRating = 'essential' | 'discretionary' | 'luxury'
```

Server configuration mismatch:
```yaml
# OpenAPI
servers:
  - url: http://localhost:3000/api  # Wrong port!

# Actual server (server/index.ts)
const PORT = process.env.PORT || 3001;
```

**NEWFEATURES.md Status:**

Current state: Empty template with placeholders
```markdown
### 1. [Feature Name]
**Description:** Brief description of the feature.
...
```

Recommendation: Either populate with actual planned features or remove file

**STYLEROADMAP.md Assessment:**

Well-organized future work tracker with 6 phases:
1. Accessibility (contrast, focus states)
2. Typography & Spacing
3. Mobile Responsiveness
4. Micro-interactions
5. Component Polish
6. Data Visualization

All tasks show ☐ (unchecked) - good for tracking future work

**Missing Documentation Recommendations:**

1. **LICENSE** (High Priority):
```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted...
```

2. **CONTRIBUTING.md** (Medium Priority):
- Code style guidelines
- PR process
- Issue templates
- Development setup

3. **CHANGELOG.md** (Medium Priority):
- Version history
- Breaking changes
- New features per version

4. **DEPLOYMENT.md** (Medium Priority):
- Production build steps
- Environment configuration
- Hosting options (Vercel, Netlify, etc.)
- Database migration guide

**Documentation Quality Score:**

| Aspect | Score | Notes |
| --- | --- | --- |
| README completeness | 8/10 | Missing deployment & contributing |
| API documentation | 7/10 | Missing admin routes |
| Code comments | 5/10 | 25% JSDoc coverage |
| Environment docs | 3/10 | .env.example very incomplete |
| Roadmap/planning | 9/10 | Excellent historical record |

**Overall Documentation Grade: B-**

Strong project documentation with good README and comprehensive roadmap, but gaps in environment configuration, API completeness, and missing standard open-source files (LICENSE, CONTRIBUTING).
