// Pure selectors for financial calculations - no side effects, fully memoized
import { useLedgerStore } from '../stores/ledgerStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useAccountStore } from '../stores/accountStore';
import { useSnapshotStore } from '../stores/snapshotStore';
import { Money } from '../domain/money';
import type { AccountNature } from '../domain/ledger';
import type { AccountType } from '../types';
import type { Transaction } from '../domain/ledger';

// Date utility for consistent date handling
const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

// Core balance selectors
export const getBalancesAt = (date: Date = new Date()) => {
  const ledgerStore = useLedgerStore.getState();
  const { baseCurrency, convertAmount } = useCurrencyStore.getState();
  const { accounts } = useAccountStore.getState();
  
  const asOfDate = endOfDay(date);
  
  // Get ledger account balances (using booked amounts)
  const ledgerBalances = ledgerStore.getAllAccountBalances(asOfDate);
  
  // Get external account balances and convert to base currency
  const externalBalances = accounts.map(account => {
    const accountTotal = account.balances.reduce((sum, balance) => {
      return sum + convertAmount(balance.amount, balance.currency, baseCurrency);
    }, 0);
    
    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance: Money.fromMajorUnits(accountTotal, baseCurrency),
      asOfDate
    };
  });
  
  // Convert ledger balances to consistent format and currency
  const processedLedgerBalances = ledgerBalances.map(balance => {
    const account = ledgerStore.getAccount(balance.accountId);
    // Convert ledger balance to base currency
    const currentCurrency = balance.balance.getCurrency();
    let finalBalance: Money;
    
    if (currentCurrency === baseCurrency) {
      // No conversion needed
      finalBalance = balance.balance;
    } else {
      // Convert to base currency
      const convertedAmount = convertAmount(balance.balance.toMajorUnits(), currentCurrency, baseCurrency);
      finalBalance = Money.fromMajorUnits(convertedAmount, baseCurrency);
    }
    
    return {
      accountId: balance.accountId,
      accountName: account?.name || 'Unknown',
      accountType: account?.nature || 'other',
      balance: finalBalance,
      asOfDate: balance.asOfDate
    };
  });
  
  return {
    ledgerBalances: processedLedgerBalances,
    externalBalances,
    asOfDate
  };
};

export const getNetWorthAt = (date: Date = new Date()) => {
  const balances = getBalancesAt(date);
  const { baseCurrency } = useCurrencyStore.getState();
  
  // Calculate from ledger accounts (already converted to base currency in getBalancesAt)
  const ledgerAssets = balances.ledgerBalances
    .filter(b => ['asset'].includes(b.accountType as AccountNature))
    .reduce((sum, b) => sum.add(b.balance), Money.fromMinorUnits(0, baseCurrency));
    
  const ledgerLiabilities = balances.ledgerBalances
    .filter(b => ['liability'].includes(b.accountType as AccountNature))
    .reduce((sum, b) => sum.add(b.balance), Money.fromMinorUnits(0, baseCurrency));
  
  // Calculate from external accounts
  const assetTypes: AccountType[] = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'];
  const liabilityTypes: AccountType[] = ['loan', 'credit-card', 'mortgage'];
  
  const externalAssets = balances.externalBalances
    .filter(b => assetTypes.includes(b.accountType))
    .reduce((sum, b) => sum.add(b.balance), Money.fromMinorUnits(0, baseCurrency));
    
  const externalLiabilities = balances.externalBalances
    .filter(b => liabilityTypes.includes(b.accountType))
    .reduce((sum, b) => sum.add(b.balance), Money.fromMinorUnits(0, baseCurrency));
  
  const totalAssets = ledgerAssets.add(externalAssets);
  const totalLiabilities = ledgerLiabilities.add(externalLiabilities);
  const netWorth = totalAssets.subtract(totalLiabilities);
  
  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    asOfDate: balances.asOfDate,
    breakdown: {
      ledger: {
        assets: ledgerAssets,
        liabilities: ledgerLiabilities
      },
      external: {
        assets: externalAssets,
        liabilities: externalLiabilities
      }
    }
  };
};

