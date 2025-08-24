import React, { useState, useMemo } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';
import { useLedgerStore } from '../../stores/ledgerStore';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Landmark, PiggyBank, ArrowUpDown, Scissors, LayoutGrid } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import { useDateRange } from '../../hooks/finance/useDateRange';
import { useFilteredTransactions } from '../../hooks/finance/useFilteredTransactions';
import { useCombinedTransactions } from '../../hooks/finance/useCombinedTransactions';
import { Card, SectionHeader, Tabs, Pagination } from '../ui';
import { CurrencyBadge } from '../Shared/CurrencyBadge';
import { getNetWorthAt, getMoMChange, getPL, getExpenseBreakdown, getSavingsPotential } from '../../selectors/finance';
import { useSnapshotStore } from '../../stores/snapshotStore';
import { Money } from '../../domain/money';

interface DashboardProps {
  onNavigate?: (tab: 'income' | 'expenses' | 'assets' | 'liabilities' | 'networth') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { formatAmount, baseCurrency } = useCurrencyStore();
  const ledgerStore = useLedgerStore();
  const snapshotStore = useSnapshotStore();
  
  
  const [entryFilter, setEntryFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransactionsCollapsed, setIsTransactionsCollapsed] = useState(false);
  const itemsPerPage = 10;
  
  // Generate investment yields on dashboard load
  // React.useEffect(() => {
  //   generateInvestmentYields();
  // }, [generateInvestmentYields]);

  // Calculate date range using hook - converts view mode and dates into start/end range
  const { startDate, endDate } = useDateRange({
    viewMode,
    selectedDate,
    customStartDate,
    customEndDate
  });
  
  // Get transactions to trigger recalculation when they change
  const transactions = ledgerStore.getTransactions();
  const accounts = ledgerStore.accounts;
  
  
  // Initialize default accounts if needed
  React.useEffect(() => {
    if (accounts.length === 0) {
      ledgerStore.initializeDefaultAccounts();
    }
  }, [accounts.length, ledgerStore]);
  
  // Get financial data using pure selectors
  const netWorthData = useMemo(() => {
    try {
      return getNetWorthAt(new Date());
    } catch (error) {
      console.error('Dashboard: Error in getNetWorthAt:', error);
      // Fallback to zero values if selector fails
      const { baseCurrency } = useCurrencyStore.getState();
      return {
        totalAssets: Money.fromMajorUnits(0, baseCurrency),
        totalLiabilities: Money.fromMajorUnits(0, baseCurrency),
        netWorth: Money.fromMajorUnits(0, baseCurrency),
        asOfDate: new Date(),
        breakdown: {
          ledger: {
            assets: Money.fromMajorUnits(0, baseCurrency),
            liabilities: Money.fromMajorUnits(0, baseCurrency)
          },
          external: {
            assets: Money.fromMajorUnits(0, baseCurrency),
            liabilities: Money.fromMajorUnits(0, baseCurrency)
          }
        }
      };
    }
  }, [transactions.length]);
  
  const periodData = useMemo(() => {
    try {
      return getPL(startDate, endDate);
    } catch (error) {
      console.error('Error in getPL:', error);
      // Fallback data
      const { baseCurrency } = useCurrencyStore.getState();
      return { 
        totalIncome: Money.fromMajorUnits(0, baseCurrency), 
        totalExpenses: Money.fromMajorUnits(0, baseCurrency),
        netIncome: Money.fromMajorUnits(0, baseCurrency),
        incomeBreakdown: [],
        expenseBreakdown: [],
        fromDate: startDate,
        toDate: endDate,
        currency: baseCurrency
      };
    }
  }, [startDate, endDate, transactions.length]);
  
