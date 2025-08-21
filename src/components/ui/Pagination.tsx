import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  label?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  page, 
  totalPages, 
  onPrev, 
  onNext, 
  label,
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};