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
| Redesign AccountsPage with editable tables | ✅ | `src/components/Accounts/AccountsPage.tsx` |
| Inline editing for account name | ✅ | Click-to-edit with Enter/Escape support |
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

---

## Future Phases (Planned)

### Phase 2: Color Palette & Theme
- Refine color palette
- Improve dark/light mode consistency
- Accessible contrast ratios

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