// P&L selectors
export const getPL = (startDate: Date, endDate: Date) => {
  const ledgerStore = useLedgerStore.getState();
  const { baseCurrency } = useCurrencyStore.getState();
  
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  
  const incomeStatement = ledgerStore.getIncomeStatement(start, end, baseCurrency);
  
  return {
    totalIncome: incomeStatement.totalIncome,
    totalExpenses: incomeStatement.totalExpenses,
    netIncome: incomeStatement.netIncome,
    incomeBreakdown: incomeStatement.income.map(item => ({
      accountName: item.account.name,
      accountCode: item.account.code,
      amount: item.amount
    })),
    expenseBreakdown: incomeStatement.expenses.map(item => ({
      accountName: item.account.name,
      accountCode: item.account.code,
      amount: item.amount
    })),
    fromDate: start,
    toDate: end,
    currency: baseCurrency
  };
};

type CashflowSource = 'income' | 'expense' | 'transfer' | 'other';

export interface CashflowBreakdown {
  source: CashflowSource;
  inflow: Money;
  outflow: Money;
}

export interface CashflowDetail {
  transactionId: string;
  description: string;
  date: Date;
  amount: Money;
  direction: 'inflow' | 'outflow';
  source: CashflowSource;
  accountId: string;
  accountName: string;
  counterpartyAccountId?: string;
  counterpartyAccountName?: string;
}

export interface CashflowStatement {
  inflows: Money;
  outflows: Money;
  net: Money;
  breakdown: CashflowBreakdown[];
  details: CashflowDetail[];
  fromDate: Date;
  toDate: Date;
  currency: string;
}

const cashLikeAccountKeywords = ['cash', 'checking', 'savings', 'wallet', 'bank', 'card'];

const isCashLikeAccount = (account: { nature: AccountNature; name: string; code: string }): boolean => {
  if (account.nature !== 'asset' && account.nature !== 'liability') {
    return false;
  }

  const normalizedName = account.name.toLowerCase();
  const matchesKeyword = cashLikeAccountKeywords.some(keyword => normalizedName.includes(keyword));
  const isCashCode = /^10\d{2}/.test(account.code);

  if (account.nature === 'asset') {
    return matchesKeyword || isCashCode;
  }

  // Include selected liability accounts (e.g., credit cards) to reflect cash-equivalent funding
  return matchesKeyword;
};

const determineCashflowSource = (
  transaction: Transaction,
  cashAccountIds: Set<string>,
  ledgerAccountLookup: (id: string) => { name: string; nature: AccountNature } | undefined,
  direction: 'inflow' | 'outflow'
): CashflowSource => {
  const nonCashPostings = transaction.postings.filter(posting => !cashAccountIds.has(posting.accountId));

  for (const posting of nonCashPostings) {
    const account = ledgerAccountLookup(posting.accountId);
    if (!account) {
      continue;
    }

    if (account.nature === 'income') {
      return 'income';
    }

    if (account.nature === 'expense') {
      return 'expense';
    }

    if (account.nature === 'liability') {
      return 'transfer';
    }
  }

  // If no clear classification, fall back to transfer (movement between cash-like accounts)
  return direction === 'inflow' ? 'transfer' : 'transfer';
};

const convertToBase = (money: Money, baseCurrency: string, convertAmount: (amount: number, from: string, to: string) => number): Money => {
  if (money.getCurrency() === baseCurrency) {
    return money;
  }

  const convertedAmount = convertAmount(money.toMajorUnits(), money.getCurrency(), baseCurrency);
  return Money.fromMajorUnits(convertedAmount, baseCurrency);
};

