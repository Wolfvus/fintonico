import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { checkAndGenerateRecurring } from './utils/recurringUtils';
import { AuthForm } from './components/Auth/AuthForm';
import { ExpenseForm } from './components/ExpenseForm/ExpenseForm';
import { IncomeForm } from './components/IncomeForm/IncomeForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AccountsPage } from './components/Accounts/AccountsPage';
import { AssetsPage } from './components/Assets/AssetsPage';
import { LiabilitiesPage } from './components/Liabilities/LiabilitiesPage';
import { TransactionList } from './components/Shared/TransactionList';
import { CurrencySelector } from './components/Currency/CurrencySelector';
import { useExpenseStore } from './stores/expenseStore';
import { Navigation } from './components/Navigation/Navigation';
import { useIncomeStore } from './stores/incomeStore';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

// Expenses Tab Component
function ExpensesTab() {
  const { expenses, deleteExpense } = useExpenseStore();
  
  const expenseTransactions = expenses.map(expense => ({
    id: expense.id,
    description: expense.what,
    amount: expense.amount,
    currency: expense.currency,
    date: expense.date,
    type: 'expense' as const,
    category: expense.rating,
    rating: expense.rating,
    recurring: expense.recurring
  }));
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <ExpenseForm />
          </div>
          <div className="lg:col-span-2">
            <TransactionList
              title="Recent Expenses"
              transactions={expenseTransactions}
              onDelete={deleteExpense}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Income Tab Component
function IncomeTab() {
  const { incomes, deleteIncome } = useIncomeStore();
  
  const incomeTransactions = incomes.map(income => ({
    id: income.id,
    description: income.source,
    amount: income.amount,
    currency: income.currency,
    date: income.date,
    type: 'income' as const,
    category: income.frequency,
    frequency: income.frequency
  }));
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1">
            <IncomeForm />
          </div>
          <div className="lg:col-span-2">
            <TransactionList
              title="Recent Income"
              transactions={incomeTransactions}
              onDelete={deleteIncome}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  const { user, loading, checkUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'income' | 'assets' | 'liabilities' | 'networth'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fintonico-theme');
    return saved !== 'light'; // Default to dark theme unless explicitly set to light
  });

  useEffect(() => {
    checkUser();
    // Check and generate recurring transactions on app load
    checkAndGenerateRecurring();
  }, [checkUser]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fintonico-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fintonico-theme', 'light');
    }
  }, [isDark]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin border-green-500"></div>
          <span className="text-gray-900 dark:text-white">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
      <Navigation 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
        onLogoClick={() => setActiveTab('dashboard')}
        onDateClick={() => setActiveTab('dashboard')}
      />
      
      {/* Desktop Top Bar */}
      <div className="hidden lg:block fixed top-0 left-16 right-0 z-30 bg-blue-100 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">FINTONICO</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">• The Ultimate Personal Finance Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="h-8 px-3 flex items-center bg-blue-200 dark:bg-gray-700 rounded-lg hover:bg-blue-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </button>
            <div className="h-6 w-px bg-blue-300 dark:bg-gray-600"></div>
            <CurrencySelector />
          </div>
        </div>
      </div>


      <main className="pt-20 lg:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:pl-20">
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

          {activeTab === 'assets' && (
            <ErrorBoundary>
              <AssetsPage />
            </ErrorBoundary>
          )}

          {activeTab === 'liabilities' && (
            <ErrorBoundary>
              <LiabilitiesPage />
            </ErrorBoundary>
          )}

          {activeTab === 'networth' && (
            <ErrorBoundary>
              <AccountsPage />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}


export default App;