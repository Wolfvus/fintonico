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
| 1. Security Audit | High | ⬜ |
| 2. Type Safety Audit | High | ⬜ |
| 3. Data Integrity Audit | High | ⬜ |
| 4. Dependency Audit | Medium | ⬜ |
| 5. Code Quality Audit | Medium | ⬜ |
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
| Check expense validation rules | `src/stores/expenseStore.ts` | ⬜ |
| Check income validation rules | `src/stores/incomeStore.ts` | ⬜ |
| Check account validation rules | `src/stores/accountStore.ts` | ⬜ |
| Review currency validation | `src/stores/currencyStore.ts` | ⬜ |
| Verify date format consistency | All date handling | ⬜ |

### 3.3 Import/Export Integrity

| Task | Files | Status |
| --- | --- | --- |
| Review XLSX parsing edge cases | `src/utils/xlsx.ts` | ⬜ |
| Check CSV parsing edge cases | `src/utils/csv.ts` | ⬜ |
| Verify data transformation accuracy | Import handlers in pages | ⬜ |
| Test round-trip export/import | All entity types | ⬜ |

---

## 4. Dependency Audit

### 4.1 Package Security

| Task | Command/Files | Status |
| --- | --- | --- |
| Run npm audit | `npm audit` | ⬜ |
| Check for outdated packages | `npm outdated` | ⬜ |
| Review high-severity vulnerabilities | `npm audit --audit-level=high` | ⬜ |
| Check unused dependencies | `npx depcheck` | ⬜ |

### 4.2 License Compliance

| Task | Files | Status |
| --- | --- | --- |
| Review package licenses | `package.json`, `server/package.json` | ⬜ |
| Check for GPL contamination | License analysis | ⬜ |

### 4.3 Bundle Size

| Task | Command | Status |
| --- | --- | --- |
| Analyze bundle size | `npm run build && npx vite-bundle-analyzer` | ⬜ |
| Identify large dependencies | Bundle analysis | ⬜ |
| Check for tree-shaking issues | Build output | ⬜ |

---

## 5. Code Quality Audit

### 5.1 Code Organization

| Task | Files | Status |
| --- | --- | --- |
| Review component file sizes | Components > 500 lines | ⬜ |
| Check for code duplication | All components | ⬜ |
| Verify separation of concerns | Stores, services, components | ⬜ |
| Review import organization | All files | ⬜ |

### 5.2 Naming Conventions

| Task | Files | Status |
| --- | --- | --- |
| Check component naming | All `.tsx` files | ⬜ |
| Check function naming | All functions | ⬜ |
| Verify constant naming (UPPER_CASE) | Config and constants | ⬜ |
| Check for ambiguous names | All files | ⬜ |

### 5.3 Error Handling

| Task | Files | Status |
| --- | --- | --- |
| Review try/catch blocks | All async functions | ⬜ |
| Check error boundary usage | React error boundaries | ⬜ |
| Verify user error messaging | Error display components | ⬜ |
| Review error logging | All catch blocks | ⬜ |

### 5.4 Comments & Documentation

| Task | Files | Status |
| --- | --- | --- |
| Check for outdated comments | All files | ⬜ |
| Verify JSDoc on public functions | Exported functions | ⬜ |
| Review TODO/FIXME items | All files | ⬜ |
| Check commented-out code | All files | ⬜ |

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

---

## Critical Issues Found

Track critical issues requiring immediate attention:

| ID | Category | Description | Severity | Status |
| --- | --- | --- | --- | --- |
| SEC-003 | Security | AuthForm.tsx:33 logs email and password to console | **High** | Open |
| SEC-005 | Security | CORS allows all origins - no origin restriction configured | **High** | Open |
| SEC-006 | Security | No security headers (helmet not installed) - clickjacking/MIME sniffing risk | **High** | Open |
| SEC-001 | Security | Dev mode accepts weak credentials (any email + 1-char password) | Medium | Open |
| SEC-002 | Security | File uploads lack explicit size limit and MIME type validation | Medium | Open |
| SEC-004 | Security | Financial data in localStorage is not encrypted | Medium | Open |
| SEC-007 | Security | No Content-Security-Policy configured | Medium | Open |
| TYPE-001 | Type Safety | 80+ uses of `any` type - reduces type safety benefits | Medium | Open |
| TYPE-002 | Type Safety | `authMiddleware as any` cast in all server routes | Medium | Open |
| DATA-001 | Data Integrity | Store persist configs inconsistent (naming, versions, migrations) | Medium | Open |

**Severity Levels:**
- **Critical**: Security vulnerability or data loss risk
- **High**: Significant bug or performance issue
- **Medium**: Code quality or maintainability issue
- **Low**: Minor improvement or nice-to-have

---

## Audit Summary

**Total Items:** 100+
**Completed:** 33 (Categories 1, 2 + Section 3.1)
**Critical Issues:** 0
**High Priority Issues:** 3 (SEC-003, SEC-005, SEC-006)
**Medium Priority Issues:** 7 (SEC-001, SEC-002, SEC-004, SEC-007, TYPE-001, TYPE-002, DATA-001)

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
