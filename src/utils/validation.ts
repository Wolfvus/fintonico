export interface ValidationError {
  [key: string]: string;
}

import { sanitizeDescription, validateAmount as sanitizeAmount, validateDate as sanitizeDate } from './sanitization';

export const validateRequired = (value: string, fieldName: string): string | null => {
  const sanitized = sanitizeDescription(value);
  return !sanitized ? `${fieldName} required` : null;
};

export const validateAmount = (amount: string): string | null => {
  const result = sanitizeAmount(amount);
  return result.isValid ? null : result.error || 'Valid amount required';
};

export const validateDate = (date: string): string | null => {
  const result = sanitizeDate(date);
  return result.isValid ? null : result.error || 'Date required';
};

