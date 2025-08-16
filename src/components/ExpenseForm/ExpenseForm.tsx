import React, { useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { DollarSign, Calendar, PenTool, Plus, Globe } from 'lucide-react';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { validateRequired, validateAmount, validateDate } from '../../utils/validation';
import type { ValidationError } from '../../utils/validation';
import { formStyles } from '../../styles/formStyles';

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
        <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Expense</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <PenTool className="w-4 h-4 text-green-600 dark:text-green-400" />
            Description
          </label>
          <input
            type="text"
            value={form.what}
            onChange={(e) => setForm(prev => ({ ...prev, what: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
            placeholder="Coffee at Starbucks, Dinner with Friends..."
            autoFocus
          />
          {errors.what && <p className="text-xs mt-1 text-red-500">{errors.what}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Amount
            </label>
            <input
              type="text"
              value={displayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                       transition-colors text-gray-900 dark:text-white
                       border-amber-500 dark:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
              placeholder={`${getCurrencySymbol(currency)}0.00`}
            />
            {errors.amount && <p className="text-xs mt-1 text-red-500">{errors.amount}</p>}
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                       transition-colors text-gray-900 dark:text-white
                       border-amber-500 dark:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
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
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
          />
          {errors.date && <p className="text-xs mt-1 text-red-500">{errors.date}</p>}
        </div>

        {form.rating === 'essential' && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => setForm(prev => ({ ...prev, recurring: e.target.checked }))}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded 
                         focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 
                         focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span>Recurring monthly expense</span>
            </label>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 ml-6">
              Check this for fixed monthly costs like rent, utilities, subscriptions
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
            Priority
          </label>
          <div className="space-y-2">
            {Object.entries(RATING_CONFIG).map(([key, config]) => (
              <label
                key={key}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${form.rating === key 
                    ? `${config.bgClass} ${config.borderClass} ${config.textClass}` 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400'
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
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${form.rating === key ? '' : 'text-gray-900 dark:text-gray-100'}`}>
                      {config.label}
                    </span>
                    <div 
                      className={`w-4 h-4 rounded-full border-2 transition-colors`}
                      style={{
                        borderColor: form.rating === key ? config.color : '#9CA3AF',
                        backgroundColor: form.rating === key ? config.color : 'transparent'
                      }}
                    >
                      {form.rating === key && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-1 opacity-75">{config.description}</p>
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

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};