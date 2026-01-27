/**
 * System Configuration Section
 * Admin panel section for managing global system settings
 */

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Plus, X, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useAuthStore } from '../../stores/authStore';
import { CURRENCY_REGISTRY } from '../../config/currencies';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Other',
];

export const SystemConfigSection: React.FC = () => {
  const { systemConfig, configLoading, fetchSystemConfig, updateSystemConfig } = useAdminStore();
  const { isSuperAdmin } = useAuthStore();

  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(['USD', 'EUR', 'MXN']);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = isSuperAdmin();

  useEffect(() => {
    fetchSystemConfig();
  }, [fetchSystemConfig]);

  useEffect(() => {
    if (systemConfig.length > 0) {
      const currencyConfig = systemConfig.find(c => c.key === 'default_currency');
      const enabledConfig = systemConfig.find(c => c.key === 'enabled_currencies');
      const categoriesConfig = systemConfig.find(c => c.key === 'expense_categories');

      if (currencyConfig?.value) setDefaultCurrency(currencyConfig.value as string);
      if (enabledConfig?.value) setEnabledCurrencies(enabledConfig.value as string[]);
      if (categoriesConfig?.value) setExpenseCategories(categoriesConfig.value as string[]);
    }
  }, [systemConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateSystemConfig('default_currency', defaultCurrency);
      await updateSystemConfig('enabled_currencies', enabledCurrencies);
      await updateSystemConfig('expense_categories', expenseCategories);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDefaultCurrency('USD');
    setEnabledCurrencies(['USD', 'EUR', 'MXN']);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
  };

  const toggleCurrency = (code: string) => {
    if (enabledCurrencies.includes(code)) {
      if (enabledCurrencies.length > 1) {
        setEnabledCurrencies(enabledCurrencies.filter(c => c !== code));
        if (defaultCurrency === code) {
          setDefaultCurrency(enabledCurrencies.find(c => c !== code) || 'USD');
        }
      }
    } else {
      setEnabledCurrencies([...enabledCurrencies, code]);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !expenseCategories.includes(newCategory.trim())) {
      setExpenseCategories([...expenseCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setExpenseCategories(expenseCategories.filter(c => c !== category));
  };


  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Configuration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage global settings for the application
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          Configuration saved successfully!
        </div>
      )}

      {!canEdit && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Only Super Admins can modify system configuration
        </div>
      )}

      {/* Currency Settings */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white">Currency Settings</h4>

        {/* Default Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Currency
          </label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            disabled={!canEdit}
            className="w-full max-w-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enabledCurrencies.map(code => {
              const currency = CURRENCY_REGISTRY[code];
              return (
                <option key={code} value={code}>
                  {currency?.code} - {currency?.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Enabled Currencies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enabled Currencies
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.values(CURRENCY_REGISTRY).map(currency => (
              <button
                key={currency.code}
                onClick={() => toggleCurrency(currency.code)}
                disabled={!canEdit}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  enabledCurrencies.includes(currency.code)
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                } ${!canEdit ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80'}`}
              >
                {currency.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white">Expense Categories</h4>

        <div className="flex flex-wrap gap-2">
          {expenseCategories.map(category => (
            <span
              key={category}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm"
            >
              {category}
              {canEdit && (
                <button
                  onClick={() => removeCategory(category)}
                  className="hover:text-red-900 dark:hover:text-red-100"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="New category..."
              className="flex-1 max-w-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={addCategory}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
