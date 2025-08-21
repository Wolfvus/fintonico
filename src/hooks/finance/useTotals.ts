// Hook that calculates total expenses and income for filtered transactions with currency conversion
import { useMemo } from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';

interface TotalsParams {
  filteredExpenses: any[];
  filteredIncomes: any[];
}

interface TotalsResult {
  periodExpenses: number;
  periodIncome: number;
}

export const useTotals = ({
  filteredExpenses,
  filteredIncomes
}: TotalsParams): TotalsResult => {
  const { baseCurrency, convertAmount } = useCurrencyStore();

  return useMemo(() => {
    const periodExpenses = filteredExpenses.reduce((sum: number, expense: any) => 
      sum + convertAmount(expense.amount, expense.currency, baseCurrency), 0
    );
    
    const periodIncome = filteredIncomes.reduce((sum: number, income: any) => 
      sum + convertAmount(income.amount, income.currency, baseCurrency), 0
    );

    return { periodExpenses, periodIncome };
  }, [filteredExpenses, filteredIncomes, baseCurrency, convertAmount]);
};