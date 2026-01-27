import React, { useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { Calendar, PenTool, Plus, Home, ShoppingBag, Sparkles } from 'lucide-react';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { sanitizeDescription, validateAmount as sanitizeValidateAmount, validateDate as sanitizeValidateDate } from '../../utils/sanitization';

interface ValidationError {
  [key: string]: string;
}
import { formStyles } from '../../styles/formStyles';
import { getTodayLocalString } from '../../utils/dateFormat';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import { FormField } from '../Shared/FormField';
import { ToggleSwitch } from '../Shared/ToggleSwitch';

const RATING_CONFIG = {
  essential: {
    label: 'Essential',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-500',
    icon: Home
  },
  discretionary: {
    label: 'Discretionary',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-500',
    icon: ShoppingBag
  },
  luxury: {
    label: 'Luxury',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500',
    icon: Sparkles
  }
};

export const ExpenseForm: React.FC = () => {
  const [form, setForm] = useState({
    what: '',
    rating: 'discretionary' as keyof typeof RATING_CONFIG,
    date: getTodayLocalString(),
    recurring: false,
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
    const sanitizedWhat = sanitizeDescription(form.what);
    if (!sanitizedWhat) newErrors.what = 'Description required';

    const amountResult = sanitizeValidateAmount(amount);
    if (!amountResult.isValid) newErrors.amount = amountResult.error || 'Valid amount required';

    const dateResult = sanitizeValidateDate(form.date);
    if (!dateResult.isValid) newErrors.date = dateResult.error || 'Date required';

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
        rating: 'discretionary',
        date: getTodayLocalString(),
        recurring: false,
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
        <Plus className="w-5 h-5 text-red-700 dark:text-red-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Expense</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Description"
          icon={PenTool}
          value={form.what}
          onChange={(value) => setForm(prev => ({ ...prev, what: value }))}
          placeholder="Coffee, Dinner, Groceries..."
          maxLength={30}
          autoFocus
          error={errors.what}
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

        {/* Priority Selection - Compact */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Priority
          </label>
          <div className="flex gap-2">
            {Object.entries(RATING_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, rating: key as keyof typeof RATING_CONFIG }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border transition-all text-sm ${
                  form.rating === key
                    ? `${config.bgClass} ${config.borderClass} ${config.textClass}`
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <config.icon className="w-4 h-4" />
                <span className="font-medium">{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300">Monthly recurring</span>
          <ToggleSwitch
            checked={form.recurring}
            onChange={(checked) => setForm(prev => ({ ...prev, recurring: checked }))}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !form.what.trim() || !amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
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