  const expenseData = useMemo(() => {
    try {
      return getExpenseBreakdown(startDate, endDate);
    } catch (error) {
      console.error('Error in getExpenseBreakdown:', error);
      // Fallback data
      const { baseCurrency } = useCurrencyStore.getState();
      return { 
        byCategory: {} as Record<string, Money>,
        byAccount: [],
        totalExpenses: Money.fromMajorUnits(0, baseCurrency),
        averageDaily: Money.fromMajorUnits(0, baseCurrency),
        fromDate: startDate,
        toDate: endDate,
        currency: baseCurrency
      };
    }
  }, [startDate, endDate, transactions.length]);
  
  const savingsData = useMemo(() => {
    try {
      return getSavingsPotential(startDate, endDate);
    } catch (error) {
      console.error('Error in getSavingsPotential:', error);
      // Fallback data
      const { baseCurrency } = useCurrencyStore.getState();
      return { 
        nonEssentialExpenses: Money.fromMajorUnits(0, baseCurrency),
        currentSavings: Money.fromMajorUnits(0, baseCurrency),
        savingsRate: 0,
        potentialSavings: Money.fromMajorUnits(0, baseCurrency),
        projectedMonthlySavings: Money.fromMajorUnits(0, baseCurrency),
        projectedYearlySavings: Money.fromMajorUnits(0, baseCurrency),
        recommendations: {
          reduceNonEssential: Money.fromMajorUnits(0, baseCurrency),
          targetSavingsRate: 0.2,
          gapToTarget: Money.fromMajorUnits(0, baseCurrency)
        },
        fromDate: startDate,
        toDate: endDate,
        currency: baseCurrency
      };
    }
  }, [startDate, endDate, transactions.length]);
  
  // Legacy compatibility - maintain filtered transactions for existing UI
  const { filteredExpenses, filteredIncomes } = useFilteredTransactions({
    startDate,
    endDate
  });


  // Ensure current month snapshot exists and get MoM change
  React.useEffect(() => {
    snapshotStore.ensureCurrentMonthSnapshot();
  }, [snapshotStore, transactions.length]);

  // Calculate net worth change using snapshots
  const netWorthChange = useMemo(() => {
    const momChange = getMoMChange();
    
    if (!momChange.hasPreviousData) {
      // Fallback when no previous data available
      return { 
        change: 0, 
        changePercent: 0,
        hasPreviousData: false 
      };
    }
    
    return { 
      change: momChange.deltaAbs || 0, 
      changePercent: momChange.deltaPct || 0,
      hasPreviousData: true
    };
  }, [transactions.length]);

  // Combine and sort transactions for display using hook - creates unified transaction view models
  const allTransactions = useCombinedTransactions({
    startDate,
    endDate,
    entryFilter
  });
  

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

  // Extract values from selector data
  const periodIncome = periodData.totalIncome.toMajorUnits();
  const periodExpenses = periodData.totalExpenses.toMajorUnits();
  const netWorth = netWorthData.netWorth.toMajorUnits();
  const totalAssets = netWorthData.totalAssets.toMajorUnits();
  const totalLiabilities = netWorthData.totalLiabilities.toMajorUnits();
  
  
  // Calculate KPIs
  const monthlyCashFlow = periodIncome - periodExpenses;
  const savingsRate = periodIncome > 0 ? ((periodIncome - periodExpenses) / periodIncome) * 100 : 0;
  
  // State for insights tabs
  const [activeInsightTab, setActiveInsightTab] = useState<'overview' | 'optimize'>('overview');

