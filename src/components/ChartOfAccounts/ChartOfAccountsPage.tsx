import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLedgerAccountStore } from '../../stores/ledgerAccountStore';
import { CreditCard, Plus, Trash2, ChevronDown, Copy, Check, X, Upload } from 'lucide-react';
import type { LedgerAccount, LedgerAccountNormalBalance } from '../../types';
import { ImportModal } from '../Shared/ImportModal';
import { parseLedgerAccountXLSX } from '../../utils/xlsx';

// Copyable Cell Component - shows copy button on hover
interface CopyableCellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CopyableCell: React.FC<CopyableCellProps> = ({
  value,
  onChange,
  placeholder = '-',
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
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
        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-green-500 rounded-md outline-none font-mono"
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`group/cell relative px-2 py-1.5 text-sm ${disabled ? 'cursor-default' : 'cursor-text'} rounded-md transition-colors min-h-[32px] flex items-center font-mono`}
    >
      {value || <span className="text-gray-400 dark:text-gray-500 italic font-sans">{placeholder}</span>}
      {value && !disabled && (
        <button
          onClick={handleCopy}
          className="absolute right-1 opacity-0 group-hover/cell:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
      )}
    </div>
  );
};

// Editable Cell Component (for name)
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onChange,
  placeholder = 'Click to edit',
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
        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-2 border-green-500 rounded-md outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setIsEditing(true)}
      className={`px-2 py-1.5 text-sm ${disabled ? 'cursor-default' : 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-700/50'} rounded-md transition-colors min-h-[32px] flex items-center`}
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
        <div className="absolute top-full left-0 mt-1 w-full min-w-[100px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
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

// Active Toggle Component - App-colored version
interface ActiveToggleProps {
  isActive: boolean;
  onChange: () => void;
}

const ActiveToggle: React.FC<ActiveToggleProps> = ({ isActive, onChange }) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isActive
          ? 'bg-teal-500 dark:bg-teal-400'
          : 'bg-gray-300 dark:bg-gray-600'
      }`}
      title={isActive ? 'Active - click to deactivate' : 'Inactive - click to activate'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

// Account Row Component
interface AccountRowProps {
  account: LedgerAccount;
  onUpdate: (updates: Partial<LedgerAccount>) => void;
  onToggleActive: () => void;
  onDelete: () => void;
  index: number;
}

const AccountRow: React.FC<AccountRowProps> = ({
  account,
  onUpdate,
  onToggleActive,
  onDelete,
  index,
}) => {
  const isInactive = !account.isActive;
  const isEven = index % 2 === 0;

  return (
    <tr className={`group border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors ${isInactive ? 'opacity-50' : ''} ${isEven ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
      {/* Name */}
      <td className="py-1 px-1 w-40">
        <EditableCell
          value={account.name}
          onChange={(name) => onUpdate({ name })}
          placeholder="Account name"
          disabled={isInactive}
        />
      </td>

      {/* Account/Card Number (10-16 digits) */}
      <td className="py-1 px-1 w-44 border-l border-gray-200 dark:border-gray-700">
        <CopyableCell
          value={account.accountNumber || ''}
          onChange={(accountNumber) => onUpdate({ accountNumber: accountNumber || undefined })}
          placeholder="-"
          disabled={isInactive}
        />
      </td>

      {/* CLABE (18 digits) */}
      <td className="py-1 px-1 w-52 border-l border-gray-200 dark:border-gray-700">
        <CopyableCell
          value={account.clabe || ''}
          onChange={(clabe) => onUpdate({ clabe: clabe || undefined })}
          placeholder="-"
          disabled={isInactive}
        />
      </td>

      {/* Account Type (Debit/Credit) */}
      <td className="py-1 px-1 w-24 border-l border-gray-200 dark:border-gray-700">
        <AccountTypeDropdown
          value={account.normalBalance}
          onChange={(normalBalance) => onUpdate({ normalBalance })}
          disabled={isInactive}
        />
      </td>

      {/* Active Toggle */}
      <td className="py-1 px-2 w-16 border-l border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <ActiveToggle
            isActive={account.isActive}
            onChange={onToggleActive}
          />
        </div>
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
  onAdd: (account: Omit<LedgerAccount, 'id'>) => void;
}

