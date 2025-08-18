/**
 * Input sanitization utilities to prevent XSS and validate user input
 */

const MAX_STRING_LENGTH = 1000;
const MAX_AMOUNT = 1000000000; // $1 billion
const MIN_AMOUNT = 0.01;

/**
 * Sanitize text input to prevent XSS attacks
 */
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, MAX_STRING_LENGTH) // Limit length
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .replace(/script/gi, '') // Remove script tags
    .replace(/iframe/gi, '') // Remove iframe tags
    .replace(/object/gi, '') // Remove object tags
    .replace(/embed/gi, ''); // Remove embed tags
};

/**
 * Validate and sanitize amount input
 */
export const validateAmount = (input: string | number): {
  isValid: boolean;
  sanitizedValue: number;
  error?: string;
} => {
  let numValue: number;
  
  if (typeof input === 'string') {
    // Remove currency symbols and formatting
    const cleaned = input.replace(/[$,\s]/g, '');
    numValue = parseFloat(cleaned);
  } else {
    numValue = input;
  }
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      sanitizedValue: 0,
      error: 'Invalid number format'
    };
  }
  
  if (numValue < MIN_AMOUNT) {
    return {
      isValid: false,
      sanitizedValue: 0,
      error: `Amount must be at least $${MIN_AMOUNT}`
    };
  }
  
  if (numValue > MAX_AMOUNT) {
    return {
      isValid: false,
      sanitizedValue: 0,
      error: `Amount cannot exceed $${MAX_AMOUNT.toLocaleString()}`
    };
  }
  
  // Round to 2 decimal places
  const rounded = Math.round(numValue * 100) / 100;
  
  return {
    isValid: true,
    sanitizedValue: rounded
  };
};

/**
 * Validate date input
 */
export const validateDate = (input: string): {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
} => {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Date is required'
    };
  }
  
  // Check basic format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(input)) {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Invalid date format'
    };
  }
  
  const date = new Date(input);
  const now = new Date();
  
  // Check if it's a valid date
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Invalid date'
    };
  }
  
  // Check if date is not too far in the future (max 10 years)
  const maxDate = new Date();
  maxDate.setFullYear(now.getFullYear() + 10);
  
  if (date > maxDate) {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Date cannot be more than 10 years in the future'
    };
  }
  
  // Check if date is not too far in the past (max 100 years)
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 100);
  
  if (date < minDate) {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Date cannot be more than 100 years in the past'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: input
  };
};

/**
 * Validate currency code
 */
export const validateCurrency = (input: string): {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
} => {
  const validCurrencies = ['USD', 'MXN', 'EUR'];
  
  if (!validCurrencies.includes(input)) {
    return {
      isValid: false,
      sanitizedValue: 'USD',
      error: 'Invalid currency code'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: input
  };
};

/**
 * Sanitize and validate JSON data from localStorage
 */
export const sanitizeStoredData = (data: any): any => {
  if (!data || typeof data !== 'object') return null;
  
  try {
    // If it's an array (transactions)
    if (Array.isArray(data)) {
      return data.map(item => ({
        id: sanitizeText(item.id || '').slice(0, 50),
        description: sanitizeText(item.description || item.what || item.source || ''),
        amount: validateAmount(item.amount || 0).sanitizedValue,
        currency: validateCurrency(item.currency || 'USD').sanitizedValue,
        date: validateDate(item.date || new Date().toISOString().split('T')[0]).sanitizedValue,
        // Preserve other fields but sanitize them
        ...Object.keys(item).reduce((acc, key) => {
          if (!['id', 'description', 'amount', 'currency', 'date', 'what', 'source'].includes(key)) {
            if (typeof item[key] === 'string') {
              acc[key] = sanitizeText(item[key]);
            } else {
              acc[key] = item[key];
            }
          }
          return acc;
        }, {} as any)
      })).filter(item => item.id && item.description); // Remove invalid items
    }
    
    return data;
  } catch (error) {
    console.error('Error sanitizing stored data:', error);
    return null;
  }
};

export const MAX_AMOUNT_VALUE = MAX_AMOUNT;