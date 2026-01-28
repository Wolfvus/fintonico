import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './stores/authStore';
import { useLedgerStore } from './stores/ledgerStore';
import { useThemeStore } from './stores/themeStore';
import { useSnapshotStore } from './stores/snapshotStore';
import { useExpenseStore } from './stores/expenseStore';
import { useIncomeStore } from './stores/incomeStore';
import { useAccountStore } from './stores/accountStore';
import { useLedgerAccountStore } from './stores/ledgerAccountStore';
import { checkAndGenerateRecurring } from './utils/recurringUtils';
import { getCurrentDate } from './utils/dateUtils';
import { TimeTravelBanner } from './components/Admin/TimeTravelBanner';
import { AuthForm } from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { NetWorthPage } from './components/NetWorth/NetWorthPage';
import { ChartOfAccountsPage } from './components/ChartOfAccounts/ChartOfAccountsPage';
import { IncomePage } from './components/Income/IncomePage';
import { ExpensePage } from './components/Expense/ExpensePage';
import { AdminPage } from './components/Admin/AdminPage';
import { CurrencySelector } from './components/Currency/CurrencySelector';
import { Navigation } from './components/Navigation/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Settings as SettingsIcon } from 'lucide-react';

type TabType = 'dashboard' | 'expenses' | 'income' | 'networth' | 'accounts' | 'admin';

function App() {
  const { t, i18n } = useTranslation();
  const { user, loading, checkUser, canAccessAdmin } = useAuthStore();
  const { initializeDefaultAccounts } = useLedgerStore();
  const { isDark, toggleTheme, initializeTheme } = useThemeStore();
  const dataFetched = useRef(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('fintonico-active-tab');
    const validTabs: TabType[] = ['dashboard', 'expenses', 'income', 'networth', 'accounts', 'admin'];
    if (saved && validTabs.includes(saved as TabType)) {
      return saved as TabType;
    }
    return 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check if user can access admin panel
  const showAdmin = canAccessAdmin();

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('fintonico-active-tab', activeTab);
  }, [activeTab]);

  // Initialize non-auth things on mount
  useEffect(() => {
    checkUser();
    initializeDefaultAccounts();
    checkAndGenerateRecurring();
    initializeTheme();
  }, [checkUser, initializeDefaultAccounts, initializeTheme]);

  // Check which stores failed to load
  const getFailedStores = () => {
    const stores = [
      { name: 'expenses', store: useExpenseStore },
      { name: 'income', store: useIncomeStore },
      { name: 'accounts', store: useAccountStore },
      { name: 'ledger', store: useLedgerAccountStore },
      { name: 'snapshots', store: useSnapshotStore },
    ];
    return stores
      .filter(s => s.store.getState().initializationStatus === 'error')
      .map(s => s.name);
  };

  // Retry only the stores that failed
  const retryFailedStores = async () => {
    setDataLoadError(null);
    const stores = [
      { name: 'expenses', store: useExpenseStore },
      { name: 'income', store: useIncomeStore },
      { name: 'accounts', store: useAccountStore },
      { name: 'ledger', store: useLedgerAccountStore },
      { name: 'snapshots', store: useSnapshotStore },
    ];

    const failedStores = stores.filter(
      s => s.store.getState().initializationStatus === 'error'
    );

    await Promise.all(failedStores.map(s => s.store.getState().fetchAll()));

    const stillFailed = getFailedStores();
    if (stillFailed.length > 0) {
      setDataLoadError(`Failed to load: ${stillFailed.join(', ')}`);
    } else {
      // All stores recovered — try snapshot creation
      if (useAccountStore.getState().isReady()) {
        useSnapshotStore.getState().ensureCurrentMonthSnapshot().catch((err) => {
          console.error('Failed to ensure current month snapshot:', err);
        });
      }
    }
  };

  // When user is authenticated, fetch all data from Supabase (runs once)
  useEffect(() => {
    if (user && !dataFetched.current) {
      dataFetched.current = true;
      setDataLoadError(null);

      const loadData = async () => {
        try {
          // Load all stores in parallel
          await Promise.all([
            useExpenseStore.getState().fetchAll(),
            useIncomeStore.getState().fetchAll(),
            useAccountStore.getState().fetchAll(),
            useLedgerAccountStore.getState().fetchAll(),
          ]);

          // Only fetch snapshots after accounts loaded successfully
          if (useAccountStore.getState().isReady()) {
            await useSnapshotStore.getState().fetchAll();
            await useSnapshotStore.getState().ensureCurrentMonthSnapshot();
          }
        } catch (err) {
          console.error('Error during data loading:', err);
        }

        // Check which stores failed (they track their own status)
        const failedStores = getFailedStores();
        if (failedStores.length > 0) {
          console.error('Failed to load data stores:', failedStores);
          setDataLoadError(`Failed to load: ${failedStores.join(', ')}`);
        }
      };

      loadData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
          <span className="text-primary">{t('loading')}...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-bg)' }}>
      <TimeTravelBanner />
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabType)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isDark={isDark}
        onThemeToggle={toggleTheme}
        onLogoClick={() => setActiveTab('dashboard')}
        onDateClick={() => setActiveTab('dashboard')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showAdmin={showAdmin}
      />

      {/* Desktop Top Bar */}
      <div className="hidden lg:block fixed top-0 left-16 right-0 z-30 nav-sidebar border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">{t('app.brand')}</span>
            <span className="text-xs text-muted flex items-center">• {t('app.tagline')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="h-8 px-3 flex items-center rounded-lg transition-colors btn-secondary"
            >
              <span className="text-sm font-medium">
                {getCurrentDate().toLocaleDateString(i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </button>
            <div className="h-6 w-px" style={{ backgroundColor: 'var(--color-border)' }}></div>
            <CurrencySelector />
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:opacity-80 transition-colors text-secondary"
              aria-label="Open settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


      {dataLoadError && (
        <div className="fixed top-14 lg:top-12 left-0 lg:left-16 right-0 z-40 bg-red-600 text-white px-4 py-2 text-sm flex items-center justify-between">
          <span>{dataLoadError}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={retryFailedStores}
              className="underline font-semibold hover:no-underline"
            >
              Retry
            </button>
            <button
              onClick={() => setDataLoadError(null)}
              className="opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="pt-16 lg:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3 lg:pl-20">
          {activeTab === 'dashboard' && (
            <ErrorBoundary>
              <Dashboard onNavigate={(tab) => setActiveTab(tab)} />
            </ErrorBoundary>
          )}

          {activeTab === 'expenses' && (
            <ErrorBoundary>
              <ExpensePage />
            </ErrorBoundary>
          )}

          {activeTab === 'income' && (
            <ErrorBoundary>
              <IncomePage />
            </ErrorBoundary>
          )}

          {activeTab === 'networth' && (
            <ErrorBoundary>
              <NetWorthPage />
            </ErrorBoundary>
          )}

          {activeTab === 'accounts' && (
            <ErrorBoundary>
              <ChartOfAccountsPage />
            </ErrorBoundary>
          )}

          {activeTab === 'admin' && showAdmin && (
            <ErrorBoundary>
              <AdminPage />
            </ErrorBoundary>
          )}
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}


export default App;
