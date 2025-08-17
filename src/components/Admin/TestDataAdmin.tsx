import React from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';

export const TestDataAdmin: React.FC = () => {
  const { addTestData: addExpenseTestData, expenses } = useExpenseStore();
  const { addTestData: addIncomeTestData, incomes } = useIncomeStore();

  const handleAddTestExpenses = () => {
    addExpenseTestData();
    alert('30 test expenses added!');
  };

  const handleAddTestIncome = () => {
    addIncomeTestData();
    alert('15 test income entries added!');
  };

  const handleDeleteEverything = () => {
    if (confirm('Are you sure you want to delete ALL expenses, income, assets, and liabilities? This cannot be undone.')) {
      // Clear expenses
      localStorage.removeItem('fintonico-expenses');
      // Clear income
      localStorage.removeItem('fintonico-incomes');
      // Clear assets
      localStorage.removeItem('fintonico-assets');
      // Clear liabilities
      localStorage.removeItem('fintonico-liabilities');
      
      // Reload page to refresh stores
      window.location.reload();
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-700 mb-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Test Data Admin</h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAddTestExpenses}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Add 30 Test Expenses
        </button>
        <button
          onClick={handleAddTestIncome}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Add 15 Test Income
        </button>
        <button
          onClick={handleDeleteEverything}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
        >
          🗑️ Delete Everything
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Current: {expenses.length} expenses, {incomes.length} income entries
      </p>
    </div>
  );
};