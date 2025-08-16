import React, { useState } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { DollarSign, Calendar, Hash, Plus } from 'lucide-react';

const RATING_CONFIG = {
  essential: { 
    label: 'Essential', 
    color: '#2FA5A9',
    bgClass: 'bg-teal-50 dark:bg-teal-900/20',
    textClass: 'text-teal-700 dark:text-teal-400',
    borderClass: 'border-teal-500',
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
    amount: '',
    rating: 'non_essential' as keyof typeof RATING_CONFIG,
    date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addExpense } = useExpenseStore();

  const handleAmountChange = (value: string) => {
    if (value && !value.includes('.') && value.length >= 2) {
      const num = parseFloat(value);
      if (!isNaN(num)) value = (num / 100).toFixed(2);
    }
    setForm(prev => ({ ...prev, amount: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    if (!form.what.trim()) newErrors.what = 'Description required';
    
    const amountNum = parseFloat(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Valid amount required';
    }
    
    if (!form.date) newErrors.date = 'Date required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addExpense({
        what: form.what.trim(),
        amount: amountNum,
        rating: form.rating,
        date: form.date,
      });
      
      setForm({
        what: '',
        amount: '',
        rating: 'non_essential',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      setErrors({ submit: 'Failed to add expense. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Expense</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Hash className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Description
          </label>
          <input
            type="text"
            value={form.what}
            onChange={(e) => setForm(prev => ({ ...prev, what: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-teal-500 dark:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
            placeholder="Coffee, lunch, gas..."
            autoFocus
          />
          {errors.what && <p className="text-xs mt-1 text-red-500">{errors.what}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Amount
          </label>
          <input
            type="text"
            value={form.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-amber-500 dark:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
            placeholder="0.00"
          />
          {errors.amount && <p className="text-xs mt-1 text-red-500">{errors.amount}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                     transition-colors text-gray-900 dark:text-white
                     border-teal-500 dark:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
          />
          {errors.date && <p className="text-xs mt-1 text-red-500">{errors.date}</p>}
        </div>

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
          disabled={isSubmitting || !form.what.trim() || !form.amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
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