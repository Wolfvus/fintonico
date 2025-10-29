// Ledger store - owns all transactions and postings for double-entry accounting
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CommonTransactions } from '../domain/ledger';
import { useCurrencyStore } from './currencyStore';
import type {
  Account,
  Transaction,
  AccountBalance,
  TrialBalance,
  BalanceSheet,
  IncomeStatement,
  AccountNature,
} from '../domain/ledger';
import { Money } from '../domain/money';
import type { Account as UserAccount } from '../types';
import { accountTypeToNature } from '../utils/accountClassifications';

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
  syncExternalAccount: (account: UserAccount) => Account;
  
  // Utility
  reset: () => void;
  clearAllData: () => void;
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

        return transactions.sort((a, b) => {
          // Handle invalid dates gracefully
          const aTime = a.date instanceof Date ? a.date.getTime() : 0;
          const bTime = b.date instanceof Date ? b.date.getTime() : 0;
          return bTime - aTime;
        });
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
                // Convert to base currency if needed
                let debitAmount = posting.bookedDebitAmount;
                if (debitAmount.getCurrency() !== baseCurrency) {
                  debitAmount = Money.fromMajorUnits(debitAmount.toMajorUnits(), baseCurrency);
                }
                
                // For assets and expenses, debits increase balance
                // For liabilities, income, and equity, debits decrease balance
                if (['asset', 'expense'].includes(account.nature)) {
                  balance = balance.add(debitAmount);
                } else {
                  balance = balance.subtract(debitAmount);
                }
              }
              if (posting.bookedCreditAmount) {
                // Convert to base currency if needed
                let creditAmount = posting.bookedCreditAmount;
                if (creditAmount.getCurrency() !== baseCurrency) {
                  creditAmount = Money.fromMajorUnits(creditAmount.toMajorUnits(), baseCurrency);
                }
                
                // For assets and expenses, credits decrease balance
                // For liabilities, income, and equity, credits increase balance
                if (['asset', 'expense'].includes(account.nature)) {
                  balance = balance.subtract(creditAmount);
                } else {
                  balance = balance.add(creditAmount);
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
        const { convertAmount } = useCurrencyStore.getState();

        const rangeStart = new Date(fromDate);
        rangeStart.setHours(0, 0, 0, 0);

        const rangeEnd = new Date(toDate);
        rangeEnd.setHours(23, 59, 59, 999);

        const incomeAccounts = accounts.filter(acc => acc.nature === 'income');
        const expenseAccounts = accounts.filter(acc => acc.nature === 'expense');

        const incomeTotals = new Map<string, number>();
        const expenseTotals = new Map<string, number>();

        const transactions = get().getTransactions({
          dateFrom: rangeStart,
          dateTo: rangeEnd
        });

        const toBaseNumber = (money: Money | null): number => {
          if (!money) return 0;
          const amount = money.toMajorUnits();
          if (money.getCurrency() === baseCurrency) {
            return amount;
          }
          return convertAmount(amount, money.getCurrency(), baseCurrency);
        };

        const addToMap = (map: Map<string, number>, accountId: string, delta: number) => {
          if (delta === 0) return;
          map.set(accountId, (map.get(accountId) || 0) + delta);
        };

        for (const transaction of transactions) {
          for (const posting of transaction.postings) {
            const account = get().getAccount(posting.accountId);
            if (!account) continue;

            if (account.nature === 'income') {
              const credit = toBaseNumber(posting.bookedCreditAmount);
              const debit = toBaseNumber(posting.bookedDebitAmount);
              addToMap(incomeTotals, account.id, credit);
              addToMap(incomeTotals, account.id, -debit);
            } else if (account.nature === 'expense') {
              const debit = toBaseNumber(posting.bookedDebitAmount);
              const credit = toBaseNumber(posting.bookedCreditAmount);
              addToMap(expenseTotals, account.id, debit);
              addToMap(expenseTotals, account.id, -credit);
            }
          }
        }

        const toMoney = (value: number) => Money.fromMajorUnits(value, baseCurrency);

        const income = incomeAccounts
          .map(account => ({
            account,
            amount: toMoney(incomeTotals.get(account.id) || 0)
          }))
          .filter(item => !item.amount.isZero());

        const expenses = expenseAccounts
          .map(account => ({
            account,
            amount: toMoney(expenseTotals.get(account.id) || 0)
          }))
          .filter(item => !item.amount.isZero());

        const totalIncomeValue = income.reduce((sum, item) => sum + item.amount.toMajorUnits(), 0);
        const totalExpensesValue = expenses.reduce((sum, item) => sum + item.amount.toMajorUnits(), 0);

        const totalIncome = toMoney(totalIncomeValue);
        const totalExpenses = toMoney(totalExpensesValue);
        const netIncome = toMoney(totalIncomeValue - totalExpensesValue);

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

      // Utility functions
      clearAllData: () => {
        console.log('Clearing all ledger data...');
        set({
          accounts: [],
          transactions: []
        });
        // Clear all localStorage keys
        localStorage.removeItem('ledger-store'); // Zustand persist key
        localStorage.removeItem('fintonico-incomes'); // Income store key
        localStorage.removeItem('fintonico-expenses'); // Expense store key
        localStorage.removeItem('fintonico-snapshots'); // Snapshot store key
        localStorage.removeItem('fintonico-ledger'); // Legacy key
        console.log('All data cleared');
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

      syncExternalAccount: (externalAccount) => {
        const existing = get().getAccount(externalAccount.id);
        const now = new Date();
        const nature = accountTypeToNature(externalAccount.type);

        if (existing) {
          if (existing.name !== externalAccount.name || existing.nature !== nature) {
            set((state) => ({
              accounts: state.accounts.map((account) =>
                account.id === existing.id
                  ? {
                      ...account,
                      name: externalAccount.name,
                      nature,
                      updatedAt: now,
                    }
                  : account,
              ),
            }));
          }
          return get().getAccount(externalAccount.id)!;
        }

        const codePrefix = nature === 'asset' ? '1' : '2';
        const rawSuffix = externalAccount.id.replace(/-/g, '').slice(0, 4).toUpperCase();
        const code = `EXT-${codePrefix}${rawSuffix.padEnd(4, '0')}`;

        const ledgerAccount: Account = {
          id: externalAccount.id,
          code,
          name: externalAccount.name,
          nature,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          accounts: [...state.accounts, ledgerAccount],
        }));

        return ledgerAccount;
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
      version: 1,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            
            // Parse and reconstruct Money objects
            const parsed = JSON.parse(str);
            if (!parsed || !parsed.state) return null;
            
            const { state } = parsed;
            
            if (state.transactions) {
            state.transactions = state.transactions.map((tx: any) => ({
              ...tx,
              date: new Date(tx.date),
              createdAt: new Date(tx.createdAt),
              updatedAt: new Date(tx.updatedAt),
              postings: tx.postings.map((posting: any) => ({
                ...posting,
                originalDebitAmount: posting.originalDebitAmount 
                  ? Money.fromMinorUnits(posting.originalDebitAmount.amountMinor || posting.originalDebitAmount._amountMinor || 0, 
                                        posting.originalDebitAmount.currency || posting.originalDebitAmount._currency || 'USD')
                  : null,
                originalCreditAmount: posting.originalCreditAmount
                  ? Money.fromMinorUnits(posting.originalCreditAmount.amountMinor || posting.originalCreditAmount._amountMinor || 0,
                                         posting.originalCreditAmount.currency || posting.originalCreditAmount._currency || 'USD')
                  : null,
                bookedDebitAmount: posting.bookedDebitAmount
                  ? Money.fromMinorUnits(posting.bookedDebitAmount.amountMinor || posting.bookedDebitAmount._amountMinor || 0,
                                        posting.bookedDebitAmount.currency || posting.bookedDebitAmount._currency || 'USD')
                  : null,
                bookedCreditAmount: posting.bookedCreditAmount
                  ? Money.fromMinorUnits(posting.bookedCreditAmount.amountMinor || posting.bookedCreditAmount._amountMinor || 0,
                                         posting.bookedCreditAmount.currency || posting.bookedCreditAmount._currency || 'USD')
                  : null,
              }))
            }));
          }
          
          if (state.accounts) {
            state.accounts = state.accounts.map((acc: any) => ({
              ...acc,
              createdAt: new Date(acc.createdAt),
              updatedAt: new Date(acc.updatedAt)
            }));
          }
          
            return { state };
          } catch (error) {
            console.error('Error loading ledger store from localStorage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Serialize Money objects to plain objects
            const serialized = JSON.parse(JSON.stringify(value));
            
            if (serialized.state.transactions) {
            serialized.state.transactions = serialized.state.transactions.map((tx: any) => ({
              ...tx,
              postings: tx.postings.map((posting: any) => ({
                ...posting,
                originalDebitAmount: posting.originalDebitAmount 
                  ? { 
                      amountMinor: posting.originalDebitAmount.getAmountMinor ? posting.originalDebitAmount.getAmountMinor() : posting.originalDebitAmount.amountMinor, 
                      currency: posting.originalDebitAmount.getCurrency ? posting.originalDebitAmount.getCurrency() : posting.originalDebitAmount.currency 
                    }
                  : null,
                originalCreditAmount: posting.originalCreditAmount
                  ? { 
                      amountMinor: posting.originalCreditAmount.getAmountMinor ? posting.originalCreditAmount.getAmountMinor() : posting.originalCreditAmount.amountMinor,
                      currency: posting.originalCreditAmount.getCurrency ? posting.originalCreditAmount.getCurrency() : posting.originalCreditAmount.currency 
                    }
                  : null,
                bookedDebitAmount: posting.bookedDebitAmount
                  ? { 
                      amountMinor: posting.bookedDebitAmount.getAmountMinor ? posting.bookedDebitAmount.getAmountMinor() : posting.bookedDebitAmount.amountMinor,
                      currency: posting.bookedDebitAmount.getCurrency ? posting.bookedDebitAmount.getCurrency() : posting.bookedDebitAmount.currency 
                    }
                  : null,
                bookedCreditAmount: posting.bookedCreditAmount
                  ? { 
                      amountMinor: posting.bookedCreditAmount.getAmountMinor ? posting.bookedCreditAmount.getAmountMinor() : posting.bookedCreditAmount.amountMinor,
                      currency: posting.bookedCreditAmount.getCurrency ? posting.bookedCreditAmount.getCurrency() : posting.bookedCreditAmount.currency 
                    }
                  : null,
              }))
            }));
          }
          
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error('Error saving ledger store to localStorage:', error);
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);
