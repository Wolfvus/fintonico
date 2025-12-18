/**
 * XLSX Import/Export Utilities
 * Handles parsing and generating Excel files for data import/export
 * Uses SheetJS (xlsx) library
 */

import * as XLSX from 'xlsx';

// Re-export types from csv.ts for consistency
export type {
  ExpenseCSVRow as ExpenseRow,
  IncomeCSVRow as IncomeRow,
  AccountCSVRow as AccountRow,
  LedgerAccountCSVRow as LedgerAccountRow,
} from './csv';

// Import constants and helpers from csv.ts
import {
  EXPENSE_CSV_HEADERS,
  INCOME_CSV_HEADERS,
  ACCOUNT_CSV_HEADERS,
  LEDGER_ACCOUNT_CSV_HEADERS,
  inferNatureFromType,
  type CSVTemplateType,
} from './csv';

// Re-export for convenience
export { inferNatureFromType };
export type XLSXTemplateType = CSVTemplateType;

// ============================================
// Core XLSX Functions
// ============================================

/**
 * Read an XLSX file and return parsed data
 * Returns array of objects with headers as keys
 */
export const readXLSXFile = async (
  file: File
): Promise<{ data: Record<string, string>[]; errors: string[] }> => {
  const errors: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    // Use first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      errors.push('Excel file has no sheets');
      return { data: [], errors };
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false, // Get formatted strings instead of raw values
      defval: '', // Default value for empty cells
    });

    if (jsonData.length === 0) {
      errors.push('Excel file has no data rows');
      return { data: [], errors };
    }

    // Normalize headers (lowercase, trim) and convert all values to strings
    const normalizedData = jsonData.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().trim();
        normalized[normalizedKey] = formatCellValue(value);
      }
      return normalized;
    });

    return { data: normalizedData, errors };
  } catch (err) {
    errors.push(`Failed to read Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { data: [], errors };
  }
};

/**
 * Format a cell value to string, handling dates and numbers
 */
const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  // Handle Date objects (from cellDates: true)
  if (value instanceof Date) {
    // Format as YYYY-MM-DD
    return value.toISOString().split('T')[0];
  }

  // Handle numbers
  if (typeof value === 'number') {
    // Check if it's a reasonable date serial number (Excel dates start at 1900)
    // Excel date serial numbers for years 2000-2100 are roughly 36526-73415
    if (value > 36526 && value < 73415 && Number.isInteger(value)) {
      // This might be an Excel date serial - convert it
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const year = date.y;
        const month = String(date.m).padStart(2, '0');
        const day = String(date.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return String(value);
  }

  return String(value).trim();
};

/**
 * Generate an XLSX workbook from data
 */
export const generateXLSX = <T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): XLSX.WorkBook => {
  // Create header row
  const headers = columns.map((col) => col.header);

  // Create data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value === undefined || value === null) return '';
      return value;
    })
  );

  // Combine headers and data
  const worksheetData = [headers, ...rows];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths based on content
  const colWidths = columns.map((col, index) => {
    const headerLen = col.header.length;
    const maxDataLen = Math.max(
      ...rows.map((row) => String(row[index] ?? '').length),
      0
    );
    return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  return workbook;
};

/**
 * Download an XLSX file
 */
export const downloadXLSX = (workbook: XLSX.WorkBook, filename: string): void => {
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

  // Create blob and download
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// ============================================
// Expense XLSX functions
// ============================================

export interface ExpenseXLSXRow {
  date: string;
  description: string;
  amount: string;
  currency: string;
  category: string;
  recurring: string;
}

export const EXPENSE_XLSX_HEADERS = EXPENSE_CSV_HEADERS;

export const parseExpenseXLSX = async (
  file: File
): Promise<{ data: ExpenseXLSXRow[]; errors: string[] }> => {
  const result = await readXLSXFile(file);

  if (result.errors.length > 0) {
    return { data: [], errors: result.errors };
  }

  // Validate required columns
  const firstRow = result.data[0];
  if (firstRow) {
    const missingHeaders = EXPENSE_XLSX_HEADERS.filter(
      (h) => !(h in firstRow)
    );
    if (missingHeaders.length > 0) {
      result.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { data: [], errors: result.errors };
    }
  }

  return {
    data: result.data as unknown as ExpenseXLSXRow[],
    errors: result.errors,
  };
};

// ============================================
// Income XLSX functions
// ============================================

export interface IncomeXLSXRow {
  date: string;
  source: string;
  amount: string;
  currency: string;
  frequency: string;
}

export const INCOME_XLSX_HEADERS = INCOME_CSV_HEADERS;

export const parseIncomeXLSX = async (
  file: File
): Promise<{ data: IncomeXLSXRow[]; errors: string[] }> => {
  const result = await readXLSXFile(file);

  if (result.errors.length > 0) {
    return { data: [], errors: result.errors };
  }

  // Validate required columns
  const firstRow = result.data[0];
  if (firstRow) {
    const missingHeaders = INCOME_XLSX_HEADERS.filter(
      (h) => !(h in firstRow)
    );
    if (missingHeaders.length > 0) {
      result.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { data: [], errors: result.errors };
    }
  }

  return {
    data: result.data as unknown as IncomeXLSXRow[],
    errors: result.errors,
  };
};

// ============================================
// Account (Net Worth) XLSX functions
// ============================================

export interface AccountXLSXRow {
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

export const ACCOUNT_XLSX_HEADERS = ACCOUNT_CSV_HEADERS;

export const parseAccountXLSX = async (
  file: File
): Promise<{ data: AccountXLSXRow[]; errors: string[] }> => {
  const result = await readXLSXFile(file);

  if (result.errors.length > 0) {
    return { data: [], errors: result.errors };
  }

  // Only require core fields - nature is optional for backwards compatibility
  const requiredHeaders = ['name', 'type', 'currency', 'balance'];
  const firstRow = result.data[0];
  if (firstRow) {
    const missingHeaders = requiredHeaders.filter(
      (h) => !(h in firstRow)
    );
    if (missingHeaders.length > 0) {
      result.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { data: [], errors: result.errors };
    }
  }

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
    } as AccountXLSXRow;
  });

  return {
    data: processedData,
    errors: result.errors,
  };
};

// ============================================
// Ledger Account (Chart of Accounts) XLSX functions
// ============================================

export interface LedgerAccountXLSXRow {
  name: string;
  account_number: string;
  clabe: string;
  normal_balance: string;
  active: string;
}

export const LEDGER_ACCOUNT_XLSX_HEADERS = LEDGER_ACCOUNT_CSV_HEADERS;

export const parseLedgerAccountXLSX = async (
  file: File
): Promise<{ data: LedgerAccountXLSXRow[]; errors: string[] }> => {
  const result = await readXLSXFile(file);

  if (result.errors.length > 0) {
    return { data: [], errors: result.errors };
  }

  // Only require core fields
  const requiredHeaders = ['name', 'normal_balance'];
  const firstRow = result.data[0];
  if (firstRow) {
    const missingHeaders = requiredHeaders.filter(
      (h) => !(h in firstRow)
    );
    if (missingHeaders.length > 0) {
      result.errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { data: [], errors: result.errors };
    }
  }

  // Clean numeric fields (account numbers, CLABE)
  const cleanedData = result.data.map((row) => ({
    ...row,
    account_number: cleanNumericField(row.account_number || ''),
    clabe: cleanNumericField(row.clabe || ''),
  }));

  return {
    data: cleanedData as LedgerAccountXLSXRow[],
    errors: result.errors,
  };
};

/**
 * Clean numeric field - strip leading apostrophes, handle Excel quirks
 */
const cleanNumericField = (val: string): string => {
  if (!val) return '';

  // Strip leading ' if present (spreadsheet text prefix)
  let cleaned = val.startsWith("'") ? val.slice(1) : val;

  // Handle scientific notation (Excel mangles long numbers)
  if (/^[\d.]+[eE][+-]?\d+$/.test(cleaned)) {
    try {
      const num = parseFloat(cleaned);
      cleaned = num.toFixed(0);
    } catch {
      // Keep original if conversion fails
    }
  }

  return cleaned;
};

// ============================================
// XLSX Template Generation
// ============================================

export interface XLSXTemplateInfo {
  headers: string[];
  description: string;
  exampleRows: (string | number | boolean)[][];
  notes: string[];
}

/**
 * Get template information for a specific XLSX type
 */
export const getXLSXTemplateInfo = (type: XLSXTemplateType): XLSXTemplateInfo => {
  switch (type) {
    case 'expenses':
      return {
        headers: EXPENSE_XLSX_HEADERS,
        description: 'Import your expenses with date, description, amount, currency, category, and recurring status.',
        exampleRows: [
          ['2025-01-15', 'Groceries', 150.00, 'MXN', 'essential', 'false'],
          ['2025-01-16', 'Netflix Subscription', 199.00, 'MXN', 'discretionary', 'true'],
          ['2025-01-20', 'New Headphones', 2500.00, 'MXN', 'luxury', 'false'],
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
        headers: INCOME_XLSX_HEADERS,
        description: 'Import your income sources with date, source name, amount, currency, and frequency.',
        exampleRows: [
          ['2025-01-01', 'Monthly Salary', 50000.00, 'MXN', 'monthly'],
          ['2025-01-15', 'Freelance Project', 1500.00, 'USD', 'one-time'],
          ['2025-01-05', 'Investment Dividends', 2500.00, 'MXN', 'monthly'],
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
        headers: ACCOUNT_XLSX_HEADERS,
        description: 'Import your financial accounts (assets and liabilities) for net worth tracking.',
        exampleRows: [
          ['Savings Account', 'bank', 'asset', 'MXN', 100000.00, 5.5, '', '', '', 'false'],
          ['Brokerage', 'investment', 'asset', 'USD', 15000.00, 7.5, '', '', '', 'false'],
          ['Credit Card', 'credit-card', 'liability', 'MXN', -8500.00, '', 15, 850, 8500, 'false'],
          ['Car Loan', 'loan', 'liability', 'MXN', -85000.00, '', 5, 4500, '', 'false'],
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
        headers: LEDGER_ACCOUNT_XLSX_HEADERS,
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
 * Generate a downloadable XLSX template with headers and example rows
 */
export const generateXLSXTemplate = (type: XLSXTemplateType): XLSX.WorkBook => {
  const info = getXLSXTemplateInfo(type);

  // Create data sheet with headers and examples
  const dataRows = [info.headers, ...info.exampleRows];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);

  // Set column widths
  const colWidths = info.headers.map((header, index) => {
    const headerLen = header.length;
    const maxDataLen = Math.max(
      ...info.exampleRows.map((row) => String(row[index] ?? '').length),
      0
    );
    return { wch: Math.min(Math.max(headerLen, maxDataLen) + 2, 50) };
  });
  dataSheet['!cols'] = colWidths;

  // Style header row (bold) - Note: styling requires xlsx-style or similar
  // Basic xlsx doesn't support rich styling, but we can set the format

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');

  // Add instructions sheet
  const instructionRows = [
    ['INSTRUCTIONS'],
    [''],
    [info.description],
    [''],
    ['COLUMN DESCRIPTIONS:'],
    ...info.notes.map((note) => [note]),
    [''],
    ['Delete the example rows before importing your data.'],
  ];
  const instructionSheet = XLSX.utils.aoa_to_sheet(instructionRows);
  instructionSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

  return workbook;
};

/**
 * Download an XLSX template file
 */
export const downloadXLSXTemplate = (type: XLSXTemplateType): void => {
  const workbook = generateXLSXTemplate(type);
  const filename = `fintonico-${type}-template.xlsx`;
  downloadXLSX(workbook, filename);
};
