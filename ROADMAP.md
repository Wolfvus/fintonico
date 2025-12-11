# Fintonico UI/UX Roadmap

## Phase 1: UI Consistency

### Step 1: Modal & Item Component Standardization ✅

**Goal:** Ensure all modals and list items follow the same design patterns across the application.

| Task | Status | Files |
| --- | --- | --- |
| Audit existing modals | ✅ | - |
| Create base Modal component | ✅ | `src/components/common/Modal.tsx` |
| Create base ListItem component | ✅ | `src/components/common/ListItem.tsx` |
| Standardize Settings modal | ✅ | `src/components/Settings/SettingsModal.tsx` |

---

### Step 2: Notion-Style Editable Tables ✅

**Goal:** Create a Notion-like inline editing experience for assets and liabilities.

| Task | Status | Files |
| --- | --- | --- |
| Create EditableTable component | ✅ | `src/components/common/EditableTable.tsx` |
| Notion-style inline editing | ✅ | Click-to-edit with Enter/Escape support |
| Type selector dropdown | ✅ | Emoji icons with dropdown selection |
| Payment due date (day of month) | ✅ | Calendar grid picker for liabilities |
| Paid status checkbox | ✅ | Green checkmark when paid this month |

---

### Step 3: Separate Net Worth & Accounts Sections ✅

**Goal:** Split functionality into two distinct sections:
1. **Net Worth** - Simple personal balance tracking (assets/liabilities)
2. **Accounts** - Double-entry accounting chart of accounts

#### Step 3.1: Simplify Net Worth Section ✅

| Task | Status | Files |
| --- | --- | --- |
| Single currency per asset/liability | ✅ | Remove multi-currency complexity |
| Add "Exclude from total" toggle | ✅ | `excludeFromTotal` field |
| Simplify columns | ✅ | Name, Type, Currency, Balance, Exclude |
| Update Account type | ✅ | `src/types/index.ts` |
| Update AccountsPage (rename to NetWorthPage) | ✅ | `src/components/NetWorth/NetWorthPage.tsx` |
| Add data migration for existing accounts | ✅ | `src/stores/accountStore.ts` |

**Net Worth Table Columns:**
- Name (editable)
- Type (dropdown: Cash, Bank, Exchange, Investment, Property, Credit Card, Loan, Mortgage, Other)
- Currency (dropdown)
- Balance (editable)
- Converted amount (in base currency)
- Due Date (liabilities only)
- Paid (liabilities only)
- Exclude (eye-off icon - grays out row, excludes from totals)
- Delete

#### Step 3.2: Create New Accounts Section (Chart of Accounts) ✅

| Task | Status | Files |
| --- | --- | --- |
| Create LedgerAccount type | ✅ | `src/types/index.ts` |
| Create ledgerAccountStore | ✅ | `src/stores/ledgerAccountStore.ts` |
| Create ChartOfAccountsPage component | ✅ | `src/components/ChartOfAccounts/ChartOfAccountsPage.tsx` |
| Add to navigation | ✅ | Update routes/tabs |

**Accounts Table Columns:**
- Name (editable)
- Account Type (Debit/Credit - normal balance)
- Category (Asset, Liability, Equity, Income, Expense)
- Account Number (editable, optional)
- Active toggle
- Delete

**LedgerAccount Type:**
```typescript
interface LedgerAccount {
  id: string;
  name: string;
  normalBalance: 'debit' | 'credit';  // Normal balance side
  accountNumber?: string;              // Optional account code
  category: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  isActive: boolean;
  description?: string;
}
```

#### Step 3.3: Update Navigation ✅

| Task | Status | Files |
| --- | --- | --- |
| Keep "Net Worth" tab | ✅ | For assets/liabilities tracking |
| Add "Accounts" tab | ✅ | For chart of accounts |
| Update routing | ✅ | `src/App.tsx` |
| Update Navigation component | ✅ | `src/components/Navigation/Navigation.tsx` |

#### Step 3.4: Remove Legacy Assets/Liabilities Sections ✅

| Task | Status | Files |
| --- | --- | --- |
| Remove Assets tab from navigation | ✅ | Consolidated into Net Worth |
| Remove Liabilities tab from navigation | ✅ | Consolidated into Net Worth |
| Delete AssetsPage component | ✅ | `src/components/Assets/` |
| Delete LiabilitiesPage component | ✅ | `src/components/Liabilities/` |
| Delete AssetForm component | ✅ | `src/components/AssetForm/` |
| Delete LiabilityForm component | ✅ | `src/components/LiabilityForm/` |
| Delete old AccountsPage | ✅ | `src/components/Accounts/` |
| Update App.tsx imports and routes | ✅ | `src/App.tsx` |

**Final Navigation Structure:**
- Dashboard
- Income
- Expenses
- Net Worth (assets + liabilities in one table)
- Accounts (chart of accounts)

---

## Phase 2: Color Palette & Theme ☐

**Goal:** Establish a unified, consistent color system with proper semantic tokens and accessible contrast ratios.

### Step 1: Define Unified Color Palette ✅

| Task | Status | Files |
| --- | --- | --- |
| Add brand colors to Tailwind config | ✅ | `tailwind.config.js` |
| Create semantic color tokens | ✅ | Success, error, warning, info |
| Define surface colors | ✅ | Background, card, elevated |
| Remove unused theme.ts | ✅ | `src/styles/theme.ts` |
| Update CSS custom properties | ✅ | `src/index.css` |
| Create utility classes | ✅ | `.card`, `.btn-*`, `.badge-*`, etc. |

**Color Palette:**
```
Brand Colors:
- Primary: Teal (#2FA5A9) - main actions, links
- Accent: Gold (#F5B700) - highlights, badges
- Navy: (#1E2A38) - text, headers

Semantic Colors:
- Success: Green (#22C55E)
- Error: Red (#EF4444)
- Warning: Amber (#F59E0B)
- Info: Blue (#3B82F6)

Surfaces (Light):
- Background: Blue-50 (#EFF6FF)
- Card: White (#FFFFFF)
- Elevated: Blue-100 (#DBEAFE)
- Border: Blue-200 (#BFDBFE)

Surfaces (Dark):
- Background: Gray-900 (#111827)
- Card: Gray-800 (#1F2937)
- Elevated: Gray-700 (#374151)
- Border: Gray-700 (#374151)
```

### Step 2: Improve Dark/Light Mode Consistency ☐

| Task | Status | Files |
| --- | --- | --- |
| Audit hardcoded colors in components | ☐ | All component files |
| Replace with Tailwind custom colors | ☐ | Use `bg-surface-*`, `text-*` |
| Consolidate theme state management | ☐ | Remove duplicate theme state |
| Update formStyles.ts | ☐ | Use semantic color classes |

### Step 3: Ensure Accessible Contrast Ratios ☐

| Task | Status | Files |
| --- | --- | --- |
| Check text/background contrast | ☐ | WCAG AA (4.5:1 for text) |
| Check interactive elements | ☐ | WCAG AA (3:1 for UI) |
| Adjust colors if needed | ☐ | Update palette |
| Test with color blindness simulators | ☐ | Verify accessibility |

---

## Future Phases (Planned)

### Phase 3: Typography & Spacing
- Font hierarchy
- Consistent spacing scale
- Responsive typography

### Phase 4: Mobile Responsiveness
- Touch-friendly interactions
- Mobile navigation
- Responsive tables/lists

### Phase 5: Micro-interactions
- Loading states
- Transitions & animations
- Feedback indicators

---

**Last Updated:** 2025-12-11
