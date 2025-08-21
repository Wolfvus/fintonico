// Repository interface for exchange rate operations (port/contract)
import { Money } from '../money';

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: Date;
  source: string; // API provider, manual entry, etc.
  rateType: 'spot' | 'eod' | 'month-end' | 'year-end'; // End-of-day, period-end rates
  effectiveTime?: Date; // Specific time for intraday rates
}

export interface RatesRepository {
  // Exchange rate operations
  saveRate(rate: ExchangeRate): Promise<void>;
  getRate(fromCurrency: string, toCurrency: string, date?: Date, rateType?: 'spot' | 'eod' | 'month-end' | 'year-end'): Promise<ExchangeRate | null>;
  getRates(baseCurrency: string, date?: Date, rateType?: 'spot' | 'eod' | 'month-end' | 'year-end'): Promise<ExchangeRate[]>;
  getAllRates(date?: Date, rateType?: 'spot' | 'eod' | 'month-end' | 'year-end'): Promise<ExchangeRate[]>;
  
  // End-of-day rate operations
  getEndOfDayRate(fromCurrency: string, toCurrency: string, date: Date): Promise<ExchangeRate | null>;
  getEndOfDayRates(baseCurrency: string, date: Date): Promise<ExchangeRate[]>;
  getMonthEndRate(fromCurrency: string, toCurrency: string, year: number, month: number): Promise<ExchangeRate | null>;
  getMonthEndRates(baseCurrency: string, year: number, month: number): Promise<ExchangeRate[]>;
  
  // Historical rates
  getHistoricalRates(fromCurrency: string, toCurrency: string, fromDate: Date, toDate: Date, rateType?: 'spot' | 'eod' | 'month-end' | 'year-end'): Promise<ExchangeRate[]>;
  
  // Rate calculations for transaction booking
  convertAmountAtTransactionDate(amount: Money, toCurrency: string, transactionDate: Date): Promise<{ convertedAmount: Money; rate: ExchangeRate }>;
  convertAmountAtEndOfDay(amount: Money, toCurrency: string, date: Date): Promise<{ convertedAmount: Money; rate: ExchangeRate }>;
  convertAmountAtMonthEnd(amount: Money, toCurrency: string, year: number, month: number): Promise<{ convertedAmount: Money; rate: ExchangeRate }>;
  
  // Legacy rate calculations (deprecated - use specific date methods)
  convertAmount(amount: Money, toCurrency: string, date?: Date): Promise<Money>;
  convertAmounts(amounts: Money[], toCurrency: string, date?: Date): Promise<Money[]>;
  
  // Bulk operations
  saveRates(rates: ExchangeRate[]): Promise<void>;
  updateRatesFromProvider(provider: string, baseCurrency: string, rateType?: 'spot' | 'eod'): Promise<ExchangeRate[]>;
  
  // Revaluation support
  calculateRevaluation(accountId: string, originalCurrency: string, baseCurrency: string, fromDate: Date, toDate: Date): Promise<Money>;
  getRevaluationRates(currencies: string[], baseCurrency: string, fromDate: Date, toDate: Date): Promise<ExchangeRate[]>;
}