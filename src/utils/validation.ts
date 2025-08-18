export interface ValidationError {
  [key: string]: string;
}

import { sanitizeText, validateAmount as sanitizeAmount, validateDate as sanitizeDate } from './sanitization';

export const validateRequired = (value: string, fieldName: string): string | null => {
  const sanitized = sanitizeText(value);
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

export const collectErrors = (errors: (string | null)[]): ValidationError => {
  const errorObj: ValidationError = {};
  errors.forEach((error, index) => {
    if (error) {
      const fields = ['what', 'amount', 'date', 'source'];
      errorObj[fields[index] || `field${index}`] = error;
    }
  });
  return errorObj;
};