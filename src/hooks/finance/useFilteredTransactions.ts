import { useMemo } from 'react';
import { useExpenseStore } from '../../stores/expenseStore';
import { useIncomeStore } from '../../stores/incomeStore';
import { parseLocalDate } from '../../utils/dateFormat';

interface FilteredTransactionsParams {
  startDate: Date;
  endDate: Date;
}

interface FilteredTransactionsResult {
  filteredExpenses: ReturnType<typeof useExpenseStore>['expenses'];
  filteredIncomes: ReturnType<typeof useIncomeStore>['incomes'];
}

export const useFilteredTransactions = ({
  startDate,
  endDate
}: FilteredTransactionsParams): FilteredTransactionsResult => {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();

  return useMemo(() => {
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = parseLocalDate(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    const filteredIncomes = incomes.filter(income => {
      const incomeDate = parseLocalDate(income.date);
      return incomeDate >= startDate && incomeDate <= endDate;
    });

    return { filteredExpenses, filteredIncomes };
  }, [expenses, incomes, startDate, endDate]);
};