  // Local styles
  const styles = {
    kpiLabel: "text-sm font-bold text-gray-900 dark:text-white",
    kpiIcon: "w-4 h-4 text-gray-900 dark:text-white",
    heroGradient: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900",
    iconContainer: "inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-xl",
    navButton: "p-2 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors",
    netWorthButton: "hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl p-3 transition-colors",
    input: "text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    clickableCard: "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
    sectionLabel: "text-sm text-gray-600 dark:text-gray-400",
    sectionHeader: "text-sm font-semibold text-gray-900 dark:text-white",
    transactionItem: "flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-200 dark:border-gray-700",
    transactionDesc: "text-sm font-medium text-gray-900 dark:text-white truncate",
    emptyState: "text-center py-8 text-gray-500 dark:text-gray-400 text-sm",
    dateDisplay: "text-sm font-semibold text-gray-900 dark:text-white text-center",
    amountLarge: "text-lg font-bold",
    amountGreen: "text-lg font-bold text-green-600 dark:text-green-400",
    amountRed: "text-lg font-bold text-red-600 dark:text-red-400",
    amountYellow: "text-lg font-bold text-yellow-600 dark:text-yellow-400"
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero Net Worth Section */}
      <div className={`${styles.heroGradient} rounded-xl shadow-lg p-3 sm:p-4 border border-blue-200 dark:border-gray-700`}>
        {/* Mobile Layout - Centered */}
        <div className="block lg:hidden">
          <button 
            onClick={() => onNavigate?.('networth')}
            className={`text-center mb-2 w-full ${styles.netWorthButton}`}
          >
            <div className={`${styles.iconContainer} p-2 mb-1`}>
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
                !netWorthChange.hasPreviousData
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  : netWorthChange.change >= 0 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {!netWorthChange.hasPreviousData 
                  ? '—' 
                  : netWorthChange.change >= 0 ? '↑' : '↓'
                }
                {!netWorthChange.hasPreviousData 
                  ? 'No data' 
                  : `${Math.abs(netWorthChange.changePercent).toFixed(1)}%`
                }
              </div>
            </div>
          </button>
          
