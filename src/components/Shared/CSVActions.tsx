import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface CSVActionsProps {
  onExport?: () => void; // Made optional - exports disabled for now
  onImport: (file: File) => Promise<{ success: boolean; message: string; count?: number }>;
  exportLabel?: string;
  importLabel?: string;
  entityName: string; // e.g., "expenses", "income", "accounts"
}

export const CSVActions: React.FC<CSVActionsProps> = ({
  onImport,
  importLabel = 'Import CSV',
  entityName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setImportResult({
        success: false,
        message: 'Please select a CSV file (.csv extension)',
      });
      setShowResultModal(true);
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(file);
      setImportResult(result);
      setShowResultModal(true);
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import file',
      });
      setShowResultModal(true);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const closeModal = () => {
    setShowResultModal(false);
    setImportResult(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Import ${entityName} from CSV`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isImporting ? 'Importing...' : importLabel}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Result Modal */}
      {showResultModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Import Result
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {importResult?.success ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        importResult?.success
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {importResult?.success ? 'Import Successful' : 'Import Failed'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {importResult?.message}
                    </p>
                    {importResult?.count !== undefined && importResult.count > 0 && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                        {importResult.count} {entityName} imported
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
