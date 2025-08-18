export const formatCurrencyInput = (
  value: string,
  currencySymbol: string
): { rawValue: string; displayValue: string } => {
  // Remove everything except digits and decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');
  const decimalCount = (cleaned.match(/\./g) || []).length;
  
  if (decimalCount > 1) {
    return { rawValue: '', displayValue: '' };
  }
  
  if (!cleaned) {
    return { rawValue: '', displayValue: '' };
  }
  
  const parts = cleaned.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Handle decimal part - ensure max 2 decimal places
  let decimalPart = parts[1] || '';
  if (decimalPart.length > 2) {
    decimalPart = decimalPart.substring(0, 2);
  }
  
  // Format the display value
  let formattedValue = integerPart;
  if (parts.length > 1) {
    // Always show decimal point if user typed it
    formattedValue = `${integerPart}.${decimalPart}`;
  }
  
  return {
    rawValue: parts.length > 1 ? `${parts[0]}.${decimalPart}` : cleaned,
    displayValue: `${currencySymbol}${formattedValue}`
  };
};

import { validateAmount as sanitizeAmount } from './sanitization';

export const validateAmount = (amount: string): boolean => {
  const result = sanitizeAmount(amount);
  return result.isValid;
};