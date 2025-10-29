import { useState, useCallback, useEffect, useRef } from 'react';
import { formatCurrencyInput } from '../utils/currency';
import { useCurrencyStore } from '../stores/currencyStore';

export const useCurrencyInput = (initialCurrency?: string) => {
  const { getCurrencySymbol, baseCurrency } = useCurrencyStore();

  const getDefaultCurrency = useCallback(() => initialCurrency ?? baseCurrency, [initialCurrency, baseCurrency]);

  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [currency, setCurrency] = useState(() => getDefaultCurrency());

  const previousBaseCurrency = useRef(baseCurrency);

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
    setCurrency(getDefaultCurrency());
  }, [getDefaultCurrency]);

  useEffect(() => {
    if (initialCurrency) {
      previousBaseCurrency.current = baseCurrency;
      return;
    }

    if (previousBaseCurrency.current === baseCurrency) {
      return;
    }

    previousBaseCurrency.current = baseCurrency;
    setCurrency(baseCurrency);

    if (amount) {
      const { displayValue } = formatCurrencyInput(amount, getCurrencySymbol(baseCurrency));
      setDisplayAmount(displayValue);
    } else {
      setDisplayAmount('');
    }
  }, [amount, baseCurrency, getCurrencySymbol, initialCurrency]);

  return {
    amount,
    displayAmount,
    currency,
    handleAmountChange,
    handleCurrencyChange,
    reset
  };
};
