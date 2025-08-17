import React, { useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionList } from '../Shared/TransactionList';

export const MonthlyView: React.FC = () => {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();
  
  // Filter transactions for selected month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
  });
  
  const monthlyIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date);
    return incomeDate.getMonth() === selectedMonth && incomeDate.getFullYear() === selectedYear;
  });
  
  // Calculate totals
  const totalExpenses = monthlyExpenses.reduce((sum, expense) => 
    sum + convertAmount(expense.amount, expense.currency, baseCurrency), 0
  );
  
  const totalIncome = monthlyIncomes.reduce((sum, income) => 
    sum + convertAmount(income.amount, income.currency, baseCurrency), 0
  );
  
  const monthlyBalance = totalIncome - totalExpenses;
  const expensePercentage = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  
  // Prepare transaction lists
  const expenseTransactions = monthlyExpenses.map(expense => ({
    id: expense.id,
    description: expense.what,
    amount: expense.amount,
    currency: expense.currency,
    date: expense.date,
    type: 'expense' as const,
    category: expense.rating,
    rating: expense.rating,
    recurring: expense.recurring
  }));
  
  const incomeTransactions = monthlyIncomes.map(income => ({
    id: income.id,
    description: income.source,
    amount: income.amount,
    currency: income.currency,
    date: income.date,
    type: 'income' as const,
    category: income.frequency,
    frequency: income.frequency
  }));
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(selectedYear, selectedMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setSelectedDate(new Date(selectedYear, selectedMonth + 1, 1));
  };
  
  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            {(selectedMonth !== new Date().getMonth() || selectedYear !== new Date().getFullYear()) && (
              <button
                onClick={goToCurrentMonth}
                className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Current Month
              </button>
            )}
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Income */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Income</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatAmount(totalIncome)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {monthlyIncomes.length} transactions
          </p>
        </div>
        
        {/* Expenses */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalExpenses)}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {monthlyExpenses.length} transactions
            </p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              expensePercentage > 90 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : expensePercentage > 70
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            }`}>
              {expensePercentage}%
            </span>
          </div>
        </div>
        
        {/* Balance */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
            <div className={`w-4 h-4 rounded-full ${monthlyBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <p className={`text-lg font-bold ${
            monthlyBalance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatAmount(monthlyBalance)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {monthlyBalance >= 0 ? 'Surplus' : 'Deficit'}
          </p>
        </div>
        
        {/* Total Transactions */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Transactions</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {monthlyExpenses.length + monthlyIncomes.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total entries
          </p>
        </div>
      </div>
      
      {/* Transaction Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionList
          title={`Income - ${monthNames[selectedMonth]} ${selectedYear}`}
          transactions={incomeTransactions}
          showFilters={false}
        />
        
        <TransactionList
          title={`Expenses - ${monthNames[selectedMonth]} ${selectedYear}`}
          transactions={expenseTransactions}
          showFilters={false}
        />
      </div>
    </div>
  );
};