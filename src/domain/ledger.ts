// Double-entry ledger domain models for accounting-grade financial tracking
import { Money } from './money';

export type AccountNature = 'asset' | 'liability' | 'income' | 'expense' | 'equity';

export interface Account {
  id: string;
  code: string; // e.g., "1001", "2001", "4001" (chart of accounts)
  name: string; // e.g., "Cash", "Credit Card", "Salary Income"
  nature: AccountNature;
  parentId?: string; // For hierarchical accounts
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Posting {
  id: string;
  accountId: string;
  // Original currency amounts (what was actually transacted)
  originalDebitAmount: Money | null; // Either debit or credit, never both
  originalCreditAmount: Money | null;
  // Base currency amounts booked at transaction date exchange rate
  bookedDebitAmount: Money | null; // Base currency equivalent at transaction date
  bookedCreditAmount: Money | null;
  // Exchange rate used for booking (original currency per base currency unit)
  exchangeRate?: number; // Only populated if original currency differs from base
  description?: string;
  reconciled: boolean;
  reconciledAt?: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  reference?: string; // External reference (invoice #, check #, etc.)
  postings: Posting[]; // Must have ≥2 postings and balance to zero
  baseCurrency: string; // Base currency for booked amounts
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // User who created the transaction
}

export interface AccountBalance {
  accountId: string;
  balance: Money;
  asOfDate: Date;
}

export interface TrialBalance {
  asOfDate: Date;
  accounts: Array<{
    account: Account;
    debitBalance: Money | null;
    creditBalance: Money | null;
  }>;
  totalDebits: Money;
  totalCredits: Money;
  isBalanced: boolean;
}

export interface FinancialStatement {
  asOfDate: Date;
  fromDate?: Date; // For P&L statements
  currency: string;
}

export interface BalanceSheet extends FinancialStatement {
  assets: Array<{ account: Account; balance: Money }>;
  liabilities: Array<{ account: Account; balance: Money }>;
  equity: Array<{ account: Account; balance: Money }>;
  totalAssets: Money;
  totalLiabilities: Money;
  totalEquity: Money;
  isBalanced: boolean; // Assets = Liabilities + Equity
}

export interface IncomeStatement extends FinancialStatement {
  income: Array<{ account: Account; amount: Money }>;
  expenses: Array<{ account: Account; amount: Money }>;
  totalIncome: Money;
  totalExpenses: Money;
  netIncome: Money;
}

// Ledger validation utilities
export class LedgerValidator {
  static validateTransaction(transaction: Transaction): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Must have at least 2 postings
    if (transaction.postings.length < 2) {
      errors.push('Transaction must have at least 2 postings');
    }

    // Each posting must have either debit or credit, not both (check both original and booked)
    transaction.postings.forEach((posting, index) => {
      const hasOriginalDebit = posting.originalDebitAmount !== null;
      const hasOriginalCredit = posting.originalCreditAmount !== null;
      const hasBookedDebit = posting.bookedDebitAmount !== null;
      const hasBookedCredit = posting.bookedCreditAmount !== null;
      
      if (hasOriginalDebit && hasOriginalCredit) {
        errors.push(`Posting ${index + 1} cannot have both original debit and credit amounts`);
      }
      
      if (!hasOriginalDebit && !hasOriginalCredit) {
        errors.push(`Posting ${index + 1} must have either original debit or credit amount`);
      }
      
      if (hasBookedDebit && hasBookedCredit) {
        errors.push(`Posting ${index + 1} cannot have both booked debit and credit amounts`);
      }
      
      if (!hasBookedDebit && !hasBookedCredit) {
        errors.push(`Posting ${index + 1} must have either booked debit or credit amount`);
      }
      
      // Ensure original and booked amounts are consistent (both debit or both credit)
      if ((hasOriginalDebit && !hasBookedDebit) || (hasOriginalCredit && !hasBookedCredit)) {
        errors.push(`Posting ${index + 1} original and booked amounts must be consistently debit or credit`);
      }
    });

    // Transaction must balance using booked amounts (total debits = total credits)
    let totalDebits = Money.fromMinorUnits(0, transaction.baseCurrency);
    let totalCredits = Money.fromMinorUnits(0, transaction.baseCurrency);

    transaction.postings.forEach(posting => {
      if (posting.bookedDebitAmount) {
        totalDebits = totalDebits.add(posting.bookedDebitAmount);
      }
      if (posting.bookedCreditAmount) {
        totalCredits = totalCredits.add(posting.bookedCreditAmount);
      }
    });

