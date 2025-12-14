import { useLedgerStore } from '../stores/ledgerStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useIncomeStore } from '../stores/incomeStore';
import { useAccountStore } from '../stores/accountStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useLedgerAccountStore } from '../stores/ledgerAccountStore';
import { useSnapshotStore } from '../stores/snapshotStore';

const PERSIST_KEYS = [
  'fintonico-currency',
  'fintonico-accounts',
  'fintonico-expenses',
  'fintonico-incomes',
  'fintonico-snapshots',
  'ledger-store',
  'fintonico-ledger',
  'fintonico-ledger-accounts',
];

export const clearMockData = async (): Promise<void> => {
  const ledger = useLedgerStore.getState();
  ledger.clearAllData();

  useExpenseStore.setState({ expenses: [], loading: false });
  useIncomeStore.setState({ incomes: [], loading: false });
  useAccountStore.setState({ accounts: [] });
  useLedgerAccountStore.setState({ accounts: [] });
  useSnapshotStore.setState({ snapshots: [] });

  useCurrencyStore.setState((state) => ({
    ...state,
    baseCurrency: 'MXN',
    enabledCurrencies: ['MXN', 'USD', 'EUR', 'BTC', 'ETH'],
    exchangeRates: { MXN: 1, USD: 20.5, EUR: 22.0 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  }));

  PERSIST_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
};


export const seedMockData = async (): Promise<void> => {
  await clearMockData();

  const ledger = useLedgerStore.getState();
  ledger.initializeDefaultAccounts();

  const accountStore = useAccountStore.getState();
  const expenseStore = useExpenseStore.getState();
  const incomeStore = useIncomeStore.getState();
  const ledgerAccountStore = useLedgerAccountStore.getState();

  // Seed Net Worth accounts (assets and liabilities)
  const netWorthAccounts = [
    {
      name: 'BBVA Checking',
      type: 'bank' as const,
      currency: 'MXN',
      balance: 45000,
    },
    {
      name: 'Banorte Savings',
      type: 'bank' as const,
      currency: 'MXN',
      balance: 120000,
      estimatedYield: 5.2,
    },
    {
      name: 'Brokerage Account',
      type: 'investment' as const,
      currency: 'USD',
      balance: 12000,
      estimatedYield: 7.5,
    },
    {
      name: 'GBM+ CETES',
      type: 'investment' as const,
      currency: 'MXN',
      balance: 50000,
      estimatedYield: 10.5,
    },
    {
      name: 'Emergency Fund',
      type: 'cash' as const,
      currency: 'MXN',
      balance: 25000,
    },
    {
      name: 'AMEX Gold',
      type: 'credit-card' as const,
      currency: 'MXN',
      balance: -8500,
      recurringDueDate: 15,
      minMonthlyPayment: 850,
      paymentToAvoidInterest: 8500,
    },
    {
      name: 'Visa Infinite',
      type: 'credit-card' as const,
      currency: 'MXN',
      balance: -3200,
      recurringDueDate: 20,
      minMonthlyPayment: 320,
      paymentToAvoidInterest: 3200,
    },
    {
      name: 'Car Loan',
      type: 'loan' as const,
      currency: 'MXN',
      balance: -85000,
      recurringDueDate: 5,
      minMonthlyPayment: 4500,
    },
  ];

  netWorthAccounts.forEach((account) => {
    accountStore.addAccount(account);
  });

  // Seed reference accounts (for CLABE/account number lookup)
  const referenceAccounts = [
    {
      name: 'BBVA Checking',
      accountNumber: '0123456789',
      clabe: '012180001234567891',
      normalBalance: 'debit' as const,
      isActive: true,
    },
    {
      name: 'Banorte Savings',
      accountNumber: '9876543210',
      clabe: '072180009876543212',
      normalBalance: 'debit' as const,
      isActive: true,
    },
    {
      name: 'AMEX Gold',
      accountNumber: '3742-XXXXXX-12345',
      normalBalance: 'credit' as const,
      isActive: true,
    },
    {
      name: 'Visa Infinite',
      accountNumber: '4815-XXXX-XXXX-1234',
      normalBalance: 'credit' as const,
      isActive: true,
    },
    {
      name: 'PayPal',
      accountNumber: 'user@email.com',
      normalBalance: 'debit' as const,
      isActive: true,
    },
  ];

  referenceAccounts.forEach((account) => {
    ledgerAccountStore.addAccount(account);
  });

  // Seed income (simplified - no account linking)
  const incomeFixtures = [
    {
      source: 'Monthly Salary',
      amount: 65000,
      currency: 'MXN',
      frequency: 'monthly' as const,
      date: '2025-12-01',
    },
    {
      source: 'Freelance Project',
      amount: 1500,
      currency: 'USD',
      frequency: 'one-time' as const,
      date: '2025-12-10',
    },
    {
      source: 'Investment Dividends',
      amount: 2500,
      currency: 'MXN',
      frequency: 'monthly' as const,
      date: '2025-12-05',
    },
  ];

  for (const income of incomeFixtures) {
    await incomeStore.addIncome(income);
  }

  // Seed expenses (simplified - no account linking)
  const expenseFixtures = [
    {
      what: 'Rent',
      amount: 18000,
      currency: 'MXN',
      rating: 'essential' as const,
      date: '2025-12-01',
      recurring: true,
    },
    {
      what: 'Groceries',
      amount: 3500,
      currency: 'MXN',
      rating: 'essential' as const,
      date: '2025-12-05',
    },
    {
      what: 'Electricity Bill',
      amount: 850,
      currency: 'MXN',
      rating: 'essential' as const,
      date: '2025-12-08',
      recurring: true,
    },
    {
      what: 'Restaurant Dinner',
      amount: 1200,
      currency: 'MXN',
      rating: 'discretionary' as const,
      date: '2025-12-07',
    },
    {
      what: 'New Headphones',
      amount: 4500,
      currency: 'MXN',
      rating: 'luxury' as const,
      date: '2025-12-09',
    },
    {
      what: 'Uber Rides',
      amount: 650,
      currency: 'MXN',
      rating: 'discretionary' as const,
      date: '2025-12-06',
    },
  ];

  for (const expense of expenseFixtures) {
    await expenseStore.addExpense(expense);
  }

  // Seed historical net worth snapshots for testing
  // This shows net worth growing over time with per-account breakdown
  const snapshotStore = useSnapshotStore.getState();

  // Helper to create historical account snapshots with progressive values
  const createHistoricalAccountSnapshots = (monthIndex: number) => {
    // monthIndex: 0=July, 1=Aug, 2=Sep, 3=Oct, 4=Nov
    // Assets grow over time, liabilities shrink
    const growthFactor = 1 + (monthIndex * 0.03); // 3% growth per month
    const debtReduction = 1 - (monthIndex * 0.02); // 2% debt reduction per month

    return [
      { accountId: 'mock-bbva', balance: Math.round(35000 * growthFactor), balanceBase: Math.round(35000 * growthFactor), accountName: 'BBVA Checking', accountType: 'bank' as const, currency: 'MXN', nature: 'asset' as const },
      { accountId: 'mock-banorte', balance: Math.round(100000 * growthFactor), balanceBase: Math.round(100000 * growthFactor), accountName: 'Banorte Savings', accountType: 'bank' as const, currency: 'MXN', nature: 'asset' as const },
      { accountId: 'mock-brokerage', balance: Math.round(10000 * growthFactor), balanceBase: Math.round(10000 * growthFactor * 20.5), accountName: 'Brokerage Account', accountType: 'investment' as const, currency: 'USD', nature: 'asset' as const },
      { accountId: 'mock-gbm', balance: Math.round(40000 * growthFactor), balanceBase: Math.round(40000 * growthFactor), accountName: 'GBM+ CETES', accountType: 'investment' as const, currency: 'MXN', nature: 'asset' as const },
      { accountId: 'mock-emergency', balance: Math.round(20000 * growthFactor), balanceBase: Math.round(20000 * growthFactor), accountName: 'Emergency Fund', accountType: 'cash' as const, currency: 'MXN', nature: 'asset' as const },
      { accountId: 'mock-amex', balance: Math.round(-12000 * debtReduction), balanceBase: Math.round(-12000 * debtReduction), accountName: 'AMEX Gold', accountType: 'credit-card' as const, currency: 'MXN', nature: 'liability' as const },
      { accountId: 'mock-visa', balance: Math.round(-5000 * debtReduction), balanceBase: Math.round(-5000 * debtReduction), accountName: 'Visa Infinite', accountType: 'credit-card' as const, currency: 'MXN', nature: 'liability' as const },
      { accountId: 'mock-car', balance: Math.round(-95000 * debtReduction), balanceBase: Math.round(-95000 * debtReduction), accountName: 'Car Loan', accountType: 'loan' as const, currency: 'MXN', nature: 'liability' as const },
    ];
  };

  const historicalSnapshots = [
    {
      monthEndLocal: '2025-07',
      netWorthBase: 320000,
      totalsByNature: { asset: 380000, liability: -60000, income: 0, expense: 0, equity: 0 },
      accountSnapshots: createHistoricalAccountSnapshots(0),
      createdAt: '2025-07-31T23:59:59.000Z',
    },
    {
      monthEndLocal: '2025-08',
      netWorthBase: 335000,
      totalsByNature: { asset: 400000, liability: -65000, income: 0, expense: 0, equity: 0 },
      accountSnapshots: createHistoricalAccountSnapshots(1),
      createdAt: '2025-08-31T23:59:59.000Z',
    },
    {
      monthEndLocal: '2025-09',
      netWorthBase: 348000,
      totalsByNature: { asset: 420000, liability: -72000, income: 0, expense: 0, equity: 0 },
      accountSnapshots: createHistoricalAccountSnapshots(2),
      createdAt: '2025-09-30T23:59:59.000Z',
    },
    {
      monthEndLocal: '2025-10',
      netWorthBase: 362000,
      totalsByNature: { asset: 445000, liability: -83000, income: 0, expense: 0, equity: 0 },
      accountSnapshots: createHistoricalAccountSnapshots(3),
      createdAt: '2025-10-31T23:59:59.000Z',
    },
    {
      monthEndLocal: '2025-11',
      netWorthBase: 378000,
      totalsByNature: { asset: 470000, liability: -92000, income: 0, expense: 0, equity: 0 },
      accountSnapshots: createHistoricalAccountSnapshots(4),
      createdAt: '2025-11-30T23:59:59.000Z',
    },
  ];

  useSnapshotStore.setState({ snapshots: historicalSnapshots });

  // Create current month snapshot based on actual account data
  await snapshotStore.createSnapshot();
};
