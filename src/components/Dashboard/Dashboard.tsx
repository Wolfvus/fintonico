import React, { useMemo, useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, Wallet, DollarSign, Activity, Filter, Calendar, ChevronLeft, ChevronRight, CreditCard, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDate, parseLocalDate } from '../../utils/dateFormat';
import { CurrencyBadge } from '../Shared/CurrencyBadge';
import { TestDataAdmin } from '../Admin/TestDataAdmin';

interface DashboardProps {
  onNavigate?: (tab: 'income' | 'expenses' | 'networth') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { expenses, deleteExpense } = useExpenseStore();
  const { incomes, generateInvestmentYields, deleteIncome } = useIncomeStore();
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
  
  // Calculate investment yields for the period
  const investmentYields = filteredIncomes
    .filter(income => income.source.startsWith('Investment yield:'))
    .reduce((sum, income) => sum + convertAmount(income.amount, income.currency, baseCurrency), 0);
  
  const periodBalance = periodIncome - periodExpenses;
  const expensePercentage = periodIncome > 0 ? Math.round((periodExpenses / periodIncome) * 100) : 0;

  // Get assets and liabilities from localStorage
  const getFinancialData = () => {
    const savedAssets = localStorage.getItem('fintonico-assets');
    const savedLiabilities = localStorage.getItem('fintonico-liabilities');
    const assets = savedAssets ? JSON.parse(savedAssets) : [];
    const liabilities = savedLiabilities ? JSON.parse(savedLiabilities) : [];
    
    const totalAssets = assets.reduce((sum: number, asset: any) => {
      const converted = convertAmount(asset.value, asset.currency, baseCurrency);
      return sum + converted;
    }, 0);
    
    const totalLiabilities = liabilities.reduce((sum: number, liability: any) => {
      const converted = convertAmount(liability.value, liability.currency, baseCurrency);
      return sum + converted;
    }, 0);
    
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  };

  const financialData = getFinancialData();

  // Get latest entries for the selected period
  const latestEntries = useMemo(() => {
    const allEntries = [
      ...filteredExpenses.map(e => ({ 
        ...e, 
        type: 'expense' as const,
        displayAmount: formatAmount(convertAmount(e.amount, e.currency, baseCurrency)),
        description: e.what
      })),
      ...filteredIncomes.map(i => ({ 
        ...i, 
        type: 'income' as const,
        displayAmount: formatAmount(convertAmount(i.amount, i.currency, baseCurrency)),
        description: i.source
      }))
    ];
    
    const filtered = entryFilter === 'all' 
      ? allEntries 
      : allEntries.filter(e => e.type === entryFilter);
    
    return filtered
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [filteredExpenses, filteredIncomes, formatAmount, convertAmount, baseCurrency, entryFilter]);
  
  // Navigation functions
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
    setViewMode('month');
  };
  