    if (!totalDebits.equals(totalCredits)) {
      errors.push(`Transaction is not balanced: booked debits (${totalDebits.format()}) ≠ booked credits (${totalCredits.format()})`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAccountNature(account: Account, posting: Posting): { isValid: boolean; error?: string } {
    const hasDebit = posting.originalDebitAmount !== null;
    const hasCredit = posting.originalCreditAmount !== null;

    // Assets and expenses increase with debits, decrease with credits
    // Liabilities, income, and equity increase with credits, decrease with debits
    const normalDebitAccounts: AccountNature[] = ['asset', 'expense'];
    const normalCreditAccounts: AccountNature[] = ['liability', 'income', 'equity'];

    if (normalDebitAccounts.includes(account.nature) && hasCredit) {
      // This is valid - reducing an asset or expense
      return { isValid: true };
    }

    if (normalCreditAccounts.includes(account.nature) && hasDebit) {
      // This is valid - reducing a liability, income, or equity
      return { isValid: true };
    }

    return { isValid: true }; // All combinations are technically valid in double-entry
  }
}

// Transaction builder for common scenarios
export class TransactionBuilder {
  private transaction: Partial<Transaction>;
  private postings: Posting[] = [];

  constructor(description: string, baseCurrency: string, date: Date = new Date()) {
    this.transaction = {
      id: crypto.randomUUID(),
      date,
      description,
      baseCurrency,
      postings: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  debit(accountId: string, originalAmount: Money, bookedAmount: Money, exchangeRate?: number, description?: string): this {
    this.postings.push({
      id: crypto.randomUUID(),
      accountId,
      originalDebitAmount: originalAmount,
      originalCreditAmount: null,
      bookedDebitAmount: bookedAmount,
      bookedCreditAmount: null,
      exchangeRate,
      description,
      reconciled: false
    });
    return this;
  }

  credit(accountId: string, originalAmount: Money, bookedAmount: Money, exchangeRate?: number, description?: string): this {
    this.postings.push({
      id: crypto.randomUUID(),
      accountId,
      originalDebitAmount: null,
      originalCreditAmount: originalAmount,
      bookedDebitAmount: null,
      bookedCreditAmount: bookedAmount,
      exchangeRate,
      description,
      reconciled: false
    });
    return this;
  }

  // Convenience method for same-currency transactions
  debitSameCurrency(accountId: string, amount: Money, description?: string): this {
    return this.debit(accountId, amount, amount, undefined, description);
  }

  creditSameCurrency(accountId: string, amount: Money, description?: string): this {
    return this.credit(accountId, amount, amount, undefined, description);
  }

  reference(ref: string): this {
    this.transaction.reference = ref;
    return this;
  }

  tags(tags: string[]): this {
    this.transaction.tags = tags;
    return this;
  }

  build(): Transaction {
    const tx: Transaction = {
      ...this.transaction,
      postings: this.postings
    } as Transaction;

    const validation = LedgerValidator.validateTransaction(tx);
    if (!validation.isValid) {
      throw new Error(`Invalid transaction: ${validation.errors.join(', ')}`);
    }

    return tx;
  }
}

// Common transaction patterns
export class CommonTransactions {
  // Salary payment: Debit Cash, Credit Salary Income
  static salary(cashAccountId: string, salaryAccountId: string, amount: Money, baseCurrency: string, date: Date): Transaction {
    return new TransactionBuilder('Salary payment', baseCurrency, date)
      .debitSameCurrency(cashAccountId, amount, 'Salary received')
      .creditSameCurrency(salaryAccountId, amount, 'Salary earned')
      .build();
  }

  // Expense payment: Debit Expense, Credit Cash
  static expense(expenseAccountId: string, cashAccountId: string, amount: Money, baseCurrency: string, description: string, date: Date): Transaction {
    return new TransactionBuilder(description, baseCurrency, date)
      .debitSameCurrency(expenseAccountId, amount, description)
      .creditSameCurrency(cashAccountId, amount, 'Payment for ' + description)
      .build();
  }

  // Credit card purchase: Debit Expense, Credit Credit Card Liability
  static creditCardPurchase(expenseAccountId: string, creditCardAccountId: string, amount: Money, baseCurrency: string, description: string, date: Date): Transaction {
    return new TransactionBuilder(description, baseCurrency, date)
      .debitSameCurrency(expenseAccountId, amount, description)
      .creditSameCurrency(creditCardAccountId, amount, 'Credit card purchase')
      .build();
  }

  // Credit card payment: Debit Credit Card Liability, Credit Cash
  static creditCardPayment(creditCardAccountId: string, cashAccountId: string, amount: Money, baseCurrency: string, date: Date): Transaction {
    return new TransactionBuilder('Credit card payment', baseCurrency, date)
      .debitSameCurrency(creditCardAccountId, amount, 'Payment to credit card')
      .creditSameCurrency(cashAccountId, amount, 'Credit card payment')
      .build();
  }

  // Transfer between accounts: Debit To Account, Credit From Account
  static transfer(fromAccountId: string, toAccountId: string, amount: Money, baseCurrency: string, description: string, date: Date): Transaction {
    return new TransactionBuilder(description, baseCurrency, date)
      .debitSameCurrency(toAccountId, amount, 'Transfer received')
      .creditSameCurrency(fromAccountId, amount, 'Transfer sent')
      .build();
  }

  // Loan payment: Debit Loan Principal, Debit Interest Expense, Credit Cash
  static loanPayment(loanAccountId: string, interestExpenseAccountId: string, cashAccountId: string, 
                     principalAmount: Money, interestAmount: Money, baseCurrency: string, date: Date): Transaction {
    const totalPayment = principalAmount.add(interestAmount);
    
    return new TransactionBuilder('Loan payment', baseCurrency, date)
      .debitSameCurrency(loanAccountId, principalAmount, 'Principal payment')
      .debitSameCurrency(interestExpenseAccountId, interestAmount, 'Interest expense')
      .creditSameCurrency(cashAccountId, totalPayment, 'Loan payment')
      .build();
  }

  // FX Revaluation: Debit/Credit Asset/Liability, Credit/Debit FX Gain/Loss
  static fxRevaluation(accountId: string, fxGainLossAccountId: string, revaluationAmount: Money, 
                      baseCurrency: string, description: string, date: Date): Transaction {
    const isGain = !revaluationAmount.isNegative();
    const absAmount = revaluationAmount.abs();
    
    if (isGain) {
      return new TransactionBuilder(description, baseCurrency, date)
        .debitSameCurrency(accountId, absAmount, 'FX revaluation gain')
        .creditSameCurrency(fxGainLossAccountId, absAmount, 'FX gain')
        .build();
    } else {
      return new TransactionBuilder(description, baseCurrency, date)
        .creditSameCurrency(accountId, absAmount, 'FX revaluation loss')
        .debitSameCurrency(fxGainLossAccountId, absAmount, 'FX loss')
        .build();
    }
  }
}