import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { AuthForm } from './components/Auth/AuthForm';
import { ExpenseForm } from './components/ExpenseForm/ExpenseForm';
import { IncomeForm } from './components/IncomeForm/IncomeForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { FinancialAnalysis } from './components/Analysis/FinancialAnalysis';
import { LogOut, Moon, Sun, Receipt, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { useIncomeStore } from './stores/incomeStore';

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
          <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin border-teal-500"></div>
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
    { id: 'analysis', label: 'Analysis', icon: PieChart, color: 'text-teal-600 dark:text-teal-400' },
    { id: 'networth', label: 'Net Worth', icon: Wallet, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b-3 border-teal-500 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">FINTONICO</h1>
              <span className="text-xs font-mono hidden sm:inline text-gray-600 dark:text-gray-400">
                Financial Tracker
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
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
                         border border-teal-500 text-teal-600 dark:text-teal-400
                         hover:bg-teal-500 hover:text-white text-sm"
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
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Income Sources</h3>
      
      {incomes.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No income sources added yet
        </div>
      ) : (
        <div className="space-y-3">
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
                    <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                      ${income.amount.toFixed(2)}
                    </span>
                    <span className="text-xs sm:text-sm">{new Date(income.date).toLocaleDateString()}</span>
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
        </div>
      )}
    </div>
  );
}

// Net Worth Tracker Component
function NetWorthTracker() {
  const [assets, setAssets] = useState<{id: string; name: string; value: number; type: string}[]>([]);
  const [liabilities, setLiabilities] = useState<{id: string; name: string; value: number; type: string}[]>([]);
  const [newAsset, setNewAsset] = useState({ name: '', value: '', type: 'savings' });
  const [newLiability, setNewLiability] = useState({ name: '', value: '', type: 'loan' });

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const addAsset = () => {
    if (newAsset.name && newAsset.value) {
      setAssets([...assets, {
        id: crypto.randomUUID(),
        name: newAsset.name,
        value: parseFloat(newAsset.value),
        type: newAsset.type
      }]);
      setNewAsset({ name: '', value: '', type: 'savings' });
    }
  };

  const addLiability = () => {
    if (newLiability.name && newLiability.value) {
      setLiabilities([...liabilities, {
        id: crypto.randomUUID(),
        name: newLiability.name,
        value: parseFloat(newLiability.value),
        type: newLiability.type
      }]);
      setNewLiability({ name: '', value: '', type: 'loan' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Assets</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            ${totalAssets.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Liabilities</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
            ${totalLiabilities.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Worth</h3>
          <p className={`text-xl sm:text-2xl font-bold ${netWorth >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
            ${netWorth.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assets</h3>
          
          <div className="space-y-3 mb-4">
            {assets.map((asset) => (
              <div key={asset.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 dark:text-white truncate block">{asset.name}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">({asset.type})</span>
                </div>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400 ml-2">
                  ${asset.value.toLocaleString()}
                </span>
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
            <input
              type="number"
              placeholder="Value"
              value={newAsset.value}
              onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-gray-300 dark:border-gray-600"
            />
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
              <div key={liability.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 dark:text-white truncate block">{liability.name}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">({liability.type})</span>
                </div>
                <span className="font-mono font-semibold text-red-600 dark:text-red-400 ml-2">
                  ${liability.value.toLocaleString()}
                </span>
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
            <input
              type="number"
              placeholder="Value"
              value={newLiability.value}
              onChange={(e) => setNewLiability({...newLiability, value: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       border-gray-300 dark:border-gray-600"
            />
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