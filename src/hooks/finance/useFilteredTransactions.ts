// Hook that provides memoized filtered transactions using finance selectors
import { useMemo } from 'react';
import { getCombinedTransactions } from '../../selectors/finance';
import type { TransactionVM } from '../../types/view/TransactionVM';

interface FilteredTransactionsParams {
  startDate: Date;
  endDate: Date;
}

interface FilteredTransactionsResult {
  filteredExpenses: TransactionVM[];
  filteredIncomes: TransactionVM[];
}

export const useFilteredTransactions = ({
  startDate,
  endDate
}: FilteredTransactionsParams): FilteredTransactionsResult => {
  return useMemo(() => {
    const allTransactions = getCombinedTransactions(startDate, endDate, 'all');
    
    const filteredExpenses = allTransactions.filter(tx => tx.type === 'expense');
    const filteredIncomes = allTransactions.filter(tx => tx.type === 'income');

    return { filteredExpenses, filteredIncomes };
  }, [startDate, endDate]);
};