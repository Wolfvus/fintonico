import React, { useState } from 'react';
import { useAccountStore } from '../../stores/accountStore';
import { Plus, Trash2, Building, CreditCard } from 'lucide-react';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import { ToggleSwitch } from '../Shared/ToggleSwitch';
import type { AccountType, AccountBalance } from '../../types';

interface BalanceFormData {
  amount: string;
  currency: string;
}

export const AccountForm: React.FC = () => {
  // Connect to Account Store
  const { addAccount } = useAccountStore();

  // Initial State Management
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [balances, setBalances] = useState<BalanceFormData[]>([
    { amount: '', currency: 'USD' }
  ]);
  const [isAssetMode, setIsAssetMode] = useState(true); // Asset/Liability toggle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic Type Options
  const assetTypeOptions = [
    { value: 'cash' as AccountType, label: 'Cash' },
    { value: 'bank' as AccountType, label: 'Bank Account' },
    { value: 'exchange' as AccountType, label: 'Exchange (Binance, etc.)' },
    { value: 'investment' as AccountType, label: 'Investment Account' },
    { value: 'property' as AccountType, label: 'Property' },
    { value: 'other' as AccountType, label: 'Other Asset' },
  ];

  const liabilityTypeOptions = [
    { value: 'loan' as AccountType, label: 'Loan' },
    { value: 'credit-card' as AccountType, label: 'Credit Card' },
    { value: 'mortgage' as AccountType, label: 'Mortgage' },
    { value: 'other' as AccountType, label: 'Other Liability' },
  ];

  const currentTypeOptions = isAssetMode ? assetTypeOptions : liabilityTypeOptions;

  // Handle Asset/Liability mode change
  const handleModeChange = (isAsset: boolean) => {
    setIsAssetMode(isAsset);
    // Reset account type to first option of the new mode
    setAccountType(isAsset ? assetTypeOptions[0].value : liabilityTypeOptions[0].value);
  };

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

  // Form Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate account name
    if (!accountName.trim()) {
      newErrors.accountName = 'Account name is required';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submission Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to AccountBalance format
      const accountBalances: AccountBalance[] = balances
        .filter(balance => {
          const amount = parseFloat(balance.amount);
          return balance.amount.trim() && !isNaN(amount) && amount > 0;
        })
        .map(balance => ({
          currency: balance.currency,
          amount: parseFloat(balance.amount)
        }));

      // Call addAccount with structured data
      addAccount({
        name: accountName.trim(),
        type: accountType,
        balances: accountBalances
      });

      // Reset form state
      setAccountName('');
      setAccountType(isAssetMode ? assetTypeOptions[0].value : liabilityTypeOptions[0].value);
      setBalances([{ amount: '', currency: 'USD' }]);
      setErrors({});

      // Success feedback could be added here

    } catch (error) {
      setErrors({ submit: 'Failed to create account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Account</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset/Liability Toggle */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className={`font-medium ${isAssetMode ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Asset
            </span>
          </div>
          
          <ToggleSwitch
            checked={!isAssetMode}
            onChange={(checked) => handleModeChange(!checked)}
            label=""
          />
          
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className={`font-medium ${!isAssetMode ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Liability
            </span>
          </div>
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Account Name
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder={isAssetMode ? "e.g., Chase Checking, Binance" : "e.g., Credit Card, Car Loan"}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
          />
          {errors.accountName && (
            <p className="text-sm text-red-500 mt-1">{errors.accountName}</p>
          )}
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Account Type
          </label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
          >
            {currentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Currency Balance Inputs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Account Balances
            </label>
            <button
              type="button"
              onClick={addNewBalance}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Currency
            </button>
          </div>

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
          </div>
          
          {errors.balances && (
            <p className="text-sm text-red-500 mt-2">{errors.balances}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !accountName.trim() || balances.every(b => !b.amount.trim())}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </span>
          ) : (
            `Create ${isAssetMode ? 'Asset' : 'Liability'} Account`
          )}
        </button>

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};