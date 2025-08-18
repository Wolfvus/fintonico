import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { formatCreditCardDueDate } from './utils/dateFormat';
import { checkAndGenerateRecurring } from './utils/recurringUtils';
import { AuthForm } from './components/Auth/AuthForm';
import { ExpenseForm } from './components/ExpenseForm/ExpenseForm';
import { IncomeForm } from './components/IncomeForm/IncomeForm';
import { NewDashboard } from './components/Dashboard/NewDashboard';
import { TransactionList } from './components/Shared/TransactionList';
import { CurrencySelector } from './components/Currency/CurrencySelector';
import { useExpenseStore } from './stores/expenseStore';
import { Navigation } from './components/Navigation/Navigation';
import { Filter } from 'lucide-react';
import { useIncomeStore } from './stores/incomeStore';
import { useCurrencyStore } from './stores/currencyStore';
import { ToggleSwitch } from './components/Shared/ToggleSwitch';
import { useCurrencyInput } from './hooks/useCurrencyInput';

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
  );
}

function App() {
  const { user, loading, checkUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'income' | 'networth'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fintonico-theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
            <NewDashboard />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab />
          )}

          {activeTab === 'income' && (
            <IncomeTab />
          )}

          {activeTab === 'networth' && (
            <NetWorthTracker />
          )}
        </div>
      </main>
    </div>
  );
}

