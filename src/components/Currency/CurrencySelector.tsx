import React, { useEffect } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';
import { RefreshCw } from 'lucide-react';

export const CurrencySelector: React.FC = () => {
  const [isChangingCurrency, setIsChangingCurrency] = React.useState(false);
  const { 
    baseCurrency, 
    currencies, 
    setBaseCurrency, 
    fetchExchangeRates,
    forceRefreshRates, 
    loading,
    error,
    lastUpdated 
  } = useCurrencyStore();

  useEffect(() => {
    // Fetch exchange rates on component mount
    console.log('🚀 CurrencySelector mounted, fetching initial rates...');
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  const handleCurrencyChange = async (newCurrency: string) => {
    if (isChangingCurrency || newCurrency === baseCurrency) return;
    
    setIsChangingCurrency(true);
    try {
      await setBaseCurrency(newCurrency);
    } catch (error) {
      console.error('Failed to change currency:', error);
    } finally {
      setIsChangingCurrency(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = Date.now();
    const diff = now - lastUpdated;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="h-7 lg:h-8 flex items-center gap-1.5 px-2 lg:px-3 bg-blue-200 dark:bg-gray-700 rounded-lg hover:bg-blue-300 dark:hover:bg-gray-600 transition-colors">
      <select
        value={baseCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        disabled={isChangingCurrency || loading}
        className="text-sm font-medium border-none bg-transparent text-gray-900 dark:text-white 
                 focus:outline-none focus:ring-0 cursor-pointer appearance-none disabled:opacity-50"
        title={error || `Last updated: ${formatLastUpdated()}`}
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code} className="bg-white dark:bg-gray-800">
            {currency.code}
          </option>
        ))}
      </select>
      
      <button
        onClick={() => forceRefreshRates()}
        disabled={loading}
        className="p-0.5 hover:bg-blue-400 dark:hover:bg-gray-500 rounded transition-all"
        title="Refresh exchange rates"
      >
        <RefreshCw className={`w-3 h-3 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : 'hover:text-gray-800 dark:hover:text-gray-200'}`} />
      </button>
      
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400" title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
};