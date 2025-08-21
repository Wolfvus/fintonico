import React, { useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { Calendar, PenTool, Plus, Home, Clapperboard, Sparkles } from 'lucide-react';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { validateRequired, validateAmount, validateDate } from '../../utils/validation';
import { sanitizeDescription } from '../../utils/sanitization';
import type { ValidationError } from '../../utils/validation';
import { formStyles } from '../../styles/formStyles';
import { getTodayLocalString } from '../../utils/dateFormat';
import { ToggleSwitch } from '../Shared/ToggleSwitch';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import { FormField } from '../Shared/FormField';

const RATING_CONFIG = {
  essential: { 
    label: 'Essential', 
    color: '#10B981',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-500',
    description: 'Necessary expenses',
    icon: Home
  },
  non_essential: { 
    label: 'Non-Essential', 
    color: '#EAB308',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-500',
    description: 'Can be reduced',
    icon: Clapperboard
  },
  luxury: { 
    label: 'Luxury', 
    color: '#DC2626',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500',
    description: 'Optional purchases',
    icon: Sparkles
  }
};

export const ExpenseForm: React.FC = () => {
  const [form, setForm] = useState({
    what: '',
    rating: 'non_essential' as keyof typeof RATING_CONFIG,
    date: getTodayLocalString(),
    recurring: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});

  const { addExpense } = useExpenseStore();
  const {
    amount,
    displayAmount,
    currency,
    handleAmountChange,
    handleCurrencyChange,
    reset: resetCurrency
  } = useCurrencyInput();


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
        what: sanitizeDescription(form.what),
        amount: parseFloat(amount),
        currency: currency,
        rating: form.rating,
        date: form.date,
        recurring: form.recurring,
      });
      
      setForm({
        what: '',
        rating: 'non_essential',
        date: getTodayLocalString(),
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
        <FormField
          label="Description"
          icon={PenTool}
          value={form.what}
          onChange={(value) => setForm(prev => ({ ...prev, what: value }))}
          placeholder="Coffee at Starbucks, Dinner..."
          maxLength={30}
          autoFocus
          error={errors.what}
          className="space-y-2.5 sm:space-y-2"
        />

        <AmountCurrencyInput
          displayAmount={displayAmount}
          currency={currency}
          onAmountChange={handleAmountChange}
          onCurrencyChange={handleCurrencyChange}
          amountError={errors.amount}
        />

        <FormField
          label="Date"
          icon={Calendar}
          type="date"
          value={form.date}
          onChange={(value) => setForm(prev => ({ ...prev, date: value }))}
          error={errors.date}
        />


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
                
                {/* Priority Icon */}
                <div className="mr-2 flex-shrink-0">
                  <config.icon 
                    className={`w-4 h-4 ${
                      form.rating === key 
                        ? config.textClass 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} 
                  />
                </div>

                {/* Content - single line */}
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