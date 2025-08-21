// Ledger store - owns all transactions and postings for double-entry accounting
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CommonTransactions } from '../domain/ledger';
import type { Account, Transaction, AccountBalance, TrialBalance, BalanceSheet, IncomeStatement, AccountNature } from '../domain/ledger';
import { Money } from '../domain/money';

interface LedgerState {
  // Core data
  accounts: Account[];
  transactions: Transaction[];
  
  // Account operations
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccount: (id: string) => Account | undefined;
  getAccountsByNature: (nature: AccountNature) => Account[];
  
  // Transaction operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransaction: (id: string) => Transaction | undefined;
  getTransactions: (filters?: TransactionFilters) => Transaction[];
  
  // Balance calculations
  getAccountBalance: (accountId: string, asOfDate?: Date) => Money;
  getAllAccountBalances: (asOfDate?: Date) => AccountBalance[];
  
  // Financial statements
  getTrialBalance: (asOfDate: Date) => TrialBalance;
  getBalanceSheet: (asOfDate: Date, baseCurrency: string) => BalanceSheet;
  getIncomeStatement: (fromDate: Date, toDate: Date, baseCurrency: string) => IncomeStatement;
  
  // Common transaction helpers
  addIncomeTransaction: (description: string, amount: Money, cashAccountId: string, incomeAccountId: string, date: Date) => void;
  addExpenseTransaction: (description: string, amount: Money, expenseAccountId: string, cashAccountId: string, date: Date) => void;
  addTransferTransaction: (description: string, amount: Money, fromAccountId: string, toAccountId: string, date: Date) => void;
  
  // Default accounts setup
  initializeDefaultAccounts: () => void;
  
  // Utility
  reset: () => void;
}

interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  accountIds?: string[];
  description?: string;
  reference?: string;
  tags?: string[];
}

