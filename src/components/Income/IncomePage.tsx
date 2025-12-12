import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useIncomeStore } from '../../stores/incomeStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { DollarSign, Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, Calendar, Filter, X } from 'lucide-react';
import type { Income } from '../../types';
import type { IncomeFrequency } from '../../stores/incomeStore';
import { CSVActions } from '../Shared/CSVActions';
import { exportIncomeToCSV, parseIncomeCSV, downloadCSV, readCSVFile } from '../../utils/csv';

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

// Frequency options
const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

// Monthly conversion factors for expected income calculation
// Using Record<string, number> to handle legacy 'yearly' data
const MONTHLY_FACTORS: Record<string, number> = {
  'one-time': 0, // One-time doesn't contribute to expected monthly
  'weekly': 4,
  'bi-weekly': 2,
  'monthly': 1,
  'yearly': 1, // Legacy support - treat yearly as monthly for display
};

// Quick Add Form Component
interface QuickAddFormProps {
  onAdd: (income: { source: string; amount: number; currency: string; frequency: IncomeFrequency; date: string }) => void;
  baseCurrency: string;
  enabledCurrencies: string[];
}

const QuickAddForm: React.FC<QuickAddFormProps> = ({ onAdd, baseCurrency, enabledCurrencies }) => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [frequency, setFrequency] = useState<IncomeFrequency>('one-time');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const frequencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
      if (frequencyRef.current && !frequencyRef.current.contains(event.target as Node)) {
        setShowFrequencyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (source.trim() && amount) {
      onAdd({
        source: source.trim(),
        amount: parseFloat(amount) || 0,
        currency,
        frequency,
        date: getTodayString(),
      });
      setSource('');
      setAmount('');
      inputRef.current?.focus();
    }
  };

  const selectedFrequency = FREQUENCY_OPTIONS.find((f) => f.value === frequency);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Source */}
        <input
          ref={inputRef}
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Income source (Salary, Freelance...)"
          className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400"
        />

        {/* Amount + Currency */}
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="flex-1 px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400"
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
                      c === currency ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Frequency Dropdown */}
        <div className="relative" ref={frequencyRef}>
          <button
            type="button"
            onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <span>{selectedFrequency?.label || 'Select frequency'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFrequencyDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showFrequencyDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFrequency(opt.value);
                    setShowFrequencyDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    opt.value === frequency ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!source.trim() || !amount}
          className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Income
        </button>
      </form>
    </div>
  );
};

// Format number with thousands separator (1,895.00)
const formatNumberWithCommas = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Editable Cell Component
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'currency';
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
        type={type === 'currency' ? 'number' : type}
        step={type === 'currency' ? '0.01' : undefined}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-green-500 rounded-md outline-none ${
          align === 'right' ? 'text-right' : 'text-left'
        } ${className}`}
      />
    );
  }

  let displayValue = value;
  if (type === 'date' && value) {
    displayValue = formatDateCompact(value);
  } else if (type === 'currency' && value) {
    displayValue = formatNumberWithCommas(value);
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

// Frequency Dropdown
interface FrequencyDropdownProps {
  value: IncomeFrequency;
  onChange: (value: IncomeFrequency) => void;
}

const FrequencyDropdown: React.FC<FrequencyDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = FREQUENCY_OPTIONS.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = FREQUENCY_OPTIONS.length * 36 + 8; // Approximate height
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPosition({
        top: openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 90),
        openUp,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors w-full"
      >
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs">
          {selectedOption?.label || 'Select...'}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap ${
                option.value === value ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
            </button>
          ))}
        </div>,
        document.body
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = options.length * 36 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPosition({
        top: openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 70),
      });
    }
  }, [isOpen, options.length]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors w-full"
      >
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300">{value}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt);
                setIsOpen(false);
              }}
              className={`flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                opt === value ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <span className="text-gray-700 dark:text-gray-300">{opt}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

// Date Picker Cell with Mini Calendar
interface DatePickerCellProps {
  value: string;
  onChange: (value: string) => void;
}

