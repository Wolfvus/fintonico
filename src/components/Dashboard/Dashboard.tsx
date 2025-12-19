import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCurrencyStore } from '../../stores/currencyStore';
import { useLedgerStore } from '../../stores/ledgerStore';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Landmark, PiggyBank, ArrowUpDown, Scissors, LayoutGrid } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import { useDateRange } from '../../hooks/finance/useDateRange';
import { useMonthNavigation } from '../../hooks/useMonthNavigation';
import { CurrencyBadge } from '../Shared/CurrencyBadge';
import { getNetWorthAt, getMoMChange } from '../../selectors/finance';
import { useSnapshotStore } from '../../stores/snapshotStore';
import { Money } from '../../domain/money';

interface DashboardProps {
  onNavigate?: (tab: 'income' | 'expenses' | 'networth') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  const ledgerStore = useLedgerStore();
  const snapshotStore = useSnapshotStore();
  const { expenses } = useExpenseStore(
    useShallow((state) => ({ expenses: state.expenses }))
  );
  const { incomes } = useIncomeStore(
    useShallow((state) => ({ incomes: state.incomes }))
  );
  
  
  const [entryFilter, setEntryFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'custom'>('month');
  const { selectedDate, navigateMonth, navigateYear, formattedMonth } = useMonthNavigation();
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransactionsCollapsed, setIsTransactionsCollapsed] = useState(false);
  const itemsPerPage = 10;

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
  }, [transactions.length, baseCurrency]);

  // Helper to parse YYYY-MM-DD date string as local date (not UTC)
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filter incomes by selected date range
  // Recurring income: shows in periods from creation date onwards (not before)
  // One-time income: only shows in the period it was created
  const filteredIncomes = useMemo(() => {
    return incomes.filter((income) => {
      const incomeDate = parseLocalDate(income.date);

      if (income.frequency === 'one-time') {
        // One-time: must be within the date range
        return incomeDate >= startDate && incomeDate <= endDate;
      } else {
        // Recurring: show if created on or before the end of the period
        // AND the period is on or after the creation month
        return incomeDate <= endDate;
      }
    });
  }, [incomes, startDate, endDate]);

  // Filter expenses by selected date range
  // Recurring expenses: shows in periods from creation date onwards (not before)
  // One-time expenses: only shows in the period it was created
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = parseLocalDate(expense.date);

      if (expense.recurring) {
        // Recurring: show if created on or before the end of the period
        return expenseDate <= endDate;
      } else {
        // One-time: must be within the date range
        return expenseDate >= startDate && expenseDate <= endDate;
      }
    });
  }, [expenses, startDate, endDate]);


  // Calculate period income total (converted to base currency)
  const periodIncome = useMemo(() => {
    return filteredIncomes.reduce((total, income) => {
      return total + convertAmount(income.amount, income.currency, baseCurrency);
    }, 0);
  }, [filteredIncomes, convertAmount, baseCurrency]);

  // Calculate period expenses total (converted to base currency)
  const periodExpenses = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => {
      return total + convertAmount(expense.amount, expense.currency, baseCurrency);
    }, 0);
  }, [filteredExpenses, convertAmount, baseCurrency]);

  // Calculate expense breakdown by rating
  const expensesByRating = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      const converted = convertAmount(expense.amount, expense.currency, baseCurrency);
      breakdown[expense.rating] = (breakdown[expense.rating] || 0) + converted;
    });
    return breakdown;
  }, [filteredExpenses, convertAmount, baseCurrency]);

  // Calculate recurring expenses total for the period (only those created on or before the period)
  const recurringExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => e.recurring)
      .reduce((total, expense) => {
        return total + convertAmount(expense.amount, expense.currency, baseCurrency);
      }, 0);
  }, [filteredExpenses, convertAmount, baseCurrency]);

  // Calculate one-time expenses for period
  const oneTimeExpensesTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => !e.recurring)
      .reduce((total, expense) => {
        return total + convertAmount(expense.amount, expense.currency, baseCurrency);
      }, 0);
  }, [filteredExpenses, convertAmount, baseCurrency]);

  // Total monthly burden (one-time + recurring for the period)
  const totalMonthlyExpenses = oneTimeExpensesTotal + recurringExpensesTotal;


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

  // Combine and sort transactions for display - using filtered income/expenses directly
  const allTransactions = useMemo(() => {
    const combined: Array<{
      id: string;
      type: 'income' | 'expense';
      description: string;
      amount: number;
      currency: string;
      date: string;
      formattedAmount: string;
    }> = [];

    // Add filtered incomes
    if (entryFilter === 'all' || entryFilter === 'income') {
      filteredIncomes.forEach((income) => {
        const converted = convertAmount(income.amount, income.currency, baseCurrency);
        combined.push({
          id: income.id,
          type: 'income',
          description: income.source,
          amount: converted,
          currency: income.currency,
          date: income.date,
          formattedAmount: `+${formatAmount(converted)}`,
        });
      });
    }

    // Add filtered expenses
    if (entryFilter === 'all' || entryFilter === 'expense') {
      filteredExpenses.forEach((expense) => {
        const converted = convertAmount(expense.amount, expense.currency, baseCurrency);
        combined.push({
          id: expense.id,
          type: 'expense',
          description: expense.what,
          amount: converted,
          currency: expense.currency,
          date: expense.date,
          formattedAmount: `-${formatAmount(converted)}`,
        });
      });
    }

    // Sort by date descending
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredIncomes, filteredExpenses, entryFilter, convertAmount, baseCurrency, formatAmount]);

  // Pagination
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

  // Extract net worth values
  const netWorth = netWorthData.netWorth.toMajorUnits();
  const totalAssets = netWorthData.totalAssets.toMajorUnits();
  const totalLiabilities = netWorthData.totalLiabilities.toMajorUnits();

  // Calculate KPIs - cashflow is income minus total expenses (one-time + recurring)
  const monthlyCashFlow = periodIncome - totalMonthlyExpenses;
  const savingsRate = periodIncome > 0 ? ((periodIncome - totalMonthlyExpenses) / periodIncome) * 100 : 0;

  // Calculate non-essential expenses for optimization tips
  const nonEssentialTotal = (expensesByRating['non_essential'] || 0) + (expensesByRating['luxury'] || 0);
  
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
    <div className="space-y-3">
      {/* Sticky Top Section: Net Worth + Time Period + KPI Cards */}
      <div className="sticky top-16 z-20 -mx-4 px-4 pt-2 pb-3 bg-gray-100 dark:bg-gray-900 space-y-2">
        {/* Hero Net Worth Section */}
        <div className={`${styles.heroGradient} rounded-xl shadow-sm py-5 px-4 border border-blue-200 dark:border-gray-700`}>
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            <button
              onClick={() => onNavigate?.('networth')}
              className="w-full"
            >
              <div className="inline-grid grid-cols-[auto_auto] gap-x-3 items-center mx-auto">
                <div className="row-span-2 self-center">
                  <div className={`${styles.iconContainer} p-2`}>
                    <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left">Net Worth</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${
                    netWorth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatAmount(netWorth)}
                  </p>
                  {netWorthChange.hasPreviousData && (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      netWorthChange.change >= 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {netWorthChange.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{netWorthChange.change >= 0 ? '+' : ''}{formatAmount(netWorthChange.change)}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
            {/* Assets/Liabilities Row */}
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assets</p>
                  <p className="text-base font-semibold text-green-600 dark:text-green-400">{formatAmount(totalAssets)}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Liabilities</p>
                  <p className="text-base font-semibold text-red-600 dark:text-red-400">{formatAmount(totalLiabilities)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <button onClick={() => onNavigate?.('networth')} className="grid grid-cols-[auto_auto] gap-x-3 items-center">
              <div className="row-span-2 self-center">
                <div className={`${styles.iconContainer} p-2.5`}>
                  <Landmark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left">Total Net Worth</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${
                  netWorth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatAmount(netWorth)}
                </p>
                {netWorthChange.hasPreviousData && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    netWorthChange.change >= 0
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {netWorthChange.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{netWorthChange.change >= 0 ? '+' : ''}{formatAmount(netWorthChange.change)}</span>
                  </div>
                )}
              </div>
            </button>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Assets</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(totalAssets)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Liabilities</p>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatAmount(totalLiabilities)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Period Controls - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Period:</span>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {viewMode === 'month' && (
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => navigateMonth('prev')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
                  {formattedMonth}
                </span>
                <button onClick={() => navigateMonth('next')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            {viewMode === 'year' && (
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => navigateYear('prev')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[60px] text-center">
                  {selectedDate.getFullYear()}
                </span>
                <button onClick={() => navigateYear('next')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
            {viewMode === 'custom' && (
              <div className="flex items-center justify-center gap-2">
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                <span className="text-xs text-gray-500">to</span>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards Row - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Cash Flow */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2.5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Cash Flow</p>
            </div>
            <p className={`text-base font-bold ${monthlyCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatAmount(monthlyCashFlow)}
            </p>
          </div>

          {/* Savings Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2.5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 mb-1">
              <PiggyBank className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Savings</p>
            </div>
            <p className={`text-base font-bold ${savingsRate >= 20 ? 'text-green-600 dark:text-green-400' : savingsRate >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </div>

          {/* Income */}
          <button className="w-full text-left" onClick={() => onNavigate?.('income')}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Income</p>
              </div>
              <p className="text-base font-bold text-green-600 dark:text-green-400">{formatAmount(periodIncome)}</p>
            </div>
          </button>

          {/* Expenses */}
          <button className="w-full text-left" onClick={() => onNavigate?.('expenses')}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Expenses</p>
              </div>
              <p className="text-base font-bold text-red-600 dark:text-red-400">{formatAmount(totalMonthlyExpenses)}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Transactions and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Recent Transactions (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Section header with collapse toggle */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
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
                <div className="overflow-x-auto">
                  {paginatedTransactions.length === 0 ? (
                    <div className={styles.emptyState}>
                      No transactions found for the selected period
                    </div>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                            <th className="text-right py-2 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">Currency</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTransactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <td className="py-2 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  transaction.type === 'income'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {transaction.description}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right">
                                <span className={`text-sm font-medium ${
                                  transaction.type === 'income'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {transaction.formattedAmount}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <CurrencyBadge
                                  currency={transaction.currency}
                                  baseCurrency={baseCurrency}
                                />
                              </td>
                              <td className="py-2 px-4">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(transaction.date)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-4 pt-4 mx-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {totalPages} ({allTransactions.length} total)
                          </span>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Insights Panel (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveInsightTab('overview')}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  activeInsightTab === 'overview'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </button>
              <button
                onClick={() => setActiveInsightTab('optimize')}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  activeInsightTab === 'optimize'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span className="hidden sm:inline">Optimize</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeInsightTab === 'overview' && (
                <div className="space-y-4">
                  <h4 className={styles.sectionHeader}>Expense Breakdown</h4>

                  {/* Pie Chart */}
                  {periodExpenses > 0 ? (
                    <div className="flex flex-col items-center">
                      <svg viewBox="0 0 100 100" className="w-40 h-40">
                        {(() => {
                          const categories = [
                            { key: 'essential', color: '#22c55e', label: 'Essential' },
                            { key: 'discretionary', color: '#eab308', label: 'Discretionary' },
                            { key: 'luxury', color: '#ef4444', label: 'Luxury' },
                          ];

                          let cumulativePercent = 0;
                          const slices: React.ReactElement[] = [];

                          categories.forEach(({ key, color }) => {
                            const value = expensesByRating[key] || 0;
                            const percent = (value / periodExpenses) * 100;

                            if (percent > 0) {
                              // Calculate SVG arc
                              const startAngle = cumulativePercent * 3.6 - 90;
                              const endAngle = (cumulativePercent + percent) * 3.6 - 90;

                              const startRad = (startAngle * Math.PI) / 180;
                              const endRad = (endAngle * Math.PI) / 180;

                              const x1 = 50 + 40 * Math.cos(startRad);
                              const y1 = 50 + 40 * Math.sin(startRad);
                              const x2 = 50 + 40 * Math.cos(endRad);
                              const y2 = 50 + 40 * Math.sin(endRad);

                              const largeArc = percent > 50 ? 1 : 0;

                              slices.push(
                                <path
                                  key={key}
                                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={color}
                                  className="transition-all hover:opacity-80"
                                />
                              );

                              cumulativePercent += percent;
                            }
                          });

                          return slices;
                        })()}
                        {/* Center circle for donut effect */}
                        <circle cx="50" cy="50" r="20" className="fill-white dark:fill-gray-800" />
                      </svg>

                      {/* Legend */}
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {([
                          { key: 'essential', color: 'bg-green-500', label: 'Essential' },
                          { key: 'discretionary', color: 'bg-yellow-500', label: 'Discretionary' },
                          { key: 'luxury', color: 'bg-red-500', label: 'Luxury' },
                        ] as const).map(({ key, color, label }) => {
                          const value = expensesByRating[key] || 0;
                          const percent = periodExpenses > 0 ? (value / periodExpenses) * 100 : 0;

                          return value > 0 ? (
                            <div key={key} className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded-full ${color}`} />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {label} ({percent.toFixed(0)}%)
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>

                      {/* Category amounts */}
                      <div className="w-full mt-4 space-y-2">
                        {([
                          { key: 'essential', color: 'text-green-600 dark:text-green-400', label: 'Essential' },
                          { key: 'discretionary', color: 'text-yellow-600 dark:text-yellow-400', label: 'Discretionary' },
                          { key: 'luxury', color: 'text-red-600 dark:text-red-400', label: 'Luxury' },
                        ] as const).map(({ key, color, label }) => {
                          const value = expensesByRating[key] || 0;
                          return value > 0 ? (
                            <div key={key} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">{label}</span>
                              <span className={`font-medium ${color}`}>{formatAmount(value)}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8">
                      <div className="w-40 h-40 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">No data</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-4">
                        No expenses this period
                      </p>
                    </div>
                  )}
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
                    {nonEssentialTotal > 0 ? (
                      <>
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {formatAmount(nonEssentialTotal)}
                        </p>
                        <p className={styles.sectionLabel}>
                          in non-essential + luxury spending
                        </p>
                      </>
                    ) : (
                      <p className={styles.sectionLabel}>
                        Great job! All spending is essential.
                      </p>
                    )}
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
          </div>
        </div>
      </div>

    </div>
  );
};
