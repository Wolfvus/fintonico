import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  exchangeRates: ExchangeRate;
  lastUpdated: number | null;
  loading: boolean;
  error: string | null;
}

interface CurrencyActions {
  setBaseCurrency: (currency: string) => void;
  fetchExchangeRates: () => Promise<void>;
  forceRefreshRates: () => Promise<void>;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatAmount: (amount: number, currency?: string) => string;
  getCurrencySymbol: (currency: string) => string;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'USDT', name: 'Tether', symbol: '₮' },
  { code: 'USDC', name: 'USD Coin', symbol: '$' },
];

// Free exchange rate API - using Fawazahmed0 Exchange API which is completely free and reliable
// Documentation: https://github.com/fawazahmed0/exchange-api
const EXCHANGE_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/';

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  persist(
    (set, get) => ({
      baseCurrency: 'MXN',
      currencies: SUPPORTED_CURRENCIES,
      exchangeRates: { MXN: 1 },
      lastUpdated: null,
      loading: false,
      error: null,

      setBaseCurrency: (currency: string) => {
        set({ baseCurrency: currency });
        // Force refresh rates when base currency changes
        get().forceRefreshRates();
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
                formattedRates[currency.code] = rates[code];
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
            set({
              exchangeRates: {
                USD: baseCurrency === 'USD' ? 1 : 0.057,
                MXN: baseCurrency === 'MXN' ? 1 : 1.0,
                EUR: baseCurrency === 'EUR' ? 1 : 0.053,
                BTC: baseCurrency === 'BTC' ? 1 : 0.000001,
                ETH: baseCurrency === 'ETH' ? 1 : 0.00001,
                USDT: baseCurrency === 'USDT' ? 1 : 0.057,
                USDC: baseCurrency === 'USDC' ? 1 : 0.057,
              },
            });
          }
        }
      },

      convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => {
        const { exchangeRates, baseCurrency } = get();
        
        if (!amount || fromCurrency === toCurrency) return amount;
        
        console.log(`Converting ${amount} from ${fromCurrency} to ${toCurrency}`);
        console.log('Base currency:', baseCurrency);
        console.log('Exchange rates:', exchangeRates);
        
        // If we're converting from the base currency
        if (fromCurrency === baseCurrency) {
          const rate = exchangeRates[toCurrency];
          const converted = rate ? amount * rate : amount;
          console.log(`Direct conversion: ${amount} * ${rate} = ${converted}`);
          return converted;
        }
        
        // If we're converting to the base currency
        if (toCurrency === baseCurrency) {
          const rate = exchangeRates[fromCurrency];
          const converted = rate ? amount / rate : amount;
          console.log(`Inverse conversion: ${amount} / ${rate} = ${converted}`);
          return converted;
        }
        
        // Converting between two non-base currencies
        // First convert from source to base, then from base to target
        const fromRate = exchangeRates[fromCurrency];
        const toRate = exchangeRates[toCurrency];
        
        if (fromRate && toRate) {
          const baseAmount = amount / fromRate;
          const converted = baseAmount * toRate;
          console.log(`Cross conversion: ${amount} / ${fromRate} * ${toRate} = ${converted}`);
          return converted;
        }
        
        return amount; // Return original if conversion not possible
      },

      formatAmount: (amount: number, currency?: string) => {
        const { baseCurrency } = get();
        const currencyCode = currency || baseCurrency;
        const symbol = get().getCurrencySymbol(currencyCode);
        
        // Format with comma separators and 2 decimal places
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
        
        return `${symbol}${formatted}`;
      },

      getCurrencySymbol: (currency: string) => {
        const currencyObj = SUPPORTED_CURRENCIES.find(c => c.code === currency);
        return currencyObj?.symbol || '$';
      },
    }),
    {
      name: 'fintonico-currency',
      partialize: (state) => ({
        baseCurrency: state.baseCurrency,
        exchangeRates: state.exchangeRates,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);