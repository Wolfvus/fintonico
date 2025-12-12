import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAccountStore } from '../../stores/accountStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { TrendingUp, TrendingDown, Plus, Trash2, ChevronDown, ChevronRight, Check, EyeOff, X, Filter } from 'lucide-react';
import type { AccountType, Account } from '../../types';

// Format number with thousand separators
const formatNumberWithCommas = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Parse formatted number back to raw number
const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  return parseFloat(cleaned) || 0;
};

// Format date for display (compact format: Dec 11)
const formatDateCompact = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Account type configurations
const ASSET_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'exchange', label: 'Exchange', icon: '₿' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'property', label: 'Property', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '💼' },
];

const LIABILITY_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'credit-card', label: 'Credit Card', icon: '💳' },
  { value: 'loan', label: 'Loan', icon: '🏦' },
  { value: 'mortgage', label: 'Mortgage', icon: '🏠' },
];

// Editable Cell Component
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'currency' | 'percent';
  placeholder?: string;
  align?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = 'Click to edit',
  align = 'left',
  className = '',
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Format the value when it changes (for currency type)
    if (type === 'currency' && value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setLocalValue(formatNumberWithCommas(num));
      } else {
        setLocalValue(value);
      }
    } else {
      setLocalValue(value);
    }
  }, [value, type]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (type === 'currency') {
        onChange(String(parseFormattedNumber(localValue)));
      } else if (type === 'percent') {
        // Remove % sign if present and parse
        const numVal = parseFloat(localValue.replace('%', '')) || 0;
        onChange(String(numVal));
      } else {
        onChange(localValue);
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    if (type === 'currency') {
      const numValue = parseFormattedNumber(localValue);
      if (String(numValue) !== value) {
        onChange(String(numValue));
      }
    } else if (type === 'percent') {
      const numVal = parseFloat(localValue.replace('%', '')) || 0;
      if (String(numVal) !== value) {
        onChange(String(numVal));
      }
    } else if (localValue !== value) {
      onChange(localValue);
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'currency') {
      // Get cursor position before formatting
      const cursorPos = e.target.selectionStart || 0;
      const oldValue = localValue;

      // Remove all non-numeric except decimal point
      const rawValue = e.target.value.replace(/[^0-9.]/g, '');

      // Handle decimal places
      const parts = rawValue.split('.');
      let formatted = parts[0];

      // Add thousand separators
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      // Add decimal part if exists
      if (parts.length > 1) {
        formatted += '.' + parts[1].slice(0, 2); // Limit to 2 decimal places
      }

      setLocalValue(formatted);

      // Adjust cursor position after formatting
      setTimeout(() => {
        if (inputRef.current) {
          const newCommas = (formatted.match(/,/g) || []).length;
          const oldCommas = (oldValue.match(/,/g) || []).length;
          const newPos = cursorPos + (newCommas - oldCommas);
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    } else if (type === 'percent') {
      // Allow only numbers and decimal point
      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
      setLocalValue(rawValue);
    } else {
      setLocalValue(e.target.value);
    }
  };

  // Format display value based on type
  let displayValue = value;
  if (type === 'currency' && value && !isEditing) {
    displayValue = formatNumberWithCommas(parseFloat(value));
  } else if (type === 'percent' && value && !isEditing) {
    const num = parseFloat(value);
    displayValue = !isNaN(num) ? `${num.toFixed(2)}%` : value;
  }

  if (isEditing && !disabled) {
    return (
      <input
        ref={inputRef}
        type={(type === 'currency' || type === 'percent') ? 'text' : type}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={type === 'number' ? '0.01' : undefined}
        className={`w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-green-500 rounded-md outline-none ${
          align === 'right' ? 'text-right' : 'text-left'
        } ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`px-2 py-1.5 text-sm ${disabled ? 'cursor-default' : 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors min-h-[32px] flex items-center ${
        align === 'right' ? 'justify-end' : 'justify-start'
      } ${className}`}
    >
      {displayValue || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
    </div>
  );
};

// Generic Dropdown Selector with Portal
interface DropdownSelectorProps<T extends string> {
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function DropdownSelector<T extends string>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}: DropdownSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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
      const dropdownHeight = 200; // Approximate max height of dropdown
      const dropdownWidth = Math.max(rect.width, 120);

      let top = rect.bottom + 4;
      let left = rect.left;

      // Check if dropdown would go off the bottom edge
      if (top + dropdownHeight > window.innerHeight) {
        // Position above the button instead
        top = rect.top - dropdownHeight - 4;
      }

      // Ensure top is not negative
      if (top < 8) {
        top = 8;
      }

      // Check if dropdown would go off the right edge
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 8;
      }

      setDropdownPosition({
        top: top + window.scrollY,
        left: left + window.scrollX,
        width: dropdownWidth,
      });
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-2 py-1.5 text-sm ${disabled ? 'cursor-default opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors w-full`}
      >
        {selectedOption?.icon && <span>{selectedOption.icon}</span>}
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
          {selectedOption?.label || placeholder}
        </span>
        {!disabled && <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
            zIndex: 9999,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                option.value === value ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// Day of Month Selector with Portal
interface DayOfMonthSelectorProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}

const DayOfMonthSelector: React.FC<DayOfMonthSelectorProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
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
      const dropdownWidth = 192; // w-48 = 12rem = 192px
      const dropdownHeight = 220; // Approximate height of calendar grid

      // Calculate initial position
      let top = rect.bottom + 4;
      let left = rect.right - dropdownWidth;

      // Check if dropdown would go off the right edge
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 8;
      }

      // Check if dropdown would go off the left edge
      if (left < 8) {
        left = 8;
      }

      // Check if dropdown would go off the bottom edge
      if (top + dropdownHeight > window.innerHeight) {
        // Position above the button instead
        top = rect.top - dropdownHeight - 4;
      }

      // Ensure top is not negative
      if (top < 8) {
        top = 8;
      }

      setDropdownPosition({
        top: top + window.scrollY,
        left: left + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1 px-2 py-1.5 text-sm ${disabled ? 'cursor-default opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors`}
      >
        <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {value ? value : '-'}
        </span>
        {!disabled && <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 w-48"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Payment due day</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => {
                  onChange(day);
                  setIsOpen(false);
                }}
                className={`w-6 h-6 text-xs rounded flex items-center justify-center transition-colors ${
                  value === day
                    ? 'bg-green-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onChange(undefined);
              setIsOpen(false);
            }}
            className="w-full mt-2 px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Clear
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// Paid Checkbox Component
interface PaidCheckboxProps {
  isPaid: boolean;
  onChange: (isPaid: boolean) => void;
  disabled?: boolean;
}

const PaidCheckbox: React.FC<PaidCheckboxProps> = ({ isPaid, onChange, disabled }) => {
  return (
    <button
      onClick={() => !disabled && onChange(!isPaid)}
      disabled={disabled}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
        isPaid
          ? 'bg-green-500 border-green-500 text-white'
          : disabled
          ? 'border-gray-200 dark:border-gray-700'
          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
      } ${disabled ? 'cursor-default opacity-60' : ''}`}
      title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
    >
      {isPaid && <Check className="w-3 h-3" />}
    </button>
  );
};

// Exclude Toggle Component
interface ExcludeToggleProps {
  isExcluded: boolean;
  onChange: () => void;
}

const ExcludeToggle: React.FC<ExcludeToggleProps> = ({ isExcluded, onChange }) => {
  return (
    <button
      onClick={onChange}
      className={`p-1.5 rounded-md transition-colors ${
        isExcluded
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={isExcluded ? 'Include in totals' : 'Exclude from totals'}
    >
      <EyeOff className="w-4 h-4" />
    </button>
  );
};

// Account Row Component
interface AccountRowProps {
  account: Account;
  typeOptions: { value: AccountType; label: string; icon: string }[];
  isLiability?: boolean;
  onUpdate: (updates: Partial<Account>) => void;
  onToggleExclude: () => void;
  onDelete: () => void;
  enabledCurrencies: string[];
  index: number;
}

const AccountRow: React.FC<AccountRowProps> = ({
  account,
  typeOptions,
  isLiability = false,
  onUpdate,
  onToggleExclude,
  onDelete,
  enabledCurrencies,
  index,
}) => {
  const isExcluded = account.excludeFromTotal || false;
  const isEven = index % 2 === 0;

  // Calculate returns based on yield (for any asset type with yield)
  const monthlyReturn = account.estimatedYield
    ? (account.balance * (account.estimatedYield / 100) / 12)
    : 0;
  const yearlyReturn = account.estimatedYield
    ? (account.balance * (account.estimatedYield / 100))
    : 0;

  const currencyOptions = enabledCurrencies.map((code) => ({
    value: code,
    label: code,
  }));

  return (
    <tr className={`group border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors ${isExcluded ? 'opacity-50' : ''} ${isEven ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
      {/* Name */}
      <td className="py-1 px-1">
        <EditableCell
          value={account.name}
          onChange={(name) => onUpdate({ name })}
          placeholder="Account name"
          disabled={isExcluded}
        />
      </td>

      {/* Type */}
      <td className="py-1 px-1 w-32 border-l border-gray-200 dark:border-gray-700">
        <DropdownSelector
          value={account.type}
          options={typeOptions}
          onChange={(type) => onUpdate({ type })}
          disabled={isExcluded}
        />
      </td>

      {/* Currency */}
      <td className="py-1 px-1 w-24 border-l border-gray-200 dark:border-gray-700">
        <DropdownSelector
          value={account.currency}
          options={currencyOptions}
          onChange={(currency) => onUpdate({ currency })}
          disabled={isExcluded}
        />
      </td>

      {/* Value */}
      <td className="py-1 px-1 w-32 border-l border-gray-300 dark:border-gray-600">
        <EditableCell
          value={String(Math.abs(account.balance))}
          onChange={(val) => {
            const numVal = parseFloat(val) || 0;
            onUpdate({ balance: isLiability ? -Math.abs(numVal) : numVal });
          }}
          type="currency"
          placeholder="0.00"
          align="right"
          disabled={isExcluded}
          className={isLiability ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
        />
      </td>

      {/* Yield % (assets only, editable for all types) */}
      {!isLiability && (
        <td className="py-1 px-1 w-20 border-l border-gray-300 dark:border-gray-600">
          <EditableCell
            value={account.estimatedYield ? String(account.estimatedYield) : ''}
            onChange={(val) => {
              const numVal = parseFloat(val) || 0;
              onUpdate({ estimatedYield: numVal > 0 ? numVal : undefined });
            }}
            type="percent"
            placeholder="-"
            align="right"
            disabled={isExcluded}
            className="text-blue-600 dark:text-blue-400"
          />
        </td>
      )}

      {/* Monthly Return (assets only) */}
      {!isLiability && (
        <td className="py-1 px-1 w-24 border-l border-gray-200 dark:border-gray-700">
          <div className={`px-2 py-1.5 text-sm text-right ${
            monthlyReturn > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
          }`}>
            {monthlyReturn > 0 ? formatNumberWithCommas(monthlyReturn) : '-'}
          </div>
        </td>
      )}

      {/* Yearly Return (assets only) */}
      {!isLiability && (
        <td className="py-1 px-1 w-28 border-l border-gray-200 dark:border-gray-700">
          <div className={`px-2 py-1.5 text-sm text-right ${
            yearlyReturn > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
          }`}>
            {yearlyReturn > 0 ? formatNumberWithCommas(yearlyReturn) : '-'}
          </div>
        </td>
      )}

      {/* Due Date (liabilities only) */}
      {isLiability && (
        <td className="py-1 px-1 w-20 border-l border-gray-300 dark:border-gray-600">
          <DayOfMonthSelector
            value={account.recurringDueDate}
            onChange={(recurringDueDate) => onUpdate({ recurringDueDate })}
            disabled={isExcluded}
          />
        </td>
      )}

      {/* Paid Status (liabilities only) */}
      {isLiability && (
        <td className="py-1 px-1 w-12 border-l border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center">
            <PaidCheckbox
              isPaid={account.isPaidThisMonth || false}
              onChange={(isPaidThisMonth) => onUpdate({
                isPaidThisMonth,
                lastPaidDate: isPaidThisMonth ? new Date().toISOString().split('T')[0] : account.lastPaidDate
              })}
              disabled={isExcluded}
            />
          </div>
        </td>
      )}

      {/* Last Updated */}
      <td className="py-1 px-1 w-16 border-l border-gray-200 dark:border-gray-700">
        <div className="px-1 py-1.5 text-xs text-gray-400 dark:text-gray-500 text-center whitespace-nowrap">
          {formatDateCompact(account.lastUpdated)}
        </div>
      </td>

      {/* Exclude Toggle */}
      <td className="py-1 px-1 w-10 border-l border-gray-200 dark:border-gray-700">
        <ExcludeToggle
          isExcluded={isExcluded}
          onChange={onToggleExclude}
        />
      </td>

      {/* Delete */}
      <td className="py-1 px-1 w-10 border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
          title="Delete account"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// Add New Account Row
interface AddAccountRowProps {
  typeOptions: { value: AccountType; label: string; icon: string }[];
  isLiability?: boolean;
  onAdd: (account: Omit<Account, 'id'>) => void;
  baseCurrency: string;
  enabledCurrencies: string[];
  colSpan: number;
}

const AddAccountRow: React.FC<AddAccountRowProps> = ({
  typeOptions,
  isLiability = false,
  onAdd,
  baseCurrency,
  enabledCurrencies,
  colSpan,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(typeOptions[0].value);
  const [currency, setCurrency] = useState(baseCurrency);
  const [amount, setAmount] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (name.trim()) {
      const numAmount = parseFormattedNumber(amount);
      onAdd({
        name: name.trim(),
        type,
        currency,
        balance: isLiability ? -Math.abs(numAmount) : numAmount,
      });
      setName('');
      setType(typeOptions[0].value);
      setCurrency(baseCurrency);
      setAmount('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setName('');
      setAmount('');
    }
  };

  const currencyOptions = enabledCurrencies.map((code) => ({
    value: code,
    label: code,
  }));

  if (!isAdding) {
    return (
      <tr>
        <td colSpan={colSpan} className="py-2 px-1">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors w-full"
          >
            <Plus className="w-4 h-4" />
            Add {isLiability ? 'liability' : 'asset'}
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/10">
      <td className="py-1 px-1">
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Account name"
          className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </td>
      <td className="py-1 px-1 w-32">
        <DropdownSelector
          value={type}
          options={typeOptions}
          onChange={setType}
        />
      </td>
      <td className="py-1 px-1 w-24">
        <DropdownSelector
          value={currency}
          options={currencyOptions}
          onChange={setCurrency}
        />
      </td>
      <td className="py-1 px-1 w-32">
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            // Allow only numbers, commas, periods
            const filtered = e.target.value.replace(/[^0-9.,]/g, '');
            setAmount(filtered);
          }}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          className="w-full px-2 py-1.5 text-sm text-right bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </td>
      {!isLiability && <td className="py-1 px-1 w-20"></td>}
      {!isLiability && <td className="py-1 px-1 w-24"></td>}
      {!isLiability && <td className="py-1 px-1 w-28"></td>}
      {isLiability && <td className="py-1 px-1 w-20"></td>}
      {isLiability && <td className="py-1 px-1 w-12"></td>}
      <td className="py-1 px-1 w-16"></td>
      <td className="py-1 px-1 w-10"></td>
      <td className="py-1 px-1 w-10">
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
        >
          <Plus className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// Assets Table Header with Toggle Filter (same pattern as Income/Expense)
interface AssetsTableHeaderProps {
  nameFilter: string;
  setNameFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  currencyFilter: string;
  setCurrencyFilter: (v: string) => void;
  excludedFilter: string;
  setExcludedFilter: (v: string) => void;
  enabledCurrencies: string[];
  typeOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AssetsTableHeader: React.FC<AssetsTableHeaderProps> = ({
  nameFilter,
  setNameFilter,
  typeFilter,
  setTypeFilter,
  currencyFilter,
  setCurrencyFilter,
  excludedFilter,
  setExcludedFilter,
  enabledCurrencies,
  typeOptions,
  hasActiveFilters,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Name
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-32">
          Type
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-24">
          Currency
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 w-32">
          Value
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 w-20">
          Yield
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-24">
          /Month
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-28">
          /Year
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-16">
          Updated
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-10">
          Excl
        </th>
        <th className="w-10 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
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
          <td colSpan={10} className="px-3 py-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Name Filter */}
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search name..."
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400 w-40"
              />
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
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
              {/* Excluded Filter */}
              <select
                value={excludedFilter}
                onChange={(e) => setExcludedFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-green-500 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="included">Included</option>
                <option value="excluded">Excluded</option>
              </select>
              {/* Clear Button */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
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

// Liabilities Table Header with Toggle Filter (same pattern as Income/Expense)
interface LiabilitiesTableHeaderProps {
  nameFilter: string;
  setNameFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  currencyFilter: string;
  setCurrencyFilter: (v: string) => void;
  paidFilter: string;
  setPaidFilter: (v: string) => void;
  excludedFilter: string;
  setExcludedFilter: (v: string) => void;
  enabledCurrencies: string[];
  typeOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const LiabilitiesTableHeader: React.FC<LiabilitiesTableHeaderProps> = ({
  nameFilter,
  setNameFilter,
  typeFilter,
  setTypeFilter,
  currencyFilter,
  setCurrencyFilter,
  paidFilter,
  setPaidFilter,
  excludedFilter,
  setExcludedFilter,
  enabledCurrencies,
  typeOptions,
  hasActiveFilters,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
          Name
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-32">
          Type
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-24">
          Currency
        </th>
        <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 w-32">
          Value
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 w-20">
          Due
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-12">
          Paid
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-16">
          Updated
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700 w-10">
          Excl
        </th>
        <th className="w-10 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
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
          <td colSpan={9} className="px-3 py-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Name Filter */}
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search name..."
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 w-40"
              />
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
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
              {/* Paid Filter */}
              <select
                value={paidFilter}
                onChange={(e) => setPaidFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Paid Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
              {/* Excluded Filter */}
              <select
                value={excludedFilter}
                onChange={(e) => setExcludedFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-red-500 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="included">Included</option>
                <option value="excluded">Excluded</option>
              </select>
              {/* Clear Button */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
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
export const NetWorthPage: React.FC = () => {
  const { accounts, addAccount, deleteAccount, updateAccount, toggleExcludeFromTotal } = useAccountStore();
  const { baseCurrency, convertAmount, formatAmount, enabledCurrencies } = useCurrencyStore();

  // Collapsible states
  const [isAssetsCollapsed, setIsAssetsCollapsed] = useState(false);
  const [isLiabilitiesCollapsed, setIsLiabilitiesCollapsed] = useState(false);

  // Filter open states
  const [isAssetFilterOpen, setIsAssetFilterOpen] = useState(false);
  const [isLiabilityFilterOpen, setIsLiabilityFilterOpen] = useState(false);

  // Asset filter states
  const [assetNameFilter, setAssetNameFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [assetCurrencyFilter, setAssetCurrencyFilter] = useState('');
  const [assetExcludedFilter, setAssetExcludedFilter] = useState('');

  // Liability filter states
  const [liabilityNameFilter, setLiabilityNameFilter] = useState('');
  const [liabilityTypeFilter, setLiabilityTypeFilter] = useState('');
  const [liabilityCurrencyFilter, setLiabilityCurrencyFilter] = useState('');
  const [liabilityPaidFilter, setLiabilityPaidFilter] = useState('');
  const [liabilityExcludedFilter, setLiabilityExcludedFilter] = useState('');

  const hasAssetFilters = assetNameFilter !== '' || assetTypeFilter !== '' || assetCurrencyFilter !== '' || assetExcludedFilter !== '';
  const hasLiabilityFilters = liabilityNameFilter !== '' || liabilityTypeFilter !== '' || liabilityCurrencyFilter !== '' || liabilityPaidFilter !== '' || liabilityExcludedFilter !== '';

  const clearAssetFilters = () => {
    setAssetNameFilter('');
    setAssetTypeFilter('');
    setAssetCurrencyFilter('');
    setAssetExcludedFilter('');
  };

  const clearLiabilityFilters = () => {
    setLiabilityNameFilter('');
    setLiabilityTypeFilter('');
    setLiabilityCurrencyFilter('');
    setLiabilityPaidFilter('');
    setLiabilityExcludedFilter('');
  };

  // Define which account types are assets vs liabilities
  const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
  const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];

  // Calculate total estimated returns from all assets with yields
  const { totalMonthlyReturn, totalYearlyReturn } = useMemo(() => {
    let monthly = 0;
    let yearly = 0;
    accounts.forEach((account) => {
      if (assetTypes.includes(account.type) && account.estimatedYield && !account.excludeFromTotal) {
        const converted = convertAmount(account.balance, account.currency, baseCurrency);
        yearly += converted * (account.estimatedYield / 100);
        monthly += converted * (account.estimatedYield / 100) / 12;
      }
    });
    return { totalMonthlyReturn: monthly, totalYearlyReturn: yearly };
  }, [accounts, convertAmount, baseCurrency]);

  // Filter accounts by type
  const allAssetAccounts = useMemo(
    () => accounts.filter((account) => assetTypes.includes(account.type)),
    [accounts]
  );
  const allLiabilityAccounts = useMemo(
    () => accounts.filter((account) => liabilityTypes.includes(account.type)),
    [accounts]
  );

  // Apply filters to assets
  const assetAccounts = useMemo(() => {
    return allAssetAccounts.filter((account) => {
      if (assetNameFilter && !account.name.toLowerCase().includes(assetNameFilter.toLowerCase())) {
        return false;
      }
      if (assetTypeFilter && account.type !== assetTypeFilter) {
        return false;
      }
      if (assetCurrencyFilter && account.currency !== assetCurrencyFilter) {
        return false;
      }
      if (assetExcludedFilter === 'included' && account.excludeFromTotal) {
        return false;
      }
      if (assetExcludedFilter === 'excluded' && !account.excludeFromTotal) {
        return false;
      }
      return true;
    });
  }, [allAssetAccounts, assetNameFilter, assetTypeFilter, assetCurrencyFilter, assetExcludedFilter]);

  // Apply filters to liabilities
  const liabilityAccounts = useMemo(() => {
    return allLiabilityAccounts.filter((account) => {
      if (liabilityNameFilter && !account.name.toLowerCase().includes(liabilityNameFilter.toLowerCase())) {
        return false;
      }
      if (liabilityTypeFilter && account.type !== liabilityTypeFilter) {
        return false;
      }
      if (liabilityCurrencyFilter && account.currency !== liabilityCurrencyFilter) {
        return false;
      }
      if (liabilityPaidFilter === 'paid' && !account.isPaidThisMonth) {
        return false;
      }
      if (liabilityPaidFilter === 'unpaid' && account.isPaidThisMonth) {
        return false;
      }
      if (liabilityExcludedFilter === 'included' && account.excludeFromTotal) {
        return false;
      }
      if (liabilityExcludedFilter === 'excluded' && !account.excludeFromTotal) {
        return false;
      }
      return true;
    });
  }, [allLiabilityAccounts, liabilityNameFilter, liabilityTypeFilter, liabilityCurrencyFilter, liabilityPaidFilter, liabilityExcludedFilter]);

  // Calculate totals (excluding excluded accounts)
  const { totalAssets, totalLiabilities, netWorth, excludedCount } = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let excludedCount = 0;

    accounts.forEach((account) => {
      if (account.excludeFromTotal) {
        excludedCount++;
        return;
      }

      const convertedAmount = convertAmount(account.balance, account.currency, baseCurrency);

      if (assetTypes.includes(account.type)) {
        totalAssets += convertedAmount;
      } else if (liabilityTypes.includes(account.type)) {
        totalLiabilities += Math.abs(convertedAmount);
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      excludedCount,
    };
  }, [accounts, baseCurrency, convertAmount]);

  // Count unpaid liabilities (use all, not filtered)
  const unpaidCount = allLiabilityAccounts.filter(
    (a) => a.recurringDueDate && !a.isPaidThisMonth && !a.excludeFromTotal
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Assets</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatAmount(totalAssets)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {allAssetAccounts.filter(a => !a.excludeFromTotal).length} of {allAssetAccounts.length} accounts
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Liabilities</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalLiabilities)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {allLiabilityAccounts.filter(a => !a.excludeFromTotal).length} of {allLiabilityAccounts.length} accounts
            {unpaidCount > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                ({unpaidCount} unpaid)
              </span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Worth</h3>
          <p className={`text-2xl font-bold ${
            netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatAmount(netWorth)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {excludedCount > 0 && `${excludedCount} excluded`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Est. Investment Returns</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatAmount(totalYearlyReturn)}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/yr</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatAmount(totalMonthlyReturn)}/mo
          </p>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsAssetsCollapsed(!isAssetsCollapsed)}
          className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {isAssetsCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-left">Assets</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {assetAccounts.length} {hasAssetFilters ? `of ${allAssetAccounts.length}` : ''} accounts
          </span>
        </button>

        {!isAssetsCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <AssetsTableHeader
                nameFilter={assetNameFilter}
                setNameFilter={setAssetNameFilter}
                typeFilter={assetTypeFilter}
                setTypeFilter={setAssetTypeFilter}
                currencyFilter={assetCurrencyFilter}
                setCurrencyFilter={setAssetCurrencyFilter}
                excludedFilter={assetExcludedFilter}
                setExcludedFilter={setAssetExcludedFilter}
                enabledCurrencies={enabledCurrencies}
                typeOptions={ASSET_TYPES.map(t => ({ value: t.value, label: t.label }))}
                hasActiveFilters={hasAssetFilters}
                onClearFilters={clearAssetFilters}
                isOpen={isAssetFilterOpen}
                onToggle={() => setIsAssetFilterOpen(!isAssetFilterOpen)}
              />
              <tbody>
                {assetAccounts.map((account, index) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      typeOptions={ASSET_TYPES}
                      onUpdate={(updates) => updateAccount(account.id, updates)}
                      onToggleExclude={() => toggleExcludeFromTotal(account.id)}
                      onDelete={() => deleteAccount(account.id)}
                      enabledCurrencies={enabledCurrencies}
                      index={index}
                    />
                  ))}
                  <AddAccountRow
                    typeOptions={ASSET_TYPES}
                    onAdd={addAccount}
                    baseCurrency={baseCurrency}
                    enabledCurrencies={enabledCurrencies}
                    colSpan={10}
                  />
                </tbody>
              </table>
            </div>
        )}
      </div>

      {/* Liabilities Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsLiabilitiesCollapsed(!isLiabilitiesCollapsed)}
          className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {isLiabilitiesCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 text-left">Liabilities</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {liabilityAccounts.length} {hasLiabilityFilters ? `of ${allLiabilityAccounts.length}` : ''} accounts
          </span>
        </button>

        {!isLiabilitiesCollapsed && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <LiabilitiesTableHeader
                  nameFilter={liabilityNameFilter}
                  setNameFilter={setLiabilityNameFilter}
                  typeFilter={liabilityTypeFilter}
                  setTypeFilter={setLiabilityTypeFilter}
                  currencyFilter={liabilityCurrencyFilter}
                  setCurrencyFilter={setLiabilityCurrencyFilter}
                  paidFilter={liabilityPaidFilter}
                  setPaidFilter={setLiabilityPaidFilter}
                  excludedFilter={liabilityExcludedFilter}
                  setExcludedFilter={setLiabilityExcludedFilter}
                  enabledCurrencies={enabledCurrencies}
                  typeOptions={LIABILITY_TYPES.map(t => ({ value: t.value, label: t.label }))}
                  hasActiveFilters={hasLiabilityFilters}
                  onClearFilters={clearLiabilityFilters}
                  isOpen={isLiabilityFilterOpen}
                  onToggle={() => setIsLiabilityFilterOpen(!isLiabilityFilterOpen)}
                />
                <tbody>
                  {liabilityAccounts.map((account, index) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      typeOptions={LIABILITY_TYPES}
                      isLiability
                      onUpdate={(updates) => updateAccount(account.id, updates)}
                      onToggleExclude={() => toggleExcludeFromTotal(account.id)}
                      onDelete={() => deleteAccount(account.id)}
                      enabledCurrencies={enabledCurrencies}
                      index={index}
                    />
                  ))}
                  <AddAccountRow
                    typeOptions={LIABILITY_TYPES}
                    isLiability
                    onAdd={addAccount}
                    baseCurrency={baseCurrency}
                    enabledCurrencies={enabledCurrencies}
                    colSpan={9}
                  />
                </tbody>
              </table>
            </div>
        )}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Start Tracking Your Net Worth
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click "Add asset" or "Add liability" in the tables above to get started.
          </p>
          <div className="flex gap-6 justify-center text-sm">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Assets</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cash, Bank, Investments</p>
            </div>
            <div className="text-center">
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Liabilities</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Credit Cards, Loans</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
