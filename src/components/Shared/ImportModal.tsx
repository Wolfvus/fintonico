import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Upload, FileText, Check, AlertCircle, Info, Lock } from 'lucide-react';
import type { XLSXTemplateType } from '../../utils/xlsx';
import {
  getXLSXTemplateInfo,
  downloadXLSXTemplate,
} from '../../utils/xlsx';
import { useAuthStore } from '../../stores/authStore';

export interface ParsedRow {
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: XLSXTemplateType;
  entityName: string; // e.g., "expenses", "income", "accounts"
  parseFile: (file: File) => Promise<{ data: Record<string, string>[]; errors: string[] }>;
  validateRow: (row: Record<string, string>, index: number) => { isValid: boolean; errors: string[] };
  onImport: (rows: Record<string, string>[]) => Promise<{ success: boolean; message: string; count?: number }>;
}

type Tab = 'template' | 'upload' | 'preview';

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  templateType,
  entityName,
  parseFile,
  validateRow,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('template');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { canImport } = useAuthStore();
  const userCanImport = canImport();

  const templateInfo = getXLSXTemplateInfo(templateType);

  const resetState = useCallback(() => {
    setActiveTab('template');
    setParsedRows([]);
    setParseErrors([]);
    setSkipInvalid(true);
    setIsImporting(false);
    setIsParsing(false);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processFile = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setParseErrors(['Please select an Excel file (.xlsx or .xls extension)']);
      setActiveTab('preview');
      return;
    }

    setIsParsing(true);
    setParseErrors([]);
    setParsedRows([]);

    try {
      const { data, errors } = await parseFile(file);

      if (errors.length > 0 && data.length === 0) {
        setParseErrors(errors);
        setParsedRows([]);
        setActiveTab('preview');
        return;
      }

      // Validate each row
      const validatedRows: ParsedRow[] = data.map((row, index) => {
        const validation = validateRow(row, index);
        return {
          data: row,
          isValid: validation.isValid,
          errors: validation.errors,
        };
      });

      setParsedRows(validatedRows);
      setParseErrors(errors);
      setActiveTab('preview');
    } catch (error) {
      setParseErrors([error instanceof Error ? error.message : 'Failed to read file']);
      setActiveTab('preview');
    } finally {
      setIsParsing(false);
    }
  }, [parseFile, validateRow]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFile]);

  const handleDownloadTemplate = useCallback(() => {
    downloadXLSXTemplate(templateType);
  }, [templateType]);

  const handleImport = useCallback(async () => {
    const rowsToImport = skipInvalid
      ? parsedRows.filter(r => r.isValid).map(r => r.data)
      : parsedRows.map(r => r.data);

    if (rowsToImport.length === 0) {
      setImportResult({ success: false, message: 'No valid rows to import' });
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(rowsToImport);
      setImportResult(result);
      if (result.success) {
        // Close modal after successful import
        setTimeout(() => handleClose(), 1500);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsImporting(false);
    }
  }, [parsedRows, skipInvalid, onImport, handleClose]);

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import {entityName.charAt(0).toUpperCase() + entityName.slice(1)}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['template', 'upload', 'preview'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'template' && <FileText className="w-4 h-4 inline mr-1.5" />}
              {tab === 'upload' && <Upload className="w-4 h-4 inline mr-1.5" />}
              {tab === 'preview' && <Check className="w-4 h-4 inline mr-1.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'preview' && parsedRows.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                  {parsedRows.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Pro Feature Gate */}
          {!userCanImport && (
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-purple-900 dark:text-purple-100">
                    Data Import is a Pro Feature
                  </p>
                  <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                    Upgrade to Pro to import data from Excel files. You can still view the template format below.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-3 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    Contact Us to Upgrade
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template Tab */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {templateInfo.description}
                </p>
              </div>

              {/* Example Table */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Example Format
                </h4>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        {templateInfo.headers.map((header) => (
                          <th
                            key={header}
                            className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {templateInfo.exampleRows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-2 py-1.5 text-gray-700 dark:text-gray-300"
                            >
                              {cell !== undefined && cell !== null && cell !== '' ? String(cell) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field Reference
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {templateInfo.notes.map((note, idx) => (
                    <li key={idx} className="flex">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Excel Template
              </button>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={userCanImport ? handleDrop : undefined}
                onDragOver={userCanImport ? handleDragOver : undefined}
                onDragLeave={userCanImport ? handleDragLeave : undefined}
                onClick={() => userCanImport && !isParsing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  !userCanImport
                    ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
                    : isParsing
                      ? 'border-gray-300 dark:border-gray-600 cursor-wait'
                      : isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
                }`}
              >
                {isParsing ? (
                  <>
                    <div className="w-10 h-10 mx-auto mb-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Processing file...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${
                      isDragging ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      or click to browse
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                <p>Supported formats: Excel (.xlsx, .xls)</p>
                <p className="mt-1">
                  Need a template?{' '}
                  <button
                    onClick={() => setActiveTab('template')}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View format guide
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Parse Errors</span>
                  </div>
                  <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                    {parseErrors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {parsedRows.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total: {parsedRows.length} rows
                  </span>
                  <span className="text-green-700 dark:text-green-400">
                    Valid: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-red-700 dark:text-red-400">
                      Invalid: {invalidCount}
                    </span>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 w-8">
                          #
                        </th>
                        {templateInfo.headers.map((header) => (
                          <th
                            key={header}
                            className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
                          >
                            {header}
                          </th>
                        ))}
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 w-16">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                            !row.isValid ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                          }`}
                        >
                          <td className="px-2 py-1.5 text-gray-500 dark:text-gray-500">
                            {rowIdx + 1}
                          </td>
                          {templateInfo.headers.map((header) => (
                            <td
                              key={header}
                              className="px-2 py-1.5 text-gray-700 dark:text-gray-300 max-w-32 truncate"
                              title={row.data[header] || ''}
                            >
                              {row.data[header] || '-'}
                            </td>
                          ))}
                          <td className="px-2 py-1.5">
                            {row.isValid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span
                                className="flex items-center gap-1 text-red-500"
                                title={row.errors.join(', ')}
                              >
                                <AlertCircle className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Data */}
              {parsedRows.length === 0 && parseErrors.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No data to preview</p>
                  <p className="text-xs mt-1">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Upload an Excel file
                    </button>
                    {' '}to get started
                  </p>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className={`p-3 rounded-lg ${
                  importResult.success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    importResult.success
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {importResult.success ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{importResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'preview' && invalidCount > 0 && (
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipInvalid}
                  onChange={(e) => setSkipInvalid(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                Skip invalid rows
              </label>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'preview' && parsedRows.length > 0 && userCanImport && (
              <button
                onClick={handleImport}
                disabled={isImporting || (skipInvalid && validCount === 0)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isImporting ? 'Importing...' : `Import ${skipInvalid ? validCount : parsedRows.length} ${entityName}`}
              </button>
            )}
            {activeTab === 'template' && (
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Continue to Upload
              </button>
            )}
            {activeTab === 'upload' && userCanImport && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isParsing ? 'Processing...' : 'Select File'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
