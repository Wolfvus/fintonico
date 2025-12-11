import { supabaseAdmin } from '../lib/supabase';
import { BadRequestError } from '../middleware/errorHandler';

// Supported currencies
const SUPPORTED_CURRENCIES = ['MXN', 'USD', 'EUR', 'BTC', 'ETH'];
const BASE_CURRENCY = 'USD';

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
  cached: boolean;
}

export interface ConversionResult {
  from: {
    currency: string;
    amount: number;
  };
  to: {
    currency: string;
    amount: number;
  };
  rate: number;
  date: string;
}

export class RatesService {
  /**
   * Fetch fiat exchange rates from external API
   */
  private async fetchFiatRates(): Promise<Record<string, number>> {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`);

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.error('Error fetching fiat rates:', error);
      // Return fallback rates
      return {
        MXN: 17.5,
        USD: 1,
        EUR: 0.92,
      };
    }
  }

  /**
   * Fetch crypto exchange rates
   */
  private async fetchCryptoRates(): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch crypto rates');
      }

      const data = await response.json();
      return {
        BTC: 1 / data.bitcoin.usd,
        ETH: 1 / data.ethereum.usd,
      };
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
      // Return fallback rates
      return {
        BTC: 0.000025,
        ETH: 0.0004,
      };
    }
  }

  /**
   * Get cached rates from database
   */
  private async getCachedRates(date: string): Promise<Record<string, number> | null> {
    const { data, error } = await supabaseAdmin
      .from('exchange_rates')
      .select('*')
      .eq('from_currency', BASE_CURRENCY)
      .gte('fetched_at', `${date}T00:00:00`)
      .lte('fetched_at', `${date}T23:59:59`);

    if (error || !data || data.length === 0) {
      return null;
    }

    const rates: Record<string, number> = {};
    data.forEach((r) => {
      rates[r.to_currency] = r.rate;
    });

    return rates;
  }

  /**
   * Store rates in database
   */
  private async storeRates(rates: Record<string, number>): Promise<void> {
    const now = new Date().toISOString();

    const ratesToInsert = SUPPORTED_CURRENCIES
      .filter((currency) => currency !== BASE_CURRENCY && rates[currency])
      .map((currency) => ({
        from_currency: BASE_CURRENCY,
        to_currency: currency,
        rate: rates[currency],
        fetched_at: now,
      }));

    const { error } = await supabaseAdmin.from('exchange_rates').insert(ratesToInsert);

    if (error) {
      console.error('Error storing rates:', error);
    }
  }

  /**
   * Get current exchange rates
   */
  async getRates(options: { date?: string; from?: string; to?: string } = {}): Promise<ExchangeRates> {
    const { date, from, to } = options;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Try cached rates first
    const cachedRates = await this.getCachedRates(targetDate);

    if (cachedRates) {
      let filteredRates = cachedRates;

      if (from && to) {
        const fromRate = from === BASE_CURRENCY ? 1 : cachedRates[from];
        const toRate = to === BASE_CURRENCY ? 1 : cachedRates[to];
        if (fromRate && toRate) {
          filteredRates = { [to]: toRate / fromRate };
        }
      }

      return {
        base: from || BASE_CURRENCY,
        date: targetDate,
        rates: filteredRates,
        cached: true,
      };
    }

    // Fetch fresh rates
    const [fiatRates, cryptoRates] = await Promise.all([
      this.fetchFiatRates(),
      this.fetchCryptoRates(),
    ]);

    const allRates = { ...fiatRates, ...cryptoRates };

    // Filter to supported currencies
    const supportedRates: Record<string, number> = {};
    SUPPORTED_CURRENCIES.forEach((currency) => {
      if (allRates[currency]) {
        supportedRates[currency] = allRates[currency];
      }
    });

    // Filter if specific currencies requested
    let filteredRates = supportedRates;
    if (from && to) {
      const fromRate = from === BASE_CURRENCY ? 1 : supportedRates[from];
      const toRate = to === BASE_CURRENCY ? 1 : supportedRates[to];
      if (fromRate && toRate) {
        filteredRates = { [to]: toRate / fromRate };
      }
    }

    return {
      base: from || BASE_CURRENCY,
      date: targetDate,
      rates: filteredRates,
      cached: false,
    };
  }

  /**
   * Refresh rates from external APIs and store in database
   */
  async refreshRates(): Promise<ExchangeRates> {
    const [fiatRates, cryptoRates] = await Promise.all([
      this.fetchFiatRates(),
      this.fetchCryptoRates(),
    ]);

    const allRates = { ...fiatRates, ...cryptoRates };

    // Filter to supported currencies
    const supportedRates: Record<string, number> = {};
    SUPPORTED_CURRENCIES.forEach((currency) => {
      if (allRates[currency]) {
        supportedRates[currency] = allRates[currency];
      }
    });

    // Store in database
    await this.storeRates(supportedRates);

    const now = new Date().toISOString();

    return {
      base: BASE_CURRENCY,
      date: now.split('T')[0],
      rates: supportedRates,
      cached: false,
    };
  }

  /**
   * Convert amount between currencies
   */
  async convert(amount: number, from: string, to: string): Promise<ConversionResult> {
    if (isNaN(amount)) {
      throw new BadRequestError('Invalid amount');
    }

    const today = new Date().toISOString().split('T')[0];

    // Get rates
    let rates = await this.getCachedRates(today);

    if (!rates) {
      const [fiatRates, cryptoRates] = await Promise.all([
        this.fetchFiatRates(),
        this.fetchCryptoRates(),
      ]);
      rates = { ...fiatRates, ...cryptoRates };
    }

    // Add base currency rate
    rates[BASE_CURRENCY] = 1;

    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) {
      throw new BadRequestError(`Unsupported currency pair: ${from}/${to}`);
    }

    // Convert: amount in FROM -> USD -> TO
    const amountInUsd = amount / fromRate;
    const convertedAmount = amountInUsd * toRate;

    return {
      from: {
        currency: from,
        amount: amount,
      },
      to: {
        currency: to,
        amount: convertedAmount,
      },
      rate: toRate / fromRate,
      date: today,
    };
  }

  /**
   * Get rate for a specific currency pair
   */
  async getRate(from: string, to: string, date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    let rates = await this.getCachedRates(targetDate);

    if (!rates) {
      const [fiatRates, cryptoRates] = await Promise.all([
        this.fetchFiatRates(),
        this.fetchCryptoRates(),
      ]);
      rates = { ...fiatRates, ...cryptoRates };
    }

    rates[BASE_CURRENCY] = 1;

    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) {
      throw new BadRequestError(`Unsupported currency pair: ${from}/${to}`);
    }

    return toRate / fromRate;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }

  /**
   * Get base currency
   */
  getBaseCurrency(): string {
    return BASE_CURRENCY;
  }
}

export const ratesService = new RatesService();
