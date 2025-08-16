import React, { useState, useMemo } from 'react';
import { Trash2, DollarSign, ArrowUpDown, Calendar, Hash } from 'lucide-react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { formatDate } from '../../utils/dateFormat';
import type { Expense } from '../../types';

interface ExpenseListProps {
  expenses: Expense[] | undefined;
  loading: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, loading }) => {
  const { deleteExpense } = useExpenseStore();
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'date' | 'amount' | 'rating') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    const sorted = [...expenses].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount': {
          const amountA = convertAmount(a.amount, a.currency, baseCurrency);
          const amountB = convertAmount(b.amount, b.currency, baseCurrency);
          comparison = amountA - amountB;
          break;
        }
        case 'rating': {
          const ratingOrder = { 'essential': 1, 'non_essential': 2, 'luxury': 3 };
          comparison = (ratingOrder[a.rating as keyof typeof ratingOrder] || 4) - 
                      (ratingOrder[b.rating as keyof typeof ratingOrder] || 4);
          break;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [expenses, sortBy, sortOrder, convertAmount, baseCurrency]);

  const getRatingStyle = (rating: string) => {
    switch (rating) {
      case 'essential':
        return {
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: '#10B981',
          textColor: '#10B981',
          label: 'Essential'
        };
      case 'non_essential':
        return {
          bgColor: 'rgba(234, 179, 8, 0.1)',
          borderColor: '#EAB308',
          textColor: '#CA8A04',
          label: 'Non-Essential'
        };
      case 'luxury':
        return {
          bgColor: 'rgba(220, 38, 38, 0.1)',
          borderColor: '#DC2626',
          textColor: '#DC2626',
          label: 'Luxury'
        };
      default:
        return {
          bgColor: 'rgba(30, 42, 56, 0.05)',
          borderColor: 'rgba(30, 42, 56, 0.3)',
          textColor: '#1E2A38',
          label: rating
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-green-500"></div>
          Loading expenses...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('date')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 transition-all
                     ${sortBy === 'date' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            <Calendar className="w-3 h-3" />
            Date
            {sortBy === 'date' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => handleSort('amount')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 transition-all
                     ${sortBy === 'amount' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            <DollarSign className="w-3 h-3" />
            Amount
            {sortBy === 'amount' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => handleSort('rating')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 transition-all
                     ${sortBy === 'rating' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            <Hash className="w-3 h-3" />
            Priority
            {sortBy === 'rating' && <ArrowUpDown className="w-3 h-3" />}
          </button>
        </div>
      </div>
      
      {(expenses || []).length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No expenses yet this month
        </div>
      ) : (
        <div className="space-y-2">
          {sortedExpenses.map((expense) => {
            const ratingStyle = getRatingStyle(expense.rating);
            return (
              <div
                key={expense.id}
                className="rounded-lg transition-all hover:shadow-md 
                         bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              >
                <div className="p-2 sm:p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm text-gray-900 dark:text-white">
                        {formatAmount(convertAmount(expense.amount, expense.currency, baseCurrency), baseCurrency)}
                      </span>
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-300 truncate">
                        {expense.what}
                      </span>
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-1.5 py-0.5 text-xs font-medium rounded-full shrink-0"
                          style={{
                            backgroundColor: ratingStyle.bgColor,
                            border: `1px solid ${ratingStyle.borderColor}`,
                            color: ratingStyle.textColor
                          }}
                        >
                          {ratingStyle.label}
                        </span>
                        {expense.recurring && (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 
                                         text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 shrink-0">
                            recurring
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {formatDate(expense.date)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="p-1.5 rounded-lg transition-all text-red-600 dark:text-red-400 
                               hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};