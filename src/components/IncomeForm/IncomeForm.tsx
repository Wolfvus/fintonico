import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useIncomeStore } from '../../stores/incomeStore';
import { Calendar, DollarSign, Clock, ChevronDown, Plus, PenTool } from 'lucide-react';
import { getTodayLocalString } from '../../utils/dateFormat';
import { sanitizeDescription } from '../../utils/sanitization';
import { useCurrencyInput } from '../../hooks/useCurrencyInput';
import { AmountCurrencyInput } from '../Shared/AmountCurrencyInput';
import { FormField } from '../Shared/FormField';
import { formStyles } from '../../styles/formStyles';
import { useLedgerStore } from '../../stores/ledgerStore';
import { shallow } from 'zustand/shallow';

export const IncomeForm: React.FC = () => {
  const [source, setSource] = useState('');
  const [frequency, setFrequency] = useState<'one-time' | 'weekly' | 'monthly' | 'yearly'>('one-time');
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [date, setDate] = useState(getTodayLocalString());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addIncome } = useIncomeStore();
  const {
    amount,
    displayAmount,
    currency,
    handleAmountChange,
    handleCurrencyChange,
    reset: resetCurrency
  } = useCurrencyInput();

  const allAccounts = useLedgerStore(state => state.accounts, shallow);
  const depositAccounts = useMemo(() => (
    allAccounts.filter(acc => acc.nature === 'asset' || acc.nature === 'liability')
  ), [allAccounts]);

  const defaultDepositAccountId = useMemo(() => {
    if (!depositAccounts.length) return '';
    return (
      depositAccounts.find(account => account.id === 'cash') ||
      depositAccounts.find(account => account.id === 'checking') ||
      depositAccounts[0]
    )?.id ?? '';
  }, [depositAccounts]);

  const [depositAccountId, setDepositAccountId] = useState(defaultDepositAccountId);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFrequencyDropdown(false);
      }
    };

    if (showFrequencyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFrequencyDropdown]);

  useEffect(() => {
    if (!depositAccountId && defaultDepositAccountId) {
      setDepositAccountId(defaultDepositAccountId);
    }
  }, [defaultDepositAccountId, depositAccountId]);

  const FREQUENCY_CONFIG = {
    'one-time': {
      label: 'One-Time',
      color: '#10B981',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-500',
      description: 'Single payment',
      icon: DollarSign
    },
    'weekly': {
      label: 'Weekly',
      color: '#10B981',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-500',
      description: 'Every week',
      icon: Clock
    },
    'monthly': {
      label: 'Monthly',
      color: '#10B981',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-500',
      description: 'Every month',
      icon: Clock
    },
    'yearly': {
      label: 'Yearly',
      color: '#10B981',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-500',
      description: 'Every year',
      icon: Clock
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    
    if (!source.trim()) {
      newErrors.source = 'Income source required';
    }
    
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Valid amount required';
    }
    
    if (!date) {
      newErrors.date = 'Date required';
    }

    if (!depositAccountId && !defaultDepositAccountId) {
      newErrors.depositAccountId = 'Select a destination account';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addIncome({
        source: sanitizeDescription(source),
        amount: amountNum,
        currency,
        frequency,
        date,
        depositAccountId: depositAccountId || defaultDepositAccountId
      });
      
      // Reset form
      setSource('');
      resetCurrency();
      setFrequency('one-time');
      setDate(getTodayLocalString());
      setDepositAccountId(defaultDepositAccountId);
      
    } catch (error) {
      console.error('Failed to add income:', error);
      setErrors({ submit: 'Failed to add income. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={formStyles.card}>
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Income</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4">
        <FormField
          label="Income Source"
          icon={PenTool}
          value={source}
          onChange={setSource}
          placeholder="Main Salary, Freelance..."
          maxLength={30}
          autoFocus
          error={errors.source}
          className="space-y-2.5 sm:space-y-2"
        />

        <AmountCurrencyInput
          displayAmount={displayAmount}
          currency={currency}
          onAmountChange={handleAmountChange}
          onCurrencyChange={handleCurrencyChange}
          amountError={errors.amount}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Deposited to account
          </label>
          <select
            value={depositAccountId || ''}
            onChange={(event) => setDepositAccountId(event.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-blue-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-gray-500 focus:ring-blue-200 dark:focus:ring-gray-600"
            disabled={!depositAccounts.length}
            required
          >
            {depositAccounts.length === 0 && <option value="">No accounts available</option>}
            {depositAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.depositAccountId && (
            <p className={formStyles.error}>{errors.depositAccountId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Frequency
          </label>
          
          {/* One-Time Selected by Default */}
          <div className="space-y-2">
            <div 
              onClick={() => {
                setFrequency('one-time');
                setShowFrequencyDropdown(false);
              }}
              className={`flex items-center p-2 rounded-md border cursor-pointer transition-all ${
              frequency === 'one-time' 
                ? `${FREQUENCY_CONFIG['one-time'].bgClass} ${FREQUENCY_CONFIG['one-time'].borderClass}` 
                : 'border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-gray-700'
            }`}>
              
              <div className="mr-2 flex-shrink-0">
                <DollarSign 
                  className={`w-4 h-4 ${
                    frequency === 'one-time' 
                      ? FREQUENCY_CONFIG['one-time'].textClass 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} 
                />
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  frequency === 'one-time' 
                    ? FREQUENCY_CONFIG['one-time'].textClass 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  One-Time
                </span>
                <span className={`text-xs ${
                  frequency === 'one-time' 
                    ? 'text-gray-600 dark:text-gray-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  · Single payment
                </span>
              </div>
            </div>

            {/* Recurring Options Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                className={`w-full flex items-center justify-between p-2 border rounded-md transition-all ${
                  frequency !== 'one-time' 
                    ? `${FREQUENCY_CONFIG[frequency].bgClass} ${FREQUENCY_CONFIG[frequency].borderClass}` 
                    : 'bg-blue-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${
                    frequency !== 'one-time' 
                      ? FREQUENCY_CONFIG[frequency].textClass 
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    frequency !== 'one-time' 
                      ? FREQUENCY_CONFIG[frequency].textClass 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {frequency !== 'one-time' 
                      ? `${FREQUENCY_CONFIG[frequency].label} · ${FREQUENCY_CONFIG[frequency].description}`
                      : 'Or select recurring frequency...'
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  frequency !== 'one-time' 
                    ? FREQUENCY_CONFIG[frequency].textClass 
                    : 'text-gray-400'
                } ${showFrequencyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showFrequencyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                  {Object.entries(FREQUENCY_CONFIG)
                    .filter(([key]) => key !== 'one-time')
                    .map(([key, config]) => (
                    <div
                      key={key}
                      onClick={() => {
                        setFrequency(key as 'one-time' | 'weekly' | 'monthly' | 'yearly');
                        setShowFrequencyDropdown(false);
                      }}
                      className={`flex items-center p-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        frequency === key ? `${config.bgClass}` : ''
                      }`}
                    >
                      
                      <div className="mr-2 flex-shrink-0">
                        <Clock 
                          className={`w-4 h-4 ${
                            frequency === key 
                              ? config.textClass 
                              : 'text-gray-400 dark:text-gray-500'
                          }`} 
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          frequency === key 
                            ? config.textClass 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {config.label}
                        </span>
                        <span className={`text-xs ${
                          frequency === key 
                            ? 'text-gray-600 dark:text-gray-300' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          · {config.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <FormField
          label="Date"
          icon={Calendar}
          type="date"
          value={date}
          onChange={setDate}
          error={errors.date}
          className="space-y-2.5 sm:space-y-2"
        />

        <button
          type="submit"
          disabled={isSubmitting || !source.trim() || !amount}
          className="w-full text-white font-medium py-3 px-4 rounded-lg transition-all 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            'Add Income'
          )}
        </button>

        {errors.submit && (
          <p className="text-sm text-center text-red-500">{errors.submit}</p>
        )}
      </form>
    </div>
  );
};
