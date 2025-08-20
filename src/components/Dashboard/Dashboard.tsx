import React, { useMemo, useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity, Filter, Calendar, ChevronLeft, ChevronRight, CreditCard, ChevronUp, ChevronDown, Landmark, BarChart3 } from 'lucide-react';
import { formatDate, parseLocalDate } from '../../utils/dateFormat';
import { CurrencyBadge } from '../Shared/CurrencyBadge';
import { TestDataAdmin } from '../Admin/TestDataAdmin';
import type { AccountType } from '../../types';

interface DashboardProps {
  onNavigate?: (tab: 'income' | 'expenses' | 'assets' | 'liabilities' | 'networth') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { expenses, deleteExpense } = useExpenseStore();
  const { incomes, generateInvestmentYields, deleteIncome } = useIncomeStore();
  const { accounts } = useAccountStore();
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  const [entryFilter, setEntryFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransactionsCollapsed, setIsTransactionsCollapsed] = useState(false);
  const itemsPerPage = 20;
  
  // Generate investment yields on dashboard load
  React.useEffect(() => {
    generateInvestmentYields();
  }, [generateInvestmentYields]);

  // Calculate date range based on view mode
  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;
    
    if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);
    } else if (viewMode === 'year') {
      const year = selectedDate.getFullYear();
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      startDate = customStartDate ? new Date(customStartDate) : new Date();
      endDate = customEndDate ? new Date(customEndDate) : new Date();
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Filter transactions for date range
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = parseLocalDate(expense.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
  
  const filteredIncomes = incomes.filter(income => {
    const incomeDate = parseLocalDate(income.date);
    return incomeDate >= startDate && incomeDate <= endDate;
  });
  
  // Calculate totals for the selected period
  const periodExpenses = filteredExpenses.reduce((sum, expense) => 
    sum + convertAmount(expense.amount, expense.currency, baseCurrency), 0
  );
  
  const periodIncome = filteredIncomes.reduce((sum, income) => 
    sum + convertAmount(income.amount, income.currency, baseCurrency), 0
  );
  
  const periodBalance = periodIncome - periodExpenses;

  // Calculate account totals
  const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
  const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];

  const calculateAccountTotals = () => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach(account => {
      const accountTotal = account.balances.reduce((sum, balance) => {
        return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
      }, 0);

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

  const { totalAssets, totalLiabilities, netWorth } = calculateAccountTotals();

  // Calculate previous month's net worth for comparison
  const getPreviousMonthNetWorth = () => {
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    // For now, return a simulated change - in a real app, you'd calculate from historical data
    const changePercent = Math.random() * 20 - 10; // Random change between -10% and +10%
    const previousNetWorth = netWorth / (1 + changePercent / 100);
    return {
      previousNetWorth,
      change: netWorth - previousNetWorth,
      changePercent
    };
  };

  const { change: netWorthChange, changePercent: netWorthChangePercent } = getPreviousMonthNetWorth();

  // Combine and sort transactions for display
  const allTransactions = useMemo(() => {
    const allItems = [
      ...filteredExpenses.map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        description: expense.what,
        amount: expense.amount,
        currency: expense.currency,
        date: expense.date,
        category: expense.rating,
        recurring: expense.recurring
      })),
      ...filteredIncomes.map(income => ({
        id: income.id,
        type: 'income' as const,
        description: income.source,
        amount: income.amount,
        currency: income.currency,
        date: income.date,
        category: income.frequency,
        recurring: false
      }))
    ];

    return allItems
      .filter(item => {
        if (entryFilter === 'all') return true;
        return item.type === entryFilter;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses, filteredIncomes, entryFilter]);

  // Navigation helpers
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
  };

  // Pagination
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Net Worth Card */}
      <div className="relative">
        <div 
          className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-750 transition-colors"
          onClick={() => onNavigate?.('networth')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                netWorth >= 0 
                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <Landmark className={`w-5 h-5 ${
                  netWorth >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Net Worth</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your total financial position</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className={`text-2xl font-bold mb-1 ${
                netWorth >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatAmount(netWorth)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across {accounts.length} accounts
              </p>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${
                netWorthChange >= 0 
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {netWorthChange >= 0 ? '↗️' : '↘️'}
                <span>
                  {netWorthChange >= 0 ? '+' : ''}{formatAmount(netWorthChange)} ({netWorthChangePercent >= 0 ? '+' : ''}{netWorthChangePercent.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs last month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly Balance Card */}
        <div 
          className={`rounded-xl shadow-lg p-4 cursor-pointer transition-colors border ${
            periodBalance >= 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
          }`}
          onClick={() => setViewMode('month')}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${
              periodBalance >= 0 
                ? 'bg-green-100 dark:bg-green-800/50' 
                : 'bg-red-100 dark:bg-red-800/50'
            }`}>
              <BarChart3 className={`w-5 h-5 ${
                periodBalance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Monthly Balance</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <p className={`text-xl font-bold mb-1 ${
            periodBalance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatAmount(periodBalance)}
          </p>
          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
            periodBalance >= 0 
              ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300'
          }`}>
            {periodBalance >= 0 ? '📈 Surplus' : '📉 Deficit'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Income</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">+{formatAmount(periodIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Expenses</span>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">-{formatAmount(periodExpenses)}</span>
            </div>
            <div className="border-t border-blue-200 dark:border-gray-600 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-900 dark:text-white">Net</span>
                <span className={`text-sm font-bold ${
                  periodBalance >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatAmount(periodBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income & Expenses Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Income Card */}
        <div 
          className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-blue-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-750 transition-colors"
          onClick={() => onNavigate?.('income')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Income</h3>
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(periodIncome)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {filteredIncomes.length} transactions
          </p>
        </div>

        {/* Expenses Card */}
        <div 
          className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-blue-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-750 transition-colors"
          onClick={() => onNavigate?.('expenses')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Expenses</h3>
            <Wallet className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(periodExpenses)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {filteredExpenses.length} transactions
          </p>
        </div>
      </div>

      {/* Assets & Liabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Assets Card */}
        <div 
          className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-blue-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-750 transition-colors"
          onClick={() => onNavigate?.('assets')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Assets</h3>
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(totalAssets)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {accounts.filter(a => assetTypes.includes(a.type)).length} accounts
          </p>
        </div>

        {/* Liabilities Card */}
        <div 
          className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-blue-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-750 transition-colors"
          onClick={() => onNavigate?.('liabilities')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Liabilities</h3>
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalLiabilities)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {accounts.filter(a => liabilityTypes.includes(a.type)).length} accounts
          </p>
        </div>
      </div>

      {/* Time Period Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Time Period:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Navigation Controls */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}

          {viewMode === 'year' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateYear('prev')}
                className="p-2 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[80px] text-center">
                {selectedDate.getFullYear()}
              </span>
              <button
                onClick={() => navigateYear('next')}
                className="p-2 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}

          {viewMode === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <button
              onClick={() => setIsTransactionsCollapsed(!isTransactionsCollapsed)}
              className="p-2 hover:bg-blue-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isTransactionsCollapsed ? (
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          
          {!isTransactionsCollapsed && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
              <select
                value={entryFilter}
                onChange={(e) => setEntryFilter(e.target.value as typeof entryFilter)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
          )}
        </div>

        {!isTransactionsCollapsed && (
          <div className="p-4">
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No transactions found for the selected period
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'income' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatAmount(convertAmount(transaction.amount, transaction.currency, baseCurrency))}
                      </p>
                      <CurrencyBadge 
                        currency={transaction.currency} 
                        baseCurrency={baseCurrency}
                      />
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages} ({allTransactions.length} total)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Data Admin - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <TestDataAdmin />
      )}
    </div>
  );
};