const DatePickerCell: React.FC<DatePickerCellProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? parseLocalDate(value) : new Date());
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      const dropdownHeight = 300;

      let top = rect.bottom + 4;
      let left = rect.right - dropdownWidth;

      // Ensure dropdown stays within viewport horizontally
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }

      // Open upward if not enough space below
      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      // Ensure it doesn't go above viewport
      if (top < 8) {
        top = 8;
      }

      // For fixed positioning, don't add scroll offset
      setDropdownPosition({
        top,
        left,
      });
    }
  }, [isOpen]);

  const selectedDate = value ? parseLocalDate(value) : null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(viewDate);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(newDate);
    setIsOpen(false);
  };

  const isSelectedDay = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewDate.getFullYear() &&
           selectedDate.getMonth() === viewDate.getMonth() &&
           selectedDate.getDate() === day;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === viewDate.getFullYear() &&
           today.getMonth() === viewDate.getMonth() &&
           today.getDate() === day;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors w-full"
      >
        <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {value ? formatDateCompact(value) : '-'}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-60"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMonth();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextMonth();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="w-7 h-6 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: startingDay }, (_, i) => (
              <div key={`empty-${i}`} className="w-7 h-7" />
            ))}
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectDay(day);
                }}
                className={`w-7 h-7 text-xs rounded flex items-center justify-center transition-colors ${
                  isSelectedDay(day)
                    ? 'bg-green-500 text-white'
                    : isToday(day)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Today button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              onChange(todayStr);
              setIsOpen(false);
            }}
            className="w-full mt-2 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Today
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// Income Row Component
interface IncomeRowProps {
  income: Income;
  onUpdate: (id: string, updates: Partial<Income>) => void;
  onDelete: (id: string) => void;
  enabledCurrencies: string[];
  index: number;
}

const IncomeRow: React.FC<IncomeRowProps> = ({
  income,
  onUpdate,
  onDelete,
  enabledCurrencies,
  index,
}) => {
  const isEven = index % 2 === 0;

  return (
    <tr className={`group border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors ${isEven ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
      {/* Source */}
      <td className="py-1 px-1">
        <EditableCell
          value={income.source}
          onChange={(source) => onUpdate(income.id, { source })}
          placeholder="Income source"
        />
      </td>

      {/* Amount */}
      <td className="py-1 px-1 border-l border-gray-300 dark:border-gray-600 w-28">
        <EditableCell
          value={String(income.amount)}
          onChange={(val) => onUpdate(income.id, { amount: parseFloat(val) || 0 })}
          type="currency"
          placeholder="0.00"
          align="right"
          className="text-green-600 dark:text-green-400 font-medium"
        />
      </td>

      {/* Currency */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-20">
        <CurrencyDropdown
          value={income.currency}
          onChange={(currency) => onUpdate(income.id, { currency })}
          options={enabledCurrencies}
        />
      </td>

      {/* Frequency */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-24">
        <FrequencyDropdown
          value={income.frequency}
          onChange={(frequency) => onUpdate(income.id, { frequency })}
        />
      </td>

      {/* Date */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-20">
        <DatePickerCell
          value={income.date}
          onChange={(date) => onUpdate(income.id, { date })}
        />
      </td>

      {/* Delete */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-10">
        <button
          onClick={() => onDelete(income.id)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          title="Delete income"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

// Filter Bar Component
interface FilterBarProps {
  sourceFilter: string;
  setSourceFilter: (v: string) => void;
  currencyFilter: string;
  setCurrencyFilter: (v: string) => void;
  frequencyFilter: string;
  setFrequencyFilter: (v: string) => void;
  enabledCurrencies: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Table Header with integrated Filter
interface TableHeaderWithFilterProps {
  sourceFilter: string;
  setSourceFilter: (v: string) => void;
  currencyFilter: string;
  setCurrencyFilter: (v: string) => void;
  frequencyFilter: string;
  setFrequencyFilter: (v: string) => void;
  enabledCurrencies: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TableHeaderWithFilter: React.FC<TableHeaderWithFilterProps> = ({
  sourceFilter,
  setSourceFilter,
  currencyFilter,
  setCurrencyFilter,
  frequencyFilter,
  setFrequencyFilter,
  enabledCurrencies,
  hasActiveFilters,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Source
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 w-28">
          Amount
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-20">
          Currency
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-24">
          Frequency
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-20">
          Date
        </th>
        <th className="w-10 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-md transition-colors ${
              hasActiveFilters
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </th>
      </tr>
      {isOpen && (
        <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <td colSpan={6} className="px-3 py-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Source Filter */}
              <input
                type="text"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                placeholder="Search source..."
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400 w-36"
              />

              {/* Currency Filter */}
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white"
              >
                <option value="">All Currencies</option>
                {enabledCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Frequency Filter */}
              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white"
              >
                <option value="">All Frequencies</option>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </thead>
  );
};

// Main Component
export const IncomePage: React.FC = () => {
  const { incomes, addIncome, deleteIncome } = useIncomeStore();
  const { baseCurrency, enabledCurrencies, formatAmount, convertAmount } = useCurrencyStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter states
  const [sourceFilter, setSourceFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = sourceFilter !== '' || currencyFilter !== '' || frequencyFilter !== '';

  const clearFilters = () => {
    setSourceFilter('');
    setCurrencyFilter('');
    setFrequencyFilter('');
  };

  // Filter incomes by selected month and filters
  const filteredIncomes = useMemo(() => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    return incomes.filter((income) => {
      const incomeDate = parseLocalDate(income.date);

      // Recurring income: show if created on or before the selected month
      // One-time income: only show in the month it was created
      if (income.frequency === 'one-time') {
        const inMonth = incomeDate >= startOfMonth && incomeDate <= endOfMonth;
        if (!inMonth) return false;
      } else {
        // Recurring income shows in all months from creation date onwards
        if (incomeDate > endOfMonth) return false;
      }

      // Apply filters
      if (sourceFilter && !income.source.toLowerCase().includes(sourceFilter.toLowerCase())) {
        return false;
      }
      if (currencyFilter && income.currency !== currencyFilter) {
        return false;
      }
      if (frequencyFilter && income.frequency !== frequencyFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort recurring first, then by date
      if ((a.frequency === 'one-time') !== (b.frequency === 'one-time')) {
        return a.frequency === 'one-time' ? 1 : -1;
      }
      return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
    });
  }, [incomes, selectedDate, sourceFilter, currencyFilter, frequencyFilter]);

  // Calculate monthly total (actual for selected month)
  const monthlyTotal = useMemo(() => {
    return filteredIncomes.reduce((total, income) => {
      return total + convertAmount(income.amount, income.currency, baseCurrency);
    }, 0);
  }, [filteredIncomes, convertAmount, baseCurrency]);

  // Calculate Expected Monthly Income (from recurring entries visible in the table)
  const { expectedMonthlyIncome, recurringCount } = useMemo(() => {
    const recurringEntries = filteredIncomes.filter((income) => income.frequency !== 'one-time');

    const total = recurringEntries.reduce((sum, income) => {
      const factor = MONTHLY_FACTORS[income.frequency] ?? 1; // Default to 1 if unknown frequency
      const converted = convertAmount(income.amount, income.currency, baseCurrency);
      return sum + (converted * factor);
    }, 0);

    return { expectedMonthlyIncome: total, recurringCount: recurringEntries.length };
  }, [filteredIncomes, convertAmount, baseCurrency]);

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const getMonthLabel = () => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Update income handler
  const handleUpdateIncome = async (id: string, updates: Partial<Income>) => {
    const income = incomes.find((i) => i.id === id);
    if (!income) return;

    await deleteIncome(id);
    await addIncome({
      source: updates.source ?? income.source,
      amount: updates.amount ?? income.amount,
      currency: updates.currency ?? income.currency,
      frequency: updates.frequency ?? income.frequency,
      date: updates.date ?? income.date,
    });
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const csvContent = exportIncomeToCSV(incomes);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `fintonico-income-${dateStr}.csv`);
  };

  // CSV Import handler
  const handleImportCSV = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const csvContent = await readCSVFile(file);
      const { data, errors } = parseIncomeCSV(csvContent);

      if (errors.length > 0) {
        return {
          success: false,
          message: errors.join('\n'),
        };
      }

      if (data.length === 0) {
        return {
          success: false,
          message: 'No valid income entries found in the CSV file',
        };
      }

      // Validate and import each row
      const validFrequencies = ['one-time', 'weekly', 'bi-weekly', 'monthly'];
      let importedCount = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // +2 because row 1 is header, and array is 0-indexed

        // Validate required fields
        if (!row.date || !row.source || !row.amount) {
          importErrors.push(`Row ${rowNum}: Missing required fields`);
          continue;
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
          importErrors.push(`Row ${rowNum}: Invalid date format (use YYYY-MM-DD)`);
          continue;
        }

        // Validate amount
        const amount = parseFloat(row.amount);
        if (isNaN(amount) || amount <= 0) {
          importErrors.push(`Row ${rowNum}: Invalid amount`);
          continue;
        }

        // Validate frequency
        const frequency = row.frequency?.toLowerCase() || 'one-time';
        if (!validFrequencies.includes(frequency)) {
          importErrors.push(`Row ${rowNum}: Invalid frequency (use one-time, weekly, bi-weekly, or monthly)`);
          continue;
        }

        // Add the income
        await addIncome({
          source: row.source,
          amount,
          currency: row.currency?.toUpperCase() || baseCurrency,
          frequency: frequency as IncomeFrequency,
          date: row.date,
        });
        importedCount++;
      }

      if (importErrors.length > 0 && importedCount === 0) {
        return {
          success: false,
          message: importErrors.slice(0, 5).join('\n') + (importErrors.length > 5 ? `\n...and ${importErrors.length - 5} more errors` : ''),
        };
      }

      return {
        success: true,
        message: importErrors.length > 0
          ? `Imported with ${importErrors.length} skipped rows`
          : 'All income entries imported successfully',
        count: importedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to parse CSV file',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Quick Add + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Add Form */}
        <div className="lg:col-span-1">
          <QuickAddForm
            onAdd={addIncome}
            baseCurrency={baseCurrency}
            enabledCurrencies={enabledCurrencies}
          />
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Income (Actual) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{getMonthLabel()}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(monthlyTotal)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{filteredIncomes.length} entries</p>
              </div>
            </div>
          </div>

          {/* Expected Monthly Income */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Expected Monthly</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(expectedMonthlyIncome)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {recurringCount > 0 ? `${recurringCount} recurring` : 'no recurring income'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Month Navigation */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-2 bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            {/* CSV Actions - Left */}
            <div className="flex-1">
              <CSVActions
                onExport={handleExportCSV}
                onImport={handleImportCSV}
                entityName="income"
              />
            </div>

            {/* Month Navigation - Center */}
            <div className="flex items-center gap-4">
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

            {/* Spacer - Right (for balance) */}
            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <TableHeaderWithFilter
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              currencyFilter={currencyFilter}
              setCurrencyFilter={setCurrencyFilter}
              frequencyFilter={frequencyFilter}
              setFrequencyFilter={setFrequencyFilter}
              enabledCurrencies={enabledCurrencies}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />
            <tbody>
              {filteredIncomes.map((income, index) => (
                <IncomeRow
                  key={income.id}
                  income={income}
                  onUpdate={handleUpdateIncome}
                  onDelete={deleteIncome}
                  enabledCurrencies={enabledCurrencies}
                  index={index}
                />
              ))}
              {filteredIncomes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No income this month. Use the Quick Add form above to get started.
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
