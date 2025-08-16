import { useState, useCallback } from 'react';
import { formatCurrencyInput } from '../utils/currency';
import { useCurrencyStore } from '../stores/currencyStore';

export const useCurrencyInput = (initialCurrency = 'MXN') => {
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [currency, setCurrency] = useState(initialCurrency);
  const { getCurrencySymbol } = useCurrencyStore();

  const handleAmountChange = useCallback((value: string) => {
    const { rawValue, displayValue } = formatCurrencyInput(
      value,
      getCurrencySymbol(currency)
    );
    
    if (rawValue !== null) {
      setAmount(rawValue);
      setDisplayAmount(displayValue);
    }
  }, [currency, getCurrencySymbol]);

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    if (amount) {
      const { displayValue } = formatCurrencyInput(
        amount,
        getCurrencySymbol(newCurrency)
      );
      setDisplayAmount(displayValue);
    }
  }, [amount, getCurrencySymbol]);

  const reset = useCallback(() => {
    setAmount('');
    setDisplayAmount('');
    setCurrency(initialCurrency);
  }, [initialCurrency]);

  return {
    amount,
    displayAmount,
    currency,
    handleAmountChange,
    handleCurrencyChange,
    reset
  };
};