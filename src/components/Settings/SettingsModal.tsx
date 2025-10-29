import React, { useEffect, useMemo, useState } from 'react';
import { X, Settings, RefreshCcw, AlertCircle } from 'lucide-react';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../../stores/currencyStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalBackdrop =
  'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4';

const modalCard =
  'w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-200 dark:border-gray-700 overflow-hidden';

const sectionTitle = 'text-sm font-semibold text-gray-900 dark:text-white';
const sectionDescription = 'text-xs text-gray-500 dark:text-gray-400';

const preferenceRow =
  'flex items-center justify-between gap-3 py-2.5 border-b border-blue-100 dark:border-gray-800 last:border-none';

const checkboxBase =
  'h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    baseCurrency,
    enabledCurrencies,
    setEnabledCurrencies,
    setBaseCurrency,
    loading,
    error,
  } = useCurrencyStore();

  const [draftBaseCurrency, setDraftBaseCurrency] = useState(baseCurrency);
  const [draftEnabled, setDraftEnabled] = useState<string[]>(enabledCurrencies);
  const [autoFetchFx, setAutoFetchFx] = useState(true);
  const [showSavingsInsights, setShowSavingsInsights] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftEnabled(enabledCurrencies);
      setDraftBaseCurrency(baseCurrency);
    }
  }, [enabledCurrencies, baseCurrency, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleToggleCurrency = (code: string) => {
    if (code === draftBaseCurrency) {
      return;
    }
    setDraftEnabled((prev) => {
      const exists = prev.includes(code);
      if (exists) {
        return prev.filter((item) => item !== code);
      }
      return [...prev, code];
    });
  };

  const handleReset = () => {
    setDraftEnabled(SUPPORTED_CURRENCIES.map((currency) => currency.code));
    setDraftBaseCurrency(SUPPORTED_CURRENCIES[0]?.code ?? baseCurrency);
    setAutoFetchFx(true);
    setShowSavingsInsights(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (draftBaseCurrency !== baseCurrency) {
        await setBaseCurrency(draftBaseCurrency);
      }
      setEnabledCurrencies(draftEnabled);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const visibleCurrencyList = useMemo(() => {
    const pool = draftEnabled.length ? draftEnabled : SUPPORTED_CURRENCIES.map((currency) => currency.code);
    return Array.from(new Set([draftBaseCurrency, ...pool]));
  }, [draftEnabled, draftBaseCurrency]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className={modalCard}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-blue-200 dark:border-gray-800 bg-blue-50/80 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <div>
              <h2 id="settings-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Workspace Settings
              </h2>
              <p className={sectionDescription}>
                Configure currency visibility and dashboard preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          <section>
            <h3 className={sectionTitle}>Base Currency</h3>
            <p className={`${sectionDescription} mb-3`}>
              Set your default reporting currency. Exchange rates will refresh when this changes.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label htmlFor="base-currency-select" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Base currency
              </label>
              <select
                id="base-currency-select"
                value={draftBaseCurrency}
                onChange={(event) => setDraftBaseCurrency(event.target.value)}
                className="w-full sm:w-56 rounded-lg border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} · {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Currency Visibility</h3>
            <p className={`${sectionDescription} mb-3`}>
              Toggle which currencies appear in selectors and summaries. Your base currency ({draftBaseCurrency}) is always enabled.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPORTED_CURRENCIES.map((currency) => {
                const isBase = currency.code === draftBaseCurrency;
                const isChecked = visibleCurrencyList.includes(currency.code);
                const disabled = isBase;
                return (
                  <label
                    key={currency.code}
                    className={`flex items-start gap-3 rounded-lg border border-blue-100 dark:border-gray-800 p-3 hover:border-blue-300 dark:hover:border-gray-600 transition-colors ${
                      disabled ? 'bg-blue-50/70 dark:bg-gray-900/60 cursor-not-allowed' : 'bg-white dark:bg-gray-900 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={checkboxBase}
                      checked={isChecked}
                      disabled={disabled}
                      onChange={() => handleToggleCurrency(currency.code)}
                      aria-label={`${currency.code} visibility toggle`}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currency.code} · {currency.name}
                      </p>
                      <p className={sectionDescription}>
                        {disabled ? 'Base currency (always on)' : 'Include in currency switcher and dashboards.'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Preview:</span>
              <span>Showing {visibleCurrencyList.join(', ')}</span>
              {visibleCurrencyList.length === 1 && visibleCurrencyList[0] === baseCurrency && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  Add another currency if you plan to track FX balances.
                </span>
              )}
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>General Preferences</h3>
            <p className={`${sectionDescription} mb-3`}>
              Feature toggles saved locally; expand as shared settings come online.
            </p>
            <div className="rounded-xl border border-blue-100 dark:border-gray-800 divide-y divide-blue-100 dark:divide-gray-800">
              <div className={preferenceRow}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Show savings insights on dashboard
                  </p>
                  <p className={sectionDescription}>Recommended to keep enabled for budgeting tips.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className={checkboxBase}
                    checked={showSavingsInsights}
                    onChange={(event) => setShowSavingsInsights(event.target.checked)}
                  />
                  {showSavingsInsights ? 'On' : 'Off'}
                </label>
              </div>
              <div className={preferenceRow}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Auto-refresh FX rates at launch
                  </p>
                  <p className={sectionDescription}>Disable if working offline to avoid API warnings.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className={checkboxBase}
                    checked={autoFetchFx}
                    onChange={(event) => setAutoFetchFx(event.target.checked)}
                  />
                  {autoFetchFx ? 'On' : 'Off'}
                </label>
              </div>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/60 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap justify-between items-center gap-3 px-6 py-4 border-t border-blue-200 dark:border-gray-800 bg-blue-50/80 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-green-600 dark:text-green-400' : ''}`} />
            <span>{loading ? 'Refreshing exchange rates…' : 'Exchange rates update every 5 minutes while open.'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Reset defaults
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                isSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
