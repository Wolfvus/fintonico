import React, { useMemo } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, PieChart, AlertTriangle, Download } from 'lucide-react';
import { ExpenseList } from './ExpenseList';

export const Dashboard: React.FC = () => {
  const { expenses, getMonthlyTotal, getExpensesByRating } = useExpenseStore();
  const { formatAmount } = useCurrencyStore();

  const monthlyStats = useMemo(() => {
    const total = getMonthlyTotal();
    const byRating = getExpensesByRating();
    return { total, byRating };
  }, [getMonthlyTotal, getExpensesByRating, formatAmount]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Description', 'Amount', 'Rating'],
      ...expenses.map(e => [e.date, e.what, e.amount.toString(), e.rating])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Monthly Overview</h2>
          
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <div className="flex-1 min-w-[140px] max-w-[200px] p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Total</span>
              </div>
              <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                {formatAmount(monthlyStats.total)}
              </p>
            </div>

            <div className="flex-1 min-w-[140px] max-w-[200px] p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <PieChart className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Essential</span>
              </div>
              <p className="text-lg font-bold font-mono text-green-600 dark:text-green-400">
                {formatAmount(monthlyStats.byRating.essential || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {monthlyStats.total > 0 ? ((monthlyStats.byRating.essential || 0) / monthlyStats.total * 100).toFixed(0) : '0'}%
              </p>
            </div>

            <div className="flex-1 min-w-[140px] max-w-[200px] p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Non-Essential</span>
              </div>
              <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {formatAmount((monthlyStats.byRating.non_essential || 0) + (monthlyStats.byRating.luxury || 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {monthlyStats.total > 0 ? (((monthlyStats.byRating.non_essential || 0) + (monthlyStats.byRating.luxury || 0)) / monthlyStats.total * 100).toFixed(0) : '0'}%
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleExport} 
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all
                       border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <ExpenseList expenses={expenses} loading={false} />
    </div>
  );
};