// Cash flow selectors
export const getCashflowStatement = (startDate: Date, endDate: Date): CashflowStatement => {
  const ledgerStore = useLedgerStore.getState();
  const { baseCurrency, convertAmount } = useCurrencyStore.getState();

  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const cashAccounts = [
    ...ledgerStore.getAccountsByNature('asset'),
    ...ledgerStore.getAccountsByNature('liability')
  ].filter(isCashLikeAccount);

  const cashAccountIds = new Set(cashAccounts.map(account => account.id));
  const getAccountMeta = (accountId: string) => {
    const account = ledgerStore.getAccount(accountId);
    if (!account) {
      return undefined;
    }
    return { name: account.name, nature: account.nature };
  };

  let totalInflows = Money.fromMinorUnits(0, baseCurrency);
  let totalOutflows = Money.fromMinorUnits(0, baseCurrency);

  const breakdownMap = new Map<CashflowSource, { inflow: Money; outflow: Money }>();
  const ensureBreakdown = (source: CashflowSource) => {
    if (!breakdownMap.has(source)) {
      breakdownMap.set(source, {
        inflow: Money.fromMinorUnits(0, baseCurrency),
        outflow: Money.fromMinorUnits(0, baseCurrency)
      });
    }
    return breakdownMap.get(source)!;
  };

  const details: CashflowDetail[] = [];

  const transactions = ledgerStore.getTransactions({
    dateFrom: start,
    dateTo: end
  });

  for (const transaction of transactions) {
    const cashPostings = transaction.postings.filter(posting => cashAccountIds.has(posting.accountId));
    if (cashPostings.length === 0) {
      continue;
    }

    for (const posting of cashPostings) {
      let direction: 'inflow' | 'outflow' | null = null;
      let amountInBase: Money | null = null;

      if (posting.bookedDebitAmount) {
        direction = 'inflow';
        amountInBase = convertToBase(posting.bookedDebitAmount, baseCurrency, convertAmount);
      } else if (posting.bookedCreditAmount) {
        direction = 'outflow';
        amountInBase = convertToBase(posting.bookedCreditAmount, baseCurrency, convertAmount);
      }

      if (!direction || !amountInBase) {
        continue;
      }

      const source = determineCashflowSource(transaction, cashAccountIds, getAccountMeta, direction);

      if (direction === 'inflow') {
        totalInflows = totalInflows.add(amountInBase);
        const entry = ensureBreakdown(source);
        entry.inflow = entry.inflow.add(amountInBase);
        breakdownMap.set(source, entry);
      } else {
        totalOutflows = totalOutflows.add(amountInBase);
        const entry = ensureBreakdown(source);
        entry.outflow = entry.outflow.add(amountInBase);
        breakdownMap.set(source, entry);
      }

      const accountMeta = getAccountMeta(posting.accountId);
      const counterpartyPosting = transaction.postings.find(p => !cashAccountIds.has(p.accountId));
      const counterpartyMeta = counterpartyPosting ? getAccountMeta(counterpartyPosting.accountId) : undefined;

      details.push({
        transactionId: transaction.id,
        description: transaction.description,
        date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
        amount: amountInBase,
        direction,
        source,
        accountId: posting.accountId,
        accountName: accountMeta?.name || posting.accountId,
        counterpartyAccountId: counterpartyPosting?.accountId,
        counterpartyAccountName: counterpartyMeta?.name
      });
    }
  }

  const net = totalInflows.subtract(totalOutflows);

  return {
    inflows: totalInflows,
    outflows: totalOutflows,
    net,
    breakdown: Array.from(breakdownMap.entries()).map(([source, value]) => ({
      source,
      inflow: value.inflow,
      outflow: value.outflow
    })),
    details: details.sort((a, b) => b.date.getTime() - a.date.getTime()),
    fromDate: start,
    toDate: end,
    currency: baseCurrency
  };
};

