/**
 * CSV Import/Export Utilities
 * Handles parsing and generating CSV files for data import/export
 */

// Escape a value for CSV (handle commas, quotes, newlines)
const escapeCSVValue = (value: string | number | boolean | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Parse a CSV value (handle quoted values)
const parseCSVValue = (value: string): string => {
  const trimmed = value.trim();
  // If wrapped in quotes, remove them and unescape internal quotes
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }
  return trimmed;
};

// Parse a CSV line into values (handle quoted values with commas)
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted value
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted value
        inQuotes = true;
      } else if (char === ',') {
        // End of value
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last value
  values.push(current.trim());

  return values;
};

// Generate CSV string from data
export const generateCSV = <T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string => {
  // Header row
  const headerRow = columns.map((col) => escapeCSVValue(col.header)).join(',');

  // Data rows
  const dataRows = data.map((row) =>
    columns.map((col) => escapeCSVValue(row[col.key] as string | number | boolean)).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

// Parse CSV string into data
export const parseCSV = (
  csvString: string,
  expectedHeaders: string[]
): { data: Record<string, string>[]; errors: string[] } => {
  const lines = csvString.split(/\r?\n/).filter((line) => line.trim());
  const errors: string[] = [];
  const data: Record<string, string>[] = [];

  if (lines.length === 0) {
    errors.push('CSV file is empty');
    return { data, errors };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Validate headers
  const missingHeaders = expectedHeaders.filter(
    (expected) => !headers.includes(expected.toLowerCase())
  );
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    return { data, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = parseCSVValue(values[index]);
    });
    data.push(row);
  }

  return { data, errors };
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Read CSV file from File input
export const readCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// ============================================
// Expense CSV functions
// ============================================

export interface ExpenseCSVRow {
  date: string;
  description: string;
  amount: string;
  currency: string;
  category: string;
  recurring: string;
}

export const EXPENSE_CSV_HEADERS = ['date', 'description', 'amount', 'currency', 'category', 'recurring'];

export const exportExpensesToCSV = (
  expenses: Array<{
    date: string;
    what: string;
    amount: number;
    currency: string;
    rating: string;
    recurring?: boolean;
  }>
): string => {
  return generateCSV(
    expenses.map((e) => ({
      date: e.date,
      description: e.what,
      amount: e.amount,
      currency: e.currency,
      category: e.rating,
      recurring: e.recurring ? 'true' : 'false',
    })),
    [
      { key: 'date', header: 'date' },
      { key: 'description', header: 'description' },
      { key: 'amount', header: 'amount' },
      { key: 'currency', header: 'currency' },
      { key: 'category', header: 'category' },
      { key: 'recurring', header: 'recurring' },
    ]
  );
};

export const parseExpenseCSV = (
  csvString: string
): { data: ExpenseCSVRow[]; errors: string[] } => {
  const result = parseCSV(csvString, EXPENSE_CSV_HEADERS);
  return {
    data: result.data as unknown as ExpenseCSVRow[],
    errors: result.errors,
  };
};

// ============================================
// Income CSV functions
// ============================================

export interface IncomeCSVRow {
  date: string;
  source: string;
  amount: string;
  currency: string;
  frequency: string;
}

export const INCOME_CSV_HEADERS = ['date', 'source', 'amount', 'currency', 'frequency'];

export const exportIncomeToCSV = (
  incomes: Array<{
    date: string;
    source: string;
    amount: number;
    currency: string;
    frequency: string;
  }>
): string => {
  return generateCSV(
    incomes.map((i) => ({
      date: i.date,
      source: i.source,
      amount: i.amount,
      currency: i.currency,
      frequency: i.frequency,
    })),
    [
      { key: 'date', header: 'date' },
      { key: 'source', header: 'source' },
      { key: 'amount', header: 'amount' },
      { key: 'currency', header: 'currency' },
      { key: 'frequency', header: 'frequency' },
    ]
  );
};

export const parseIncomeCSV = (
  csvString: string
): { data: IncomeCSVRow[]; errors: string[] } => {
  const result = parseCSV(csvString, INCOME_CSV_HEADERS);
  return {
    data: result.data as unknown as IncomeCSVRow[],
    errors: result.errors,
  };
};

// ============================================
// Account (Net Worth) CSV functions
// ============================================

export interface AccountCSVRow {
  name: string;
  type: string;
  nature: string;
  currency: string;
  balance: string;
  yield: string;
  due_date: string;
  min_payment: string;
  no_interest_payment: string;
  excluded: string;
}

export const ACCOUNT_CSV_HEADERS = ['name', 'type', 'nature', 'currency', 'balance', 'yield', 'due_date', 'min_payment', 'no_interest_payment', 'excluded'];

// Type-to-nature mapping for backwards compatibility
const ASSET_TYPES = ['cash', 'bank', 'exchange', 'investment', 'property'];
const LIABILITY_TYPES = ['loan', 'credit-card', 'mortgage'];

export const inferNatureFromType = (type: string, balance: number): 'asset' | 'liability' => {
  if (ASSET_TYPES.includes(type)) return 'asset';
  if (LIABILITY_TYPES.includes(type)) return 'liability';
  // For 'other' type, infer from balance sign
  return balance >= 0 ? 'asset' : 'liability';
};

export const exportAccountsToCSV = (
  accounts: Array<{
    name: string;
    type: string;
    currency: string;
    balance: number;
    estimatedYield?: number;
    recurringDueDate?: number;
    minMonthlyPayment?: number;
    paymentToAvoidInterest?: number;
    excludeFromTotal?: boolean;
  }>
): string => {
  return generateCSV(
    accounts.map((a) => ({
      name: a.name,
      type: a.type,
      nature: inferNatureFromType(a.type, a.balance),
      currency: a.currency,
      balance: a.balance,
      yield: a.estimatedYield ?? '',
      due_date: a.recurringDueDate ?? '',
      min_payment: a.minMonthlyPayment ?? '',
      no_interest_payment: a.paymentToAvoidInterest ?? '',
      excluded: a.excludeFromTotal ? 'true' : 'false',
    })),
    [
      { key: 'name', header: 'name' },
      { key: 'type', header: 'type' },
      { key: 'nature', header: 'nature' },
      { key: 'currency', header: 'currency' },
      { key: 'balance', header: 'balance' },
      { key: 'yield', header: 'yield' },
      { key: 'due_date', header: 'due_date' },
      { key: 'min_payment', header: 'min_payment' },
      { key: 'no_interest_payment', header: 'no_interest_payment' },
      { key: 'excluded', header: 'excluded' },
    ]
  );
};

export const parseAccountCSV = (
  csvString: string
): { data: AccountCSVRow[]; errors: string[] } => {
  // Only require core fields - nature is optional for backwards compatibility
  const result = parseCSV(csvString, ['name', 'type', 'currency', 'balance']);

  // Process each row to ensure nature field exists
  const processedData = result.data.map((row) => {
    const balance = parseFloat(row.balance) || 0;
    let nature = row.nature?.toLowerCase().trim();

    // Validate nature or infer from type/balance
    if (nature !== 'asset' && nature !== 'liability') {
      nature = inferNatureFromType(row.type, balance);
    }

    return {
      ...row,
      nature,
    } as AccountCSVRow;
  });

  return {
    data: processedData,
    errors: result.errors,
  };
};

// ============================================
// Ledger Account (Chart of Accounts) CSV functions
// ============================================

export interface LedgerAccountCSVRow {
  name: string;
  account_number: string;
  clabe: string;
  normal_balance: string;
  active: string;
}

export const LEDGER_ACCOUNT_CSV_HEADERS = ['name', 'account_number', 'clabe', 'normal_balance', 'active'];

export const exportLedgerAccountsToCSV = (
  accounts: Array<{
    name: string;
    accountNumber?: string;
    clabe?: string;
    normalBalance: string;
    isActive: boolean;
  }>
): string => {
  // Prefix numeric strings with ' so spreadsheets treat them as text
  const prefixNumeric = (val: string | undefined): string => {
    if (!val) return '';
    // If it looks like a long number, prefix with '
    return /^\d{6,}$/.test(val) ? `'${val}` : val;
  };

  return generateCSV(
    accounts.map((a) => ({
      name: a.name,
      account_number: prefixNumeric(a.accountNumber),
      clabe: prefixNumeric(a.clabe),
      normal_balance: a.normalBalance,
      active: a.isActive ? 'true' : 'false',
    })),
    [
      { key: 'name', header: 'name' },
      { key: 'account_number', header: 'account_number' },
      { key: 'clabe', header: 'clabe' },
      { key: 'normal_balance', header: 'normal_balance' },
      { key: 'active', header: 'active' },
    ]
  );
};

export const parseLedgerAccountCSV = (
  csvString: string
): { data: LedgerAccountCSVRow[]; errors: string[] } => {
  const result = parseCSV(csvString, ['name', 'normal_balance']);
  const warnings: string[] = [];

  // Clean numeric fields:
  // - Strip leading ' if present (from our export or spreadsheet)
  // - Convert scientific notation back to full number (Excel mangles long numbers)
  // - Accept plain numbers for easy manual CSV creation
  const cleanNumericField = (val: string, rowNum: number, fieldName: string): string => {
    if (!val) return '';

    // Strip leading ' if present
    let cleaned = val.startsWith("'") ? val.slice(1) : val;

    // Handle scientific notation (e.g., 6.46990404E+17)
    // WARNING: This loses precision! Excel corrupts long numbers.
    if (/^[\d.]+[eE][+-]?\d+$/.test(cleaned)) {
      warnings.push(`Row ${rowNum}: ${fieldName} appears to be in scientific notation - precision may be lost. Re-export from original source if possible.`);
      try {
        const num = parseFloat(cleaned);
        cleaned = num.toFixed(0);
      } catch {
        // If conversion fails, keep original
      }
    }

    return cleaned;
  };

  const cleanedData = result.data.map((row, index) => ({
    ...row,
    account_number: cleanNumericField(row.account_number || '', index + 2, 'account_number'),
    clabe: cleanNumericField(row.clabe || '', index + 2, 'clabe'),
  }));

  return {
    data: cleanedData as LedgerAccountCSVRow[],
    errors: [...result.errors, ...warnings],
  };
};

// ============================================
// CSV Template Generators
// ============================================

export type CSVTemplateType = 'expenses' | 'income' | 'accounts' | 'ledger-accounts';

export interface CSVTemplateInfo {
  headers: string[];
  description: string;
  exampleRows: string[][];
  notes: string[];
}

/**
 * Get template information for a specific CSV type
 */
export const getCSVTemplateInfo = (type: CSVTemplateType): CSVTemplateInfo => {
  switch (type) {
    case 'expenses':
      return {
        headers: EXPENSE_CSV_HEADERS,
        description: 'Import your expenses with date, description, amount, currency, category, and recurring status.',
        exampleRows: [
          ['2025-01-15', 'Groceries', '150.00', 'MXN', 'essential', 'false'],
          ['2025-01-16', 'Netflix Subscription', '199.00', 'MXN', 'discretionary', 'true'],
          ['2025-01-20', 'New Headphones', '2500.00', 'MXN', 'luxury', 'false'],
        ],
        notes: [
          'date: YYYY-MM-DD format (e.g., 2025-01-15)',
          'description: Text description of the expense',
          'amount: Positive number (e.g., 150.00)',
          'currency: MXN, USD, EUR, etc.',
          'category: essential, discretionary, or luxury',
          'recurring: true or false',
        ],
      };

    case 'income':
      return {
        headers: INCOME_CSV_HEADERS,
        description: 'Import your income sources with date, source name, amount, currency, and frequency.',
        exampleRows: [
          ['2025-01-01', 'Monthly Salary', '50000.00', 'MXN', 'monthly'],
          ['2025-01-15', 'Freelance Project', '1500.00', 'USD', 'one-time'],
          ['2025-01-05', 'Investment Dividends', '2500.00', 'MXN', 'monthly'],
        ],
        notes: [
          'date: YYYY-MM-DD format (e.g., 2025-01-01)',
          'source: Name of the income source',
          'amount: Positive number (e.g., 50000.00)',
          'currency: MXN, USD, EUR, etc.',
          'frequency: one-time, weekly, bi-weekly, or monthly',
        ],
      };

    case 'accounts':
      return {
        headers: ACCOUNT_CSV_HEADERS,
        description: 'Import your financial accounts (assets and liabilities) for net worth tracking.',
        exampleRows: [
          ['Savings Account', 'bank', 'asset', 'MXN', '100000.00', '5.5', '', '', '', 'false'],
          ['Brokerage', 'investment', 'asset', 'USD', '15000.00', '7.5', '', '', '', 'false'],
          ['Credit Card', 'credit-card', 'liability', 'MXN', '-8500.00', '', '15', '850', '8500', 'false'],
          ['Car Loan', 'loan', 'liability', 'MXN', '-85000.00', '', '5', '4500', '', 'false'],
        ],
        notes: [
          'name: Account name',
          'type: cash, bank, exchange, investment, property, loan, credit-card, mortgage, or other',
          'nature: asset or liability',
          'currency: MXN, USD, EUR, etc.',
          'balance: Positive for assets, negative for liabilities',
          'yield: Annual yield % (optional, for investments)',
          'due_date: Day of month for payments (1-31, optional)',
          'min_payment: Minimum monthly payment (optional, for liabilities)',
          'no_interest_payment: Amount to pay to avoid interest (optional)',
          'excluded: true or false (exclude from net worth totals)',
        ],
      };

    case 'ledger-accounts':
      return {
        headers: LEDGER_ACCOUNT_CSV_HEADERS,
        description: 'Import your chart of accounts with account numbers and CLABE codes for reference.',
        exampleRows: [
          ['BBVA Checking', '0123456789', '012180001234567891', 'debit', 'true'],
          ['Banorte Savings', '9876543210', '072180009876543212', 'debit', 'true'],
          ['AMEX Gold', '3742-XXXXXX-12345', '', 'credit', 'true'],
        ],
        notes: [
          'name: Account name for reference',
          'account_number: Bank account number (optional)',
          'clabe: 18-digit CLABE code (optional, Mexico only)',
          'normal_balance: debit or credit',
          'active: true or false',
        ],
      };
  }
};

/**
 * Generate a downloadable CSV template with headers and example rows
 */
export const generateCSVTemplate = (type: CSVTemplateType): string => {
  const info = getCSVTemplateInfo(type);

  // Header row
  const headerRow = info.headers.join(',');

  // Example rows
  const exampleRows = info.exampleRows.map((row) =>
    row.map((val) => escapeCSVValue(val)).join(',')
  );

  return [headerRow, ...exampleRows].join('\n');
};

/**
 * Download a CSV template file
 */
export const downloadCSVTemplate = (type: CSVTemplateType): void => {
  const template = generateCSVTemplate(type);
  const filename = `fintonico-${type}-template.csv`;
  downloadCSV(template, filename);
};
