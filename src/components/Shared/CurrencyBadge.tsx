import React from 'react';

interface CurrencyBadgeProps {
  currency: string;
  baseCurrency: string;
  className?: string;
}

export const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({ 
  currency, 
  baseCurrency, 
  className = '' 
}) => {
  // Only show badge if currency is different from base
  if (currency === baseCurrency) return null;
  
  return (
    <span className={`text-xs text-gray-400 dark:text-gray-500 ${className}`}>
      {currency}
    </span>
  );
};