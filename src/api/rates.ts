// Exchange Rates API
import { apiClient } from './client';
import type { ExchangeRate, ConvertResult, SupportedCurrencies } from './types';

export interface RatesParams {
  date?: string;
  from?: string;
  to?: string;
}

export const ratesApi = {
  /**
   * Get current exchange rates
   */
  async getRates(params?: RatesParams): Promise<{ rates: ExchangeRate[]; base_currency: string; date: string }> {
    return apiClient.get('/rates', params);
  },

  /**
   * Refresh rates from external APIs
   */
  async refresh(): Promise<{ rates: ExchangeRate[]; updated_at: string }> {
    return apiClient.post('/rates/refresh');
  },

  /**
   * Convert amount between currencies
   */
  async convert(amount: number, from: string, to: string): Promise<ConvertResult> {
    return apiClient.get<ConvertResult>('/rates/convert', { amount, from, to });
  },

  /**
   * Get supported currencies
   */
  async getCurrencies(): Promise<SupportedCurrencies> {
    return apiClient.get<SupportedCurrencies>('/rates/currencies');
  },
};
