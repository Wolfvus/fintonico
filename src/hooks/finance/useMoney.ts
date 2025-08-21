// Hook that demonstrates Money class usage for currency formatting and conversion
import { useMemo } from 'react';
import { Money } from '../../domain/money';
import { useCurrencyStore } from '../../stores/currencyStore';

interface UseMoneyResult {
  formatMoney: (amount: number, currency: string, options?: { 
    showSymbol?: boolean; 
    showCode?: boolean; 
    precision?: number;
  }) => string;
  convertMoney: (amount: number, fromCurrency: string, toCurrency: string) => Money;
  createMoney: (amount: number, currency: string) => Money;
  demonstratePrecision: (btcAmount: number, ethAmount: number) => {
    btc: string;
    eth: string;
    usd: string;
  };
}

export const useMoney = (): UseMoneyResult => {
  const { convertAmount } = useCurrencyStore();

  return useMemo(() => ({
    formatMoney: (amount: number, currency: string, options = {}) => {
      const money = Money.fromMajorUnits(amount, currency);
      return money.format(options);
    },

    convertMoney: (amount: number, fromCurrency: string, toCurrency: string) => {
      const convertedAmount = convertAmount(amount, fromCurrency, toCurrency);
      return Money.fromMajorUnits(convertedAmount, toCurrency);
    },

    createMoney: (amount: number, currency: string) => {
      return Money.fromMajorUnits(amount, currency);
    },

    demonstratePrecision: (btcAmount: number, ethAmount: number) => {
      const btc = Money.fromMajorUnits(btcAmount, 'BTC');
      const eth = Money.fromMajorUnits(ethAmount, 'ETH');
      const usd = Money.fromMajorUnits(1234.56, 'USD');
      
      return {
        btc: btc.format(), // 8 decimals
        eth: eth.format(), // 5 decimals  
        usd: usd.format()  // 2 decimals
      };
    }
  }), [convertAmount]);
};