// Expense breakdown selectors
export const getExpenseBreakdown = (startDate: Date, endDate: Date) => {
  const pl = getPL(startDate, endDate);
  const { baseCurrency } = useCurrencyStore.getState();
  
  // Categorize expenses by type (essential, important, non_essential)
  const getExpenseCategory = (accountName: string): 'essential' | 'important' | 'non_essential' => {
    const name = accountName.toLowerCase();
    if (name.includes('food') || name.includes('housing') || name.includes('utilities') || name.includes('healthcare')) {
      return 'essential';
    } else if (name.includes('transport') || name.includes('shopping')) {
      return 'important';
    } else {
      return 'non_essential';
    }
  };
  
  const categorizedExpenses = pl.expenseBreakdown.reduce((acc, expense) => {
    const category = getExpenseCategory(expense.accountName);
    if (!acc[category]) {
      acc[category] = Money.fromMinorUnits(0, baseCurrency);
    }
    // Ensure expense amount is in base currency
    const { convertAmount } = useCurrencyStore.getState();
    const convertedAmount = convertAmount(expense.amount.toMajorUnits(), expense.amount.getCurrency(), baseCurrency);
    const expenseInBaseCurrency = Money.fromMajorUnits(convertedAmount, baseCurrency);
    acc[category] = acc[category].add(expenseInBaseCurrency);
    return acc;
  }, {} as Record<string, Money>);
  
  const expensesByAccount = pl.expenseBreakdown.sort((a, b) => 
    b.amount.toMinorUnits() - a.amount.toMinorUnits()
  );
  
  return {
    totalExpenses: pl.totalExpenses,
    byCategory: categorizedExpenses,
    byAccount: expensesByAccount,
    averageDaily: pl.totalExpenses.divide(
      Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
    ),
    fromDate: startDate,
    toDate: endDate,
    currency: baseCurrency
  };
};

// Savings potential selectors
export const getSavingsPotential = (startDate: Date, endDate: Date) => {
  const pl = getPL(startDate, endDate);
  const expenseBreakdown = getExpenseBreakdown(startDate, endDate);
  const { baseCurrency } = useCurrencyStore.getState();
  
  // Calculate savings rate
  const savingsRate = pl.totalIncome.toMinorUnits() > 0 
    ? pl.netIncome.toMinorUnits() / pl.totalIncome.toMinorUnits()
    : 0;
  
  // Identify potential savings by looking at non-essential expenses
  const nonEssentialExpenses = expenseBreakdown.byCategory['non_essential'] || Money.fromMinorUnits(0, baseCurrency);
  const potentialSavings = nonEssentialExpenses.multiply(0.3); // Assume 30% of non-essential could be saved
  
  // Calculate projected savings if potential is realized
  // Ensure all amounts are in base currency
  const { convertAmount } = useCurrencyStore.getState();
  const netIncomeConverted = convertAmount(pl.netIncome.toMajorUnits(), pl.netIncome.getCurrency(), baseCurrency);
  const netIncomeInBaseCurrency = Money.fromMajorUnits(netIncomeConverted, baseCurrency);
  
  const projectedMonthlySavings = netIncomeInBaseCurrency.add(potentialSavings);
  const projectedYearlySavings = projectedMonthlySavings.multiply(12);
  
  return {
    currentSavings: netIncomeInBaseCurrency,
    savingsRate,
    potentialSavings,
    projectedMonthlySavings,
    projectedYearlySavings,
    nonEssentialExpenses,
    recommendations: {
      reduceNonEssential: nonEssentialExpenses,
      targetSavingsRate: 0.2, // 20% target
      gapToTarget: Money.fromMajorUnits(
        Math.max(0, pl.totalIncome.toMajorUnits() * 0.2 - pl.netIncome.toMajorUnits()),
        baseCurrency
      )
    },
    fromDate: startDate,
    toDate: endDate,
    currency: baseCurrency
  };
};

// Period convenience selectors
export const getCurrentMonthPL = () => {
  const now = new Date();
  return getPL(startOfMonth(now), endOfMonth(now));
};

export const getCurrentMonthExpenseBreakdown = () => {
  const now = new Date();
  return getExpenseBreakdown(startOfMonth(now), endOfMonth(now));
};

export const getCurrentMonthCashflow = () => {
  const now = new Date();
  return getCashflowStatement(startOfMonth(now), endOfMonth(now));
};

export const getCurrentMonthSavingsPotential = () => {
  const now = new Date();
  return getSavingsPotential(startOfMonth(now), endOfMonth(now));
};

