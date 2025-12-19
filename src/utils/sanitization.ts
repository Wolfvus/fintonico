/**
 * Input sanitization utilities to prevent XSS and validate user input
 */

const MAX_STRING_LENGTH = 1000;
const MAX_DESCRIPTION_LENGTH = 30;
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
 * Sanitize description with 30-character limit
 */
export const sanitizeDescription = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH) // Limit to 30 characters
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
 * Valid currency codes supported by the application
 */
export const VALID_CURRENCIES = ['USD', 'MXN', 'EUR', 'BTC', 'ETH'] as const;
export type ValidCurrency = typeof VALID_CURRENCIES[number];

/**
 * Validate currency code
 */
export const validateCurrency = (input: string): {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
} => {
  if (!VALID_CURRENCIES.includes(input as ValidCurrency)) {
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


export const MAX_AMOUNT_VALUE = MAX_AMOUNT;

/**
 * Valid account types for net worth tracking
 */
export const VALID_ACCOUNT_TYPES = [
  'cash', 'bank', 'exchange', 'investment', 'property',
  'loan', 'credit-card', 'mortgage', 'other'
] as const;
export type ValidAccountType = typeof VALID_ACCOUNT_TYPES[number];

/**
 * Validate account type
 */
export const validateAccountType = (input: string): {
  isValid: boolean;
  sanitizedValue: ValidAccountType;
  error?: string;
} => {
  if (!VALID_ACCOUNT_TYPES.includes(input as ValidAccountType)) {
    return {
      isValid: false,
      sanitizedValue: 'other',
      error: 'Invalid account type'
    };
  }

  return {
    isValid: true,
    sanitizedValue: input as ValidAccountType
  };
};

/**
 * Validate account name (max 100 characters)
 */
export const validateAccountName = (input: string): {
  isValid: boolean;
  sanitizedValue: string;
  error?: string;
} => {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Account name is required'
    };
  }

  const sanitized = sanitizeText(input).slice(0, 100);

  if (sanitized.length < 1) {
    return {
      isValid: false,
      sanitizedValue: '',
      error: 'Account name is required'
    };
  }

  return {
    isValid: true,
    sanitizedValue: sanitized
  };
};

/**
 * Validate account balance (can be negative for liabilities)
 */
export const validateBalance = (input: string | number): {
  isValid: boolean;
  sanitizedValue: number;
  error?: string;
} => {
  let numValue: number;

  if (typeof input === 'string') {
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

  // Balance can be negative (for liabilities) but has max limit
  if (Math.abs(numValue) > MAX_AMOUNT) {
    return {
      isValid: false,
      sanitizedValue: 0,
      error: `Balance cannot exceed $${MAX_AMOUNT.toLocaleString()}`
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
 * Validate optional percentage (0-100)
 */
export const validatePercentage = (input: number | undefined): {
  isValid: boolean;
  sanitizedValue: number | undefined;
  error?: string;
} => {
  if (input === undefined || input === null) {
    return { isValid: true, sanitizedValue: undefined };
  }

  if (typeof input !== 'number' || isNaN(input)) {
    return {
      isValid: false,
      sanitizedValue: undefined,
      error: 'Invalid percentage format'
    };
  }

  if (input < 0 || input > 100) {
    return {
      isValid: false,
      sanitizedValue: undefined,
      error: 'Percentage must be between 0 and 100'
    };
  }

  return {
    isValid: true,
    sanitizedValue: Math.round(input * 100) / 100
  };
};

/**
 * Validate optional day of month (1-31)
 */
export const validateDayOfMonth = (input: number | undefined): {
  isValid: boolean;
  sanitizedValue: number | undefined;
  error?: string;
} => {
  if (input === undefined || input === null) {
    return { isValid: true, sanitizedValue: undefined };
  }

  if (typeof input !== 'number' || isNaN(input) || !Number.isInteger(input)) {
    return {
      isValid: false,
      sanitizedValue: undefined,
      error: 'Invalid day format'
    };
  }

  if (input < 1 || input > 31) {
    return {
      isValid: false,
      sanitizedValue: undefined,
      error: 'Day must be between 1 and 31'
    };
  }

  return {
    isValid: true,
    sanitizedValue: input
  };
};