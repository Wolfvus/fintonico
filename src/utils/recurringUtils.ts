import type { Expense } from '../types';
import type { Income } from '../types';

// Recurring utils only work with localStorage (DEV_MODE).
// In production, recurring transactions should be handled server-side or via Supabase.
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEV_MODE === 'true';

export const generateRecurringTransactions = () => {
  if (!DEV_MODE) return; // Skip in production - localStorage won't have Supabase data

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];

  // Generate recurring expenses
  generateRecurringExpenses(firstDayOfMonth, currentYear, currentMonth);

  // Generate recurring income (for non-investment income)
  generateRecurringIncome(firstDayOfMonth, currentYear, currentMonth);
};

const generateRecurringExpenses = (firstDayOfMonth: string, currentYear: number, currentMonth: number) => {
  try {
    // Get expenses from localStorage
    const savedExpenses = localStorage.getItem('fintonico-expenses');
    const expenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : [];

    // Find recurring expenses (template expenses)
    const recurringExpenses = expenses.filter(expense => expense.recurring);

    if (recurringExpenses.length === 0) return;

    // Check if we already have generated expenses for this month
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const existingMonthlyExpenses = expenses.filter(expense =>
      expense.date.startsWith(monthPrefix) &&
      expense.id.startsWith('recurring-expense-')
    );

    // Generate new recurring expenses for this month
    const newRecurringExpenses = recurringExpenses
      .filter(recurringExpense => {
        // Check if this specific recurring expense was already generated this month
        return !existingMonthlyExpenses.some(existing =>
          existing.id.includes(recurringExpense.id) && existing.id.includes(`${currentYear}-${currentMonth}`)
        );
      })
      .map(recurringExpense => ({
        ...recurringExpense,
        id: `recurring-expense-${recurringExpense.id}-${currentYear}-${currentMonth}`,
        date: firstDayOfMonth,
        created_at: new Date().toISOString(),
        recurring: false // The generated instance is not recurring, only the template is
      }));

    if (newRecurringExpenses.length > 0) {
      const allExpenses = [...newRecurringExpenses, ...expenses];
      localStorage.setItem('fintonico-expenses', JSON.stringify(allExpenses));
    }
  } catch (err) {
    console.error('Failed to generate recurring expenses:', err);
  }
};

const generateRecurringIncome = (firstDayOfMonth: string, currentYear: number, currentMonth: number) => {
  try {
    // Get incomes from localStorage
    const savedIncomes = localStorage.getItem('fintonico-incomes');
    const incomes: Income[] = savedIncomes ? JSON.parse(savedIncomes) : [];

    // Find recurring monthly income (excluding investment yields which are handled separately)
    const recurringIncomes = incomes.filter(income =>
      income.frequency === 'monthly' &&
      !income.source.startsWith('Investment yield:')
    );

    if (recurringIncomes.length === 0) return;

    // Check if we already have generated incomes for this month
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const existingMonthlyIncomes = incomes.filter(income =>
      income.date.startsWith(monthPrefix) &&
      income.id.startsWith('recurring-income-')
    );

    // Generate new recurring incomes for this month
    const newRecurringIncomes = recurringIncomes
      .filter(recurringIncome => {
        // Check if this specific recurring income was already generated this month
        return !existingMonthlyIncomes.some(existing =>
          existing.id.includes(recurringIncome.id) && existing.id.includes(`${currentYear}-${currentMonth}`)
        );
      })
      .map(recurringIncome => ({
        ...recurringIncome,
        id: `recurring-income-${recurringIncome.id}-${currentYear}-${currentMonth}`,
        date: firstDayOfMonth,
        created_at: new Date().toISOString(),
      }));

    if (newRecurringIncomes.length > 0) {
      const allIncomes = [...newRecurringIncomes, ...incomes];
      localStorage.setItem('fintonico-incomes', JSON.stringify(allIncomes));
    }
  } catch (err) {
    console.error('Failed to generate recurring income:', err);
  }
};

// Function to check if we need to generate recurring transactions
export const checkAndGenerateRecurring = () => {
  if (!DEV_MODE) return; // Skip in production

  try {
    const lastCheck = localStorage.getItem('fintonico-last-recurring-check');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    if (lastCheck !== currentMonthKey) {
      generateRecurringTransactions();
      localStorage.setItem('fintonico-last-recurring-check', currentMonthKey);
    }
  } catch (err) {
    console.error('Failed to check/generate recurring transactions:', err);
  }
};
