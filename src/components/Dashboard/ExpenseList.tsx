import React from 'react';
import { Trash2, DollarSign } from 'lucide-react';
import { useExpenseStore, type Expense } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';

interface ExpenseListProps {
  expenses: Expense[] | undefined;
  loading: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, loading }) => {
  const { deleteExpense } = useExpenseStore();
  const { formatAmount, baseCurrency, convertAmount, exchangeRates } = useCurrencyStore();

  const getRatingStyle = (rating: string) => {
    switch (rating) {
      case 'essential':
        return {
          bgColor: 'rgba(47, 165, 169, 0.1)',
          borderColor: '#2FA5A9',
          textColor: '#2FA5A9',
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
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-teal-500"></div>
          Loading expenses...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Expenses</h3>
      
      {(expenses || []).length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No expenses yet this month
        </div>
      ) : (
        <div className="space-y-3">
          {(expenses || []).map((expense) => {
            const ratingStyle = getRatingStyle(expense.rating);
            return (
              <div
                key={expense.id}
                className="rounded-lg p-3 sm:p-4 transition-all hover:shadow-md 
                         bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {expense.what}
                      </span>
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full shrink-0"
                        style={{
                          backgroundColor: ratingStyle.bgColor,
                          border: `1px solid ${ratingStyle.borderColor}`,
                          color: ratingStyle.textColor
                        }}
                      >
                        {ratingStyle.label}
                      </span>
                      {expense.recurring && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 
                                       text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 shrink-0">
                          recurring
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-mono font-semibold text-amber-600 dark:text-white">
                        {formatAmount(convertAmount(expense.amount, expense.currency, baseCurrency), baseCurrency)}
                      </span>
                      <span className="text-xs sm:text-sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 rounded-lg transition-all text-red-600 dark:text-red-400 
                             hover:bg-red-50 dark:hover:bg-red-900/20 self-start shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};