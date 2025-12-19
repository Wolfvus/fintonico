import React, { useEffect, useMemo, useState } from 'react';
import { Settings, RefreshCcw, AlertCircle, ChevronDown } from 'lucide-react';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../../stores/currencyStore';
import { clearMockData, seedMockData } from '../../utils/resetData';
import { Modal, modalButtonStyles } from '../Shared/Modal';
import { ToggleSwitch } from '../Shared/ToggleSwitch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sectionTitle = 'text-sm font-semibold text-primary';
const sectionDescription = 'text-xs text-muted';

const preferenceRow =
  'flex items-center justify-between gap-4 px-4 py-3 border-b last:border-none transition-colors hover:bg-[var(--color-surface-elevated)] border-[color:var(--color-border)]';

const checkboxBase =
  'h-4 w-4 rounded border-[color:var(--color-border)] text-[color:var(--color-primary)]';

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
  const [isCurrencyListOpen, setIsCurrencyListOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isSeedingData, setIsSeedingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftEnabled(enabledCurrencies);
      setDraftBaseCurrency(baseCurrency);
      setIsCurrencyListOpen(true);
    }
  }, [enabledCurrencies, baseCurrency, isOpen]);

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

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Clear all local data? This will remove your incomes, expenses, accounts, and settings from this browser. This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setIsClearingData(true);
      await clearMockData();
      // Reload to ensure all components reflect the cleared state
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      setIsClearingData(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeedingData(true);
      await seedMockData();
      // Reload to ensure all components reflect the new data
      window.location.reload();
    } catch (error) {
      console.error('Failed to seed data:', error);
      setIsSeedingData(false);
    }
  };

  const visibleCurrencyList = useMemo(() => {
    const pool = draftEnabled.length ? draftEnabled : SUPPORTED_CURRENCIES.map((currency) => currency.code);
    return Array.from(new Set([draftBaseCurrency, ...pool]));
  }, [draftEnabled, draftBaseCurrency]);

  const footerContent = (
    <>
      <div className="flex items-center gap-2 text-xs text-muted mr-auto">
        <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[color:var(--color-primary)]' : ''}`} />
        <span>{loading ? 'Refreshing exchange rates...' : 'Exchange rates update every 5 minutes while open.'}</span>
      </div>
      <button
        onClick={handleReset}
        className={modalButtonStyles.secondary}
      >
        Reset defaults
      </button>
      <button onClick={onClose} className={modalButtonStyles.secondary}>
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={modalButtonStyles.primary}
      >
        {isSaving ? 'Saving...' : 'Save changes'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workspace Settings"
      description="Configure currency visibility and dashboard preferences."
      icon={<Settings className="w-5 h-5" />}
      size="xl"
      footer={footerContent}
    >
      <div className="space-y-8">
        <section>
          <h3 className={sectionTitle}>Base Currency</h3>
          <p className={`${sectionDescription} mb-3`}>
            Used for totals and financial reports.
          </p>
          <div className="rounded-xl border bg-[var(--color-surface-card)] border-[color:var(--color-border)] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label htmlFor="base-currency-select" className="text-sm font-medium text-primary">
              Base currency
            </label>
            <div className="relative w-full sm:w-56">
              <select
                id="base-currency-select"
                value={draftBaseCurrency}
                onChange={(event) => setDraftBaseCurrency(event.target.value)}
                className="select w-full pr-9"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className={sectionTitle}>Currency Visibility</h3>
              <p className={sectionDescription}>
                Choose which currencies show up in pickers and dashboards. Base stays on.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCurrencyListOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-secondary px-2 py-1 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
              aria-expanded={isCurrencyListOpen}
              aria-controls="currency-visibility-list"
            >
              {isCurrencyListOpen ? 'Hide list' : 'Show list'}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isCurrencyListOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {isCurrencyListOpen && (
            <div
              id="currency-visibility-list"
              className="rounded-xl border divide-y bg-[var(--color-surface-card)] border-[color:var(--color-border)] divide-[color:var(--color-border)]"
            >
              {SUPPORTED_CURRENCIES.map((currency) => {
                const isBase = currency.code === draftBaseCurrency;
                const isChecked = visibleCurrencyList.includes(currency.code);
                const disabled = isBase;
                return (
                  <label
                    key={currency.code}
                    className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-2 transition-colors ${
                      disabled
                        ? 'opacity-70 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        className={`${checkboxBase} shrink-0`}
                        checked={isChecked}
                        disabled={disabled}
                        onChange={() => handleToggleCurrency(currency.code)}
                        aria-label={`${currency.code} visibility toggle`}
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-primary whitespace-nowrap">
                          {currency.code}
                        </span>
                        <span className="text-xs text-muted truncate">
                          {currency.name}
                        </span>
                      </div>
                    </div>
                    {disabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-elevated)] text-secondary border border-[color:var(--color-border)]">
                        Base
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="font-medium">Preview:</span>
            <span>Showing {visibleCurrencyList.join(', ')}</span>
            {visibleCurrencyList.length === 1 && visibleCurrencyList[0] === baseCurrency && (
              <span className="inline-flex items-center gap-1 text-[color:var(--color-warning)]">
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
          <div className="rounded-xl border divide-y bg-[var(--color-surface-card)] border-[color:var(--color-border)] divide-[color:var(--color-border)]">
            <div className={preferenceRow}>
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">
                  Show savings insights on dashboard
                </p>
                <p className={sectionDescription}>Recommended to keep enabled for budgeting tips.</p>
              </div>
              <ToggleSwitch
                checked={showSavingsInsights}
                onChange={setShowSavingsInsights}
                size="sm"
                ariaLabel="Show savings insights on dashboard"
              />
            </div>
            <div className={preferenceRow}>
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">
                  Auto-refresh FX rates at launch
                </p>
                <p className={sectionDescription}>Disable if working offline to avoid API warnings.</p>
              </div>
              <ToggleSwitch
                checked={autoFetchFx}
                onChange={setAutoFetchFx}
                size="sm"
                ariaLabel="Auto-refresh FX rates at launch"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Data Management</h3>
          <p className={`${sectionDescription} mb-3`}>
            These actions only affect data stored in this browser.
          </p>
          <div className="rounded-xl border divide-y bg-[var(--color-surface-card)] border-[color:var(--color-border)] divide-[color:var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">Seed mock data</p>
                <p className={sectionDescription}>Populate the app with a small demo dataset.</p>
              </div>
              <button
                onClick={handleSeedData}
                disabled={isSeedingData}
                className="px-3 py-2 text-sm font-medium border rounded-lg transition-colors border-[color:var(--color-info)] text-[color:var(--color-info)] hover:bg-[var(--color-info-bg)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSeedingData ? 'Seeding...' : 'Seed mock data'}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">Clear local data</p>
                <p className={sectionDescription}>Removes all local entries. You cannot undo this.</p>
              </div>
              <button
                onClick={handleClearData}
                disabled={isClearingData}
                className={`${modalButtonStyles.danger} ${isClearingData ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isClearingData ? 'Clearing...' : 'Clear local data'}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 text-xs border rounded-lg px-3 py-2 text-[color:var(--color-error)] border-[color:var(--color-error)] bg-[var(--color-error-bg)]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
