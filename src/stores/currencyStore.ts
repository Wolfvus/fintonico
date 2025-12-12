import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Money } from '../domain/money';
import { getCurrencyConfig, CURRENCY_REGISTRY } from '../config/currencies';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRate {
  [key: string]: number;
}

interface CurrencyState {
  baseCurrency: string;
  currencies: Currency[];
  enabledCurrencies: string[];
  exchangeRates: ExchangeRate;
  lastUpdated: number | null;
  loading: boolean;
  error: string | null;
}

interface CurrencyActions {
  setBaseCurrency: (currency: string) => Promise<void>;
  setEnabledCurrencies: (currencies: string[]) => void;
  toggleCurrency: (currency: string) => void;
  resetEnabledCurrencies: () => void;
  fetchExchangeRates: () => Promise<void>;
  forceRefreshRates: () => Promise<void>;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatAmount: (amount: number, currency?: string) => string;
  getCurrencySymbol: (currency: string) => string;
  getVisibleCurrencies: () => string[];
}

// Get supported currencies from registry
export const SUPPORTED_CURRENCIES: Currency[] = Object.values(CURRENCY_REGISTRY).map(config => ({
  code: config.code,
  name: config.name,
  symbol: config.symbol
}));

const DEFAULT_ENABLED = SUPPORTED_CURRENCIES.map(currency => currency.code);

const ensureEnabledSet = (codes: string[], baseCurrency: string) => {
  const unique = Array.from(new Set(codes.length ? codes : DEFAULT_ENABLED));
  if (!unique.includes(baseCurrency)) {
    unique.unshift(baseCurrency);
  }
  return unique;
};

