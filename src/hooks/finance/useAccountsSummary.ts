// Hook that calculates account totals, net worth, and categorizes assets vs liabilities
import { useMemo } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import type { AccountType } from '../../types';

interface AccountsSummaryResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetTypes: AccountType[];
  liabilityTypes: AccountType[];
  accounts: ReturnType<typeof useAccountStore>['accounts'];
}

export const useAccountsSummary = (): AccountsSummaryResult => {
  const { accounts } = useAccountStore();
  const { baseCurrency, convertAmount } = useCurrencyStore();

  return useMemo(() => {
    const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
    const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];

    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach(account => {
      const accountTotal = account.balances.reduce((sum: number, balance: any) => {
        return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
      }, 0);

      if (assetTypes.includes(account.type)) {
        totalAssets += accountTotal;
      } else if (liabilityTypes.includes(account.type)) {
        totalLiabilities += accountTotal;
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetTypes,
      liabilityTypes,
      accounts
    };
  }, [accounts, baseCurrency, convertAmount]);
};