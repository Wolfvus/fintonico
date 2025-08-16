import React, { useEffect } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';
import { DollarSign, RefreshCw } from 'lucide-react';

export const CurrencySelector: React.FC = () => {
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

  const handleCurrencyChange = (newCurrency: string) => {
    setBaseCurrency(newCurrency);
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
    <div className="flex items-center gap-2">
      <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <select
        value={baseCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        className="text-sm border-none bg-transparent text-gray-700 dark:text-gray-300 
                 focus:outline-none focus:ring-0 cursor-pointer hover:text-gray-900 dark:hover:text-white"
        title={error || `Last updated: ${formatLastUpdated()}`}
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code} className="bg-white dark:bg-gray-800">
            {currency.symbol}{currency.code}
          </option>
        ))}
      </select>
      
      <button
        onClick={() => forceRefreshRates()}
        disabled={loading}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
        title="Refresh exchange rates"
      >
        <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : 'hover:text-gray-600 dark:hover:text-gray-300'}`} />
      </button>
      
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400" title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
};