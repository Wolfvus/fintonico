import { FxMissingError } from '../domain/errors';
import { FxRate, FxRateInput, FxRateSchema } from '../domain/types';

const key = (base: string, quote: string, asOf: string) =>
  `${base.toUpperCase()}::${quote.toUpperCase()}::${asOf}`;

export interface GetRateInput {
  base: string;
  quote: string;
  asOf: Date | string;
}

export interface EnsureRateInput extends FxRateInput {}

export class FxTable {
  private readonly rates = new Map<string, FxRate>();

  ensure(input: EnsureRateInput): FxRate {
    const rate = FxRateSchema.parse(input);
    this.rates.set(key(rate.base, rate.quote, rate.asOf), rate);
    return rate;
  }

  getRate({ base, quote, asOf }: GetRateInput): number {
    const normalizedBase = base.toUpperCase();
    const normalizedQuote = quote.toUpperCase();

    if (normalizedBase === normalizedQuote) {
      return 1;
    }

    const isoAsOf = new Date(asOf).toISOString();
    const rate = this.rates.get(key(normalizedBase, normalizedQuote, isoAsOf));
    if (!rate) {
      throw new FxMissingError(
        `Missing FX rate for ${normalizedBase}/${normalizedQuote} @ ${isoAsOf}`,
      );
    }
    return rate.rate;
  }
}

export const createFxTable = () => new FxTable();
