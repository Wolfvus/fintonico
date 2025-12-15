import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useIncomeStore } from '../../stores/incomeStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { DollarSign, Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, Calendar, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Upload } from 'lucide-react';
import type { Income } from '../../types';
import type { IncomeFrequency } from '../../stores/incomeStore';
import { ImportModal } from '../Shared/ImportModal';
import { parseIncomeCSV } from '../../utils/csv';

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
      } ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
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
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: 'amount' | 'date') => void;
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
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Source
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
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-24">
          Frequency
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

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Quick Add form state
  const [quickFrequency, setQuickFrequency] = useState<IncomeFrequency>('one-time');

  // Filter states
  const [sourceFilter, setSourceFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sort states
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const hasActiveFilters = sourceFilter !== '' || currencyFilter !== '' || frequencyFilter !== '';

  const clearFilters = () => {
    setSourceFilter('');
    setCurrencyFilter('');
    setFrequencyFilter('');
  };

  // Handle sort toggle
  const handleSort = (column: 'amount' | 'date') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
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
      // Apply custom sort if selected
      if (sortColumn === 'amount') {
        const amountA = convertAmount(a.amount, a.currency, baseCurrency);
        const amountB = convertAmount(b.amount, b.currency, baseCurrency);
        return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
      }
      if (sortColumn === 'date') {
        const dateA = parseLocalDate(a.date).getTime();
        const dateB = parseLocalDate(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      // Default sort: recurring first, then by date descending
      if ((a.frequency === 'one-time') !== (b.frequency === 'one-time')) {
        return a.frequency === 'one-time' ? 1 : -1;
      }
      return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
    });
  }, [incomes, selectedDate, sourceFilter, currencyFilter, frequencyFilter, sortColumn, sortDirection, convertAmount, baseCurrency]);

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

  // CSV validation function for ImportModal
  const validateIncomeRow = useCallback((row: Record<string, string>, _index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const validFrequencies = ['one-time', 'weekly', 'bi-weekly', 'monthly'];

    // Validate required fields
    if (!row.date) errors.push('Missing date');
    if (!row.source) errors.push('Missing source');
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

    // Validate frequency
    const frequency = row.frequency?.toLowerCase() || 'one-time';
    if (row.frequency && !validFrequencies.includes(frequency)) {
      errors.push('Invalid frequency');
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

    // Build set of existing income for duplicate detection
    const existingKeys = new Set(
      incomes.map((i) => `${i.date}|${i.source.toLowerCase()}|${i.amount}|${i.currency}`)
    );

    let importedCount = 0;
    let skippedDuplicates = 0;

    for (const row of rows) {
      const amount = parseFloat(row.amount);
      const currency = row.currency?.toUpperCase() || baseCurrency;
      const frequency = (row.frequency?.toLowerCase() || 'one-time') as IncomeFrequency;

      // Check for duplicate
      const key = `${row.date}|${row.source.toLowerCase()}|${amount}|${currency}`;
      if (existingKeys.has(key)) {
        skippedDuplicates++;
        continue;
      }

      existingKeys.add(key);

      await addIncome({
        source: row.source,
        amount,
        currency,
        frequency,
        date: row.date,
      });
      importedCount++;
    }

    const messages: string[] = [];
    if (importedCount > 0) messages.push(`${importedCount} imported`);
    if (skippedDuplicates > 0) messages.push(`${skippedDuplicates} duplicates skipped`);

    return {
      success: importedCount > 0,
      message: messages.join(', ') || 'No income imported',
      count: importedCount,
    };
  }, [incomes, baseCurrency, addIncome]);

  // CSV parse wrapper for ImportModal
  const parseCSVForModal = useCallback((csvString: string): { data: Record<string, string>[]; errors: string[] } => {
    const result = parseIncomeCSV(csvString);
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
              const sourceInput = form.elements.namedItem('quickSource') as HTMLInputElement;
              const amountInput = form.elements.namedItem('quickAmount') as HTMLInputElement;
              if (sourceInput.value.trim() && amountInput.value) {
                addIncome({
                  source: sourceInput.value.trim(),
                  amount: parseFloat(amountInput.value) || 0,
                  currency: baseCurrency,
                  frequency: quickFrequency,
                  date: getTodayString(),
                });
                sourceInput.value = '';
                amountInput.value = '';
                sourceInput.focus();
              }
            }} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Quick Add</span>
              </div>
              <input
                name="quickSource"
                type="text"
                placeholder="Source"
                className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white placeholder-gray-400"
              />
              <div className="flex gap-2">
                <input
                  name="quickAmount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="w-24 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <select
                  value={quickFrequency}
                  onChange={(e) => setQuickFrequency(e.target.value as IncomeFrequency)}
                  className="flex-1 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-sm font-medium rounded transition-colors"
              >
                Add Income
              </button>
            </form>
          </div>

          {/* Summary Cards (2/3) */}
          <div className="col-span-2 grid grid-cols-2 gap-3">
            {/* Monthly Income (Actual) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{getMonthLabel()}</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 truncate">
                    {formatAmount(monthlyTotal)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{filteredIncomes.length} entries</p>
                </div>
              </div>
            </div>

            {/* Expected Monthly Income */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Expected Monthly</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
                    {formatAmount(expectedMonthlyIncome)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {recurringCount > 0 ? `${recurringCount} recurring` : 'no recurring'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Month Navigation - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5">
          <div className="flex items-center justify-between">
            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Import income from CSV"
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
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
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

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        templateType="income"
        entityName="income"
        parseCSV={parseCSVForModal}
        validateRow={validateIncomeRow}
        onImport={handleImportRows}
      />
    </div>
  );
};