  // Format period label
  const getPeriodLabel = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (viewMode === 'month') {
      return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    } else if (viewMode === 'year') {
      return `Year ${selectedDate.getFullYear()}`;
    } else {
      return customStartDate && customEndDate 
        ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
        : 'Custom Range';
    }
  };

  const handleDelete = (entry: any) => {
    if (entry.type === 'expense') {
      deleteExpense(entry.id);
    } else if (entry.type === 'income') {
      deleteIncome(entry.id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Balance - FIRST */}
      <div className="bg-slate-100 dark:bg-gray-800 rounded-lg p-4 border border-slate-300 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {viewMode === 'month' ? 'Monthly' : viewMode === 'year' ? 'Yearly' : 'Period'} Balance
            </h3>
            <p className={`text-2xl font-bold ${periodBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatAmount(periodBalance)}
            </p>
          </div>
          <Activity className={`w-8 h-8 ${periodBalance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Period Income */}
        <div 
          className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-slate-300 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onNavigate?.('income')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Income</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
            {formatAmount(periodIncome)}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{filteredIncomes.length} transactions</p>
          </div>
          {investmentYields > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-300 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 dark:text-gray-400">Investment yields</p>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">{formatAmount(investmentYields)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Period Expenses */}
        <div 
          className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-slate-300 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onNavigate?.('expenses')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Expenses</span>
            <Wallet className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
            {formatAmount(periodExpenses)}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{filteredExpenses.length} transactions</p>
            <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
              expensePercentage > 90 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : expensePercentage > 70
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              <span className="hidden xs:inline">{expensePercentage}% of income</span>
              <span className="xs:hidden">{expensePercentage}%</span>
            </span>
          </div>
        </div>

        {/* Net Worth */}
        <div 
          className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-slate-300 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onNavigate?.('networth')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Net Worth</span>
            <TrendingUp className="w-4 h-4 text-yellow-500" />
          </div>
          <p className={`text-base sm:text-lg font-bold ${financialData.netWorth >= 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatAmount(financialData.netWorth)}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Assets - Liabilities</p>
          </div>
        </div>

        {/* Total Liabilities */}
        <div 
          className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-slate-300 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onNavigate?.('networth')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Liabilities</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatAmount(financialData.totalLiabilities)}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total debt</p>
          </div>
        </div>
      </div>

      {/* Date Range Selector - MOVED AFTER SUMMARY CARDS */}
      <div className="bg-slate-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-slate-300 dark:border-gray-700">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          {/* Date Display with Navigation Arrows */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigatePeriod('prev')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              disabled={viewMode === 'custom'}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {getPeriodLabel()}
              </span>
            </div>
            
            <button
              onClick={() => navigatePeriod('next')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              disabled={viewMode === 'custom'}
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* View Mode Controls - Centered Below */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'year'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setViewMode('custom')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'custom'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600'
                }`}
              >
                Custom
              </button>
            </div>
            
            {/* Today button */}
            {(viewMode !== 'custom' && (selectedDate.getMonth() !== new Date().getMonth() || selectedDate.getFullYear() !== new Date().getFullYear())) && (
              <button
                onClick={goToToday}
                className="px-3 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
          {/* Navigation and Period Display */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigatePeriod('prev')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              disabled={viewMode === 'custom'}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {getPeriodLabel()}
              </span>
            </div>
            
            <button
              onClick={() => navigatePeriod('next')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              disabled={viewMode === 'custom'}
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'year'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600'
              }`}
            >
              Year
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'custom'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600'
              }`}
            >
              Custom
            </button>
            {(viewMode !== 'custom' && (selectedDate.getMonth() !== new Date().getMonth() || selectedDate.getFullYear() !== new Date().getFullYear())) && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>
        
        {viewMode === 'custom' && (
          <div className="mt-4 space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-2.5 py-2 sm:px-3 sm:py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-base sm:text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-2.5 py-2 sm:px-3 sm:py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-base sm:text-sm min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Latest Entries with Pagination and Collapse */}
      <div className="bg-slate-100 dark:bg-gray-800 rounded-lg border border-slate-300 dark:border-gray-700">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
              <button
                onClick={() => setIsTransactionsCollapsed(!isTransactionsCollapsed)}
                className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                {isTransactionsCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={entryFilter}
                  onChange={(e) => {
                    setEntryFilter(e.target.value as 'all' | 'income' | 'expense');
                    setCurrentPage(1);
                  }}
                  className="text-base sm:text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>
              </div>
              <button
                onClick={() => setIsTransactionsCollapsed(!isTransactionsCollapsed)}
                className="hidden sm:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors items-center justify-center"
              >
                {isTransactionsCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
        {!isTransactionsCollapsed && (
          <>
            <div className="p-2">
              {latestEntries.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No entries yet
                </div>
              ) : (
                <div className="space-y-1">
                  {latestEntries
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((entry) => (
                      <div key={`${entry.type}-${entry.id}`} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group border border-gray-200 dark:border-gray-700">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                          {/* Top line: Description (left) + Amount (right) */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                entry.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {entry.description}
                              </p>
                            </div>
                            <p className={`text-sm font-medium flex-shrink-0 ${
                              entry.type === 'income' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {entry.type === 'income' ? '+' : '-'}{entry.displayAmount}
                            </p>
                          </div>
                          
                          {/* Bottom line: Empty (no tags in dashboard) + Date/Currency/Delete (right) */}
                          <div className="flex items-center justify-between mt-1">
                            <div></div> {/* Empty space for balance */}
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(entry.date)}
                              </p>
                              <CurrencyBadge 
                                currency={entry.currency} 
                                baseCurrency={baseCurrency}
                              />
                              <button 
                                onClick={() => handleDelete(entry)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              entry.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
                              {entry.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(entry.date)}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-medium ${
                                entry.type === 'income' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {entry.type === 'income' ? '+' : '-'}{entry.displayAmount}
                              </span>
                              <CurrencyBadge 
                                currency={entry.currency} 
                                baseCurrency={baseCurrency}
                              />
                            </div>
                            <button 
                              onClick={() => handleDelete(entry)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all ml-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {latestEntries.length > itemsPerPage && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, latestEntries.length)}-{Math.min(currentPage * itemsPerPage, latestEntries.length)} of {latestEntries.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {Math.ceil(latestEntries.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(latestEntries.length / itemsPerPage)}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Test Data Admin - at the end */}
      <TestDataAdmin />
    </div>
  );
};