// Default accounts for chart of accounts
const createDefaultAccounts = (): Account[] => {
  const now = new Date();
  return [
    // Assets
    { id: 'cash', code: '1001', name: 'Cash', nature: 'asset', isActive: true, createdAt: now, updatedAt: now },
    { id: 'checking', code: '1002', name: 'Checking Account', nature: 'asset', isActive: true, createdAt: now, updatedAt: now },
    { id: 'savings', code: '1003', name: 'Savings Account', nature: 'asset', isActive: true, createdAt: now, updatedAt: now },
    { id: 'investments', code: '1200', name: 'Investments', nature: 'asset', isActive: true, createdAt: now, updatedAt: now },
    
    // Liabilities
    { id: 'credit-card', code: '2001', name: 'Credit Card', nature: 'liability', isActive: true, createdAt: now, updatedAt: now },
    { id: 'loan', code: '2002', name: 'Loan Payable', nature: 'liability', isActive: true, createdAt: now, updatedAt: now },
    
    // Equity
    { id: 'retained-earnings', code: '3001', name: 'Retained Earnings', nature: 'equity', isActive: true, createdAt: now, updatedAt: now },
    
    // Income
    { id: 'salary', code: '4001', name: 'Salary Income', nature: 'income', isActive: true, createdAt: now, updatedAt: now },
    { id: 'freelance', code: '4002', name: 'Freelance Income', nature: 'income', isActive: true, createdAt: now, updatedAt: now },
    { id: 'investment-income', code: '4003', name: 'Investment Income', nature: 'income', isActive: true, createdAt: now, updatedAt: now },
    { id: 'fx-gain', code: '4900', name: 'Foreign Exchange Gain', nature: 'income', isActive: true, createdAt: now, updatedAt: now },
    
    // Expenses
    { id: 'food', code: '5001', name: 'Food & Dining', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'transport', code: '5002', name: 'Transportation', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'housing', code: '5003', name: 'Housing', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'utilities', code: '5004', name: 'Utilities', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'entertainment', code: '5005', name: 'Entertainment', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'healthcare', code: '5006', name: 'Healthcare', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'shopping', code: '5007', name: 'Shopping', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'fx-loss', code: '5900', name: 'Foreign Exchange Loss', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
    { id: 'other-expense', code: '5999', name: 'Other Expenses', nature: 'expense', isActive: true, createdAt: now, updatedAt: now },
  ];
};

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],

      // Account operations
      createAccount: (accountData) => {
        const account: Account = {
          ...accountData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set(state => ({ accounts: [...state.accounts, account] }));
      },

      updateAccount: (id, updates) => {
        set(state => ({
          accounts: state.accounts.map(account =>
            account.id === id
              ? { ...account, ...updates, updatedAt: new Date() }
              : account
          )
        }));
      },

      deleteAccount: (id) => {
        set(state => ({ accounts: state.accounts.filter(account => account.id !== id) }));
      },

      getAccount: (id) => {
        return get().accounts.find(account => account.id === id);
      },

      getAccountsByNature: (nature) => {
        return get().accounts.filter(account => account.nature === nature && account.isActive);
      },

      // Transaction operations
      addTransaction: (transactionData) => {
        const transaction: Transaction = {
          ...transactionData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          postings: transactionData.postings.map(posting => ({
            ...posting,
            id: crypto.randomUUID()
          }))
        };
        set(state => ({ transactions: [...state.transactions, transaction] }));
      },

      updateTransaction: (id, updates) => {
        set(state => ({
          transactions: state.transactions.map(transaction =>
            transaction.id === id
              ? { ...transaction, ...updates, updatedAt: new Date() }
              : transaction
          )
        }));
      },

      deleteTransaction: (id) => {
        set(state => ({ transactions: state.transactions.filter(transaction => transaction.id !== id) }));
      },

      getTransaction: (id) => {
        return get().transactions.find(transaction => transaction.id === id);
      },

      getTransactions: (filters = {}) => {
        let transactions = get().transactions;

        if (filters.dateFrom) {
          transactions = transactions.filter(tx => tx.date >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          transactions = transactions.filter(tx => tx.date <= filters.dateTo!);
        }
        if (filters.accountIds?.length) {
          transactions = transactions.filter(tx =>
            tx.postings.some(posting => filters.accountIds!.includes(posting.accountId))
          );
        }
        if (filters.description) {
          transactions = transactions.filter(tx =>
            tx.description.toLowerCase().includes(filters.description!.toLowerCase())
          );
        }
        if (filters.reference) {
          transactions = transactions.filter(tx =>
            tx.reference?.toLowerCase().includes(filters.reference!.toLowerCase())
          );
        }
        if (filters.tags?.length) {
          transactions = transactions.filter(tx =>
            filters.tags!.some(tag => tx.tags?.includes(tag))
          );
        }

        return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      },

      // Balance calculations using booked amounts for historical consistency
      getAccountBalance: (accountId, asOfDate = new Date()) => {
        const account = get().getAccount(accountId);
        if (!account) {
          return Money.fromMinorUnits(0, 'USD');
        }

        const transactions = get().transactions.filter(tx => tx.date <= asOfDate);
        
        // Use the base currency from the first transaction, or default to USD
        const baseCurrency = transactions[0]?.baseCurrency || 'USD';
        let balance = Money.fromMinorUnits(0, baseCurrency);

        for (const transaction of transactions) {
          for (const posting of transaction.postings) {
            if (posting.accountId === accountId) {
              // Use booked amounts for historical consistency
              if (posting.bookedDebitAmount) {
                // For assets and expenses, debits increase balance
                // For liabilities, income, and equity, debits decrease balance
                if (['asset', 'expense'].includes(account.nature)) {
                  balance = balance.add(posting.bookedDebitAmount);
                } else {
                  balance = balance.subtract(posting.bookedDebitAmount);
                }
              }
              if (posting.bookedCreditAmount) {
                // For assets and expenses, credits decrease balance
                // For liabilities, income, and equity, credits increase balance
                if (['asset', 'expense'].includes(account.nature)) {
                  balance = balance.subtract(posting.bookedCreditAmount);
                } else {
                  balance = balance.add(posting.bookedCreditAmount);
                }
              }
            }
          }
        }

        return balance;
      },

      getAllAccountBalances: (asOfDate = new Date()) => {
        const accounts = get().accounts;
        return accounts.map(account => ({
          accountId: account.id,
          balance: get().getAccountBalance(account.id, asOfDate),
          asOfDate
        }));
      },

      // Financial statements
      getTrialBalance: (asOfDate) => {
        const accounts = get().accounts;
        const balances = accounts.map(account => {
          const balance = get().getAccountBalance(account.id, asOfDate);
          const isNormalDebit = ['asset', 'expense'].includes(account.nature);
          
          return {
            account,
            debitBalance: isNormalDebit && !balance.isNegative() ? balance : 
                         !isNormalDebit && balance.isNegative() ? balance.abs() : null,
            creditBalance: !isNormalDebit && !balance.isNegative() ? balance :
                          isNormalDebit && balance.isNegative() ? balance.abs() : null
          };
        });

        const totalDebits = balances.reduce((sum, item) => 
          item.debitBalance ? sum.add(item.debitBalance) : sum, 
          Money.fromMinorUnits(0, 'USD')
        );
        
        const totalCredits = balances.reduce((sum, item) => 
          item.creditBalance ? sum.add(item.creditBalance) : sum, 
          Money.fromMinorUnits(0, 'USD')
        );

        return {
          asOfDate,
          accounts: balances,
          totalDebits,
          totalCredits,
          isBalanced: totalDebits.equals(totalCredits)
        };
      },

      getBalanceSheet: (asOfDate, baseCurrency) => {
        const accounts = get().accounts;
        const assets = accounts.filter(acc => acc.nature === 'asset').map(account => ({
          account,
          balance: get().getAccountBalance(account.id, asOfDate)
        }));
        
        const liabilities = accounts.filter(acc => acc.nature === 'liability').map(account => ({
          account,
          balance: get().getAccountBalance(account.id, asOfDate)
        }));
        
        const equity = accounts.filter(acc => acc.nature === 'equity').map(account => ({
          account,
          balance: get().getAccountBalance(account.id, asOfDate)
        }));

        const totalAssets = assets.reduce((sum, item) => sum.add(item.balance), Money.fromMinorUnits(0, baseCurrency));
        const totalLiabilities = liabilities.reduce((sum, item) => sum.add(item.balance), Money.fromMinorUnits(0, baseCurrency));
        const totalEquity = equity.reduce((sum, item) => sum.add(item.balance), Money.fromMinorUnits(0, baseCurrency));

        return {
          asOfDate,
          currency: baseCurrency,
          assets,
          liabilities,
          equity,
          totalAssets,
          totalLiabilities,
          totalEquity,
          isBalanced: totalAssets.equals(totalLiabilities.add(totalEquity))
        };
      },

      getIncomeStatement: (fromDate, toDate, baseCurrency) => {
        const accounts = get().accounts;
        
        const incomeAccounts = accounts.filter(acc => acc.nature === 'income');
        const expenseAccounts = accounts.filter(acc => acc.nature === 'expense');

        const income = incomeAccounts.map(account => ({
          account,
          amount: get().getAccountBalance(account.id, toDate)
        }));
        
        const expenses = expenseAccounts.map(account => ({
          account,
          amount: get().getAccountBalance(account.id, toDate)
        }));

        const totalIncome = income.reduce((sum, item) => sum.add(item.amount), Money.fromMinorUnits(0, baseCurrency));
        const totalExpenses = expenses.reduce((sum, item) => sum.add(item.amount), Money.fromMinorUnits(0, baseCurrency));
        const netIncome = totalIncome.subtract(totalExpenses);

        return {
          asOfDate: toDate,
          fromDate,
          currency: baseCurrency,
          income,
          expenses,
          totalIncome,
          totalExpenses,
          netIncome
        };
      },

      // Common transaction helpers
      addIncomeTransaction: (description, amount, cashAccountId, incomeAccountId, date) => {
        // Use the currency of the amount as the base currency for now
        // In a full implementation, this would come from user settings
        const baseCurrency = amount.getCurrency();
        const transaction = CommonTransactions.salary(cashAccountId, incomeAccountId, amount, baseCurrency, date);
        transaction.description = description;
        get().addTransaction(transaction);
      },

      addExpenseTransaction: (description, amount, expenseAccountId, cashAccountId, date) => {
        const baseCurrency = amount.getCurrency();
        const transaction = CommonTransactions.expense(expenseAccountId, cashAccountId, amount, baseCurrency, description, date);
        get().addTransaction(transaction);
      },

      addTransferTransaction: (description, amount, fromAccountId, toAccountId, date) => {
        const baseCurrency = amount.getCurrency();
        const transaction = CommonTransactions.transfer(fromAccountId, toAccountId, amount, baseCurrency, description, date);
        get().addTransaction(transaction);
      },

      // Default accounts setup
      initializeDefaultAccounts: () => {
        const state = get();
        if (state.accounts.length === 0) {
          set({ accounts: createDefaultAccounts() });
        }
      },

      // Utility
      reset: () => {
        set({ accounts: [], transactions: [] });
      }
    }),
    {
      name: 'ledger-store',
      version: 1
    }
  )
);