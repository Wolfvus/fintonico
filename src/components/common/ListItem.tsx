import React from 'react';
import { Trash2 } from 'lucide-react';
import { CurrencyBadge } from '../Shared/CurrencyBadge';
import { formatDate } from '../../utils/dateFormat';
import { useCurrencyStore } from '../../stores/currencyStore';

type ListItemVariant = 'income' | 'expense' | 'asset' | 'liability' | 'neutral';

interface ListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  currency: string;
  date?: string;
  variant?: ListItemVariant;
  tags?: Array<{
    label: string;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  }>;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  children?: React.ReactNode;
}

const variantStyles: Record<ListItemVariant, { dot: string; amount: string; prefix: string }> = {
  income: {
    dot: 'bg-green-500',
    amount: 'text-green-600 dark:text-green-400',
    prefix: '+',
  },
  expense: {
    dot: 'bg-red-500',
    amount: 'text-red-600 dark:text-red-400',
    prefix: '-',
  },
  asset: {
    dot: 'bg-green-500',
    amount: 'text-green-600 dark:text-green-400',
    prefix: '+',
  },
  liability: {
    dot: 'bg-red-500',
    amount: 'text-red-600 dark:text-red-400',
    prefix: '-',
  },
  neutral: {
    dot: 'bg-gray-500',
    amount: 'text-gray-600 dark:text-gray-400',
    prefix: '',
  },
};

const tagColorStyles: Record<string, string> = {
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
};

export const ListItem: React.FC<ListItemProps> = ({
  id,
  title,
  subtitle,
  amount,
  currency,
  date,
  variant = 'neutral',
  tags = [],
  onDelete,
  onClick,
  children,
}) => {
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore();
  const styles = variantStyles[variant];
  const convertedAmount = convertAmount(amount, currency, baseCurrency);
  const isClickable = !!onClick;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group border border-gray-200 dark:border-gray-700 ${
        isClickable ? 'cursor-pointer' : ''
      }`}
      onClick={onClick ? () => onClick(id) : undefined}
    >
      {/* Desktop Layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-3 sm:flex-1 sm:min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {title}
            </p>
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`text-xs px-1.5 py-0.5 rounded-full ${tagColorStyles[tag.color]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block sm:hidden w-full">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-white flex-1 min-w-0 pr-2">
            {title}
          </p>
          <p className={`text-sm font-medium flex-shrink-0 ${styles.amount}`}>
            {styles.prefix}
            {formatAmount(convertedAmount)}
          </p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 flex-1 min-w-0 flex-wrap">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`text-xs px-1.5 py-0.5 rounded-full ${tagColorStyles[tag.color]}`}
              >
                {tag.label}
              </span>
            ))}
            {subtitle && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {date && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(date)}
              </p>
            )}
            <CurrencyBadge currency={currency} baseCurrency={baseCurrency} />
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Right Section */}
      <div className="hidden sm:flex sm:items-center sm:gap-3 sm:flex-shrink-0">
        <div className="text-right">
          <p className={`text-sm font-medium ${styles.amount}`}>
            {styles.prefix}
            {formatAmount(convertedAmount)}
          </p>
          {date && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(date)}
            </p>
          )}
          <CurrencyBadge currency={currency} baseCurrency={baseCurrency} />
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Custom Children */}
      {children && <div className="mt-2 px-1 w-full">{children}</div>}
    </div>
  );
};
