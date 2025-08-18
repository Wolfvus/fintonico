import React, { useState, useMemo } from 'react';
import { Filter, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import { useCurrencyStore } from '../../stores/currencyStore';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  type: 'income' | 'expense';
  category?: string;
  frequency?: string;
  rating?: string;
  recurring?: boolean;
}

interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  loading?: boolean;
  showFilters?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  title,
  transactions,
  onDelete,
  loading = false,
  showFilters = true
}) => {
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  const [filter, setFilter] = useState<'all' | 'this-year' | 'custom-month' | 'this-week'>('custom-month');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Format month label
  const getMonthLabel = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply date filter
    if (filter !== 'all') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      // For custom month, use selectedDate
      const startOfSelectedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfSelectedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

      filtered = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        if (filter === 'this-week') {
          return transactionDate >= startOfWeek;
        } else if (filter === 'custom-month') {
          return transactionDate >= startOfSelectedMonth && transactionDate <= endOfSelectedMonth;
        } else if (filter === 'this-year') {
          return transactionDate >= startOfYear;
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'amount') {
        const amountA = convertAmount(a.amount, a.currency, baseCurrency);
        const amountB = convertAmount(b.amount, b.currency, baseCurrency);
        return amountB - amountA;
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [transactions, filter, sortBy, convertAmount, baseCurrency, selectedDate]);

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 shadow-lg">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            
            {showFilters && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="text-base sm:text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Time</option>
                  <option value="this-year">This Year</option>
                  <option value="custom-month">Select Month</option>
                  <option value="this-week">This Week</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-base sm:text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-blue-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="date">By Date</option>
                  <option value="amount">By Amount</option>
                </select>
              </div>
            )}
          </div>

          {/* Month Navigation - Show when custom-month is selected */}
          {showFilters && filter === 'custom-month' && (
            <div className="flex items-center justify-between bg-blue-100 dark:bg-gray-700 rounded-lg p-3">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getMonthLabel()}
                </span>
              </div>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              {/* Today button - show if not current month */}
              {(selectedDate.getMonth() !== new Date().getMonth() || selectedDate.getFullYear() !== new Date().getFullYear()) && (
                <button
                  onClick={goToCurrentMonth}
                  className="ml-2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Current
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="p-3">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No transactions found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
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
                
                <div className="flex items-center gap-3 flex-shrink-0 mt-2 sm:mt-0">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(convertAmount(transaction.amount, transaction.currency, baseCurrency))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                      {formatDate(transaction.date)}
                    </p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};