// Free exchange rate API - using Fawazahmed0 Exchange API which is completely free and reliable
// Documentation: https://github.com/fawazahmed0/exchange-api
const EXCHANGE_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/';

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  persist(
    (set, get) => ({
      baseCurrency: 'MXN',
      currencies: SUPPORTED_CURRENCIES,
      enabledCurrencies: ensureEnabledSet(DEFAULT_ENABLED, 'MXN'),
      exchangeRates: { MXN: 1 },
      lastUpdated: null,
      loading: false,
      error: null,

      setBaseCurrency: async (currency: string) => {
        set(state => ({
          baseCurrency: currency,
          enabledCurrencies: ensureEnabledSet(state.enabledCurrencies, currency)
        }));
        // Force refresh rates when base currency changes
        await get().forceRefreshRates();
      },

      setEnabledCurrencies: (currencies: string[]) => {
        const { baseCurrency } = get();
        set({
          enabledCurrencies: ensureEnabledSet(currencies, baseCurrency)
        });
      },

      toggleCurrency: (currency: string) => {
        const { baseCurrency, enabledCurrencies } = get();
        if (currency === baseCurrency) {
          console.warn('Base currency cannot be disabled.');
          return;
        }
        const isEnabled = enabledCurrencies.includes(currency);
        const next = isEnabled
          ? enabledCurrencies.filter(code => code !== currency)
          : [...enabledCurrencies, currency];
        const ensured = ensureEnabledSet(next, baseCurrency);
        if (ensured.length === 1 && ensured[0] === baseCurrency && isEnabled) {
          console.warn('At least one additional currency should remain visible.');
        }
        set({ enabledCurrencies: ensured });
      },

      resetEnabledCurrencies: () => {
        const { baseCurrency } = get();
        set({
          enabledCurrencies: ensureEnabledSet(DEFAULT_ENABLED, baseCurrency)
        });
      },

      forceRefreshRates: async () => {
        // Force refresh by clearing lastUpdated
        set({ lastUpdated: null });
        await get().fetchExchangeRates();
      },

      fetchExchangeRates: async () => {
        const { baseCurrency, lastUpdated } = get();
        
        // Check if we need to update (cache for 5 minutes for more frequent updates)
        const now = Date.now();
        if (lastUpdated && now - lastUpdated < 5 * 60 * 1000) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const baseCurrencyLower = baseCurrency.toLowerCase();
          const apiUrl = `${EXCHANGE_API_URL}${baseCurrencyLower}.json`;
          console.log('🔄 Fetching exchange rates from API:', apiUrl);
          
          const response = await fetch(apiUrl);
          console.log('📡 API Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('💱 Exchange rates received:', data);
          
          // Fawazahmed0 API returns rates in format: { date: "2024-01-01", mxn: { usd: 0.058, eur: 0.053, ... } }
          const rates = data[baseCurrencyLower];
          
          if (rates) {
            // Convert to uppercase keys and add base currency
            const formattedRates: ExchangeRate = { [baseCurrency]: 1 };
            
            // Add only the currencies we support
            SUPPORTED_CURRENCIES.forEach(currency => {
              const code = currency.code.toLowerCase();
              if (rates[code] !== undefined) {
                let rate = rates[code];
                
                // The API returns incorrect crypto rates - override with realistic values
                if (currency.code === 'BTC' && baseCurrency === 'MXN') {
                  rate = 0.00000060; // 1 MXN ≈ 0.00000060 BTC
                } else if (currency.code === 'ETH' && baseCurrency === 'MXN') {
                  rate = 0.000022;   // 1 MXN ≈ 0.000022 ETH
                } else if (currency.code === 'BTC' && baseCurrency === 'USD') {
                  rate = 0.0000105;  // 1 USD ≈ 0.0000105 BTC
                } else if (currency.code === 'ETH' && baseCurrency === 'USD') {
                  rate = 0.000385;   // 1 USD ≈ 0.000385 ETH
                } else if (currency.code === 'BTC' && baseCurrency === 'EUR') {
                  rate = 0.0000116;  // 1 EUR ≈ 0.0000116 BTC
                } else if (currency.code === 'ETH' && baseCurrency === 'EUR') {
                  rate = 0.000423;   // 1 EUR ≈ 0.000423 ETH
                }
                
                formattedRates[currency.code] = rate;
              }
            });
            
            set({
              exchangeRates: formattedRates,
              lastUpdated: now,
              loading: false,
              error: null,
            });
            console.log('✅ Exchange rates updated successfully:', formattedRates);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (error) {
          console.error('❌ Failed to fetch exchange rates:', error);
          set({
            loading: false,
            error: 'Failed to fetch exchange rates. Using cached rates.',
          });
          
          // Fallback to approximate rates if API fails
          if (Object.keys(get().exchangeRates).length === 1) {
            // Approximate rates based on current market values (August 2025)
            const fallbackRates: ExchangeRate = { [baseCurrency]: 1 };
            
            // Calculate realistic fallback rates based on approximate values:
            // 1 BTC ≈ $95,000, 1 ETH ≈ $2,600, 1 USD ≈ 17.5 MXN, 1 EUR ≈ 1.1 USD
            if (baseCurrency === 'MXN') {
              fallbackRates.USD = 0.057;      // 1 MXN ≈ 0.057 USD
              fallbackRates.EUR = 0.052;      // 1 MXN ≈ 0.052 EUR  
              fallbackRates.BTC = 0.00000060; // 1 MXN ≈ 0.00000060 BTC
              fallbackRates.ETH = 0.000022;   // 1 MXN ≈ 0.000022 ETH
            } else if (baseCurrency === 'USD') {
              fallbackRates.MXN = 17.5;       // 1 USD ≈ 17.5 MXN
              fallbackRates.EUR = 0.91;       // 1 USD ≈ 0.91 EUR
              fallbackRates.BTC = 0.0000105;  // 1 USD ≈ 0.0000105 BTC (1 BTC ≈ $95,000)
              fallbackRates.ETH = 0.000385;   // 1 USD ≈ 0.000385 ETH (1 ETH ≈ $2,600)
            } else {
              // Add basic rates for other base currencies
              fallbackRates.USD = 0.057;
              fallbackRates.MXN = 17.5;
              fallbackRates.EUR = 0.91;
              fallbackRates.BTC = 0.0000105;
              fallbackRates.ETH = 0.000385;
            }
            
            set({ exchangeRates: fallbackRates });
          }
        }
      },

      convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => {
        const { exchangeRates, baseCurrency } = get();
        
        if (!amount || fromCurrency === toCurrency) return amount;
        
        
        // If we're converting from the base currency
        if (fromCurrency === baseCurrency) {
          const rate = exchangeRates[toCurrency];
          const converted = rate ? amount * rate : amount;
          return converted;
        }
        
        // If we're converting to the base currency
        if (toCurrency === baseCurrency) {
          const rate = exchangeRates[fromCurrency];
          const converted = rate ? amount / rate : amount;
          return converted;
        }
        
        // Converting between two non-base currencies
        // First convert from source to base, then from base to target
        const fromRate = exchangeRates[fromCurrency];
        const toRate = exchangeRates[toCurrency];
        
        if (fromRate && toRate) {
          const baseAmount = amount / fromRate;
          const converted = baseAmount * toRate;
          return converted;
        }
        
        return amount; // Return original if conversion not possible
      },

      formatAmount: (amount: number, currency?: string) => {
        const { baseCurrency } = get();
        const currencyCode = currency || baseCurrency;

        // Use Money class for proper formatting
        const money = Money.fromMajorUnits(amount, currencyCode);
        return money.format();
      },

      getCurrencySymbol: (currency: string) => {
        try {
          const config = getCurrencyConfig(currency);
          return config.symbol;
        } catch {
          // Fallback for unsupported currencies
          const currencyObj = SUPPORTED_CURRENCIES.find(c => c.code === currency);
          return currencyObj?.symbol || '$';
        }
      },

      getVisibleCurrencies: () => {
        const { baseCurrency, enabledCurrencies } = get();
        const list = ensureEnabledSet(enabledCurrencies, baseCurrency);
        return Array.from(new Set([baseCurrency, ...list]));
      }
    }),
    {
      name: 'fintonico-currency',
      partialize: (state) => ({
        baseCurrency: state.baseCurrency,
        exchangeRates: state.exchangeRates,
        lastUpdated: state.lastUpdated,
        enabledCurrencies: state.enabledCurrencies,
      }),
    }
  )
);
