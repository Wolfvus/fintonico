import type { AccountType } from '../types';
import type { AccountNature } from '../domain/ledger';

export const ASSET_ACCOUNT_TYPES: AccountType[] = [
  'cash',
  'bank',
  'exchange',
  'investment',
  'property',
  'other',
];

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = ['loan', 'credit-card', 'mortgage'];

export const isAssetAccountType = (type: AccountType): boolean => ASSET_ACCOUNT_TYPES.includes(type);

export const isLiabilityAccountType = (type: AccountType): boolean =>
  LIABILITY_ACCOUNT_TYPES.includes(type);

export const isBalanceSheetAccountType = (type: AccountType): boolean =>
  isAssetAccountType(type) || isLiabilityAccountType(type);

export const accountTypeToNature = (type: AccountType): AccountNature =>
  isLiabilityAccountType(type) ? 'liability' : 'asset';
