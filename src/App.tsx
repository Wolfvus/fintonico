import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useLedgerStore } from './stores/ledgerStore';
import { useThemeStore } from './stores/themeStore';
import { checkAndGenerateRecurring } from './utils/recurringUtils';
import { AuthForm } from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { NetWorthPage } from './components/NetWorth/NetWorthPage';
import { ChartOfAccountsPage } from './components/ChartOfAccounts/ChartOfAccountsPage';
import { IncomePage } from './components/Income/IncomePage';
import { ExpensePage } from './components/Expense/ExpensePage';
import { CurrencySelector } from './components/Currency/CurrencySelector';
import { Navigation } from './components/Navigation/Navigation';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Settings as SettingsIcon } from 'lucide-react';

function App() {
  const { user, loading, checkUser } = useAuthStore();
  const { initializeDefaultAccounts } = useLedgerStore();
  const { isDark, toggleTheme, initializeTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'income' | 'networth' | 'accounts'>(() => {
    const saved = localStorage.getItem('fintonico-active-tab');
    if (saved && ['dashboard', 'expenses', 'income', 'networth', 'accounts'].includes(saved)) {
      return saved as 'dashboard' | 'expenses' | 'income' | 'networth' | 'accounts';
    }
    return 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('fintonico-active-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    checkUser();
    // Initialize ledger with default chart of accounts
    initializeDefaultAccounts();
    // Check and generate recurring transactions on app load
    checkAndGenerateRecurring();
    // Initialize theme from localStorage or system preference
    initializeTheme();
  }, [checkUser, initializeDefaultAccounts, initializeTheme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }}></div>
          <span className="text-primary">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-bg)' }}>
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isDark={isDark}
        onThemeToggle={toggleTheme}
        onLogoClick={() => setActiveTab('dashboard')}
        onDateClick={() => setActiveTab('dashboard')}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Desktop Top Bar */}
      <div className="hidden lg:block fixed top-0 left-16 right-0 z-30 nav-sidebar border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">FINTONICO</span>
            <span className="text-xs text-muted flex items-center">• The Ultimate Personal Finance Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="h-8 px-3 flex items-center rounded-lg transition-colors btn-secondary"
            >
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString('en-US', {
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
        </div>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}


export default App;
