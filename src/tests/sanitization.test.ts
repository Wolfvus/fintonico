import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeDescription,
  validateAmount,
  validateDate,
  validateCurrency,
  validateAccountType,
  validateAccountName,
  validateBalance,
  validatePercentage,
  validateDayOfMonth,
  VALID_CURRENCIES,
  VALID_ACCOUNT_TYPES,
  MAX_AMOUNT_VALUE,
} from '../utils/sanitization';

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('removes angle brackets to prevent XSS', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")/');
    expect(sanitizeText('Hello <b>world</b>')).toBe('Hello bworld/b');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeText('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  it('removes event handlers', () => {
    expect(sanitizeText('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeText('onmouseover=evil()')).toBe('evil()');
    expect(sanitizeText('ONCLICK=test')).toBe('test');
  });

  it('removes dangerous tags', () => {
    expect(sanitizeText('script')).toBe('');
    expect(sanitizeText('iframe content')).toBe(' content');
    expect(sanitizeText('object data')).toBe(' data');
    expect(sanitizeText('embed src')).toBe(' src');
  });

  it('limits length to 1000 characters', () => {
    const longString = 'a'.repeat(1500);
    expect(sanitizeText(longString).length).toBe(1000);
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
    expect(sanitizeText(123 as any)).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeText('Hello World 123!')).toBe('Hello World 123!');
    expect(sanitizeText('Café & Restaurant')).toBe('Café & Restaurant');
  });
});

describe('sanitizeDescription', () => {
  it('limits length to 30 characters', () => {
    const longString = 'a'.repeat(50);
    expect(sanitizeDescription(longString).length).toBe(30);
  });

  it('applies same XSS protection as sanitizeText', () => {
    expect(sanitizeDescription('<script>')).toBe('');
    expect(sanitizeDescription('onclick=x')).toBe('x');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeDescription(null as any)).toBe('');
  });
});

describe('validateAmount', () => {
  it('accepts valid number input', () => {
    const result = validateAmount(100);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(100);
  });

  it('accepts valid string input', () => {
    const result = validateAmount('100.50');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(100.5);
  });

  it('removes currency symbols and formatting', () => {
    expect(validateAmount('$1,234.56').sanitizedValue).toBe(1234.56);
    expect(validateAmount('$ 100').sanitizedValue).toBe(100);
  });

  it('rounds to 2 decimal places', () => {
    const result = validateAmount(100.456);
    expect(result.sanitizedValue).toBe(100.46);
  });

  it('rejects amounts below minimum (0.01)', () => {
    const result = validateAmount(0.001);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least');
  });

  it('rejects amounts above maximum (1 billion)', () => {
    const result = validateAmount(2000000000);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot exceed');
  });

  it('rejects invalid number format', () => {
    const result = validateAmount('not a number');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid number format');
  });

  it('rejects NaN', () => {
    const result = validateAmount(NaN);
    expect(result.isValid).toBe(false);
  });
});

describe('validateDate', () => {
  it('accepts valid YYYY-MM-DD format', () => {
    const result = validateDate('2025-01-15');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe('2025-01-15');
  });

  it('rejects empty input', () => {
    const result = validateDate('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Date is required');
  });

  it('rejects invalid format', () => {
    expect(validateDate('01-15-2025').isValid).toBe(false);
    expect(validateDate('2025/01/15').isValid).toBe(false);
    expect(validateDate('Jan 15, 2025').isValid).toBe(false);
  });

  it('rejects dates too far in the future (>10 years)', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 11);
    const dateStr = futureDate.toISOString().split('T')[0];

    const result = validateDate(dateStr);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('future');
  });

  it('rejects dates too far in the past (>100 years)', () => {
    const result = validateDate('1900-01-01');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('past');
  });

  it('rejects invalid date values', () => {
    const result = validateDate('2025-13-45');
    expect(result.isValid).toBe(false);
  });
});

describe('validateCurrency', () => {
  it('accepts all valid currencies', () => {
    VALID_CURRENCIES.forEach(currency => {
      const result = validateCurrency(currency);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(currency);
    });
  });

  it('includes BTC and ETH', () => {
    expect(validateCurrency('BTC').isValid).toBe(true);
    expect(validateCurrency('ETH').isValid).toBe(true);
  });

  it('rejects invalid currency codes', () => {
    const result = validateCurrency('XYZ');
    expect(result.isValid).toBe(false);
    expect(result.sanitizedValue).toBe('USD'); // Default fallback
    expect(result.error).toBe('Invalid currency code');
  });

  it('is case sensitive', () => {
    expect(validateCurrency('usd').isValid).toBe(false);
    expect(validateCurrency('Usd').isValid).toBe(false);
  });
});

