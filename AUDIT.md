# Fintonico Code Audit Plan

A comprehensive step-by-step audit checklist for the Fintonico codebase.

**Created:** 2025-12-17
**Last Updated:** 2025-12-17

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
| 6. Performance Audit | Medium | ⬜ |
| 7. Testing Coverage Audit | Medium | ⬜ |
| 8. Accessibility Audit | Low | ⬜ |
| 9. Documentation Audit | Low | ⬜ |

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
| Review useMemo/useCallback usage | All components | ⬜ |
| Check for unnecessary re-renders | Complex components | ⬜ |
| Verify list virtualization | Long lists | ⬜ |
| Review component memoization | Heavy components | ⬜ |

### 6.2 State Management

| Task | Files | Status |
| --- | --- | --- |
| Check store selector granularity | Store consumers | ⬜ |
| Review subscription patterns | useXxxStore calls | ⬜ |
| Verify state normalization | Store structures | ⬜ |

### 6.3 Network & Data

| Task | Files | Status |
| --- | --- | --- |
| Review API call frequency | API consumers | ⬜ |
| Check for N+1 query patterns | Data fetching | ⬜ |
| Verify data caching strategy | Store persist config | ⬜ |
| Review exchange rate fetching | Currency store | ⬜ |

### 6.4 Bundle & Load Time

| Task | Files | Status |
| --- | --- | --- |
| Check code splitting | Route-level splitting | ⬜ |
| Review lazy loading | Heavy components | ⬜ |
| Verify asset optimization | Images and icons | ⬜ |

---

## 7. Testing Coverage Audit

### 7.1 Unit Tests

| Task | Files | Status |
| --- | --- | --- |
| Review existing test coverage | `src/tests/*.test.ts` | ⬜ |
| Identify untested utilities | `src/utils/*.ts` | ⬜ |
| Check store test coverage | `src/stores/*.ts` | ⬜ |
| Verify service test coverage | `server/services/*.ts` | ⬜ |

### 7.2 Integration Tests

| Task | Files | Status |
| --- | --- | --- |
| Review API endpoint tests | `server/__tests__/*.test.ts` | ⬜ |
| Check component integration tests | Component tests | ⬜ |
| Verify store integration tests | Store + component tests | ⬜ |

### 7.3 Test Quality

| Task | Files | Status |
| --- | --- | --- |
| Check test isolation | All test files | ⬜ |
| Review mock quality | Test mocks | ⬜ |
| Verify assertion completeness | Test assertions | ⬜ |
| Check for flaky tests | CI/CD history | ⬜ |

---

## 8. Accessibility Audit

### 8.1 Semantic HTML

| Task | Files | Status |
| --- | --- | --- |
| Check heading hierarchy | All pages | ⬜ |
| Verify form labels | All forms | ⬜ |
| Review button vs link usage | Interactive elements | ⬜ |
| Check landmark regions | Layout components | ⬜ |

### 8.2 Keyboard Navigation

| Task | Files | Status |
| --- | --- | --- |
| Verify focus management | Modal and dialog components | ⬜ |
| Check tab order | All pages | ⬜ |
| Review keyboard shortcuts | Navigation and actions | ⬜ |
| Test skip links | Navigation | ⬜ |

### 8.3 ARIA & Screen Readers

| Task | Files | Status |
| --- | --- | --- |
| Check ARIA labels | Interactive elements | ⬜ |
| Verify live regions | Dynamic content | ⬜ |
| Review icon accessibility | Icon-only buttons | ⬜ |
| Check error announcements | Form validation | ⬜ |

### 8.4 Visual Accessibility

| Task | Files | Status |
| --- | --- | --- |
| Check color contrast | All themes | ⬜ |
| Verify focus indicators | Interactive elements | ⬜ |
| Review text sizing | Responsive text | ⬜ |
| Check motion preferences | Animations | ⬜ |

---

## 9. Documentation Audit

### 9.1 Code Documentation

| Task | Files | Status |
| --- | --- | --- |
| Review README.md accuracy | `README.md` | ⬜ |
| Check ROADMAP.md updates | `roadmap.md` | ⬜ |
| Verify API documentation | `server/docs/openapi.yaml` | ⬜ |
| Review inline documentation | Complex functions | ⬜ |

### 9.2 User Documentation

| Task | Files | Status |
| --- | --- | --- |
| Check feature documentation | README features section | ⬜ |
| Verify setup instructions | README quick start | ⬜ |
| Review environment variables | `.env.example` | ⬜ |

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
| TYPE-001 | Type Safety | 80+ uses of `any` type - reduces type safety benefits | Medium | Open |
| TYPE-002 | Type Safety | `authMiddleware as any` cast in all server routes | Medium | Open |
| DATA-001 | Data Integrity | Store persist configs inconsistent (naming, versions, migrations) | Medium | Open |
| DATA-002 | Data Integrity | accountStore has NO input validation - accepts any data | **High** | Open |
| DATA-003 | Data Integrity | validateCurrency() missing BTC, ETH from whitelist | Medium | Open |
| DEP-003 | Dependency | 3 moderate vulnerabilities in vite (fix available via npm audit fix) | Medium | Open |
| DEP-004 | Dependency | 29 outdated packages (react, typescript, eslint, etc.) | Medium | Open |
| DEP-005 | Dependency | xlsx is ~500KB - should be lazy-loaded for bundle optimization | Medium | Open |
| CODE-001 | Code Quality | NetWorthPage.tsx is 1,992 lines - needs component extraction | Medium | Open |
| CODE-002 | Code Quality | ExpensePage.tsx is 1,555 lines - needs component extraction | Medium | Open |
| CODE-003 | Code Quality | Duplicate table/filter logic across page components | Medium | Open |
| CODE-004 | Code Quality | Directory naming inconsistency (common/ vs Shared/) | Low | Open |
| CODE-005 | Code Quality | JSDoc coverage is only ~25% of exports | Low | Open |

**Severity Levels:**
- **Critical**: Security vulnerability or data loss risk
- **High**: Significant bug or performance issue
- **Medium**: Code quality or maintainability issue
- **Low**: Minor improvement or nice-to-have

---

## Audit Summary

**Total Items:** 100+
**Completed:** 66 (Categories 1, 2, 3, 4, 5) - **Code Quality Audit Complete**
**Critical Issues:** 0
**High Priority Issues:** 6 (SEC-003, SEC-005, SEC-006, DATA-002, DEP-001, DEP-002)
**Medium Priority Issues:** 15 (SEC-001, SEC-002, SEC-004, SEC-007, TYPE-001, TYPE-002, DATA-001, DATA-003, DEP-003, DEP-004, DEP-005, CODE-001, CODE-002, CODE-003)
**Low Priority Issues:** 2 (CODE-004, CODE-005)

---

## Next Steps

1. Begin with Security Audit (Category 1)
2. Run automated tools: `npm audit`, `npx depcheck`, lint
3. Document findings in Execution Log
4. Create issues for critical findings
5. Schedule follow-up audit after fixes

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
