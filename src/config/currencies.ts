// Central currency registry with minor unit scales, symbols, and display rules
export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  minorUnitScale: number; // number of decimal places for minor units
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const CURRENCY_REGISTRY: Record<string, CurrencyConfig> = {
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    minorUnitScale: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnitScale: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    minorUnitScale: 2,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ','
  }
};

export const getCurrencyConfig = (currencyCode: string): CurrencyConfig => {
  const config = CURRENCY_REGISTRY[currencyCode.toUpperCase()];
  if (!config) {
    throw new Error(`Currency ${currencyCode} not found in registry`);
  }
  return config;
};

export const isCurrencySupported = (currencyCode: string): boolean => {
  return currencyCode.toUpperCase() in CURRENCY_REGISTRY;
};