describe('validateAccountType', () => {
  it('accepts all valid account types', () => {
    VALID_ACCOUNT_TYPES.forEach(type => {
      const result = validateAccountType(type);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(type);
    });
  });

  it('includes liability types', () => {
    expect(validateAccountType('loan').isValid).toBe(true);
    expect(validateAccountType('credit-card').isValid).toBe(true);
    expect(validateAccountType('mortgage').isValid).toBe(true);
  });

  it('rejects invalid account types', () => {
    const result = validateAccountType('invalid');
    expect(result.isValid).toBe(false);
    expect(result.sanitizedValue).toBe('other'); // Default fallback
  });
});

describe('validateAccountName', () => {
  it('accepts valid account names', () => {
    const result = validateAccountName('My Savings Account');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe('My Savings Account');
  });

  it('sanitizes XSS attempts', () => {
    const result = validateAccountName('<script>alert(1)</script>');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).not.toContain('<');
    expect(result.sanitizedValue).not.toContain('>');
  });

  it('limits length to 100 characters', () => {
    const longName = 'a'.repeat(150);
    const result = validateAccountName(longName);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue.length).toBe(100);
  });

  it('rejects empty input', () => {
    expect(validateAccountName('').isValid).toBe(false);
    expect(validateAccountName('   ').isValid).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(validateAccountName(null as any).isValid).toBe(false);
    expect(validateAccountName(undefined as any).isValid).toBe(false);
  });
});

describe('validateBalance', () => {
  it('accepts positive balances', () => {
    const result = validateBalance(5000);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(5000);
  });

  it('accepts negative balances (for liabilities)', () => {
    const result = validateBalance(-5000);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(-5000);
  });

  it('accepts zero balance', () => {
    const result = validateBalance(0);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(0);
  });

  it('accepts string input with formatting', () => {
    expect(validateBalance('$1,234.56').sanitizedValue).toBe(1234.56);
    expect(validateBalance('-$500').sanitizedValue).toBe(-500);
  });

  it('rounds to 2 decimal places', () => {
    expect(validateBalance(100.999).sanitizedValue).toBe(101);
    expect(validateBalance(-50.556).sanitizedValue).toBe(-50.56);
  });

  it('rejects amounts exceeding max (absolute value)', () => {
    expect(validateBalance(2000000000).isValid).toBe(false);
    expect(validateBalance(-2000000000).isValid).toBe(false);
  });

  it('rejects invalid input', () => {
    expect(validateBalance('not a number').isValid).toBe(false);
    expect(validateBalance(NaN).isValid).toBe(false);
  });
});

describe('validatePercentage', () => {
  it('accepts valid percentages (0-100)', () => {
    expect(validatePercentage(0).isValid).toBe(true);
    expect(validatePercentage(50).isValid).toBe(true);
    expect(validatePercentage(100).isValid).toBe(true);
  });

  it('accepts undefined (optional field)', () => {
    const result = validatePercentage(undefined);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(undefined);
  });

  it('rounds to 2 decimal places', () => {
    expect(validatePercentage(5.555).sanitizedValue).toBe(5.56);
  });

  it('rejects negative percentages', () => {
    expect(validatePercentage(-1).isValid).toBe(false);
  });

  it('rejects percentages over 100', () => {
    expect(validatePercentage(101).isValid).toBe(false);
  });

  it('rejects non-number input', () => {
    expect(validatePercentage('50' as any).isValid).toBe(false);
    expect(validatePercentage(NaN).isValid).toBe(false);
  });
});

describe('validateDayOfMonth', () => {
  it('accepts valid days (1-31)', () => {
    expect(validateDayOfMonth(1).isValid).toBe(true);
    expect(validateDayOfMonth(15).isValid).toBe(true);
    expect(validateDayOfMonth(31).isValid).toBe(true);
  });

  it('accepts undefined (optional field)', () => {
    const result = validateDayOfMonth(undefined);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(undefined);
  });

  it('rejects day 0', () => {
    expect(validateDayOfMonth(0).isValid).toBe(false);
  });

  it('rejects day > 31', () => {
    expect(validateDayOfMonth(32).isValid).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(validateDayOfMonth(15.5).isValid).toBe(false);
  });

  it('rejects non-number input', () => {
    expect(validateDayOfMonth('15' as any).isValid).toBe(false);
    expect(validateDayOfMonth(NaN).isValid).toBe(false);
  });
});

describe('constants', () => {
  it('exports VALID_CURRENCIES with expected values', () => {
    expect(VALID_CURRENCIES).toContain('USD');
    expect(VALID_CURRENCIES).toContain('MXN');
    expect(VALID_CURRENCIES).toContain('EUR');
    expect(VALID_CURRENCIES).toContain('BTC');
    expect(VALID_CURRENCIES).toContain('ETH');
  });

  it('exports VALID_ACCOUNT_TYPES with expected values', () => {
    expect(VALID_ACCOUNT_TYPES).toContain('bank');
    expect(VALID_ACCOUNT_TYPES).toContain('credit-card');
    expect(VALID_ACCOUNT_TYPES).toContain('investment');
  });

  it('exports MAX_AMOUNT_VALUE as 1 billion', () => {
    expect(MAX_AMOUNT_VALUE).toBe(1000000000);
  });
});
