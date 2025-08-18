import React, { useState } from 'react';
import { useIncomeStore } from '../../stores/incomeStore';
import { Calendar, Briefcase, RefreshCw } from 'lucide-react';
import { getTodayLocalString } from '../../utils/dateFormat';
import { sanitizeDescription } from '../../utils/sanitization';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import { FormField } from '../Shared/FormField';

export const IncomeForm: React.FC = () => {
  const [source, setSource] = useState('');
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [date, setDate] = useState(getTodayLocalString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addIncome } = useIncomeStore();
  const {
    amount,
    displayAmount,
    currency,
    handleAmountChange,
    handleCurrencyChange,
    reset: resetCurrency
  } = useCurrencyInput();

  const frequencyOptions = [
    { value: 'one-time', label: 'One-Time', icon: '💰' },
    { value: 'monthly', label: 'Monthly', icon: '📅' },
    { value: 'weekly', label: 'Weekly', icon: '🗓️' },
    { value: 'yearly', label: 'Yearly', icon: '📊' },
  ];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    
    if (!source.trim()) {
      newErrors.source = 'Income source required';
    }
    
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Valid amount required';
    }
    
    if (!date) {
      newErrors.date = 'Date required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addIncome({
        source: sanitizeDescription(source),
        amount: amountNum,
        currency,
        frequency,
        date,
      });
      
      // Reset form
      setSource('');
      resetCurrency();
      setFrequency('monthly');
      setDate(getTodayLocalString());
      
    } catch (error) {
      console.error('Failed to add income:', error);
      setErrors({ submit: 'Failed to add income. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Income</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Income Source"
          icon={Briefcase}
          value={source}
          onChange={setSource}
          placeholder="Main Salary, Freelance..."
          maxLength={30}
          autoFocus
          error={errors.source}
        />

        <AmountCurrencyInput
          displayAmount={displayAmount}
          currency={currency}
          onAmountChange={handleAmountChange}
          onCurrencyChange={handleCurrencyChange}
          amountError={errors.amount}
        />

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <FormField
          label="Date"
          icon={Calendar}
          type="date"
          value={date}
          onChange={setDate}
          error={errors.date}
        />

        <button
          type="submit"
          disabled={isSubmitting || !source.trim() || !amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            'Add Income'
          )}
        </button>

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};