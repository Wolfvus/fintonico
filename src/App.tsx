import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { formatDate } from './utils/dateFormat';
import { AuthForm } from './components/Auth/AuthForm';
import { ExpenseForm } from './components/ExpenseForm/ExpenseForm';
import { IncomeForm } from './components/IncomeForm/IncomeForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { FinancialAnalysis } from './components/Analysis/FinancialAnalysis';
import { CurrencySelector } from './components/Currency/CurrencySelector';
import { LogOut, Moon, Sun, Receipt, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { useIncomeStore } from './stores/incomeStore';
import { useCurrencyStore } from './stores/currencyStore';

function App() {
  const { user, loading, checkUser, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'expenses' | 'income' | 'analysis' | 'networth'>('expenses');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fintonico-theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    checkUser();
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

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: Receipt, color: 'text-red-600 dark:text-red-400' },
    { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
    { id: 'analysis', label: 'Analysis', icon: PieChart, color: 'text-green-600 dark:text-green-400' },
    { id: 'networth', label: 'Net Worth', icon: Wallet, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b-3 border-green-500 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">FINTONICO</h1>
              <span className="text-xs font-mono hidden sm:inline text-gray-600 dark:text-gray-400">
                Financial Tracker
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <CurrencySelector />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block truncate max-w-32">
                {user.email}
              </span>
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all
                         border border-green-500 text-green-600 dark:text-green-400
                         hover:bg-green-500 hover:text-white text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm mb-4 sm:mb-6 sticky top-16 z-40">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-all relative whitespace-nowrap
                            ${isActive ? tab.color : 'text-gray-600 dark:text-gray-400'}
                            ${isActive ? 'border-b-3' : 'border-b-3 border-transparent'}
                            hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base`}
                  style={{ 
                    borderBottomColor: isActive ? 'currentColor' : 'transparent'
                  }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.substring(0, 4)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-4 sm:py-8 pb-8">
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1">
                <ExpenseForm />
              </div>
              <div className="xl:col-span-2">
                <Dashboard />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1">
                <IncomeForm />
              </div>
              <div className="xl:col-span-2">
                <IncomeList />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <FinancialAnalysis />
        )}

        {activeTab === 'networth' && (
          <NetWorthTracker />
        )}
      </main>
    </div>
  );
}

// Income List Component
function IncomeList() {
  const { incomes, deleteIncome } = useIncomeStore();
  const { formatAmount, baseCurrency, convertAmount, exchangeRates } = useCurrencyStore();
  
  // Force re-render when exchange rates change
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [exchangeRates, baseCurrency]);

  // Get investment yields from localStorage
  const getInvestmentYields = () => {
    const saved = localStorage.getItem('fintonico-assets');
    const assets = saved ? JSON.parse(saved) : [];
    return assets
      .filter((asset: any) => asset.type === 'investment' && asset.yield > 0)
      .map((asset: any) => ({
        id: `yield-${asset.id}`,
        source: `${asset.name} (Investment Yield)`,
        amount: (asset.value * asset.yield / 100) / 12, // Monthly yield
        currency: asset.currency,
        frequency: 'monthly',
        date: new Date().toISOString().split('T')[0],
        isYield: true
      }));
  };

  const investmentYields = getInvestmentYields();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Income Sources</h3>
      
      {incomes.length === 0 && investmentYields.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No income sources added yet
        </div>
      ) : (
        <div className="space-y-3">
          {/* Regular Income Sources */}
          {incomes.map((income) => (
            <div
              key={income.id}
              className="rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">{income.source}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 
                                   text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shrink-0">
                      {income.frequency}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono font-semibold text-green-600 dark:text-white">
                      {formatAmount(convertAmount(income.amount, income.currency, baseCurrency), baseCurrency)}
                    </span>
                    <span className="text-xs sm:text-sm">{formatDate(income.date)}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteIncome(income.id)}
                  className="p-2 rounded-lg transition-all text-red-600 dark:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-900/20 self-start shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Investment Yields */}
          {investmentYields.map((yield_income) => (
            <div
              key={yield_income.id}
              className="rounded-lg p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">{yield_income.source}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 
                                   text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shrink-0">
                      auto-calculated
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono font-semibold text-blue-600 dark:text-white">
                      {formatAmount(convertAmount(yield_income.amount, yield_income.currency, baseCurrency), baseCurrency)}
                    </span>
                    <span className="text-xs sm:text-sm">Monthly yield</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg text-blue-600 dark:text-blue-400 self-start shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
  const { formatAmount, currencies, baseCurrency, convertAmount, exchangeRates } = useCurrencyStore();
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

  const addAsset = () => {
    if (newAsset.name && newAsset.value) {
      setAssets([...assets, {
        id: crypto.randomUUID(),
        name: newAsset.name,
        value: parseFloat(newAsset.value),
        currency: newAsset.currency,
        type: newAsset.type,
        yield: newAsset.yield ? parseFloat(newAsset.yield) : undefined
      }]);
      setNewAsset({ name: '', value: '', currency: 'MXN', type: 'savings', yield: '' });
    }
  };

  const addLiability = () => {
    if (newLiability.name && newLiability.value) {
      setLiabilities([...liabilities, {
        id: crypto.randomUUID(),
        name: newLiability.name,
        value: parseFloat(newLiability.value),
        currency: newLiability.currency,
        type: newLiability.type,
        dueDate: newLiability.type === 'credit-card' ? newLiability.dueDate : undefined,
        isPaid: newLiability.type === 'credit-card' ? newLiability.isPaid : undefined
      }]);
      setNewLiability({ name: '', value: '', currency: 'MXN', type: 'loan', dueDate: '', isPaid: false });
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

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Assets</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-white">
            {formatAmount(totalAssets)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Liabilities</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-white">
            {formatAmount(totalLiabilities)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Worth</h3>
          <p className={`text-xl sm:text-2xl font-bold ${netWorth >= 0 ? 'text-green-600 dark:text-white' : 'text-red-600 dark:text-white'}`}>
            {formatAmount(netWorth)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assets</h3>
          
          <div className="space-y-3 mb-4">
            {assets.map((asset) => (
              <div key={asset.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                {editingAsset === asset.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      placeholder="Asset name"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={asset.value}
                        onChange={(e) => updateAsset(asset.id, { value: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                        placeholder="Value"
                      />
                      <select
                        value={asset.currency}
                        onChange={(e) => updateAsset(asset.id, { currency: e.target.value })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                        className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">({asset.type})</span>
                        {asset.type === 'investment' && asset.yield && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {asset.yield}% annual yield
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-green-600 dark:text-white">
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
              placeholder="Asset name"
              value={newAsset.name}
              onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-gray-300 dark:border-gray-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Value"
                value={newAsset.value}
                onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-gray-300 dark:border-gray-600"
              />
              <select
                value={newAsset.currency}
                onChange={(e) => setNewAsset({...newAsset, currency: e.target.value})}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-gray-300 dark:border-gray-600"
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
                       border-gray-300 dark:border-gray-600"
            >
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="property">Property</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </select>
            {newAsset.type === 'investment' && (
              <input
                type="number"
                placeholder="Annual yield % (e.g., 7.5)"
                value={newAsset.yield}
                onChange={(e) => setNewAsset({...newAsset, yield: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-gray-300 dark:border-gray-600"
                step="0.1"
              />
            )}
            <button
              onClick={addAsset}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
            >
              Add Asset
            </button>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Liabilities</h3>
          
          <div className="space-y-3 mb-4">
            {liabilities.map((liability) => (
              <div key={liability.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {editingLiability === liability.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={liability.name}
                      onChange={(e) => updateLiability(liability.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      placeholder="Liability name"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={liability.value}
                        onChange={(e) => updateLiability(liability.id, { value: parseFloat(e.target.value) || 0 })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                        placeholder="Value"
                      />
                      <select
                        value={liability.currency}
                        onChange={(e) => updateLiability(liability.id, { currency: e.target.value })}
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                        className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                          className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          placeholder="Payment due date"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                          <input
                            type="checkbox"
                            checked={liability.isPaid || false}
                            onChange={(e) => updateLiability(liability.id, { isPaid: e.target.checked })}
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded 
                                     focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 
                                     focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span>Payment completed</span>
                        </label>
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">({liability.type})</span>
                        {liability.type === 'credit-card' && liability.dueDate && (
                          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                            Due: {formatDate(liability.dueDate)}
                          </span>
                        )}
                        {liability.type === 'credit-card' && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            liability.isPaid 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {liability.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-red-600 dark:text-white">
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
              placeholder="Liability name"
              value={newLiability.name}
              onChange={(e) => setNewLiability({...newLiability, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-gray-300 dark:border-gray-600"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Value"
                value={newLiability.value}
                onChange={(e) => setNewLiability({...newLiability, value: e.target.value})}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-gray-300 dark:border-gray-600"
              />
              <select
                value={newLiability.currency}
                onChange={(e) => setNewLiability({...newLiability, currency: e.target.value})}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         border-gray-300 dark:border-gray-600"
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
                       border-gray-300 dark:border-gray-600"
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
                           border-gray-300 dark:border-gray-600"
                />
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={newLiability.isPaid}
                    onChange={(e) => setNewLiability({...newLiability, isPaid: e.target.checked})}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded 
                             focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 
                             focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span>Payment completed</span>
                </label>
              </div>
            )}
            <button
              onClick={addLiability}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
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