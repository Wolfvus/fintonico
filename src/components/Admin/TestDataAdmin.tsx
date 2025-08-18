import React from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';

export const TestDataAdmin: React.FC = () => {
  const { addTestData: addExpenseTestData, expenses } = useExpenseStore();
  const { addTestData: addIncomeTestData, incomes } = useIncomeStore();

  // Get current assets and liabilities from localStorage
  const getAssets = () => {
    const saved = localStorage.getItem('fintonico-assets');
    return saved ? JSON.parse(saved) : [];
  };

  const getLiabilities = () => {
    const saved = localStorage.getItem('fintonico-liabilities');
    return saved ? JSON.parse(saved) : [];
  };

  const assets = getAssets();
  const liabilities = getLiabilities();

  const handleAddTestExpenses = () => {
    addExpenseTestData();
    alert('30 test expenses added!');
  };

  const handleAddTestIncome = () => {
    addIncomeTestData();
    alert('15 test income entries added!');
  };

  const handleAddTestAssets = () => {
    const testAssets = [
      {
        id: crypto.randomUUID(),
        name: 'Emergency Savings Account',
        value: 25000,
        currency: 'USD',
        type: 'savings'
      },
      {
        id: crypto.randomUUID(),
        name: 'Checking Account',
        value: 5500,
        currency: 'USD',
        type: 'savings'
      },
      {
        id: crypto.randomUUID(),
        name: 'S&P 500 Index Fund',
        value: 85000,
        currency: 'USD',
        type: 'investment',
        yield: 7.2
      },
      {
        id: crypto.randomUUID(),
        name: 'Tech Stocks Portfolio',
        value: 42000,
        currency: 'USD',
        type: 'investment',
        yield: 12.5
      },
      {
        id: crypto.randomUUID(),
        name: 'Real Estate Investment',
        value: 15000,
        currency: 'USD',
        type: 'investment',
        yield: 4.8
      },
      {
        id: crypto.randomUUID(),
        name: 'Primary Residence',
        value: 450000,
        currency: 'USD',
        type: 'property'
      },
      {
        id: crypto.randomUUID(),
        name: 'Rental Property',
        value: 280000,
        currency: 'USD',
        type: 'property'
      },
      {
        id: crypto.randomUUID(),
        name: '2022 Honda Civic',
        value: 28000,
        currency: 'USD',
        type: 'vehicle'
      },
      {
        id: crypto.randomUUID(),
        name: 'Cryptocurrency Portfolio',
        value: 8500,
        currency: 'USD',
        type: 'investment',
        yield: -15.2
      },
      {
        id: crypto.randomUUID(),
        name: 'Gold Bullion',
        value: 12000,
        currency: 'USD',
        type: 'other'
      }
    ];

    const currentAssets = getAssets();
    const updatedAssets = [...currentAssets, ...testAssets];
    localStorage.setItem('fintonico-assets', JSON.stringify(updatedAssets));
    alert('10 test assets added!');
  };

  const handleAddTestLiabilities = () => {
    const testLiabilities = [
      {
        id: crypto.randomUUID(),
        name: 'Mortgage - Primary Home',
        value: 380000,
        currency: 'USD',
        type: 'mortgage'
      },
      {
        id: crypto.randomUUID(),
        name: 'Mortgage - Rental Property',
        value: 220000,
        currency: 'USD',
        type: 'mortgage'
      },
      {
        id: crypto.randomUUID(),
        name: 'Car Loan - Honda Civic',
        value: 18500,
        currency: 'USD',
        type: 'loan'
      },
      {
        id: crypto.randomUUID(),
        name: 'Chase Sapphire Credit Card',
        value: 2800,
        currency: 'USD',
        type: 'credit-card',
        dueDate: '2024-08-25',
        isPaid: false
      },
      {
        id: crypto.randomUUID(),
        name: 'AmEx Gold Card',
        value: 1200,
        currency: 'USD',
        type: 'credit-card',
        dueDate: '2024-08-20',
        isPaid: true
      },
      {
        id: crypto.randomUUID(),
        name: 'Student Loan',
        value: 45000,
        currency: 'USD',
        type: 'loan'
      },
      {
        id: crypto.randomUUID(),
        name: 'Personal Loan',
        value: 8500,
        currency: 'USD',
        type: 'loan'
      },
      {
        id: crypto.randomUUID(),
        name: 'Business Credit Line',
        value: 15000,
        currency: 'USD',
        type: 'other'
      }
    ];

    const currentLiabilities = getLiabilities();
    const updatedLiabilities = [...currentLiabilities, ...testLiabilities];
    localStorage.setItem('fintonico-liabilities', JSON.stringify(updatedLiabilities));
    alert('8 test liabilities added!');
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
          onClick={handleAddTestAssets}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add 10 Test Assets
        </button>
        <button
          onClick={handleAddTestLiabilities}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
        >
          Add 8 Test Liabilities
        </button>
        <button
          onClick={handleDeleteEverything}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
        >
          🗑️ Delete Everything
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Current: {expenses.length} expenses, {incomes.length} income, {assets.length} assets, {liabilities.length} liabilities
      </p>
    </div>
  );
};