          {/* Assets and Liabilities Summary - Mobile */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className={styles.sectionLabel}>Total Assets</p>
              </div>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {formatAmount(totalAssets)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className={styles.sectionLabel}>Total Liabilities</p>
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
            className={`flex items-center gap-4 ${styles.netWorthButton}`}
          >
            <div className={`${styles.iconContainer} p-3`}>
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
                  !netWorthChange.hasPreviousData
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    : netWorthChange.change >= 0 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {!netWorthChange.hasPreviousData 
                    ? '—' 
                    : netWorthChange.change >= 0 ? '↑' : '↓'
                  }
                  {!netWorthChange.hasPreviousData 
                    ? 'No data' 
                    : `${Math.abs(netWorthChange.changePercent).toFixed(1)}%`
                  }
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
                <p className={styles.sectionLabel}>Total Assets</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(totalAssets)}
                </p>
              </div>
            </div>
            
            {/* Liabilities */}
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className={styles.sectionLabel}>Total Liabilities</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                  {formatAmount(totalLiabilities)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Time Period:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className={styles.input}
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
                className={styles.navButton}
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className={`${styles.dateDisplay} min-w-[120px]`}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className={styles.navButton}
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}

          {viewMode === 'year' && (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <button
                onClick={() => navigateYear('prev')}
                className={styles.navButton}
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className={`${styles.dateDisplay} min-w-[80px]`}>
                {selectedDate.getFullYear()}
              </span>
              <button
                onClick={() => navigateYear('next')}
                className={styles.navButton}
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
                className={styles.input}
              />
              <span className={styles.sectionLabel}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
          )}
        </div>
      </Card>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Monthly Cash Flow */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpDown className={styles.kpiIcon} />
            <p className={styles.kpiLabel}>Cash Flow</p>
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
        </Card>

        {/* Savings Rate */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className={styles.kpiIcon} />
            <p className={styles.kpiLabel}>Savings Rate</p>
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
        </Card>

        {/* Monthly Income */}
        <button 
          className="w-full text-left"
          onClick={() => onNavigate?.('income')}
        >
          <Card className={styles.clickableCard}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={styles.kpiIcon} />
              <p className={styles.kpiLabel}>Income</p>
            </div>
            <p className={styles.amountGreen}>
              {formatAmount(periodIncome)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredIncomes.length} transactions
            </p>
          </Card>
        </button>

        {/* Monthly Expenses */}
        <button 
          className="w-full text-left"
          onClick={() => onNavigate?.('expenses')}
        >
          <Card className={styles.clickableCard}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className={styles.kpiIcon} />
              <p className={styles.kpiLabel}>Expenses</p>
            </div>
            <p className={styles.amountRed}>
              {formatAmount(periodExpenses)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredExpenses.length} transactions
            </p>
          </Card>
        </button>
      </div>

      {/* Two Column Layout: Transactions and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Recent Transactions (2/3 width) */}
        <div className="lg:col-span-2">
          <Card>
            {/* SectionHeader primitive - provides consistent header with collapse toggle */}
            <SectionHeader 
              title="Recent Transactions"
              right={
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
              }
              className="p-4 sm:p-5"
            />
          
            {!isTransactionsCollapsed && (
              <div>
                <div className="px-4 sm:px-5 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={styles.sectionLabel}>Filter:</span>
                    <select
                      value={entryFilter}
                      onChange={(e) => setEntryFilter(e.target.value as typeof entryFilter)}
                      className={styles.input}
                    >
                      <option value="all">All</option>
                      <option value="income">Income</option>
                      <option value="expense">Expenses</option>
                    </select>
                  </div>
                </div>
                <div className="p-4">
                  {paginatedTransactions.length === 0 ? (
                    <div className={styles.emptyState}>
                      No transactions found for the selected period
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paginatedTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className={styles.transactionItem}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={styles.transactionDesc}>
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
                              {transaction.formattedAmount}
                            </p>
                            <CurrencyBadge 
                              currency={transaction.currency} 
                              baseCurrency={baseCurrency}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Pagination primitive - handles navigation with status label */}
                      {totalPages > 1 && (
                        <Pagination 
                          page={currentPage}
                          totalPages={totalPages}
                          onPrev={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          label={`Page ${currentPage} of ${totalPages} (${allTransactions.length} total)`}
                          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Insights Panel (1/3 width) */}
        <div className="lg:col-span-1">
          <Card>
            {/* Tabs primitive - navigation with icons and responsive labels */}
            <Tabs 
              value={activeInsightTab}
              onChange={(value) => setActiveInsightTab(value as typeof activeInsightTab)}
              items={[
                { value: 'overview', label: 'Overview', icon: LayoutGrid },
                { value: 'optimize', label: 'Optimize', icon: Scissors }
              ]}
            />

            {/* Tab Content */}
            <div className="p-4">
              {activeInsightTab === 'overview' && (
                <div className="space-y-4">
                  <h4 className={styles.sectionHeader}>Quick Stats</h4>
                  
                  {/* Top Categories */}
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Top Expense Categories</p>
                    <div className="space-y-2">
                      {Object.entries(expenseData.byCategory).map(([category, amount]) => {
                        const categoryTotal = amount.toMajorUnits();
                        const percentage = periodExpenses > 0 ? (categoryTotal / periodExpenses) * 100 : 0;
                        
                        return categoryTotal > 0 ? (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-xs capitalize text-gray-700 dark:text-gray-300">
                              {category.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    category === 'essential' ? 'bg-green-500' :
                                    category === 'non_essential' ? 'bg-yellow-500' :
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
                </div>
              )}

              {activeInsightTab === 'optimize' && (
                <div className="space-y-4">
                  <h4 className={styles.sectionHeader}>Optimization Tips</h4>
                  
                  {/* Savings Potential */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs font-medium text-gray-900 dark:text-white">Savings Potential</p>
                    </div>
                    {(() => {
                      const nonEssentialTotal = savingsData.nonEssentialExpenses.toMajorUnits();
                      
                      return nonEssentialTotal > 0 ? (
                        <>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {formatAmount(nonEssentialTotal)}
                          </p>
                          <p className={styles.sectionLabel}>
                            in non-essential spending
                          </p>
                        </>
                      ) : (
                        <p className={styles.sectionLabel}>
                          Great job! All spending is essential.
                        </p>
                      );
                    })()}
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    <p className={styles.sectionLabel}>Quick Tips:</p>
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
          </Card>
        </div>
      </div>

    </div>
  );
};