const AddAccountRow: React.FC<AddAccountRowProps> = ({ onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [clabe, setClabe] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [normalBalance, setNormalBalance] = useState<LedgerAccountNormalBalance>('debit');
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
        clabe: clabe.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        normalBalance,
        isActive: true,
      });
      setName('');
      setClabe('');
      setAccountNumber('');
      setNormalBalance('debit');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setName('');
      setClabe('');
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
            Add account reference
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/10">
      <td className="py-1 px-1 w-40">
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
      <td className="py-1 px-1 w-44 border-l border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Account/Card #"
          className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </td>
      <td className="py-1 px-1 w-52 border-l border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={clabe}
          onChange={(e) => setClabe(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="18-digit CLABE"
          className="w-full px-2 py-1.5 text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </td>
      <td className="py-1 px-1 w-24 border-l border-gray-200 dark:border-gray-700">
        <AccountTypeDropdown
          value={normalBalance}
          onChange={setNormalBalance}
        />
      </td>
      <td className="py-1 px-2 w-16 border-l border-gray-200 dark:border-gray-700"></td>
      <td className="py-1 px-1 w-10 border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
        >
          <Plus className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// Accounts Table Header with Always-Visible Sticky Filters
interface AccountsTableHeaderProps {
  nameFilter: string;
  setNameFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const AccountsTableHeader: React.FC<AccountsTableHeaderProps> = ({
  nameFilter,
  setNameFilter,
  typeFilter,
  setTypeFilter,
  hasActiveFilters,
  onClearFilters,
}) => {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-40">
          Name
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-44 border-l border-gray-200 dark:border-gray-700">
          Account/Card #
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-52 border-l border-gray-200 dark:border-gray-700">
          CLABE
        </th>
        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-24 border-l border-gray-200 dark:border-gray-700">
          Type
        </th>
        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-16 border-l border-gray-200 dark:border-gray-700">
          Active
        </th>
        <th className="w-10 border-l border-gray-200 dark:border-gray-700"></th>
      </tr>
      {/* Always-visible filter row */}
      <tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
        <td className="py-2 px-2">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search..."
            className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400 w-full"
          />
        </td>
        <td className="py-2 px-1 border-l border-gray-200 dark:border-gray-700"></td>
        <td className="py-2 px-1 border-l border-gray-200 dark:border-gray-700"></td>
        <td className="py-2 px-1 border-l border-gray-200 dark:border-gray-700">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-1 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none focus:border-teal-500 text-gray-900 dark:text-white w-full"
          >
            <option value="">All</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </td>
        <td className="py-2 px-1 border-l border-gray-200 dark:border-gray-700"></td>
        <td className="py-2 px-1 border-l border-gray-200 dark:border-gray-700">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Clear filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </td>
      </tr>
    </thead>
  );
};

// Main Component
export const ChartOfAccountsPage: React.FC = () => {
  const { accounts, addAccount, deleteAccount, updateAccount, toggleActive } = useLedgerAccountStore();

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const hasActiveFilters = nameFilter !== '' || typeFilter !== '';

  const clearFilters = () => {
    setNameFilter('');
    setTypeFilter('');
  };

  // Apply filters
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (nameFilter && !account.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      if (typeFilter && account.normalBalance !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [accounts, nameFilter, typeFilter]);

  const activeCount = accounts.filter(a => a.isActive).length;

  // CSV validation function for ImportModal
  const validateAccountRow = useCallback((row: Record<string, string>, _index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate required fields
    if (!row.name) errors.push('Missing name');
    if (!row.normal_balance) errors.push('Missing normal_balance');

    // Validate normal_balance
    const normalBalance = row.normal_balance?.toLowerCase();
    if (row.normal_balance && normalBalance !== 'debit' && normalBalance !== 'credit') {
      errors.push('Invalid normal_balance');
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // CSV import handler for ImportModal
  const handleImportRows = useCallback(async (rows: Record<string, string>[]): Promise<{ success: boolean; message: string; count?: number }> => {
    const MAX_IMPORT_ROWS = 50;

    if (rows.length > MAX_IMPORT_ROWS) {
      return {
        success: false,
        message: `Too many rows (${rows.length}). Maximum ${MAX_IMPORT_ROWS} accounts per import.`,
      };
    }

    // Build set of existing accounts for duplicate detection
    const existingKeys = new Set(
      accounts.map((a) => a.name.toLowerCase())
    );

    let importedCount = 0;
    let skippedDuplicates = 0;

    for (const row of rows) {
      // Check for duplicate
      const key = row.name.toLowerCase();
      if (existingKeys.has(key)) {
        skippedDuplicates++;
        continue;
      }

      existingKeys.add(key);

      addAccount({
        name: row.name,
        accountNumber: row.account_number || undefined,
        clabe: row.clabe || undefined,
        normalBalance: row.normal_balance.toLowerCase() as LedgerAccountNormalBalance,
        isActive: row.active?.toLowerCase() !== 'false',
      });
      importedCount++;
    }

    const messages: string[] = [];
    if (importedCount > 0) messages.push(`${importedCount} imported`);
    if (skippedDuplicates > 0) messages.push(`${skippedDuplicates} duplicates skipped`);

    return {
      success: importedCount > 0,
      message: messages.join(', ') || 'No accounts imported',
      count: importedCount,
    };
  }, [accounts, addAccount]);

  // XLSX parse wrapper for ImportModal
  const parseFileForModal = useCallback(async (file: File): Promise<{ data: Record<string, string>[]; errors: string[] }> => {
    const result = await parseLedgerAccountXLSX(file);
    return { data: result.data as unknown as Record<string, string>[], errors: result.errors };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Account References</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Quick reference for your bank accounts, CLABEs and card numbers. {activeCount} active of {accounts.length} total.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Import accounts from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full">
            <AccountsTableHeader
              nameFilter={nameFilter}
              setNameFilter={setNameFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
            <tbody>
              {filteredAccounts.map((account, index) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onUpdate={(updates) => updateAccount(account.id, updates)}
                  onToggleActive={() => toggleActive(account.id)}
                  onDelete={() => deleteAccount(account.id)}
                  index={index}
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
          <CreditCard className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Add Your Account References
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Store your bank account numbers and CLABEs for quick reference.
            Hover over any entry to copy it to your clipboard.
          </p>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        templateType="ledger-accounts"
        entityName="accounts"
        parseFile={parseFileForModal}
        validateRow={validateAccountRow}
        onImport={handleImportRows}
      />
    </div>
  );
};
