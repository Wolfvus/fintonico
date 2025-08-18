import React, { useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { Coins, Calendar, PenTool, Plus, Globe } from 'lucide-react';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { validateRequired, validateAmount, validateDate } from '../../utils/validation';
import type { ValidationError } from '../../utils/validation';
import { formStyles, getInputClassName } from '../../styles/formStyles';
import { ToggleSwitch } from '../Shared/ToggleSwitch';

const RATING_CONFIG = {
  essential: { 
    label: 'Essential', 
    color: '#10B981',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-500',
    description: 'Necessary expenses'
  },
  non_essential: { 
    label: 'Non-Essential', 
    color: '#EAB308',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-500',
    description: 'Can be reduced'
  },
  luxury: { 
    label: 'Luxury', 
    color: '#DC2626',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500',
    description: 'Optional purchases'
  }
};

export const ExpenseForm: React.FC = () => {
  const [form, setForm] = useState({
    what: '',
    rating: 'non_essential' as keyof typeof RATING_CONFIG,
    date: new Date().toISOString().split('T')[0],
    recurring: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});

  const { addExpense } = useExpenseStore();
  const { currencies, getCurrencySymbol } = useCurrencyStore();
  const {
    amount,
    displayAmount,
    currency,
    handleAmountChange,
    handleCurrencyChange,
    reset: resetCurrency
  } = useCurrencyInput('MXN');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: ValidationError = {};
    const whatError = validateRequired(form.what, 'Description');
    if (whatError) newErrors.what = whatError;
    
    const amountError = validateAmount(amount);
    if (amountError) newErrors.amount = amountError;
    
    const dateError = validateDate(form.date);
    if (dateError) newErrors.date = dateError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addExpense({
        what: form.what.trim(),
        amount: parseFloat(amount),
        currency: currency,
        rating: form.rating,
        date: form.date,
        recurring: form.recurring,
      });
      
      setForm({
        what: '',
        rating: 'non_essential',
        date: new Date().toISOString().split('T')[0],
        recurring: false
      });
      resetCurrency();
    } catch {
      setErrors({ submit: 'Failed to add expense. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={formStyles.card}>
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Expense</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2.5 sm:mb-2 text-gray-900 dark:text-gray-100">
            <PenTool className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            Description
          </label>
          <input
            type="text"
            value={form.what}
            onChange={(e) => setForm(prev => ({ ...prev, what: e.target.value }))}
            className={getInputClassName()}
            placeholder="Coffee at Starbucks, Dinner with Friends..."
            autoFocus
          />
          {errors.what && <p className="text-xs mt-1 text-red-500">{errors.what}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <Coins className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              Amount
            </label>
            <input
              type="text"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={getInputClassName()}
              placeholder={`${getCurrencySymbol(currency)}0.00`}
            />
            {errors.amount && <p className="text-xs mt-1 text-red-500">{errors.amount}</p>}
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className={getInputClassName()}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol}{currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
            className={getInputClassName()}
          />
          {errors.date && <p className="text-xs mt-1 text-red-500">{errors.date}</p>}
        </div>


        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Priority
          </label>
          <div className="space-y-1.5">
            {Object.entries(RATING_CONFIG).map(([key, config]) => (
              <label
                key={key}
                className={`flex items-center p-2 rounded-md border cursor-pointer transition-all
                  ${form.rating === key 
                    ? `${config.bgClass} ${config.borderClass}` 
                    : 'border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={key}
                  checked={form.rating === key}
                  onChange={(e) => setForm(prev => ({ ...prev, rating: e.target.value as keyof typeof RATING_CONFIG }))}
                  className="sr-only"
                />
                
                {/* Custom radio button */}
                <div 
                  className="w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0"
                  style={{
                    borderColor: form.rating === key ? config.color : '#9CA3AF',
                    backgroundColor: form.rating === key ? config.color : 'transparent'
                  }}
                >
                  {form.rating === key && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full m-0.5" />
                  )}
                </div>

                {/* Content - single line */}
                <div className="flex items-center justify-between flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      form.rating === key 
                        ? config.textClass 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {config.label}
                    </span>
                    <span className={`text-xs ${
                      form.rating === key 
                        ? 'text-gray-600 dark:text-gray-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      · {config.description}
                    </span>
                  </div>
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !form.what.trim() || !amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <ToggleSwitch
            checked={form.recurring}
            onChange={(checked) => setForm(prev => ({ ...prev, recurring: checked }))}
            label="Recurring monthly expense"
          />
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 ml-2">
            Enable for fixed monthly costs like rent, utilities, subscriptions
          </p>
        </div>

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};