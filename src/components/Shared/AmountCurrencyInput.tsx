import React from 'react';
import { DollarSign, Globe } from 'lucide-react';
import { useCurrencyStore } from '../../stores/currencyStore';

interface AmountCurrencyInputProps {
  displayAmount: string;
  currency: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (currency: string) => void;
  amountError?: string;
  className?: string;
}

export const AmountCurrencyInput: React.FC<AmountCurrencyInputProps> = ({
  displayAmount,
  currency,
  onAmountChange,
  onCurrencyChange,
  amountError,
  className = "grid grid-cols-2 gap-3"
}) => {
  const { currencies, getCurrencySymbol } = useCurrencyStore();

  return (
    <div className={className}>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          Amount
        </label>
        <input
          type="text"
          value={displayAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                   transition-colors text-gray-900 dark:text-white
                   border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
          placeholder={`${getCurrencySymbol(currency)}0.00`}
        />
        {amountError && (
          <p className="text-xs mt-1 text-red-500">{amountError}</p>
        )}
      </div>
      
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700
                   transition-colors text-gray-900 dark:text-white
                   border-blue-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600"
        >
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.symbol}{curr.code}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};