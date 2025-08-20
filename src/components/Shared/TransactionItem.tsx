import React from 'react';
import { Trash2 } from 'lucide-react';
import { CurrencyBadge } from './CurrencyBadge';
import { formatDate } from '../../utils/dateFormat';
import { useCurrencyStore } from '../../stores/currencyStore';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  type: 'income' | 'expense' | 'asset' | 'liability';
  category?: string;
  frequency?: string;
  rating?: string;
  recurring?: boolean;
  accountType?: string;
  balances?: Array<{ currency: string; amount: number }>;
  dueDate?: string;
  recurringDueDate?: number;
}

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  renderCustomContent?: (transaction: Transaction) => React.ReactNode;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
  renderCustomContent
}) => {
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group border border-gray-200 dark:border-gray-700">
      <div className="hidden sm:flex sm:items-center sm:gap-3 sm:flex-1 sm:min-w-0">
        <div 
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            transaction.type === 'income' || transaction.type === 'asset' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {transaction.description}
            </p>
            {transaction.category && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                transaction.type === 'income'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : transaction.rating === 'essential'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : transaction.rating === 'non_essential'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {transaction.category}
              </span>
            )}
            {transaction.recurring && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                recurring
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="block sm:hidden w-full mt-2">
        {/* Top line: Description (left) + Amount (right) */}
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white flex-1 min-w-0 pr-2">
            {transaction.description}
          </p>
          <p className={`text-sm font-medium flex-shrink-0 ${
            transaction.type === 'income' || transaction.type === 'asset'
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {(transaction.type === 'income' || transaction.type === 'asset') ? '+' : '-'}
            {formatAmount(convertAmount(transaction.amount, transaction.currency, baseCurrency))}
          </p>
        </div>
        
        {/* Bottom line: Tags (left) + Date/Currency/Delete (right) */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {transaction.category && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                transaction.type === 'income'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : transaction.rating === 'essential'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : transaction.rating === 'non_essential'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {transaction.category}
              </span>
            )}
            {transaction.recurring && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                recurring
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(transaction.date)}
            </p>
            <CurrencyBadge 
              currency={transaction.currency} 
              baseCurrency={baseCurrency}
            />
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Content */}
      {renderCustomContent && (
        <div className="mt-2 px-1">
          {renderCustomContent(transaction)}
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-3 sm:flex-shrink-0">
        <div className="text-right">
          <p className={`text-sm font-medium ${
            transaction.type === 'income' || transaction.type === 'asset'
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {(transaction.type === 'income' || transaction.type === 'asset') ? '+' : '-'}
            {formatAmount(convertAmount(transaction.amount, transaction.currency, baseCurrency))}
          </p>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(transaction.date)}
            </p>
            <CurrencyBadge 
              currency={transaction.currency} 
              baseCurrency={baseCurrency}
            />
          </div>
        </div>
        
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};