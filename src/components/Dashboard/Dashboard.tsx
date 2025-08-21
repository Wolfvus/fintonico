import React, { useMemo, useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Landmark, PiggyBank, ArrowUpDown, PieChart, Scissors, LayoutGrid } from 'lucide-react';
import { formatDate, parseLocalDate } from '../../utils/dateFormat';
import { CurrencyBadge } from '../Shared/CurrencyBadge';
import { TestDataAdmin } from '../Admin/TestDataAdmin';
import type { AccountType } from '../../types';

interface DashboardProps {
  onNavigate?: (tab: 'income' | 'expenses' | 'assets' | 'liabilities' | 'networth') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { expenses } = useExpenseStore();
  const { incomes, generateInvestmentYields } = useIncomeStore();
  const { accounts } = useAccountStore();
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  const [entryFilter, setEntryFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransactionsCollapsed, setIsTransactionsCollapsed] = useState(false);
  const itemsPerPage = 10;
  
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
    // For now, return a static comparison since we don't have historical data
    // In a real app, you'd calculate from stored historical net worth data
    const previousNetWorth = netWorth * 0.95; // Assume 5% growth for demo
    const change = netWorth - previousNetWorth;
    const changePercent = previousNetWorth > 0 ? (change / previousNetWorth) * 100 : 0;
    return {
      previousNetWorth,
      change,
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

  // Calculate KPIs
  const monthlyCashFlow = periodIncome - periodExpenses;
  const savingsRate = periodIncome > 0 ? ((periodIncome - periodExpenses) / periodIncome) * 100 : 0;
  
  // State for insights tabs
  const [activeInsightTab, setActiveInsightTab] = useState<'overview' | 'analytics' | 'optimize'>('overview');

  // Reusable styles
  const kpiLabelStyle = "text-sm font-bold text-gray-900 dark:text-white";
  const kpiIconStyle = "w-4 h-4 text-gray-900 dark:text-white";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero Net Worth Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-3 sm:p-4 border border-blue-200 dark:border-gray-700">
        {/* Mobile Layout - Centered */}
        <div className="block lg:hidden">
          <button 
            onClick={() => onNavigate?.('networth')}
            className="text-center mb-2 w-full hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl p-3 transition-colors"
          >
            <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-1">
              <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Total Net Worth</h2>
            <div className="flex items-center justify-center gap-3">
              <p className={`text-3xl sm:text-4xl font-bold ${
                netWorth >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatAmount(netWorth)}
              </p>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                netWorthChange >= 0 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {netWorthChange >= 0 ? '↑' : '↓'}
                {Math.abs(netWorthChangePercent).toFixed(1)}%
              </div>
            </div>
          </button>
          
          {/* Assets and Liabilities Summary - Mobile */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-200 dark:border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
              </div>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {formatAmount(totalAssets)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Liabilities</p>
              </div>
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                {formatAmount(totalLiabilities)}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Left/Right Split */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          {/* Left Side - Net Worth */}
          <button 
            onClick={() => onNavigate?.('networth')}
            className="flex items-center gap-4 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl p-3 transition-colors"
          >
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Landmark className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 text-left">Total Net Worth</h2>
              <div className="flex items-center gap-3">
                <p className={`text-3xl font-bold ${
                  netWorth >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatAmount(netWorth)}
                </p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                  netWorthChange >= 0 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {netWorthChange >= 0 ? '↑' : '↓'}
                  {Math.abs(netWorthChangePercent).toFixed(1)}%
                </div>
              </div>
            </div>
          </button>

          {/* Right Side - Assets and Liabilities Stack */}
          <div className="flex flex-col gap-2">
            {/* Assets */}
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(totalAssets)}
                </p>
              </div>
            </div>
            
            {/* Liabilities */}
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Liabilities</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                  {formatAmount(totalLiabilities)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2">
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
            <div className="flex items-center justify-center sm:justify-start gap-2">
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
            <div className="flex items-center justify-center sm:justify-start gap-2">
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
            <div className="flex items-center justify-center sm:justify-start gap-2">
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Monthly Cash Flow */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpDown className={kpiIconStyle} />
            <p className={kpiLabelStyle}>Cash Flow</p>
          </div>
          <p className={`text-lg font-bold ${
            monthlyCashFlow >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatAmount(monthlyCashFlow)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {monthlyCashFlow >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className={kpiIconStyle} />
            <p className={kpiLabelStyle}>Savings Rate</p>
          </div>
          <p className={`text-lg font-bold ${
            savingsRate >= 20 
              ? 'text-green-600 dark:text-green-400' 
              : savingsRate >= 10
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {savingsRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            of income
          </p>
        </div>

        {/* Monthly Income */}
        <button 
          onClick={() => onNavigate?.('income')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left w-full"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={kpiIconStyle} />
            <p className={kpiLabelStyle}>Income</p>
          </div>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatAmount(periodIncome)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredIncomes.length} transactions
          </p>
        </button>

        {/* Monthly Expenses */}
        <button 
          onClick={() => onNavigate?.('expenses')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left w-full"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className={kpiIconStyle} />
            <p className={kpiLabelStyle}>Expenses</p>
          </div>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatAmount(periodExpenses)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredExpenses.length} transactions
          </p>
        </button>
      </div>

      {/* Two Column Layout: Transactions and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Recent Transactions (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                <button
                  onClick={() => setIsTransactionsCollapsed(!isTransactionsCollapsed)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        </div>

        {/* Right Column: Insights Panel (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Tabs Header */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => setActiveInsightTab('overview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeInsightTab === 'overview'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveInsightTab('analytics')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeInsightTab === 'analytics'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <PieChart className="w-4 h-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveInsightTab('optimize')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeInsightTab === 'optimize'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Scissors className="w-4 h-4" />
                    <span className="hidden sm:inline">Optimize</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeInsightTab === 'overview' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Stats</h4>
                  
                  {/* Top Categories */}
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Top Expense Categories</p>
                    <div className="space-y-2">
                      {['essential', 'non_essential', 'luxury'].map((rating) => {
                        const categoryExpenses = filteredExpenses.filter(e => e.rating === rating);
                        const categoryTotal = categoryExpenses.reduce((sum, e) => 
                          sum + convertAmount(e.amount, e.currency, baseCurrency), 0
                        );
                        const percentage = periodExpenses > 0 ? (categoryTotal / periodExpenses) * 100 : 0;
                        
                        return categoryTotal > 0 ? (
                          <div key={rating} className="flex items-center justify-between">
                            <span className="text-xs capitalize text-gray-700 dark:text-gray-300">
                              {rating.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    rating === 'essential' ? 'bg-green-500' :
                                    rating === 'non_essential' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Account Distribution</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {accounts.filter(a => assetTypes.includes(a.type)).length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Assets</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {accounts.filter(a => liabilityTypes.includes(a.type)).length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Liabilities</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeInsightTab === 'analytics' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Spending Analysis</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Detailed analytics coming soon. Track spending patterns, identify trends, and visualize your financial habits.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Charts and graphs will appear here
                    </p>
                  </div>
                </div>
              )}

              {activeInsightTab === 'optimize' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Optimization Tips</h4>
                  
                  {/* Savings Potential */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs font-medium text-gray-900 dark:text-white">Savings Potential</p>
                    </div>
                    {(() => {
                      const nonEssentialTotal = filteredExpenses
                        .filter(e => e.rating === 'non_essential' || e.rating === 'luxury')
                        .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, baseCurrency), 0);
                      
                      return nonEssentialTotal > 0 ? (
                        <>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {formatAmount(nonEssentialTotal)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            in non-essential spending
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Great job! All spending is essential.
                        </p>
                      );
                    })()}
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Quick Tips:</p>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-1">
                        <span className="text-green-500">•</span>
                        <span>Aim for a 20% or higher savings rate</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-yellow-500">•</span>
                        <span>Review non-essential expenses monthly</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        <span>Track spending patterns over time</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Data Admin - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <TestDataAdmin />
      )}
    </div>
  );
};