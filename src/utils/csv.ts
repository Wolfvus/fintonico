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
  currency: string;
  balance: string;
  yield: string;
  due_date: string;
  excluded: string;
}

export const ACCOUNT_CSV_HEADERS = ['name', 'type', 'currency', 'balance', 'yield', 'due_date', 'excluded'];

export const exportAccountsToCSV = (
  accounts: Array<{
    name: string;
    type: string;
    currency: string;
    balance: number;
    estimatedYield?: number;
    recurringDueDate?: number;
    excludeFromTotal?: boolean;
  }>
): string => {
  return generateCSV(
    accounts.map((a) => ({
      name: a.name,
      type: a.type,
      currency: a.currency,
      balance: a.balance,
      yield: a.estimatedYield ?? '',
      due_date: a.recurringDueDate ?? '',
      excluded: a.excludeFromTotal ? 'true' : 'false',
    })),
    [
      { key: 'name', header: 'name' },
      { key: 'type', header: 'type' },
      { key: 'currency', header: 'currency' },
      { key: 'balance', header: 'balance' },
      { key: 'yield', header: 'yield' },
      { key: 'due_date', header: 'due_date' },
      { key: 'excluded', header: 'excluded' },
    ]
  );
};

export const parseAccountCSV = (
  csvString: string
): { data: AccountCSVRow[]; errors: string[] } => {
  const result = parseCSV(csvString, ['name', 'type', 'currency', 'balance']);
  return {
    data: result.data as unknown as AccountCSVRow[],
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
