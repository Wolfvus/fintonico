import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';
import { useLedgerStore } from './ledgerStore';
import { Money } from '../domain/money';
import type { Expense, ExpenseRating } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';

export interface NewExpense {
  what: string;
  amount: number;
  currency: string;
  rating: ExpenseRating;
  date?: string;
  recurring?: boolean;
}

interface ExpenseState {
  expenses: Expense[];
  loading: boolean;
  addExpense: (expense: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => void;
  getMonthlyTotal: () => number;
  getExpensesByRating: () => Record<ExpenseRating, number>;
  // Internal method to derive from ledger
  _deriveExpensesFromLedger: () => Expense[];
}

const STORAGE_KEY = 'fintonico-expenses';

const storage = {
  get: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      
      // Validate and sanitize each expense
      return parsed.filter((expense: any) => {
        if (typeof expense !== 'object' || !expense) return false;
        const whatResult = sanitizeDescription(expense.what || '');
        const amountResult = validateAmount(String(expense.amount || ''));
        const dateResult = validateDate(expense.date || '');
        return whatResult && amountResult.isValid && dateResult.isValid;
      }).map((expense: any) => ({
        id: String(expense.id || crypto.randomUUID()),
        what: sanitizeDescription(expense.what),
        amount: validateAmount(String(expense.amount)).sanitizedValue,
        currency: String(expense.currency || 'MXN'),
        rating: String(expense.rating || 'non_essential') as ExpenseRating,
        date: expense.date,
        created_at: String(expense.created_at || new Date().toISOString()),
        recurring: Boolean(expense.recurring)
      }));
    } catch (error) {
      console.error('Error loading expenses from localStorage:', error);
      return [];
    }
  },
  set: (expenses: Expense[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to localStorage:', error);
    }
  }
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: storage.get(),
  loading: false,

  // Derive expenses from ledger transactions
  _deriveExpensesFromLedger: () => {
    const ledgerStore = useLedgerStore.getState();
    const transactions = ledgerStore.getTransactions();
    const expenseAccounts = ledgerStore.getAccountsByNature('expense');
    
    // Convert transactions with expense postings to Expense format
    const derivedExpenses: Expense[] = [];
    
    for (const transaction of transactions) {
      for (const posting of transaction.postings) {
        // Use original amount for display, check if this is an expense posting
        const originalAmount = posting.originalDebitAmount;
        if (originalAmount && expenseAccounts.some(acc => acc.id === posting.accountId)) {
          const account = ledgerStore.getAccount(posting.accountId);
          if (account) {
            // Map account names to expense ratings
            const getExpenseRating = (accountName: string): ExpenseRating => {
              const name = accountName.toLowerCase();
              if (name.includes('food') || name.includes('housing') || name.includes('utilities') || name.includes('healthcare')) {
                return 'essential';
              } else if (name.includes('transport') || name.includes('shopping')) {
                return 'important';
              } else {
                return 'non_essential';
              }
            };
            
            // Ensure originalAmount is a Money object
            const amount = typeof originalAmount.toMajorUnits === 'function' 
              ? originalAmount.toMajorUnits() 
              : Number(originalAmount) || 0;
            const currency = typeof originalAmount.getCurrency === 'function'
              ? originalAmount.getCurrency()
              : 'MXN'; // Default to MXN
              
            // Ensure dates are valid Date objects
            const transactionDate = transaction.date instanceof Date 
              ? transaction.date 
              : new Date(transaction.date || Date.now());
            const createdAtDate = transaction.createdAt instanceof Date 
              ? transaction.createdAt 
              : new Date(transaction.createdAt || Date.now());
              
            derivedExpenses.push({
              id: `${transaction.id}-${posting.id}`,
              what: transaction.description,
              amount,
              currency,
              rating: getExpenseRating(account.name),
              date: transactionDate.toISOString().split('T')[0],
              created_at: createdAtDate.toISOString(),
              recurring: false
            });
          }
        }
      }
    }
    
    return derivedExpenses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addExpense: async (data: NewExpense) => {
    const ledgerStore = useLedgerStore.getState();
    
    // Ensure default accounts exist
    ledgerStore.initializeDefaultAccounts();
    
    // Map expense rating to appropriate expense account
    const getExpenseAccountId = (rating: ExpenseRating): string => {
      switch (rating) {
        case 'essential':
          return 'food'; // Default to food for essential
        case 'important':
          return 'transport'; // Default to transport for important
        case 'non_essential':
          return 'entertainment'; // Default to entertainment for non-essential
        default:
          return 'other-expense';
      }
    };
    
    // Find or use default accounts
    const cashAccount = ledgerStore.getAccount('cash') || ledgerStore.getAccountsByNature('asset')[0];
    const expenseAccountId = getExpenseAccountId(data.rating);
    const expenseAccount = ledgerStore.getAccount(expenseAccountId) || ledgerStore.getAccountsByNature('expense')[0];
    
    if (!cashAccount || !expenseAccount) {
      throw new Error('Required accounts not found');
    }
    
    const amount = Money.fromMajorUnits(data.amount, data.currency);
    const date = data.date ? new Date(data.date) : new Date();
    
    // Add transaction to ledger
    ledgerStore.addExpenseTransaction(
      data.what,
      amount,
      expenseAccount.id,
      cashAccount.id,
      date
    );
    
    // Update local state to reflect changes
    set({ expenses: get()._deriveExpensesFromLedger() });
  },

  deleteExpense: (id: string) => {
    const ledgerStore = useLedgerStore.getState();
    
    // The ID format is: transactionId-postingId where both are UUIDs
    // UUIDs are in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
    // So we need to extract the first 36 characters as the transaction ID
    let transactionId: string;
    
    if (id.length > 36) {
      // Composite ID format: extract first UUID
      transactionId = id.substring(0, 36);
    } else {
      // Just a transaction ID
      transactionId = id;
    }
    
    const transaction = ledgerStore.getTransaction(transactionId);
    
    if (transaction) {
      ledgerStore.deleteTransaction(transactionId);
      // Update local state
      set({ expenses: get()._deriveExpensesFromLedger() });
    } else {
      // Fallback: delete from legacy storage
      const expenses = get().expenses.filter(e => e.id !== id);
      set({ expenses });
      storage.set(expenses);
    }
  },

  getMonthlyTotal: () => {
    const now = new Date();
    const { baseCurrency } = useCurrencyStore.getState();
    
    // Get expenses from ledger for current month
    const ledgerStore = useLedgerStore.getState();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const incomeStatement = ledgerStore.getIncomeStatement(startOfMonth, endOfMonth, baseCurrency);
    return incomeStatement.totalExpenses.toMajorUnits();
  },

  getExpensesByRating: () => {
    const { baseCurrency, convertAmount } = useCurrencyStore.getState();
    const expenses = get()._deriveExpensesFromLedger();
    return expenses.reduce((acc, e) => {
      const convertedAmount = convertAmount(e.amount, e.currency, baseCurrency);
      acc[e.rating] = (acc[e.rating] || 0) + convertedAmount;
      return acc;
    }, {} as Record<ExpenseRating, number>);
  }
}));