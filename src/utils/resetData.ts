import { useLedgerStore } from '../stores/ledgerStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useIncomeStore } from '../stores/incomeStore';
import { useAccountStore } from '../stores/accountStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useLedgerAccountStore } from '../stores/ledgerAccountStore';

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

  useCurrencyStore.setState((state) => ({
    ...state,
    baseCurrency: 'MXN',
    enabledCurrencies: ['MXN', 'USD', 'EUR', 'BTC', 'ETH'],
    exchangeRates: { MXN: 1 },
    lastUpdated: null,
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
    },
    {
      name: 'Visa Infinite',
      type: 'credit-card' as const,
      currency: 'MXN',
      balance: -3200,
      recurringDueDate: 20,
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
      rating: 'non_essential' as const,
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
      rating: 'non_essential' as const,
      date: '2025-12-06',
    },
  ];

  for (const expense of expenseFixtures) {
    await expenseStore.addExpense(expense);
  }
};
