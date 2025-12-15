import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useExpenseStore } from '../../stores/expenseStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, Calendar, RefreshCw, Home, ShoppingBag, Sparkles, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import type { Expense, ExpenseRating } from '../../types';
import { ImportModal } from '../Shared/ImportModal';
import { parseExpenseCSV } from '../../utils/csv';

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

// Editable Cell Component
// Format number with thousands separator (1,895.00)
const formatNumberWithCommas = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
        className={`w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-red-500 rounded-md outline-none ${
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

// Rating Dropdown
interface RatingDropdownProps {
  value: ExpenseRating;
  onChange: (value: ExpenseRating) => void;
}

const RatingDropdown: React.FC<RatingDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = RATING_OPTIONS.find((opt) => opt.value === value);

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
      const dropdownHeight = RATING_OPTIONS.length * 40 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPosition({
        top: openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 120),
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
        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors w-full"
      >
        <span className={`flex-1 text-left ${selectedOption?.color}`}>
          {selectedOption?.label || 'Select...'}
        </span>
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
          {RATING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
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
                opt === value ? 'bg-red-50 dark:bg-red-900/20' : ''
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
                    ? 'bg-red-500 text-white'
                    : isToday(day)
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
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

// Expense Row Component
interface ExpenseRowProps {
  expense: Expense;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  enabledCurrencies: string[];
  index: number;
  hideDate?: boolean;
  hideRecurring?: boolean;
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  onUpdate,
  onDelete,
  enabledCurrencies,
  index,
  hideDate = false,
  hideRecurring = false,
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
      <td className="py-1 px-1 border-l border-gray-300 dark:border-gray-600 w-28">
        <EditableCell
          value={String(expense.amount)}
          onChange={(val) => onUpdate(expense.id, { amount: parseFloat(val) || 0 })}
          type="currency"
          placeholder="0.00"
          align="right"
          className="text-red-600 dark:text-red-400 font-medium"
        />
      </td>

      {/* Currency */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-20">
        <CurrencyDropdown
          value={expense.currency}
          onChange={(currency) => onUpdate(expense.id, { currency })}
          options={enabledCurrencies}
        />
      </td>

      {/* Rating */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-32">
        <RatingDropdown
          value={expense.rating}
          onChange={(rating) => onUpdate(expense.id, { rating })}
        />
      </td>

      {/* Date - conditionally rendered */}
      {!hideDate && (
        <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-20">
          <DatePickerCell
            value={expense.date}
            onChange={(date) => onUpdate(expense.id, { date })}
          />
        </td>
      )}

      {/* Recurring - conditionally rendered */}
      {!hideRecurring && (
        <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-10">
          <div className="flex items-center justify-center">
            <RecurringToggle
              value={expense.recurring || false}
              onChange={(recurring) => onUpdate(expense.id, { recurring })}
            />
          </div>
        </td>
      )}

      {/* Delete */}
      <td className="py-1 px-1 border-l border-gray-200 dark:border-gray-700 w-10">
        <button
          onClick={() => onDelete(expense.id)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          title="Delete expense"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

// Sort types
type SortColumn = 'amount' | 'date' | null;
type SortDirection = 'asc' | 'desc';

// Sortable Column Header Component
interface SortableHeaderProps {
  label: string;
  column: 'amount' | 'date';
  currentSort: SortColumn;
  direction: SortDirection;
  onSort: (column: 'amount' | 'date') => void;
  align?: 'left' | 'right';
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, currentSort, direction, onSort, align = 'left' }) => {
  const isActive = currentSort === column;

  return (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors w-full ${
        align === 'right' ? 'justify-end' : 'justify-start'
      } ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
    >
      <span>{label}</span>
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );
};

// Monthly Expenses Table Header with Filter (includes Date, Recurring columns)
interface MonthlyTableHeaderProps {
  descriptionFilter: string;
  setDescriptionFilter: (v: string) => void;
  currencyFilter: string;
  setCurrencyFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  enabledCurrencies: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: 'amount' | 'date') => void;
}

const MonthlyTableHeader: React.FC<MonthlyTableHeaderProps> = ({
  descriptionFilter,
  setDescriptionFilter,
  currencyFilter,
  setCurrencyFilter,
  categoryFilter,
  setCategoryFilter,
  enabledCurrencies,
  hasActiveFilters,
  onClearFilters,
  isOpen,
  onToggle,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Description
        </th>
        <th className="px-2 py-2 border-l border-gray-300 dark:border-gray-600 w-28">
          <SortableHeader
            label="Amount"
            column="amount"
            currentSort={sortColumn}
            direction={sortDirection}
            onSort={onSort}
            align="right"
          />
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-20">
          Currency
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-32">
          Category
        </th>
        <th className="px-2 py-2 border-l border-gray-200 dark:border-gray-700 w-24">
          <SortableHeader
            label="Date"
            column="date"
            currentSort={sortColumn}
            direction={sortDirection}
            onSort={onSort}
            align="left"
          />
        </th>
        <th className="w-10 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-md transition-colors ${
              hasActiveFilters
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
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
              {/* Description Filter */}
              <input
                type="text"
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                placeholder="Search description..."
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 w-36"
              />

              {/* Currency Filter */}
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Currencies</option>
                {enabledCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {RATING_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
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

// Recurring Expenses Table Header with Filter (includes Due Date, no Recurring column)
interface RecurringTableHeaderProps {
  descriptionFilter: string;
  setDescriptionFilter: (v: string) => void;
  currencyFilter: string;
  setCurrencyFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  enabledCurrencies: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: 'amount' | 'date') => void;
}

const RecurringTableHeader: React.FC<RecurringTableHeaderProps> = ({
  descriptionFilter,
  setDescriptionFilter,
  currencyFilter,
  setCurrencyFilter,
  categoryFilter,
  setCategoryFilter,
  enabledCurrencies,
  hasActiveFilters,
  onClearFilters,
  isOpen,
  onToggle,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Description
        </th>
        <th className="px-2 py-2 border-l border-gray-300 dark:border-gray-600 w-28">
          <SortableHeader
            label="Amount"
            column="amount"
            currentSort={sortColumn}
            direction={sortDirection}
            onSort={onSort}
            align="right"
          />
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-20">
          Currency
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-32">
          Category
        </th>
        <th className="px-2 py-2 border-l border-gray-200 dark:border-gray-700 w-24">
          <SortableHeader
            label="Due Date"
            column="date"
            currentSort={sortColumn}
            direction={sortDirection}
            onSort={onSort}
            align="left"
          />
        </th>
        <th className="w-10 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-md transition-colors ${
              hasActiveFilters
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
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
              {/* Description Filter */}
              <input
                type="text"
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                placeholder="Search..."
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 w-32"
              />

              {/* Currency Filter */}
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Currencies</option>
                {enabledCurrencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {RATING_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
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
export const ExpensePage: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useExpenseStore();
  const { baseCurrency, enabledCurrencies, formatAmount, convertAmount } = useCurrencyStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Quick Add form state
  const [quickRating, setQuickRating] = useState<ExpenseRating>('discretionary');
  const [quickRecurring, setQuickRecurring] = useState(false);

  // Section collapse states
  const [isRecurringCollapsed, setIsRecurringCollapsed] = useState(false);
  const [isMonthlyCollapsed, setIsMonthlyCollapsed] = useState(false);

  // Monthly expenses filter states
  const [monthlyDescFilter, setMonthlyDescFilter] = useState('');
  const [monthlyCurrencyFilter, setMonthlyCurrencyFilter] = useState('');
  const [monthlyCategoryFilter, setMonthlyCategoryFilter] = useState('');
  const [isMonthlyFilterOpen, setIsMonthlyFilterOpen] = useState(false);

  // Recurring expenses filter states
  const [recurringDescFilter, setRecurringDescFilter] = useState('');
  const [recurringCurrencyFilter, setRecurringCurrencyFilter] = useState('');
  const [recurringCategoryFilter, setRecurringCategoryFilter] = useState('');
  const [isRecurringFilterOpen, setIsRecurringFilterOpen] = useState(false);

  // Sort states for monthly expenses
  const [monthlySortColumn, setMonthlySortColumn] = useState<SortColumn>(null);
  const [monthlySortDirection, setMonthlySortDirection] = useState<SortDirection>('desc');

  // Sort states for recurring expenses
  const [recurringSortColumn, setRecurringSortColumn] = useState<SortColumn>(null);
  const [recurringSortDirection, setRecurringSortDirection] = useState<SortDirection>('desc');

  const hasMonthlyFilters = monthlyDescFilter !== '' || monthlyCurrencyFilter !== '' || monthlyCategoryFilter !== '';
  const hasRecurringFilters = recurringDescFilter !== '' || recurringCurrencyFilter !== '' || recurringCategoryFilter !== '';

  // Handle sort toggle for monthly expenses
  const handleMonthlySort = (column: 'amount' | 'date') => {
    if (monthlySortColumn === column) {
      setMonthlySortDirection(monthlySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setMonthlySortColumn(column);
      setMonthlySortDirection('desc');
    }
  };

  // Handle sort toggle for recurring expenses
  const handleRecurringSort = (column: 'amount' | 'date') => {
    if (recurringSortColumn === column) {
      setRecurringSortDirection(recurringSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRecurringSortColumn(column);
      setRecurringSortDirection('desc');
    }
  };

  const clearMonthlyFilters = () => {
    setMonthlyDescFilter('');
    setMonthlyCurrencyFilter('');
    setMonthlyCategoryFilter('');
  };

  const clearRecurringFilters = () => {
    setRecurringDescFilter('');
    setRecurringCurrencyFilter('');
    setRecurringCategoryFilter('');
  };

  // Separate recurring and monthly expenses
  // Recurring expenses only show from their creation date onwards (not for previous months)
  const allRecurringExpenses = useMemo(() => {
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    return expenses.filter((expense) => {
      if (!expense.recurring) return false;
      const expenseDate = parseLocalDate(expense.date);
      // Only show if created on or before the selected month
      return expenseDate <= endOfMonth;
    });
  }, [expenses, selectedDate]);

  const allMonthlyExpenses = useMemo(() => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    return expenses.filter((expense) => {
      if (expense.recurring) return false;
      const expenseDate = parseLocalDate(expense.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });
  }, [expenses, selectedDate]);

  // Apply filters to recurring expenses
  const filteredRecurringExpenses = useMemo(() => {
    return allRecurringExpenses.filter((expense) => {
      if (recurringDescFilter && !expense.what.toLowerCase().includes(recurringDescFilter.toLowerCase())) {
        return false;
      }
      if (recurringCurrencyFilter && expense.currency !== recurringCurrencyFilter) {
        return false;
      }
      if (recurringCategoryFilter && expense.rating !== recurringCategoryFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      // Apply custom sort if selected
      if (recurringSortColumn === 'amount') {
        const amountA = convertAmount(a.amount, a.currency, baseCurrency);
        const amountB = convertAmount(b.amount, b.currency, baseCurrency);
        return recurringSortDirection === 'asc' ? amountA - amountB : amountB - amountA;
      }
      if (recurringSortColumn === 'date') {
        const dateA = parseLocalDate(a.date).getTime();
        const dateB = parseLocalDate(b.date).getTime();
        return recurringSortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      // Default sort: alphabetically by description
      return a.what.localeCompare(b.what);
    });
  }, [allRecurringExpenses, recurringDescFilter, recurringCurrencyFilter, recurringCategoryFilter, recurringSortColumn, recurringSortDirection, convertAmount, baseCurrency]);

  // Apply filters to monthly expenses
  const filteredMonthlyExpenses = useMemo(() => {
    return allMonthlyExpenses.filter((expense) => {
      if (monthlyDescFilter && !expense.what.toLowerCase().includes(monthlyDescFilter.toLowerCase())) {
        return false;
      }
      if (monthlyCurrencyFilter && expense.currency !== monthlyCurrencyFilter) {
        return false;
      }
      if (monthlyCategoryFilter && expense.rating !== monthlyCategoryFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      // Apply custom sort if selected
      if (monthlySortColumn === 'amount') {
        const amountA = convertAmount(a.amount, a.currency, baseCurrency);
        const amountB = convertAmount(b.amount, b.currency, baseCurrency);
        return monthlySortDirection === 'asc' ? amountA - amountB : amountB - amountA;
      }
      if (monthlySortColumn === 'date') {
        const dateA = parseLocalDate(a.date).getTime();
        const dateB = parseLocalDate(b.date).getTime();
        return monthlySortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      // Default sort: by date descending
      return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
    });
  }, [allMonthlyExpenses, monthlyDescFilter, monthlyCurrencyFilter, monthlyCategoryFilter, monthlySortColumn, monthlySortDirection, convertAmount, baseCurrency]);

  // Calculate totals
  const recurringTotal = useMemo(() => {
    return allRecurringExpenses.reduce((total, expense) => {
      return total + convertAmount(expense.amount, expense.currency, baseCurrency);
    }, 0);
  }, [allRecurringExpenses, convertAmount, baseCurrency]);

  const monthlyTotal = useMemo(() => {
    return allMonthlyExpenses.reduce((total, expense) => {
      return total + convertAmount(expense.amount, expense.currency, baseCurrency);
    }, 0);
  }, [allMonthlyExpenses, convertAmount, baseCurrency]);

  // Calculate breakdown by rating (monthly + recurring)
  const ratingBreakdown = useMemo(() => {
    const breakdown: Record<ExpenseRating, number> = {
      essential: 0,
      discretionary: 0,
      luxury: 0,
    };
    // Add monthly expenses
    allMonthlyExpenses.forEach((expense) => {
      if (breakdown[expense.rating] !== undefined) {
        breakdown[expense.rating] += convertAmount(expense.amount, expense.currency, baseCurrency);
      }
    });
    // Add recurring expenses
    allRecurringExpenses.forEach((expense) => {
      if (breakdown[expense.rating] !== undefined) {
        breakdown[expense.rating] += convertAmount(expense.amount, expense.currency, baseCurrency);
      }
    });
    return breakdown;
  }, [allMonthlyExpenses, allRecurringExpenses, convertAmount, baseCurrency]);

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

  // CSV validation function for ImportModal
  const validateExpenseRow = useCallback((row: Record<string, string>, _index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const validRatings = ['essential', 'discretionary', 'luxury'];

    // Validate required fields
    if (!row.date) errors.push('Missing date');
    if (!row.description) errors.push('Missing description');
    if (!row.amount) errors.push('Missing amount');

    // Validate date format (YYYY-MM-DD)
    if (row.date && !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      errors.push('Invalid date format (use YYYY-MM-DD)');
    }

    // Validate amount
    const amount = parseFloat(row.amount);
    if (row.amount && (isNaN(amount) || amount <= 0)) {
      errors.push('Invalid amount');
    }

    // Validate category
    const category = row.category?.toLowerCase() || 'discretionary';
    if (row.category && !validRatings.includes(category)) {
      errors.push('Invalid category');
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // CSV import handler for ImportModal
  const handleImportRows = useCallback(async (rows: Record<string, string>[]): Promise<{ success: boolean; message: string; count?: number }> => {
    const MAX_IMPORT_ROWS = 500;

    if (rows.length > MAX_IMPORT_ROWS) {
      return {
        success: false,
        message: `Too many rows (${rows.length}). Maximum ${MAX_IMPORT_ROWS} rows per import.`,
      };
    }

    // Build set of existing expenses for duplicate detection
    const existingKeys = new Set(
      expenses.map((e) => `${e.date}|${e.what.toLowerCase()}|${e.amount}|${e.currency}`)
    );

    let importedCount = 0;
    let skippedDuplicates = 0;

    for (const row of rows) {
      const amount = parseFloat(row.amount);
      const currency = row.currency?.toUpperCase() || baseCurrency;
      const category = (row.category?.toLowerCase() || 'discretionary') as ExpenseRating;

      // Check for duplicate
      const key = `${row.date}|${row.description.toLowerCase()}|${amount}|${currency}`;
      if (existingKeys.has(key)) {
        skippedDuplicates++;
        continue;
      }

      existingKeys.add(key);

      await addExpense({
        what: row.description,
        amount,
        currency,
        rating: category,
        date: row.date,
        recurring: row.recurring?.toLowerCase() === 'true',
      });
      importedCount++;
    }

    const messages: string[] = [];
    if (importedCount > 0) messages.push(`${importedCount} imported`);
    if (skippedDuplicates > 0) messages.push(`${skippedDuplicates} duplicates skipped`);

    return {
      success: importedCount > 0,
      message: messages.join(', ') || 'No expenses imported',
      count: importedCount,
    };
  }, [expenses, baseCurrency, addExpense]);

  // CSV parse wrapper for ImportModal
  const parseCSVForModal = useCallback((csvString: string): { data: Record<string, string>[]; errors: string[] } => {
    const result = parseExpenseCSV(csvString);
    return { data: result.data as unknown as Record<string, string>[], errors: result.errors };
  }, []);

  return (
    <div className="space-y-3">
      {/* Sticky Top Section: Quick Add + Summary Cards + Month Navigation */}
      <div className="sticky top-16 z-20 -mx-4 px-4 pt-2 pb-3 bg-gray-100 dark:bg-gray-900 space-y-2">
        {/* Grid: Quick Add (1/3) + Summary Cards (2/3) */}
        <div className="grid grid-cols-3 gap-3">
          {/* Quick Add Form - Compact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const whatInput = form.elements.namedItem('quickWhat') as HTMLInputElement;
              const amountInput = form.elements.namedItem('quickAmount') as HTMLInputElement;
              if (whatInput.value.trim() && amountInput.value) {
                addExpense({
                  what: whatInput.value.trim(),
                  amount: parseFloat(amountInput.value) || 0,
                  currency: baseCurrency,
                  rating: quickRating,
                  date: getTodayString(),
                  recurring: quickRecurring,
                });
                whatInput.value = '';
                amountInput.value = '';
                setQuickRecurring(false);
                whatInput.focus();
              }
            }} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Quick Add</span>
              </div>
              <input
                name="quickWhat"
                type="text"
                placeholder="Description"
                className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
              />
              <div className="flex gap-2">
                <input
                  name="quickAmount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="w-20 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <select
                  value={quickRating}
                  onChange={(e) => setQuickRating(e.target.value as ExpenseRating)}
                  className="flex-1 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
                >
                  {RATING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickRecurring(!quickRecurring)}
                  className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded border transition-colors ${
                    quickRecurring
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Recurring</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white text-sm font-medium rounded transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Summary Cards (2/3) */}
          <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Monthly Total */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Monthly</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 truncate">
                {formatAmount(monthlyTotal)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                + {formatAmount(recurringTotal)} rec.
              </p>
            </div>

            {/* Category Breakdowns */}
            {RATING_OPTIONS.map((rating) => (
              <div key={rating.value} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1 mb-0.5">
                  <rating.icon className={`w-3 h-3 ${rating.color}`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{rating.label}</p>
                </div>
                <p className={`text-base font-semibold truncate ${rating.color}`}>
                  {formatAmount(ratingBreakdown[rating.value])}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Month Navigation - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5">
          <div className="flex items-center justify-between">
            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Import expenses from CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Month Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[130px] text-center">
                  {getMonthLabel()}
                </span>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Spacer */}
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* Recurring Expenses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsRecurringCollapsed(!isRecurringCollapsed)}
          className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {isRecurringCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
          <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-left">Recurring Expenses</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            {formatAmount(recurringTotal)}/mo
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {filteredRecurringExpenses.length} {hasRecurringFilters ? `of ${allRecurringExpenses.length}` : ''} items
          </span>
        </button>

        {!isRecurringCollapsed && (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <RecurringTableHeader
                descriptionFilter={recurringDescFilter}
                setDescriptionFilter={setRecurringDescFilter}
                currencyFilter={recurringCurrencyFilter}
                setCurrencyFilter={setRecurringCurrencyFilter}
                categoryFilter={recurringCategoryFilter}
                setCategoryFilter={setRecurringCategoryFilter}
                enabledCurrencies={enabledCurrencies}
                hasActiveFilters={hasRecurringFilters}
                onClearFilters={clearRecurringFilters}
                isOpen={isRecurringFilterOpen}
                onToggle={() => setIsRecurringFilterOpen(!isRecurringFilterOpen)}
                sortColumn={recurringSortColumn}
                sortDirection={recurringSortDirection}
                onSort={handleRecurringSort}
              />
              <tbody>
                {filteredRecurringExpenses.map((expense, index) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onUpdate={handleUpdateExpense}
                    onDelete={deleteExpense}
                    enabledCurrencies={enabledCurrencies}
                    index={index}
                    hideRecurring
                  />
                ))}
                {filteredRecurringExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No recurring expenses. Mark an expense as recurring to have it appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Expenses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsMonthlyCollapsed(!isMonthlyCollapsed)}
          className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {isMonthlyCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
          <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-left">Monthly Expenses</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            {formatAmount(monthlyTotal)}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {filteredMonthlyExpenses.length} {hasMonthlyFilters ? `of ${allMonthlyExpenses.length}` : ''} items
          </span>
        </button>

        {!isMonthlyCollapsed && (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <MonthlyTableHeader
                descriptionFilter={monthlyDescFilter}
                setDescriptionFilter={setMonthlyDescFilter}
                currencyFilter={monthlyCurrencyFilter}
                setCurrencyFilter={setMonthlyCurrencyFilter}
                categoryFilter={monthlyCategoryFilter}
                setCategoryFilter={setMonthlyCategoryFilter}
                enabledCurrencies={enabledCurrencies}
                hasActiveFilters={hasMonthlyFilters}
                onClearFilters={clearMonthlyFilters}
                isOpen={isMonthlyFilterOpen}
                onToggle={() => setIsMonthlyFilterOpen(!isMonthlyFilterOpen)}
                sortColumn={monthlySortColumn}
                sortDirection={monthlySortDirection}
                onSort={handleMonthlySort}
              />
              <tbody>
                {filteredMonthlyExpenses.map((expense, index) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onUpdate={handleUpdateExpense}
                    onDelete={deleteExpense}
                    enabledCurrencies={enabledCurrencies}
                    index={index}
                    hideRecurring
                  />
                ))}
                {filteredMonthlyExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No expenses this month. Use the Quick Add form above to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        templateType="expenses"
        entityName="expenses"
        parseCSV={parseCSVForModal}
        validateRow={validateExpenseRow}
        onImport={handleImportRows}
      />
    </div>
  );
};
