import React from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { AccountType } from '../../types';

export const AccountsPage: React.FC = () => {
  // Connect to State
  const { accounts } = useAccountStore();
  const { baseCurrency, convertAmount, formatAmount } = useCurrencyStore();

  // Define which account types are assets vs liabilities
  const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
  const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];

  // Calculate Totals
  const calculateTotals = () => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach(account => {
      // Sum all balances for this account
      const accountTotal = account.balances.reduce((sum, balance) => {
        // Convert each balance to baseCurrency before adding
        const convertedAmount = convertAmount(balance.amount, balance.currency, baseCurrency);
        return sum + convertedAmount;
      }, 0);

      // Determine if this account is an asset or liability
      if (assetTypes.includes(account.type)) {
        totalAssets += accountTotal;
      } else if (liabilityTypes.includes(account.type)) {
        // Liabilities are stored as negative values (debt), normalize to positive
        totalLiabilities += Math.abs(accountTotal);
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  };

  const { totalAssets, totalLiabilities, netWorth } = calculateTotals();

  // Filter accounts by type
  const assetAccounts = accounts.filter(account => assetTypes.includes(account.type));
  const liabilityAccounts = accounts.filter(account => liabilityTypes.includes(account.type));

  return (
    <div className="space-y-6">
      {/* Financial Summary - Three Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Assets Card */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Assets</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(totalAssets)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {assetAccounts.length} accounts
          </p>
        </div>

        {/* Total Liabilities Card */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Liabilities</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalLiabilities)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {liabilityAccounts.length} accounts
          </p>
        </div>

        {/* Net Worth Card */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Worth</h3>
          <p className={`text-xl sm:text-2xl font-bold ${
            netWorth >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatAmount(netWorth)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {accounts.length} total accounts
          </p>
        </div>
      </div>

      {/* Quick Account Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Overview */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assets</h3>
            </div>
            
            {assetAccounts.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No assets yet. Go to the Assets tab to add accounts.
              </p>
            ) : (
              <div className="space-y-3">
                {assetAccounts.slice(0, 5).map(account => {
                  const accountTotal = account.balances.reduce((sum, balance) => {
                    return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
                  }, 0);
                  
                  return (
                    <div key={account.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {account.type.replace('-', ' ')}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatAmount(accountTotal)}
                      </p>
                    </div>
                  );
                })}
                {assetAccounts.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{assetAccounts.length - 5} more accounts
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Liabilities Overview */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Liabilities</h3>
            </div>
            
            {liabilityAccounts.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No liabilities yet. Go to the Liabilities tab to add accounts.
              </p>
            ) : (
              <div className="space-y-3">
                {liabilityAccounts.slice(0, 5).map(account => {
                  const accountTotal = account.balances.reduce((sum, balance) => {
                    return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
                  }, 0);

                  return (
                    <div key={account.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {account.type.replace('-', ' ')}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        {formatAmount(Math.abs(accountTotal))}
                      </p>
                    </div>
                  );
                })}
                {liabilityAccounts.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{liabilityAccounts.length - 5} more accounts
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Message */}
      {accounts.length === 0 && (
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Your Financial Overview
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start building your net worth by adding your first accounts.
          </p>
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Assets Tab</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cash, Bank, Investments</p>
            </div>
            <div className="text-center">
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Liabilities Tab</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Credit Cards, Loans</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};