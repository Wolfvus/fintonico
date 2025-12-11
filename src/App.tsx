import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useLedgerStore } from './stores/ledgerStore';
import { useThemeStore } from './stores/themeStore';
import { checkAndGenerateRecurring } from './utils/recurringUtils';
import { AuthForm } from './components/Auth/AuthForm';
import { ExpenseForm } from './components/ExpenseForm/ExpenseForm';
import { IncomeForm } from './components/IncomeForm/IncomeForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { NetWorthPage } from './components/NetWorth/NetWorthPage';
import { ChartOfAccountsPage } from './components/ChartOfAccounts/ChartOfAccountsPage';
import { DataList } from './components/Shared/DataList';
import { TransactionItem, type Transaction } from './components/Shared/TransactionItem';
import { CurrencySelector } from './components/Currency/CurrencySelector';
import { useExpenseStore } from './stores/expenseStore';
import { Navigation } from './components/Navigation/Navigation';
import { useIncomeStore } from './stores/incomeStore';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Settings as SettingsIcon } from 'lucide-react';

// Expenses Tab Component
function ExpensesTab() {
  const expenseStore = useExpenseStore();
  const { deleteExpense } = expenseStore;
  
  // Get derived expenses from ledger
  const expenses = expenseStore._deriveExpensesFromLedger();
  
  const expenseTransactions: Transaction[] = expenses.map(expense => ({
    id: expense.id,
    description: expense.what,
    amount: expense.amount,
    currency: expense.currency,
    date: expense.date,
    type: 'expense' as const,
    category: expense.rating,
    rating: expense.rating,
    recurring: expense.recurring,
    fundingAccountId: expense.fundingAccountId,
    fundingAccountName: expense.fundingAccountName,
    fundingAccountNature: expense.fundingAccountNature
  }));
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <ExpenseForm />
          </div>
          <div className="lg:col-span-2">
            <DataList
              title="Recent Expenses"
              items={expenseTransactions}
              renderItem={(transaction, onDelete) => (
                <TransactionItem 
                  transaction={transaction} 
                  onDelete={onDelete}
                />
              )}
              onDelete={deleteExpense}
              emptyMessage="No expenses yet. Add your first expense to get started."
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Income Tab Component
function IncomeTab() {
  const incomeStore = useIncomeStore();
  const { deleteIncome } = incomeStore;
  
  // Get derived incomes from ledger
  const incomes = incomeStore._deriveIncomesFromLedger();
  
  const incomeTransactions: Transaction[] = incomes.map(income => ({
    id: income.id,
    description: income.source,
    amount: income.amount,
    currency: income.currency,
    date: income.date,
    type: 'income' as const,
    category: income.frequency,
    frequency: income.frequency,
    fundingAccountId: income.depositAccountId,
    fundingAccountName: income.depositAccountName,
    fundingAccountNature: income.depositAccountNature
  }));
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <IncomeForm />
          </div>
          <div className="lg:col-span-2">
            <DataList
              title="Recent Income"
              items={incomeTransactions}
              renderItem={(transaction, onDelete) => (
                <TransactionItem 
                  transaction={transaction} 
                  onDelete={onDelete}
                />
              )}
              onDelete={deleteIncome}
              emptyMessage="No income yet. Add your first income source to get started."
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  const { user, loading, checkUser } = useAuthStore();
  const { initializeDefaultAccounts } = useLedgerStore();
  const { isDark, toggleTheme, initializeTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'income' | 'networth' | 'accounts'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            <ExpensesTab />
          )}

          {activeTab === 'income' && (
            <IncomeTab />
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
