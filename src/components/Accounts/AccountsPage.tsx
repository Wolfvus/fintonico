import React from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { AccountForm } from './AccountForm';
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
        totalLiabilities += accountTotal;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  };

  const { totalAssets, totalLiabilities, netWorth } = calculateTotals();

  // Render the Summary
  return (
    <div className="space-y-6">
      {/* Financial Summary - Three Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Assets Card */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Assets</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatAmount(totalAssets)}
          </p>
        </div>

        {/* Total Liabilities Card */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Liabilities</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalLiabilities)}
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
        </div>
      </div>

      {/* Account Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountForm />
        
        {/* Account List */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Accounts</h3>
          
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No accounts yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Use the form to add your first account
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map(account => (
                <div key={account.id} className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {account.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {account.type.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Multi-currency balances */}
                  <div className="space-y-1">
                    {account.balances.map((balance, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {balance.currency}
                        </span>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {formatAmount(balance.amount, balance.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};