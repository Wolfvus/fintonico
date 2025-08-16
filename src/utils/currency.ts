export const formatCurrencyInput = (
  value: string,
  currencySymbol: string
): { rawValue: string; displayValue: string } => {
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
  const formattedValue = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  
  return {
    rawValue: cleaned,
    displayValue: `${currencySymbol}${formattedValue}`
  };
};

export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};