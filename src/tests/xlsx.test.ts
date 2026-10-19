import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { generateXLSX, readXLSXFile } from '../utils/xlsx';

describe('spreadsheet import and export', () => {
  it('round-trips exported rows through the import parser', async () => {
    const workbook = generateXLSX(
      [{ name: 'Café', amount: 125.5 }],
      [
        { key: 'name', header: ' Name ' },
        { key: 'amount', header: 'Amount' },
      ]
    );
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const result = await readXLSXFile(new File([buffer], 'accounts.xlsx'));
    expect(result).toEqual({ data: [{ name: 'Café', amount: '125.5' }], errors: [] });
  });

  it('reports a malformed archive as an import error', async () => {
    const result = await readXLSXFile(
      new File([new Uint8Array([0x50, 0x4b, 3, 4, 0])], 'broken.xlsx')
    );
    expect(result.data).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Failed to read Excel file/);
  });
});
