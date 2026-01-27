import React, { useEffect, useMemo, useState } from 'react';
import { Settings, RefreshCcw, AlertCircle, ChevronDown, Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../../stores/currencyStore';
import { clearMockData, seedMockData } from '../../utils/resetData';
import { Modal, modalButtonStyles } from '../Shared/Modal';
import { ToggleSwitch } from '../Shared/ToggleSwitch';
import { DataMigration } from './DataMigration';

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
  const { t } = useTranslation();
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
      t('settings.clearConfirm')
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
        <span>{loading ? t('settings.refreshingRates') : t('settings.ratesInfo')}</span>
      </div>
      <button
        onClick={handleReset}
        className={modalButtonStyles.secondary}
      >
        {t('settings.resetDefaults')}
      </button>
      <button onClick={onClose} className={modalButtonStyles.secondary}>
        {t('settings.cancel')}
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={modalButtonStyles.primary}
      >
        {isSaving ? t('settings.saving') : t('settings.saveChanges')}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      description={t('settings.description')}
      icon={<Settings className="w-5 h-5" />}
      size="xl"
      footer={footerContent}
    >
      <div className="space-y-8">
        {/* Language */}
        <section>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-primary">{t('settings.language')}</h4>
            <p className="text-xs text-muted">{t('settings.languageDesc')}</p>
            <select
              value={i18n.language?.startsWith('es') ? 'es' : 'en'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-lg text-sm border transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>{t('settings.baseCurrency')}</h3>
          <p className={`${sectionDescription} mb-3`}>
            {t('settings.baseCurrencyDesc')}
          </p>
          <div className="rounded-xl border bg-[var(--color-surface-card)] border-[color:var(--color-border)] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label htmlFor="base-currency-select" className="text-sm font-medium text-primary">
              {t('settings.baseCurrencyLabel')}
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
              <h3 className={sectionTitle}>{t('settings.currencyVisibility')}</h3>
              <p className={sectionDescription}>
                {t('settings.currencyVisibilityDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCurrencyListOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-secondary px-2 py-1 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
              aria-expanded={isCurrencyListOpen}
              aria-controls="currency-visibility-list"
            >
              {isCurrencyListOpen ? t('settings.hideList') : t('settings.showList')}
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
                        {t('settings.base')}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="font-medium">{t('settings.preview')}</span>
            <span>{t('settings.showing')} {visibleCurrencyList.join(', ')}</span>
            {visibleCurrencyList.length === 1 && visibleCurrencyList[0] === baseCurrency && (
              <span className="inline-flex items-center gap-1 text-[color:var(--color-warning)]">
                <AlertCircle className="w-3 h-3" />
                {t('settings.addCurrencyWarning')}
              </span>
            )}
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>{t('settings.generalPreferences')}</h3>
          <p className={`${sectionDescription} mb-3`}>
            {t('settings.generalPreferencesDesc')}
          </p>
          <div className="rounded-xl border divide-y bg-[var(--color-surface-card)] border-[color:var(--color-border)] divide-[color:var(--color-border)]">
            <div className={preferenceRow}>
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">
                  {t('settings.showSavingsInsights')}
                </p>
                <p className={sectionDescription}>{t('settings.showSavingsInsightsDesc')}</p>
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
                  {t('settings.autoRefreshFx')}
                </p>
                <p className={sectionDescription}>{t('settings.autoRefreshFxDesc')}</p>
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
          <h3 className={sectionTitle}>
            <span className="inline-flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              {t('settings.cloudSync')}
            </span>
          </h3>
          <p className={`${sectionDescription} mb-3`}>
            {t('settings.cloudSyncDesc')}
          </p>
          <div className="rounded-xl border bg-[var(--color-surface-card)] border-[color:var(--color-border)] p-4">
            <DataMigration />
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>{t('settings.dataManagement')}</h3>
          <p className={`${sectionDescription} mb-3`}>
            {t('settings.dataManagementDesc')}
          </p>
          <div className="rounded-xl border divide-y bg-[var(--color-surface-card)] border-[color:var(--color-border)] divide-[color:var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">{t('settings.seedMockData')}</p>
                <p className={sectionDescription}>{t('settings.seedMockDataDesc')}</p>
              </div>
              <button
                onClick={handleSeedData}
                disabled={isSeedingData}
                className="px-3 py-2 text-sm font-medium border rounded-lg transition-colors border-[color:var(--color-info)] text-[color:var(--color-info)] hover:bg-[var(--color-info-bg)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSeedingData ? t('settings.seeding') : t('settings.seedMockDataBtn')}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">{t('settings.clearLocalData')}</p>
                <p className={sectionDescription}>{t('settings.clearLocalDataDesc')}</p>
              </div>
              <button
                onClick={handleClearData}
                disabled={isClearingData}
                className={`${modalButtonStyles.danger} ${isClearingData ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isClearingData ? t('settings.clearing') : t('settings.clearLocalData')}
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
