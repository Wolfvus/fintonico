import React, { useState } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { TrendingDown, Plus, Trash2, Calendar } from 'lucide-react';
import { getTodayLocalString } from '../../utils/dateFormat';
import { sanitizeDescription } from '../../utils/sanitization';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import type { AccountType, AccountBalance } from '../../types';

interface BalanceFormData {
  amount: string;
  currency: string;
}

export const LiabilityForm: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('credit-card');
  const [balances, setBalances] = useState<BalanceFormData[]>([
    { amount: '', currency: 'USD' }
  ]);
  const [dueDate, setDueDate] = useState('');
  const [recurringDueDate, setRecurringDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addAccount } = useAccountStore();

  const liabilityTypeOptions = [
    { value: 'credit-card' as AccountType, label: 'Credit Card', icon: '💳' },
    { value: 'loan' as AccountType, label: 'Loan', icon: '🏦' },
    { value: 'mortgage' as AccountType, label: 'Mortgage', icon: '🏠' },
    { value: 'other' as AccountType, label: 'Other Liability', icon: '📋' },
  ];

  // Multi-Currency Balance Input Handlers
  const addNewBalance = () => {
    setBalances([...balances, { amount: '', currency: 'USD' }]);
  };

  const removeBalance = (index: number) => {
    if (balances.length > 1) {
      setBalances(balances.filter((_, i) => i !== index));
    }
  };

  const updateBalanceAmount = (index: number, amount: string) => {
    const newBalances = [...balances];
    newBalances[index] = { ...newBalances[index], amount };
    setBalances(newBalances);
  };

  const updateBalanceCurrency = (index: number, currency: string) => {
    const newBalances = [...balances];
    newBalances[index] = { ...newBalances[index], currency };
    setBalances(newBalances);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Liability name required';
    }
    
    // Validate balances
    const validBalances = balances.filter(balance => {
      const amount = parseFloat(balance.amount);
      return balance.amount.trim() && !isNaN(amount) && amount > 0;
    });

    if (validBalances.length === 0) {
      newErrors.balances = 'At least one valid balance is required';
    }

    // Check for duplicate currencies
    const currencies = validBalances.map(b => b.currency);
    const uniqueCurrencies = new Set(currencies);
    if (currencies.length !== uniqueCurrencies.size) {
      newErrors.balances = 'Cannot have duplicate currencies in the same account';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert form data to AccountBalance format
      const accountBalances: AccountBalance[] = validBalances.map(balance => ({
        currency: balance.currency,
        amount: parseFloat(balance.amount)
      }));

      // Create liability account
      const accountData: any = {
        name: sanitizeDescription(name.trim()),
        type,
        balances: accountBalances
      };

      // Add due date if provided
      if (dueDate && ['credit-card', 'loan', 'mortgage'].includes(type)) {
        accountData.dueDate = dueDate;
      }

      // Add recurring due date if provided (for credit cards)
      if (recurringDueDate && type === 'credit-card') {
        accountData.recurringDueDate = parseInt(recurringDueDate);
      }

      addAccount(accountData);
      
      // Reset form
      setName('');
      setType('credit-card');
      setBalances([{ amount: '', currency: 'USD' }]);
      setDueDate('');
      setRecurringDueDate('');
      
    } catch (error) {
      setErrors({ submit: 'Failed to create liability. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Liability</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Liability Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Liability Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chase Credit Card, Car Loan"
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Liability Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Liability Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {liabilityTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  type === option.value
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type}</p>
          )}
        </div>

        {/* Due Date and Recurring Options (for credit cards and loans) */}
        {['credit-card', 'loan', 'mortgage'].includes(type) && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Due Date {type === 'credit-card' ? '(Next Payment)' : '(Next Payment)'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                         transition-colors text-gray-900 dark:text-white
                         border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
              />
            </div>
            
            {type === 'credit-card' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Recurring Payment Day (Optional)
                </label>
                <select
                  value={recurringDueDate}
                  onChange={(e) => setRecurringDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                           transition-colors text-gray-900 dark:text-white
                           border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
                >
                  <option value="">Select day of month</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day.toString()}>
                      Day {day} of each month
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose the day when payment is due each month
                </p>
              </div>
            )}
          </div>
        )}

        {/* Multi-Currency Balance Inputs */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Liability Balances *
          </label>
          <div className="space-y-3">
            {balances.map((balance, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <AmountCurrencyInput
                    displayAmount={balance.amount}
                    currency={balance.currency}
                    onAmountChange={(amount) => updateBalanceAmount(index, amount)}
                    onCurrencyChange={(currency) => updateBalanceCurrency(index, currency)}
                    className="grid grid-cols-2 gap-3"
                  />
                </div>
                
                {balances.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBalance(index)}
                    className="mt-8 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove this currency"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addNewBalance}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Currency
            </button>
          </div>
          {errors.balances && (
            <p className="text-sm text-red-500 mt-1">{errors.balances}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || balances.every(b => !b.amount.trim())}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding Liability...
            </span>
          ) : (
            'Add Liability'
          )}
        </button>

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};