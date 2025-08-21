// Hook that provides memoized account summary using finance selectors
import { useMemo } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { getNetWorthAt } from '../../selectors/finance';
import type { AccountType, Account } from '../../types';

interface AccountsSummaryResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetTypes: AccountType[];
  liabilityTypes: AccountType[];
  accounts: Account[];
}

export const useAccountsSummary = (): AccountsSummaryResult => {
  const { accounts } = useAccountStore();

  return useMemo(() => {
    const netWorthData = getNetWorthAt(new Date());
    const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
    const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];

    return {
      totalAssets: netWorthData.breakdown.external.assets.toMajorUnits(),
      totalLiabilities: netWorthData.breakdown.external.liabilities.toMajorUnits(),
      netWorth: netWorthData.netWorth.toMajorUnits(),
      assetTypes,
      liabilityTypes,
      accounts
    };
  }, [accounts]);
};