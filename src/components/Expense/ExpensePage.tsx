import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, Calendar, RefreshCw, Home, ShoppingBag, Sparkles } from 'lucide-react';
import type { Expense, ExpenseRating } from '../../types';

// Format date for display (compact format: Dec 11)
const formatDateCompact = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Parse YYYY-MM-DD as local date
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Get today as YYYY-MM-DD
const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Rating options with colors - 3 categories
const RATING_OPTIONS: { value: ExpenseRating; label: string; color: string; bgColor: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'essential', label: 'Essential', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: Home },
  { value: 'discretionary', label: 'Discretionary', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: ShoppingBag },
  { value: 'luxury', label: 'Luxury', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: Sparkles },
];

// Quick Add Form Component
interface QuickAddFormProps {
  onAdd: (expense: { what: string; amount: number; currency: string; rating: ExpenseRating; date: string; recurring?: boolean }) => void;
  baseCurrency: string;
  enabledCurrencies: string[];
}

const QuickAddForm: React.FC<QuickAddFormProps> = ({ onAdd, baseCurrency, enabledCurrencies }) => {
  const [what, setWhat] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [rating, setRating] = useState<ExpenseRating>('discretionary');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (what.trim() && amount) {
      onAdd({
        what: what.trim(),
        amount: parseFloat(amount) || 0,
        currency,
        rating,
        date: getTodayString(),
      });
      setWhat('');
      setAmount('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Description */}
        <input
          ref={inputRef}
          type="text"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="What did you spend on?"
          className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400"
        />

        {/* Amount + Currency */}
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="flex-1 px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <div className="relative" ref={currencyRef}>
            <button
              type="button"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {currency}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCurrencyDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[80px]">
                {enabledCurrencies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      c === currency ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Buttons */}
        <div className="flex gap-2">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRating(opt.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border transition-all text-sm ${
                rating === opt.value
                  ? `${opt.bgColor} border-current ${opt.color}`
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <opt.icon className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!what.trim() || !amount}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
};

// Editable Cell Component
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = 'Click to edit',
  align = 'left',
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(localValue);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-red-500 rounded-md outline-none ${
          align === 'right' ? 'text-right' : 'text-left'
        } ${className}`}
      />
    );
  }

  let displayValue = value;
  if (type === 'date' && value) {
    displayValue = formatDateCompact(value);
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`px-2 py-1.5 text-sm cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors min-h-[32px] flex items-center ${
        align === 'right' ? 'justify-end' : 'justify-start'
      } ${className}`}
    >
      {displayValue || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
    </div>
  );
};

// Rating Dropdown
interface RatingDropdownProps {
  value: ExpenseRating;
  onChange: (value: ExpenseRating) => void;
}

const RatingDropdown: React.FC<RatingDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = RATING_OPTIONS.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors w-full"
      >
        <span className={`flex-1 text-left ${selectedOption?.color}`}>
          {selectedOption?.label || 'Select...'}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                option.value === value ? option.bgColor : ''
              }`}
            >
              <option.icon className={`w-4 h-4 ${option.color}`} />
              <span className={option.color}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Currency Dropdown
interface CurrencyDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors w-full"
      >
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300">{value}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[70px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                opt === value ? 'bg-red-50 dark:bg-red-900/20' : ''
              }`}
            >
              <span className="text-gray-700 dark:text-gray-300">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Recurring Toggle
interface RecurringToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const RecurringToggle: React.FC<RecurringToggleProps> = ({ value, onChange }) => {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`p-1.5 rounded-md transition-colors ${
        value
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={value ? 'Recurring expense' : 'Mark as recurring'}
    >
      <RefreshCw className="w-4 h-4" />
    </button>
  );
};

