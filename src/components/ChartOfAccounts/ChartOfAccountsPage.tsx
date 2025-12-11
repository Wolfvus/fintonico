import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLedgerAccountStore } from '../../stores/ledgerAccountStore';
import { BookOpen, Plus, Trash2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import type { LedgerAccount, LedgerAccountNormalBalance, LedgerAccountCategory } from '../../types';

// Editable Cell Component
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  placeholder = 'Click to edit',
  className = '',
  disabled = false,
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

  if (isEditing && !disabled) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-green-500 rounded-md outline-none ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`px-2 py-1.5 text-sm ${disabled ? 'cursor-default' : 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors min-h-[32px] flex items-center ${className}`}
    >
      {value || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
    </div>
  );
};

// Account Type Dropdown (Debit/Credit)
interface AccountTypeDropdownProps {
  value: LedgerAccountNormalBalance;
  onChange: (value: LedgerAccountNormalBalance) => void;
  disabled?: boolean;
}

const AccountTypeDropdown: React.FC<AccountTypeDropdownProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { value: LedgerAccountNormalBalance; label: string; color: string }[] = [
    { value: 'debit', label: 'Debit', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'credit', label: 'Credit', color: 'text-purple-600 dark:text-purple-400' },
  ];

  const selectedOption = options.find((opt) => opt.value === value);

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-2 py-1.5 text-sm ${disabled ? 'cursor-default opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors w-full`}
      >
        <span className={`flex-1 text-left font-medium ${selectedOption?.color}`}>
          {selectedOption?.label || 'Select...'}
        </span>
        {!disabled && <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[100px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex items-center px-3 py-2 text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                option.value === value ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <span className={`font-medium ${option.color}`}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Category Dropdown
interface CategoryDropdownProps {
  value: LedgerAccountCategory;
  onChange: (value: LedgerAccountCategory) => void;
  disabled?: boolean;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { value: LedgerAccountCategory; label: string; icon: string }[] = [
    { value: 'asset', label: 'Asset', icon: '📈' },
    { value: 'liability', label: 'Liability', icon: '📉' },
    { value: 'equity', label: 'Equity', icon: '💰' },
    { value: 'income', label: 'Income', icon: '💵' },
    { value: 'expense', label: 'Expense', icon: '💸' },
  ];

  const selectedOption = options.find((opt) => opt.value === value);

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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-2 py-1.5 text-sm ${disabled ? 'cursor-default opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors w-full`}
      >
        {selectedOption?.icon && <span>{selectedOption.icon}</span>}
        <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
          {selectedOption?.label || 'Select...'}
        </span>
        {!disabled && <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
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
              <span>{option.icon}</span>
              <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Active Toggle Component
interface ActiveToggleProps {
  isActive: boolean;
  onChange: () => void;
}

const ActiveToggle: React.FC<ActiveToggleProps> = ({ isActive, onChange }) => {
  return (
    <button
      onClick={onChange}
      className={`p-1.5 rounded-md transition-colors ${
        isActive
          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={isActive ? 'Active - click to deactivate' : 'Inactive - click to activate'}
    >
      {isActive ? (
        <ToggleRight className="w-5 h-5" />
      ) : (
        <ToggleLeft className="w-5 h-5" />
      )}
    </button>
  );
};

// Account Row Component
interface AccountRowProps {
  account: LedgerAccount;
  onUpdate: (updates: Partial<LedgerAccount>) => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

const AccountRow: React.FC<AccountRowProps> = ({
  account,
  onUpdate,
  onToggleActive,
  onDelete,
}) => {
  const isInactive = !account.isActive;

  return (
    <tr className={`group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${isInactive ? 'opacity-50' : ''}`}>
      {/* Name */}
      <td className="py-1 px-1">
        <EditableCell
          value={account.name}
          onChange={(name) => onUpdate({ name })}
          placeholder="Account name"
          disabled={isInactive}
        />
      </td>

      {/* Account Type (Debit/Credit) */}
      <td className="py-1 px-1 w-28">
        <AccountTypeDropdown
          value={account.normalBalance}
          onChange={(normalBalance) => onUpdate({ normalBalance })}
          disabled={isInactive}
        />
      </td>

      {/* Category */}
      <td className="py-1 px-1 w-32">
        <CategoryDropdown
          value={account.category}
          onChange={(category) => onUpdate({ category })}
          disabled={isInactive}
        />
      </td>

      {/* Account Number */}
      <td className="py-1 px-1 w-32">
        <EditableCell
          value={account.accountNumber || ''}
          onChange={(accountNumber) => onUpdate({ accountNumber: accountNumber || undefined })}
          placeholder="-"
          disabled={isInactive}
          className="font-mono"
        />
      </td>

      {/* Active Toggle */}
      <td className="py-1 px-1 w-12">
        <ActiveToggle
          isActive={account.isActive}
          onChange={onToggleActive}
        />
      </td>

      {/* Delete */}
      <td className="py-1 px-1 w-10">
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
  onAdd: (account: Omit<LedgerAccount, 'id'>) => void;
}

const AddAccountRow: React.FC<AddAccountRowProps> = ({ onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [normalBalance, setNormalBalance] = useState<LedgerAccountNormalBalance>('debit');
  const [category, setCategory] = useState<LedgerAccountCategory>('asset');
  const [accountNumber, setAccountNumber] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (name.trim()) {
      onAdd({
        name: name.trim(),
        normalBalance,
        category,
        accountNumber: accountNumber.trim() || undefined,
        isActive: true,
      });
      setName('');
      setNormalBalance('debit');
      setCategory('asset');
      setAccountNumber('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setName('');
      setAccountNumber('');
    }
  };

  if (!isAdding) {
    return (
      <tr>
        <td colSpan={6} className="py-2 px-1">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors w-full"
          >
            <Plus className="w-4 h-4" />
            Add account
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
      <td className="py-1 px-1 w-28">
        <AccountTypeDropdown
          value={normalBalance}
          onChange={setNormalBalance}
        />
      </td>
      <td className="py-1 px-1 w-32">
        <CategoryDropdown
          value={category}
          onChange={setCategory}
        />
      </td>
      <td className="py-1 px-1 w-32">
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 1000"
          className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </td>
      <td className="py-1 px-1 w-12"></td>
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

// Main Component
export const ChartOfAccountsPage: React.FC = () => {
  const { accounts, addAccount, deleteAccount, updateAccount, toggleActive } = useLedgerAccountStore();

  // Group accounts by category
  const groupedAccounts = useMemo(() => {
    const groups: Record<LedgerAccountCategory, LedgerAccount[]> = {
      asset: [],
      liability: [],
      equity: [],
      income: [],
      expense: [],
    };

    accounts.forEach((account) => {
      groups[account.category].push(account);
    });

    // Sort each group by account number (if exists) then by name
    Object.keys(groups).forEach((key) => {
      groups[key as LedgerAccountCategory].sort((a, b) => {
        if (a.accountNumber && b.accountNumber) {
          return a.accountNumber.localeCompare(b.accountNumber);
        }
        if (a.accountNumber) return -1;
        if (b.accountNumber) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [accounts]);

  const categoryLabels: Record<LedgerAccountCategory, { label: string; icon: string }> = {
    asset: { label: 'Assets', icon: '📈' },
    liability: { label: 'Liabilities', icon: '📉' },
    equity: { label: 'Equity', icon: '💰' },
    income: { label: 'Income', icon: '💵' },
    expense: { label: 'Expenses', icon: '💸' },
  };

  const activeCount = accounts.filter(a => a.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chart of Accounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeCount} active account{activeCount !== 1 ? 's' : ''} of {accounts.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Account #
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  Active
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onUpdate={(updates) => updateAccount(account.id, updates)}
                  onToggleActive={() => toggleActive(account.id)}
                  onDelete={() => deleteAccount(account.id)}
                />
              ))}
              <AddAccountRow onAdd={addAccount} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Create Your Chart of Accounts
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            A chart of accounts organizes your financial transactions into categories.
            Start by adding accounts for your assets, liabilities, equity, income, and expenses.
          </p>
          <div className="flex gap-4 justify-center flex-wrap text-sm">
            {(['asset', 'liability', 'equity', 'income', 'expense'] as LedgerAccountCategory[]).map((cat) => (
              <div key={cat} className="text-center">
                <span className="text-2xl">{categoryLabels[cat].icon}</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">{categoryLabels[cat].label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