// Net Worth Tracker Component
function NetWorthTracker() {
  // Load from localStorage on mount
  const [assets, setAssets] = useState<{id: string; name: string; value: number; currency: string; type: string; yield?: number}[]>(() => {
    const saved = localStorage.getItem('fintonico-assets');
    return saved ? JSON.parse(saved) : [];
  });
  const [liabilities, setLiabilities] = useState<{id: string; name: string; value: number; currency: string; type: string; dueDate?: string; isPaid?: boolean}[]>(() => {
    const saved = localStorage.getItem('fintonico-liabilities');
    return saved ? JSON.parse(saved) : [];
  });
  const [newAsset, setNewAsset] = useState({ name: '', value: '', currency: 'MXN', type: 'savings', yield: '' });
  const [newLiability, setNewLiability] = useState({ name: '', value: '', currency: 'MXN', type: 'loan', dueDate: '', isPaid: false });
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editingLiability, setEditingLiability] = useState<string | null>(null);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [liabilityFilter, setLiabilityFilter] = useState<string>('all');
  const [assetSortBy, setAssetSortBy] = useState<'amount' | 'type'>('amount');
  const [liabilitySortBy, setLiabilitySortBy] = useState<'amount' | 'type'>('amount');
  const { formatAmount, currencies, baseCurrency, convertAmount } = useCurrencyStore();
  
  // Currency inputs
  const {
    amount: assetAmount,
    displayAmount: assetDisplayAmount,
    currency: assetCurrency,
    handleAmountChange: handleAssetAmountChange,
    handleCurrencyChange: handleAssetCurrencyChange,
    reset: resetAssetInput
  } = useCurrencyInput('MXN');
  
  const {
    amount: liabilityAmount,
    displayAmount: liabilityDisplayAmount,
    currency: liabilityCurrency,
    handleAmountChange: handleLiabilityAmountChange,
    handleCurrencyChange: handleLiabilityCurrencyChange,
    reset: resetLiabilityInput
  } = useCurrencyInput('MXN');
  // Save to localStorage whenever assets or liabilities change
  useEffect(() => {
    localStorage.setItem('fintonico-assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('fintonico-liabilities', JSON.stringify(liabilities));
  }, [liabilities]);

  const totalAssets = assets.reduce((sum, a) => sum + convertAmount(a.value, a.currency, baseCurrency), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + convertAmount(l.value, l.currency, baseCurrency), 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleYieldChange = (value: string) => {
    // Remove any existing % sign and keep only numbers and decimal point
    const cleanValue = value.replace(/%/g, '').replace(/[^\d.]/g, '');
    
    // Format with % if there's a value
    if (cleanValue && cleanValue !== '.') {
      setNewAsset({...newAsset, yield: cleanValue + '%'});
    } else {
      setNewAsset({...newAsset, yield: cleanValue});
    }
  };

  const addAsset = () => {
    if (newAsset.name.trim() && assetAmount && parseFloat(assetAmount) > 0) {
      const yieldValue = newAsset.yield ? parseFloat(newAsset.yield.replace('%', '')) : undefined;
      setAssets([...assets, {
        id: crypto.randomUUID(),
        name: newAsset.name.trim(),
        value: parseFloat(assetAmount),
        currency: assetCurrency,
        type: newAsset.type,
        yield: yieldValue
      }]);
      setNewAsset({ name: '', value: '', currency: 'MXN', type: 'savings', yield: '' });
      resetAssetInput();
    }
  };

  const addLiability = () => {
    if (newLiability.name.trim() && liabilityAmount && parseFloat(liabilityAmount) > 0) {
      setLiabilities([...liabilities, {
        id: crypto.randomUUID(),
        name: newLiability.name.trim(),
        value: parseFloat(liabilityAmount),
        currency: liabilityCurrency,
        type: newLiability.type,
        dueDate: newLiability.type === 'credit-card' ? newLiability.dueDate : undefined,
        isPaid: newLiability.type === 'credit-card' ? newLiability.isPaid : undefined
      }]);
      setNewLiability({ name: '', value: '', currency: 'MXN', type: 'loan', dueDate: '', isPaid: false });
      resetLiabilityInput();
    }
  };

  const updateAsset = (id: string, updates: Partial<{name: string; value: number; currency: string; type: string; yield: number}>) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, ...updates } : asset
    ));
  };

  const updateLiability = (id: string, updates: Partial<{name: string; value: number; currency: string; type: string; dueDate: string; isPaid: boolean}>) => {
    setLiabilities(liabilities.map(liability => 
      liability.id === id ? { ...liability, ...updates } : liability
    ));
  };

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const deleteLiability = (id: string) => {
    setLiabilities(liabilities.filter(liability => liability.id !== id));
  };

  // Filter and sort assets
  const filteredAssets = assets.filter(asset => 
    assetFilter === 'all' || asset.type === assetFilter
  ).sort((a, b) => {
    if (assetSortBy === 'amount') {
      return convertAmount(b.value, b.currency, baseCurrency) - convertAmount(a.value, a.currency, baseCurrency);
    }
    return a.type.localeCompare(b.type);
  });

  // Filter and sort liabilities
  const filteredLiabilities = liabilities.filter(liability => 
    liabilityFilter === 'all' || liability.type === liabilityFilter
  ).sort((a, b) => {
    if (liabilitySortBy === 'amount') {
      return convertAmount(b.value, b.currency, baseCurrency) - convertAmount(a.value, a.currency, baseCurrency);
    }
    return a.type.localeCompare(b.type);
  });

  // Get type color mapping
  const getTypeColor = (type: string, isAsset: boolean) => {
    const assetColors: Record<string, string> = {
      'savings': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'investment': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'property': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'vehicle': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'other': 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    };
    
    const liabilityColors: Record<string, string> = {
      'loan': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'mortgage': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      'credit-card': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'other': 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    };
    
    return isAsset ? assetColors[type] || assetColors.other : liabilityColors[type] || liabilityColors.other;
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Assets</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatAmount(totalAssets)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Liabilities</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {formatAmount(totalLiabilities)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Worth</h3>
          <p className={`text-xl sm:text-2xl font-bold ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatAmount(netWorth)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assets</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="text-base sm:text-xs border border-blue-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="all">All Types</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
                <option value="property">Property</option>
                <option value="vehicle">Vehicle</option>
                <option value="other">Other</option>
              </select>
              <select
                value={assetSortBy}
                onChange={(e) => setAssetSortBy(e.target.value as 'amount' | 'type')}
                className="text-base sm:text-xs border border-blue-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="amount">By Amount</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                {editingAsset === asset.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                      placeholder="Asset name"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={asset.value}
                        onChange={(e) => updateAsset(asset.id, { value: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                        placeholder="Value"
                      />
                      <select
                        value={asset.currency}
                        onChange={(e) => updateAsset(asset.id, { currency: e.target.value })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code}
                          </option>
                        ))}
                      </select>
                      <select
                        value={asset.type}
                        onChange={(e) => updateAsset(asset.id, { type: e.target.value })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                      >
                        <option value="savings">Savings</option>
                        <option value="investment">Investment</option>
                        <option value="property">Property</option>
                        <option value="vehicle">Vehicle</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {asset.type === 'investment' && (
                      <input
                        type="number"
                        value={asset.yield || ''}
                        onChange={(e) => updateAsset(asset.id, { yield: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                        placeholder="Annual yield % (e.g., 7.5)"
                        step="0.1"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingAsset(null)}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate block">{asset.name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(asset.type, true)}`}>
                          {asset.type}
                        </span>
                        {asset.type === 'investment' && asset.yield && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {asset.yield}% annual yield
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {formatAmount(convertAmount(asset.value, asset.currency, baseCurrency), baseCurrency)}
                      </span>
                      <button
                        onClick={() => setEditingAsset(asset.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="e.g., My Savings Account"
              value={newAsset.name}
              onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-blue-300 dark:border-gray-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="$10,000.00"
                value={assetDisplayAmount}
                onChange={(e) => handleAssetAmountChange(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-blue-300 dark:border-gray-600"
              />
              <select
                value={assetCurrency}
                onChange={(e) => handleAssetCurrencyChange(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-blue-300 dark:border-gray-600"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={newAsset.type}
              onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-blue-300 dark:border-gray-600"
            >
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="property">Property</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </select>
            {newAsset.type === 'investment' && (
              <input
                type="text"
                placeholder="e.g., 8 (auto-formats to 8%)"
                value={newAsset.yield}
                onChange={(e) => handleYieldChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-blue-300 dark:border-gray-600"
              />
            )}
            <button
              onClick={addAsset}
              disabled={!newAsset.name.trim() || !assetAmount || parseFloat(assetAmount) <= 0}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            >
              Add Asset
            </button>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-blue-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Liabilities</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={liabilityFilter}
                onChange={(e) => setLiabilityFilter(e.target.value)}
                className="text-base sm:text-xs border border-blue-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="all">All Types</option>
                <option value="loan">Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="credit-card">Credit Card</option>
                <option value="other">Other</option>
              </select>
              <select
                value={liabilitySortBy}
                onChange={(e) => setLiabilitySortBy(e.target.value as 'amount' | 'type')}
                className="text-base sm:text-xs border border-blue-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="amount">By Amount</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {filteredLiabilities.map((liability) => (
              <div key={liability.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {editingLiability === liability.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={liability.name}
                      onChange={(e) => updateLiability(liability.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                      placeholder="Liability name"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={liability.value}
                        onChange={(e) => updateLiability(liability.id, { value: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                        placeholder="Value"
                      />
                      <select
                        value={liability.currency}
                        onChange={(e) => updateLiability(liability.id, { currency: e.target.value })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code}
                          </option>
                        ))}
                      </select>
                      <select
                        value={liability.type}
                        onChange={(e) => updateLiability(liability.id, { type: e.target.value })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                      >
                        <option value="loan">Loan</option>
                        <option value="mortgage">Mortgage</option>
                        <option value="credit-card">Credit Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {liability.type === 'credit-card' && (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={liability.dueDate || ''}
                          onChange={(e) => updateLiability(liability.id, { dueDate: e.target.value })}
                          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600"
                          placeholder="Payment due date"
                        />
                        <ToggleSwitch
                          checked={liability.isPaid || false}
                          onChange={(checked) => updateLiability(liability.id, { isPaid: checked })}
                          label="Payment completed"
                          size="sm"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingLiability(null)}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => deleteLiability(liability.id)}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate block">{liability.name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(liability.type, false)}`}>
                          {liability.type}
                        </span>
                        {liability.type === 'credit-card' && liability.dueDate && (
                          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                            Due: {formatCreditCardDueDate(liability.dueDate)}
                          </span>
                        )}
                        {liability.type === 'credit-card' && (
                          <ToggleSwitch
                            checked={liability.isPaid || false}
                            onChange={(checked) => updateLiability(liability.id, { isPaid: checked })}
                            label={liability.isPaid ? 'Paid' : 'Unpaid'}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                        {formatAmount(convertAmount(liability.value, liability.currency, baseCurrency), baseCurrency)}
                      </span>
                      <button
                        onClick={() => setEditingLiability(liability.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="e.g., Credit Card Balance"
              value={newLiability.name}
              onChange={(e) => setNewLiability({...newLiability, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-blue-300 dark:border-gray-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="$5,000.00"
                value={liabilityDisplayAmount}
                onChange={(e) => handleLiabilityAmountChange(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-blue-300 dark:border-gray-600"
              />
              <select
                value={liabilityCurrency}
                onChange={(e) => handleLiabilityCurrencyChange(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-blue-300 dark:border-gray-600"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={newLiability.type}
              onChange={(e) => setNewLiability({...newLiability, type: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-blue-300 dark:border-gray-600"
            >
              <option value="loan">Loan</option>
              <option value="mortgage">Mortgage</option>
              <option value="credit-card">Credit Card</option>
              <option value="other">Other</option>
            </select>
            {newLiability.type === 'credit-card' && (
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="Payment due date"
                  value={newLiability.dueDate}
                  onChange={(e) => setNewLiability({...newLiability, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           border-blue-300 dark:border-gray-600"
                />
                <ToggleSwitch
                  checked={newLiability.isPaid}
                  onChange={(checked) => setNewLiability({...newLiability, isPaid: checked})}
                  label="Payment completed"
                  size="sm"
                />
              </div>
            )}
            <button
              onClick={addLiability}
              disabled={!newLiability.name.trim() || !liabilityAmount || parseFloat(liabilityAmount) <= 0}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            >
              Add Liability
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;