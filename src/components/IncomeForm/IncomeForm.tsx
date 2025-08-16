import React, { useState } from 'react';
import { useIncomeStore } from '../../stores/incomeStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { DollarSign, Calendar, Briefcase, RefreshCw, Globe } from 'lucide-react';

export const IncomeForm: React.FC = () => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('MXN');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'biweekly' | 'yearly' | 'one-time'>('monthly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addIncome } = useIncomeStore();
  const { currencies } = useCurrencyStore();

  const frequencyOptions = [
    { value: 'monthly', label: 'Monthly', icon: '📅' },
    { value: 'biweekly', label: 'Bi-weekly', icon: '📆' },
    { value: 'weekly', label: 'Weekly', icon: '🗓️' },
    { value: 'yearly', label: 'Yearly', icon: '📊' },
    { value: 'one-time', label: 'One-time', icon: '💰' },
  ];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow natural decimal input - don't auto-convert to cents
    // Only allow valid number characters and one decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    const decimalCount = (sanitized.match(/\./g) || []).length;
    
    if (decimalCount <= 1) {
      setAmount(sanitized);
    }
  };

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
        source: source.trim(),
        amount: amountNum,
        currency,
        frequency,
        date,
      });
      
      // Reset form
      setSource('');
      setAmount('');
      setCurrency('MXN');
      setFrequency('monthly');
      setDate(new Date().toISOString().split('T')[0]);
      
    } catch (error) {
      console.error('Failed to add income:', error);
      setErrors({ submit: 'Failed to add income. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Income</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Briefcase className="w-4 h-4 text-green-600 dark:text-green-400" />
            Income Source
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-all duration-200 text-gray-900 dark:text-white
                     border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
            placeholder="Salary, Freelance, Investment..."
            autoFocus
          />
          {errors.source && (
            <p className="text-xs mt-1 text-red-500">{errors.source}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              Amount
            </label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                       transition-all duration-200 text-gray-900 dark:text-white
                       border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-xs mt-1 text-red-500">{errors.amount}</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                       transition-all duration-200 text-gray-900 dark:text-white
                       border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-all duration-200 text-gray-900 dark:text-white
                     border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-all duration-200 text-gray-900 dark:text-white
                     border-green-500 dark:border-green-600 focus:ring-2 focus:ring-green-500/20"
          />
          {errors.date && (
            <p className="text-xs mt-1 text-red-500">{errors.date}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !source.trim() || !amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg
                   transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
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