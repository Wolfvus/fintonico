// Hook that provides memoized combined transactions using finance selectors
import { useMemo } from 'react';
import { getCombinedTransactions } from '../../selectors/finance';
import { useLedgerStore } from '../../stores/ledgerStore';
import type { TransactionVM } from '../../types/view/TransactionVM';

interface CombinedTransactionsParams {
  startDate: Date;
  endDate: Date;
  entryFilter: 'all' | 'income' | 'expense';
}

export const useCombinedTransactions = ({
  startDate,
  endDate,
  entryFilter
}: CombinedTransactionsParams): TransactionVM[] => {
  // Get transactions to trigger recalculation when they change
  const transactions = useLedgerStore(state => state.transactions);
  
  return useMemo(() => {
    return getCombinedTransactions(startDate, endDate, entryFilter);
  }, [startDate, endDate, entryFilter, transactions.length]);
};