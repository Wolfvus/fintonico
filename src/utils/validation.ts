export interface ValidationError {
  [key: string]: string;
}

export const validateRequired = (value: string, fieldName: string): string | null => {
  return !value.trim() ? `${fieldName} required` : null;
};

export const validateAmount = (amount: string): string | null => {
  const num = parseFloat(amount);
  if (!amount || isNaN(num) || num <= 0) {
    return 'Valid amount required';
  }
  return null;
};

export const validateDate = (date: string): string | null => {
  return !date ? 'Date required' : null;
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