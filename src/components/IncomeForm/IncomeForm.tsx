import React, { useState, useRef, useEffect } from 'react';
import { useIncomeStore } from '../../stores/incomeStore';
import { Calendar, DollarSign, Clock, ChevronDown, Plus, PenTool } from 'lucide-react';
import { getTodayLocalString } from '../../utils/dateFormat';
import { sanitizeDescription } from '../../utils/sanitization';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import { FormField } from '../Shared/FormField';
import { formStyles } from '../../styles/formStyles';

export const IncomeForm: React.FC = () => {
  const [source, setSource] = useState('');
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly' | 'yearly'>('one-time');
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [date, setDate] = useState(getTodayLocalString());
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFrequencyDropdown(false);
      }
    };

    if (showFrequencyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFrequencyDropdown]);

  const FREQUENCY_OPTIONS = [
    { value: 'one-time', label: 'One-Time', icon: DollarSign },
    { value: 'weekly', label: 'Weekly', icon: Clock },
    { value: 'monthly', label: 'Monthly', icon: Clock },
    { value: 'yearly', label: 'Yearly', icon: Clock },
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
      setFrequency('one-time');
      setDate(getTodayLocalString());

    } catch (error) {
      console.error('Failed to add income:', error);
      setErrors({ submit: 'Failed to add income. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFrequency = FREQUENCY_OPTIONS.find(f => f.value === frequency)!;

  return (
    <div className={formStyles.card}>
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Income</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Source"
          icon={PenTool}
          value={source}
          onChange={setSource}
          placeholder="Salary, Freelance, Dividends..."
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

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Date"
            icon={Calendar}
            type="date"
            value={date}
            onChange={setDate}
            error={errors.date}
          />

          {/* Frequency Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Frequency
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                className="w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <selectedFrequency.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">{selectedFrequency.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFrequencyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showFrequencyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 overflow-hidden">
                  {FREQUENCY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFrequency(option.value as typeof frequency);
                        setShowFrequencyDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        frequency === option.value ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <option.icon className={`w-4 h-4 ${frequency === option.value ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !source.trim() || !amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {isSubmitting ? 'Adding...' : 'Add Income'}
        </button>

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};