// Month-over-Month change selector
export const getMoMChange = (monthEnd?: string) => {
  const snapshotStore = useSnapshotStore.getState();
  
  // Get target month (default to current month)
  const targetMonthEnd = monthEnd || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  
  // Get previous month
  const [year, month] = targetMonthEnd.split('-').map(Number);
  const prevDate = new Date(year, month - 1, 1); // Go to previous month
  const prevMonthEnd = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Get snapshots
  const currentSnapshot = snapshotStore.getSnapshot(targetMonthEnd);
  const previousSnapshot = snapshotStore.getSnapshot(prevMonthEnd);
  
  // Fallback if no data available
  if (!currentSnapshot || !previousSnapshot) {
    return {
      deltaAbs: null,
      deltaPct: null,
      hasPreviousData: false,
      currentValue: currentSnapshot?.netWorthBase || null,
      previousValue: previousSnapshot?.netWorthBase || null
    };
  }
  
  const deltaAbs = currentSnapshot.netWorthBase - previousSnapshot.netWorthBase;
  const deltaPct = previousSnapshot.netWorthBase !== 0 
    ? (deltaAbs / Math.abs(previousSnapshot.netWorthBase)) * 100 
    : 0;
  
  return {
    deltaAbs,
    deltaPct,
    hasPreviousData: true,
    currentValue: currentSnapshot.netWorthBase,
    previousValue: previousSnapshot.netWorthBase
  };
};

// Combined transaction view selector for UI
export const getCombinedTransactions = (
  startDate: Date, 
  endDate: Date, 
  entryFilter: 'all' | 'income' | 'expense' = 'all'
) => {
  const ledgerStore = useLedgerStore.getState();
  const { formatAmount, baseCurrency, convertAmount } = useCurrencyStore.getState();
  
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  
  const transactions = ledgerStore.getTransactions({
    dateFrom: start,
    dateTo: end
  });
  
  const allItems: Array<{
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    currency: string;
    date: string;
    category: string;
    recurring?: boolean;
    formattedAmount: string;
  }> = [];
  
  // Convert ledger transactions to view models
  for (const transaction of transactions) {
    for (const posting of transaction.postings) {
      const account = ledgerStore.getAccount(posting.accountId);
      if (!account) continue;
      
      const originalAmount = posting.originalDebitAmount || posting.originalCreditAmount;
      if (!originalAmount) continue;
      
      let type: 'income' | 'expense';
      let formattedAmount: string;
      let category: string;
      
      // Convert amount to base currency for consistency
      // Ensure originalAmount is a Money object
      const amount = typeof originalAmount.toMajorUnits === 'function' 
        ? originalAmount.toMajorUnits() 
        : Number(originalAmount) || 0;
      const currency = typeof originalAmount.getCurrency === 'function'
        ? originalAmount.getCurrency()
        : baseCurrency;
      const convertedAmount = convertAmount(amount, currency, baseCurrency);
      
      if (account.nature === 'income' && posting.originalCreditAmount) {
        type = 'income';
        formattedAmount = `+${formatAmount(convertedAmount)}`;
        category = 'income';
      } else if (account.nature === 'expense' && posting.originalDebitAmount) {
        type = 'expense';
        formattedAmount = `-${formatAmount(convertedAmount)}`;
        category = getExpenseCategory(account.name);
      } else {
        continue; // Skip non-income/expense accounts
      }
      
      // Ensure transaction date is a valid Date object
      const transactionDate = transaction.date instanceof Date 
        ? transaction.date 
        : new Date(transaction.date || Date.now());
        
      allItems.push({
        id: `${transaction.id}-${posting.id}`,
        type,
        description: transaction.description,
        amount: convertedAmount,
        currency: baseCurrency,
        date: transactionDate.toISOString().split('T')[0],
        category,
        recurring: false,
        formattedAmount
      });
    }
  }
  
  // Apply filter and sort
  return allItems
    .filter(item => {
      if (entryFilter === 'all') return true;
      return item.type === entryFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Helper function moved from expense breakdown
const getExpenseCategory = (accountName: string): string => {
  const name = accountName.toLowerCase();
  if (name.includes('food') || name.includes('housing') || name.includes('utilities') || name.includes('healthcare')) {
    return 'essential';
  } else if (name.includes('transport') || name.includes('shopping')) {
    return 'important';
  } else {
    return 'non_essential';
  }
};
