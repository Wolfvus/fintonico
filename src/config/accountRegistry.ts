import type { ExpenseRating } from '../types';
import type { Account } from '../domain/ledger';

export type AccountSubtype =
  | 'operating-cash'
  | 'savings'
  | 'investment'
  | 'credit-card'
  | 'loan'
  | 'other';

export interface AccountMetadata {
  id: string;
  subtype: AccountSubtype;
  displayName?: string;
  defaultExpenseRatings?: ExpenseRating[];
  defaultIncome?: boolean;
  monthEndAction?: 'paydown' | 'review';
}

const ACCOUNT_METADATA: Record<string, AccountMetadata> = {
  cash: {
    id: 'cash',
    subtype: 'operating-cash',
    defaultExpenseRatings: ['essential', 'discretionary'],
    defaultIncome: true,
  },
  checking: {
    id: 'checking',
    subtype: 'operating-cash',
    defaultExpenseRatings: ['essential', 'discretionary'],
    defaultIncome: true,
  },
  savings: {
    id: 'savings',
    subtype: 'savings',
    defaultIncome: true,
    monthEndAction: 'review',
  },
  investments: {
    id: 'investments',
    subtype: 'investment',
    monthEndAction: 'review',
  },
  'credit-card': {
    id: 'credit-card',
    subtype: 'credit-card',
    defaultExpenseRatings: ['discretionary', 'luxury'],
    monthEndAction: 'paydown',
  },
  loan: {
    id: 'loan',
    subtype: 'loan',
    monthEndAction: 'review',
  },
};

export const getAccountMetadata = (accountId: string): AccountMetadata => {
  return (
    ACCOUNT_METADATA[accountId] || {
      id: accountId,
      subtype: 'other',
    }
  );
};

export const getDefaultExpenseFundingAccount = (
  rating: ExpenseRating,
  availableAccounts: Account[],
): string | undefined => {
  const preferred = availableAccounts.find((account) => {
    const meta = getAccountMetadata(account.id);
    return meta.defaultExpenseRatings?.includes(rating);
  });

  if (preferred) {
    return preferred.id;
  }

  const fallback = availableAccounts.find(
    (account) => getAccountMetadata(account.id).subtype === 'operating-cash',
  );

  return fallback?.id ?? availableAccounts[0]?.id;
};

export const getDefaultIncomeDepositAccount = (
  availableAccounts: Account[],
): string | undefined => {
  const preferred = availableAccounts.find((account) => getAccountMetadata(account.id).defaultIncome);
  if (preferred) {
    return preferred.id;
  }

  return (
    availableAccounts.find((account) => getAccountMetadata(account.id).subtype === 'operating-cash')?.id ??
    availableAccounts[0]?.id
  );
};

export const filterAccountsBySubtype = (accounts: Account[], subtypes: AccountSubtype[]) => {
  return accounts.filter((account) => subtypes.includes(getAccountMetadata(account.id).subtype));
};
