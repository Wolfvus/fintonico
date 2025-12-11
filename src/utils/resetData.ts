import { useLedgerStore } from '../stores/ledgerStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useIncomeStore } from '../stores/incomeStore';
import { useAccountStore } from '../stores/accountStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { isAssetAccountType, isLiabilityAccountType } from './accountClassifications';

const PERSIST_KEYS = [
  'fintonico-currency',
  'fintonico-accounts',
  'fintonico-expenses',
  'fintonico-incomes',
  'fintonico-snapshots',
  'ledger-store',
  'fintonico-ledger',
];

export const clearMockData = async (): Promise<void> => {
  const ledger = useLedgerStore.getState();
  ledger.clearAllData();

  useExpenseStore.setState({ expenses: [], loading: false });
  useIncomeStore.setState({ incomes: [], loading: false });
  useAccountStore.setState({ accounts: [] });

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

  const supplementalAccounts = [
    {
      name: 'Brokerage Account',
      type: 'investment' as const,
      currency: 'USD',
      balance: 12000,
    },
    {
      name: 'Travel Fund',
      type: 'cash' as const,
      currency: 'MXN',
      balance: 5000,
    },
    {
      name: 'Visa Credit Card',
      type: 'credit-card' as const,
      currency: 'MXN',
      balance: -1800,
      dueDate: '2025-10-25',
    },
  ];

  supplementalAccounts.forEach((account) => {
    accountStore.addAccount(account);
  });

  const currentAccounts = useAccountStore.getState().accounts;
  const assetAccounts = currentAccounts.filter((account) => isAssetAccountType(account.type));
  const liabilityAccounts = currentAccounts.filter((account) =>
    isLiabilityAccountType(account.type),
  );

  const defaultDepositAccount = assetAccounts[0]?.id ?? liabilityAccounts[0]?.id;

  const defaultFundingFor = (rating: 'essential' | 'important' | 'non_essential' | 'luxury'): string => {
    if (rating === 'non_essential' || rating === 'luxury') {
      return liabilityAccounts[0]?.id ?? assetAccounts[0]?.id ?? defaultDepositAccount;
    }

    if (rating === 'important') {
      return assetAccounts[0]?.id ?? liabilityAccounts[0]?.id ?? defaultDepositAccount;
    }

    return assetAccounts[0]?.id ?? liabilityAccounts[0]?.id ?? defaultDepositAccount;
  };

  if (!defaultDepositAccount) {
    console.warn('Skipping mock data seeding; no eligible deposit accounts configured.');
    return;
  }

  const incomeFixtures = [
    {
      source: 'Full-time Salary',
      amount: 4200,
      currency: 'MXN',
      frequency: 'monthly' as const,
      date: '2025-10-01',
      depositAccountId: defaultDepositAccount,
    },
    {
      source: 'Freelance UX Audit',
      amount: 950,
      currency: 'USD',
      frequency: 'one-time' as const,
      date: '2025-10-12',
      depositAccountId: defaultDepositAccount,
    },
  ];

  for (const income of incomeFixtures) {
    await incomeStore.addIncome(income);
  }

  const expenseFixtures = [
    {
      what: 'Rent',
      amount: 1200,
      currency: 'MXN',
      rating: 'essential' as const,
      date: '2025-10-02',
      fundingAccountId: defaultFundingFor('essential'),
    },
    {
      what: 'Groceries',
      amount: 320,
      currency: 'MXN',
      rating: 'essential' as const,
      date: '2025-10-05',
      fundingAccountId: defaultFundingFor('essential'),
    },
    {
      what: 'Flight to NYC',
      amount: 450,
      currency: 'USD',
      rating: 'non_essential' as const,
      date: '2025-10-10',
      fundingAccountId: defaultFundingFor('non_essential'),
    },
    {
      what: 'Team Dinner',
      amount: 180,
      currency: 'MXN',
      rating: 'important' as const,
      date: '2025-10-15',
      fundingAccountId: defaultFundingFor('important'),
    },
  ];

  for (const expense of expenseFixtures) {
    await expenseStore.addExpense(expense);
  }
};
