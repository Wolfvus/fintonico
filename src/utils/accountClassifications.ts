import type { AccountType } from '../types';
import type { AccountNature } from '../domain/ledger';
import type { AccountSubtype } from '../config/accountRegistry';

export const ASSET_ACCOUNT_TYPES: AccountType[] = [
  'cash',
  'bank',
  'exchange',
  'investment',
  'property',
  'other',
];

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = ['loan', 'credit-card', 'mortgage'];

export const LIQUID_ASSET_TYPES: AccountType[] = ['cash', 'bank', 'exchange'];
export const LIQUID_LEDGER_SUBTYPES: AccountSubtype[] = ['operating-cash', 'savings'];

export const isAssetAccountType = (type: AccountType): boolean => ASSET_ACCOUNT_TYPES.includes(type);

export const isLiabilityAccountType = (type: AccountType): boolean =>
  LIABILITY_ACCOUNT_TYPES.includes(type);

export const isBalanceSheetAccountType = (type: AccountType): boolean =>
  isAssetAccountType(type) || isLiabilityAccountType(type);

export const accountTypeToNature = (type: AccountType): AccountNature =>
  isLiabilityAccountType(type) ? 'liability' : 'asset';

export const isLiquidAssetType = (type: AccountType): boolean => LIQUID_ASSET_TYPES.includes(type);

export const isLiquidLedgerSubtype = (subtype: AccountSubtype): boolean =>
  LIQUID_LEDGER_SUBTYPES.includes(subtype);
