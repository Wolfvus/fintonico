import React, { useMemo } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { TrendingUp, PieChart, AlertTriangle, Download } from 'lucide-react';
import { ExpenseList } from './ExpenseList';

export const Dashboard: React.FC = () => {
  const { expenses, getMonthlyTotal, getExpensesByRating } = useExpenseStore();

  const monthlyStats = useMemo(() => {
    const total = getMonthlyTotal();
    const byRating = getExpensesByRating();
    return { total, byRating };
  }, [getMonthlyTotal, getExpensesByRating]);

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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Monthly Overview</h2>
          <button 
            onClick={handleExport} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                     border-amber-500 text-amber-600 dark:text-amber-400
                     hover:bg-amber-500 hover:text-white"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
              <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
              ${monthlyStats.total.toFixed(2)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Essential</span>
              <PieChart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">
              ${(monthlyStats.byRating.essential || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {monthlyStats.total > 0 ? ((monthlyStats.byRating.essential || 0) / monthlyStats.total * 100).toFixed(1) : '0.0'}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Non-Essential & Luxury</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              ${((monthlyStats.byRating.non_essential || 0) + (monthlyStats.byRating.luxury || 0)).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {monthlyStats.total > 0 ? (((monthlyStats.byRating.non_essential || 0) + (monthlyStats.byRating.luxury || 0)) / monthlyStats.total * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>
      </div>

      <ExpenseList expenses={expenses} loading={false} />
    </div>
  );
};