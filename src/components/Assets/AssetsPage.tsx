import React from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { AssetForm } from '../AssetForm/AssetForm';
import { TrendingUp, Edit, Trash2 } from 'lucide-react';
import { TransactionList } from '../Shared/TransactionList';
import type { AccountType } from '../../types';

export const AssetsPage: React.FC = () => {
  const { accounts, deleteAccount } = useAccountStore();
  const { baseCurrency, convertAmount, formatAmount } = useCurrencyStore();

  // Define which account types are assets
  const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
  
  // Filter only asset accounts
  const assetAccounts = accounts.filter(account => assetTypes.includes(account.type));

  // Convert assets to transaction format for the list
  const assetTransactions = assetAccounts.map(account => {
    const totalBalance = account.balances.reduce((sum, balance) => {
      return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
    }, 0);

    return {
      id: account.id,
      description: account.name,
      amount: totalBalance,
      currency: baseCurrency,
      date: new Date().toISOString().split('T')[0], // Current date as placeholder
      type: 'asset' as const,
      category: account.type,
      accountType: account.type,
      balances: account.balances
    };
  });

  const handleDeleteAsset = (assetId: string) => {
    const asset = assetAccounts.find(a => a.id === assetId);
    if (asset && window.confirm(`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`)) {
      deleteAccount(assetId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <AssetForm />
        </div>
        <div className="lg:col-span-2">
          <TransactionList
            title="Your Assets"
            transactions={assetTransactions}
            onDelete={handleDeleteAsset}
            emptyMessage="No assets yet. Add your first asset account to get started."
            renderCustomContent={(transaction) => (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {transaction.accountType?.replace('-', ' ')}
                  </span>
                </div>
                
                {/* Multi-currency balances */}
                {transaction.balances && transaction.balances.length > 1 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Currency breakdown:
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {transaction.balances.map((balance, index) => (
                        <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                          {balance.currency}: {formatAmount(balance.amount, balance.currency)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};