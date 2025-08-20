import React from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { LiabilityForm } from '../LiabilityForm/LiabilityForm';
import { TrendingDown, Calendar } from 'lucide-react';
import { DataList } from '../Shared/DataList';
import { TransactionItem, type Transaction } from '../Shared/TransactionItem';
import type { AccountType } from '../../types';

export const LiabilitiesPage: React.FC = () => {
  const { accounts, deleteAccount } = useAccountStore();
  const { baseCurrency, convertAmount, formatAmount } = useCurrencyStore();

  // Define which account types are liabilities
  const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];
  
  // Filter only liability accounts
  const liabilityAccounts = accounts.filter(account => liabilityTypes.includes(account.type));

  // Convert liabilities to transaction format for the list
  const liabilityTransactions: Transaction[] = liabilityAccounts.map(account => {
    const totalBalance = account.balances.reduce((sum, balance) => {
      return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
    }, 0);

    return {
      id: account.id,
      description: account.name,
      amount: totalBalance,
      currency: baseCurrency,
      date: account.dueDate || new Date().toISOString().split('T')[0],
      type: 'liability' as const,
      category: account.type,
      accountType: account.type,
      balances: account.balances,
      dueDate: account.dueDate,
      recurringDueDate: account.recurringDueDate
    };
  });

  const handleDeleteLiability = (liabilityId: string) => {
    const liability = liabilityAccounts.find(l => l.id === liabilityId);
    if (liability && window.confirm(`Are you sure you want to delete "${liability.name}"? This action cannot be undone.`)) {
      deleteAccount(liabilityId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <LiabilityForm />
        </div>
        <div className="lg:col-span-2">
          <DataList
            title="Your Liabilities"
            items={liabilityTransactions}
            renderItem={(transaction, onDelete) => (
              <TransactionItem 
                transaction={transaction} 
                onDelete={onDelete}
                renderCustomContent={(transaction) => (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {transaction.accountType?.replace('-', ' ')}
                      </span>
                    </div>
                    
                    {/* Due Date and Recurring Info */}
                    {(transaction.dueDate || transaction.recurringDueDate) && ['credit-card', 'loan', 'mortgage'].includes(transaction.accountType || '') && (
                      <div className="mb-2 space-y-1">
                        {transaction.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {new Date(transaction.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {transaction.recurringDueDate && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Monthly: Day {transaction.recurringDueDate}
                          </div>
                        )}
                      </div>
                    )}
                    
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
            )}
            onDelete={handleDeleteLiability}
            emptyMessage="No liabilities yet. Add your first liability account to get started."
            enableDateFilter={false}
            enableSorting={false}
          />
        </div>
      </div>
    </div>
  );
};