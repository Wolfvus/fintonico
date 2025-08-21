// Hook that combines and sorts filtered expenses/incomes into unified transaction view models
import { useMemo } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';
import type { TransactionVM } from '../../types/view/TransactionVM';

interface CombinedTransactionsParams {
  filteredExpenses: any[];
  filteredIncomes: any[];
  entryFilter: 'all' | 'income' | 'expense';
}

export const useCombinedTransactions = ({
  filteredExpenses,
  filteredIncomes,
  entryFilter
}: CombinedTransactionsParams): TransactionVM[] => {
  const { convertAmount, baseCurrency, formatAmount } = useCurrencyStore();

  return useMemo(() => {
    const allItems: TransactionVM[] = [
      ...filteredExpenses.map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        description: expense.what,
        amount: expense.amount,
        currency: expense.currency,
        date: expense.date,
        category: expense.rating,
        recurring: expense.recurring,
        formattedAmount: `-${formatAmount(convertAmount(expense.amount, expense.currency, baseCurrency))}`
      })),
      ...filteredIncomes.map(income => ({
        id: income.id,
        type: 'income' as const,
        description: income.source,
        amount: income.amount,
        currency: income.currency,
        date: income.date,
        category: income.frequency,
        recurring: false,
        formattedAmount: `+${formatAmount(convertAmount(income.amount, income.currency, baseCurrency))}`
      }))
    ];

    return allItems
      .filter(item => {
        if (entryFilter === 'all') return true;
        return item.type === entryFilter;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses, filteredIncomes, entryFilter, convertAmount, baseCurrency, formatAmount]);
};