// Expense Row Component
interface ExpenseRowProps {
  expense: Expense;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  enabledCurrencies: string[];
  index: number;
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  onUpdate,
  onDelete,
  enabledCurrencies,
  index,
}) => {
  const isEven = index % 2 === 0;

  return (
    <tr className={`group border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors ${isEven ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
      {/* Description */}
      <td className="py-1 px-1">
        <EditableCell
          value={expense.what}
          onChange={(what) => onUpdate(expense.id, { what })}
          placeholder="Expense description"
        />
      </td>

      {/* Amount */}
      <td className="py-1 px-1 w-28 border-l border-gray-300 dark:border-gray-600">
        <EditableCell
          value={String(expense.amount)}
          onChange={(val) => onUpdate(expense.id, { amount: parseFloat(val) || 0 })}
          type="number"
          placeholder="0.00"
          align="right"
          className="text-red-600 dark:text-red-400 font-medium"
        />
      </td>

      {/* Currency */}
      <td className="py-1 px-1 w-20 border-l border-gray-200 dark:border-gray-700">
        <CurrencyDropdown
          value={expense.currency}
          onChange={(currency) => onUpdate(expense.id, { currency })}
          options={enabledCurrencies}
        />
      </td>

      {/* Rating */}
      <td className="py-1 px-1 w-32 border-l border-gray-200 dark:border-gray-700">
        <RatingDropdown
          value={expense.rating}
          onChange={(rating) => onUpdate(expense.id, { rating })}
        />
      </td>

      {/* Date */}
      <td className="py-1 px-1 w-24 border-l border-gray-200 dark:border-gray-700">
        <EditableCell
          value={expense.date}
          onChange={(date) => onUpdate(expense.id, { date })}
          type="date"
          placeholder="-"
        />
      </td>

      {/* Recurring */}
      <td className="py-1 px-1 w-10 border-l border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <RecurringToggle
            value={expense.recurring || false}
            onChange={(recurring) => onUpdate(expense.id, { recurring })}
          />
        </div>
      </td>

      {/* Delete */}
      <td className="py-1 px-1 w-10 border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onDelete(expense.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          title="Delete expense"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// Main Component
export const ExpensePage: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useExpenseStore();
  const { baseCurrency, enabledCurrencies, formatAmount, convertAmount } = useCurrencyStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    return expenses.filter((expense) => {
      const expenseDate = parseLocalDate(expense.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    }).sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [expenses, selectedDate]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => {
      return total + convertAmount(expense.amount, expense.currency, baseCurrency);
    }, 0);
  }, [filteredExpenses, convertAmount, baseCurrency]);

  // Calculate breakdown by rating
  const ratingBreakdown = useMemo(() => {
    const breakdown: Record<ExpenseRating, number> = {
      essential: 0,
      discretionary: 0,
      luxury: 0,
    };
    filteredExpenses.forEach((expense) => {
      if (breakdown[expense.rating] !== undefined) {
        breakdown[expense.rating] += convertAmount(expense.amount, expense.currency, baseCurrency);
      }
    });
    return breakdown;
  }, [filteredExpenses, convertAmount, baseCurrency]);

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const getMonthLabel = () => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Update expense handler
  const handleUpdateExpense = async (id: string, updates: Partial<Expense>) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    await deleteExpense(id);
    await addExpense({
      what: updates.what ?? expense.what,
      amount: updates.amount ?? expense.amount,
      currency: updates.currency ?? expense.currency,
      rating: updates.rating ?? expense.rating,
      date: updates.date ?? expense.date,
      recurring: updates.recurring ?? expense.recurring,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Quick Add + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Add Form */}
        <div className="lg:col-span-1">
          <QuickAddForm
            onAdd={addExpense}
            baseCurrency={baseCurrency}
            enabledCurrencies={enabledCurrencies}
          />
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly Total</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatAmount(monthlyTotal)}
            </p>
          </div>

          {RATING_OPTIONS.map((rating) => (
            <div key={rating.value} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5 mb-1">
                <rating.icon className={`w-3 h-3 ${rating.color}`} />
                <p className="text-xs text-gray-500 dark:text-gray-400">{rating.label}</p>
              </div>
              <p className={`text-lg font-semibold ${rating.color}`}>
                {formatAmount(ratingBreakdown[rating.value])}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
              {getMonthLabel()}
            </span>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28 border-l border-gray-300 dark:border-gray-600">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 border-l border-gray-200 dark:border-gray-700">
                  Curr
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32 border-l border-gray-200 dark:border-gray-700">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24 border-l border-gray-200 dark:border-gray-700">
                  Date
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10 border-l border-gray-200 dark:border-gray-700">
                  <RefreshCw className="w-3 h-3 mx-auto" />
                </th>
                <th className="w-10 border-l border-gray-200 dark:border-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, index) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onUpdate={handleUpdateExpense}
                  onDelete={deleteExpense}
                  enabledCurrencies={enabledCurrencies}
                  index={index}
                />
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No expenses this month. Use the Quick Add form above to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
