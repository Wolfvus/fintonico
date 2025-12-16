// Money value object with minor units storage and conversion helpers
import { getCurrencyConfig, type CurrencyConfig } from '../config/currencies';

export class Money {
  private readonly amountMinor: number; // Always stored as integer in minor units
  private readonly currency: string;

  constructor(amountMinor: number, currency: string) {
    if (!Number.isInteger(amountMinor)) {
      throw new Error('Amount minor must be an integer');
    }
    this.amountMinor = amountMinor;
    this.currency = currency.toUpperCase();
  }

  // Factory methods for creating Money from different inputs
  static fromMajorUnits(amount: number, currency: string): Money {
    const config = getCurrencyConfig(currency);
    const amountMinor = Math.round(amount * Math.pow(10, config.minorUnitScale));
    return new Money(amountMinor, currency);
  }

  static fromMinorUnits(amountMinor: number, currency: string): Money {
    return new Money(amountMinor, currency);
  }

  // Getters
  getAmountMinor(): number {
    return this.amountMinor;
  }

  getCurrency(): string {
    return this.currency;
  }

  getAmountMajor(): number {
    const config = getCurrencyConfig(this.currency);
    return this.amountMinor / Math.pow(10, config.minorUnitScale);
  }

  // Arithmetic operations
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot add different currencies: ${this.currency} and ${other.currency}`);
    }
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot subtract different currencies: ${this.currency} and ${other.currency}`);
    }
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amountMinor * factor), this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(Math.round(this.amountMinor / divisor), this.currency);
  }

  // Comparison methods
  equals(other: Money): boolean {
    return this.amountMinor === other.amountMinor && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot compare different currencies: ${this.currency} and ${other.currency}`);
    }
    return this.amountMinor > other.amountMinor;
  }

  isLessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot compare different currencies: ${this.currency} and ${other.currency}`);
    }
    return this.amountMinor < other.amountMinor;
  }

  isZero(): boolean {
    return this.amountMinor === 0;
  }

  isPositive(): boolean {
    return this.amountMinor > 0;
  }

  isNegative(): boolean {
    return this.amountMinor < 0;
  }

  // Convenience methods for compatibility
  toMajorUnits(): number {
    return this.getAmountMajor();
  }

  toMinorUnits(): number {
    return this.getAmountMinor();
  }

  abs(): Money {
    return new Money(Math.abs(this.amountMinor), this.currency);
  }

  // Formatting methods
  format(options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    precision?: number;
  }): string {
    const config = getCurrencyConfig(this.currency);
    const opts = {
      showSymbol: true,
      showCode: false,
      precision: config.minorUnitScale,
      ...options
    };

    const amount = this.getAmountMajor();
    const formattedAmount = this.formatNumber(amount, opts.precision, config);
    
    let result = formattedAmount;
    
    if (opts.showSymbol) {
      if (config.symbolPosition === 'before') {
        result = `${config.symbol}${result}`;
      } else {
        result = `${result} ${config.symbol}`;
      }
    }
    
    if (opts.showCode) {
      result = `${result} ${config.code}`;
    }
    
    return result;
  }

  private formatNumber(amount: number, precision: number, config: CurrencyConfig): string {
    const fixed = amount.toFixed(precision);
    const [integerPart, decimalPart] = fixed.split('.');
    
    // Add thousands separator
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    
    if (precision === 0 || !decimalPart) {
      return formattedInteger;
    }
    
    return `${formattedInteger}${config.decimalSeparator}${decimalPart}`;
  }

  // Serialization
  toJSON(): { amountMinor: number; currency: string } {
    return {
      amountMinor: this.amountMinor,
      currency: this.currency
    };
  }

  static fromJSON(data: { amountMinor: number; currency: string }): Money {
    return new Money(data.amountMinor, data.currency);
  }

  toString(): string {
    return this.format();
  }
}