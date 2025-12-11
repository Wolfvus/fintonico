import { create } from 'zustand';
import { useCurrencyStore } from './currencyStore';
import { useAccountStore } from './accountStore';
import { useLedgerStore } from './ledgerStore';
import { Money } from '../domain/money';
import type { Income } from '../types';
import { sanitizeDescription, validateAmount, validateDate } from '../utils/sanitization';
import { isBalanceSheetAccountType } from '../utils/accountClassifications';
import { incomeApi } from '../api';

// Use API mode when backend is available
const USE_API = import.meta.env.VITE_USE_API === 'true';

export type IncomeFrequency = 'one-time' | 'weekly' | 'yearly' | 'monthly';

export interface NewIncome {
  source: string;
  amount: number;
  currency: string;
  frequency: IncomeFrequency;
  date?: string;
  depositAccountId?: string;
}

interface IncomeState {
  incomes: Income[];
  loading: boolean;
  error: string | null;
  addIncome: (income: NewIncome) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  fetchIncomes: (filters?: { startDate?: string; endDate?: string }) => Promise<void>;
  getMonthlyTotal: () => number;
  generateInvestmentYields: () => void;
  clearError: () => void;
  // Internal method to derive from ledger
  _deriveIncomesFromLedger: () => Income[];
}

const STORAGE_KEY = 'fintonico-incomes';

const storage = {
  get: (): Income[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      
      // Validate and sanitize each income
      return parsed.filter((income: any) => {
        if (typeof income !== 'object' || !income) return false;
        const sourceResult = sanitizeDescription(income.source || '');
        const amountResult = validateAmount(String(income.amount || ''));
        const dateResult = validateDate(income.date || '');
        return sourceResult && amountResult.isValid && dateResult.isValid;
      }).map((income: any) => ({
        id: String(income.id || crypto.randomUUID()),
        source: sanitizeDescription(income.source),
        amount: validateAmount(String(income.amount)).sanitizedValue,
        currency: String(income.currency || 'MXN'),
        frequency: String(income.frequency || 'monthly') as IncomeFrequency,
        date: income.date,
        created_at: String(income.created_at || new Date().toISOString()),
        depositAccountId: income.depositAccountId,
        depositAccountName: income.depositAccountName,
        depositAccountNature: income.depositAccountNature
      }));
    } catch (error) {
      console.error('Error loading incomes from localStorage:', error);
      return [];
    }
  },
  set: (incomes: Income[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incomes));
    } catch (error) {
      console.error('Error saving incomes to localStorage:', error);
    }
  }
};

export const useIncomeStore = create<IncomeState>((set, get) => ({
  incomes: storage.get(),
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  // Fetch incomes from API or derive from ledger
  fetchIncomes: async (filters) => {
    if (USE_API) {
      set({ loading: true, error: null });
      try {
        const response = await incomeApi.getAll({
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        });
        // Map API response to local Income type
        const incomes: Income[] = response.data.map(i => ({
          id: i.id,
          source: i.source,
          amount: i.amount,
          currency: i.currency,
          frequency: (i.recurrence_interval as IncomeFrequency) || 'one-time',
          date: i.received_date,
          created_at: i.created_at,
          depositAccountId: undefined,
          depositAccountName: undefined,
          depositAccountNature: undefined,
        }));
        set({ incomes, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    } else {
      // Derive from ledger in local mode
      set({ incomes: get()._deriveIncomesFromLedger() });
    }
  },

  // Derive incomes from ledger transactions
  _deriveIncomesFromLedger: () => {
    const ledgerStore = useLedgerStore.getState();
    const transactions = ledgerStore.getTransactions();
    const incomeAccounts = ledgerStore.getAccountsByNature('income');
    
    // Convert transactions with income postings to Income format
    const derivedIncomes: Income[] = [];
    
    for (const transaction of transactions) {
      for (const posting of transaction.postings) {
        // Use original amount for display, check if this is an income posting
        const originalAmount = posting.originalCreditAmount;
        if (originalAmount && incomeAccounts.some(acc => acc.id === posting.accountId)) {
          const account = ledgerStore.getAccount(posting.accountId);
          if (account) {
            // Ensure originalAmount is a Money object
            const amount = typeof originalAmount.toMajorUnits === 'function' 
              ? originalAmount.toMajorUnits() 
              : typeof originalAmount.getAmountMajor === 'function'
              ? originalAmount.getAmountMajor()
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
            const counterpartPosting = transaction.postings
              .filter(p => p.id !== posting.id)
              .find(p => {
                const cpAccount = ledgerStore.getAccount(p.accountId);
                return cpAccount && (cpAccount.nature === 'asset' || cpAccount.nature === 'liability');
              }) || transaction.postings.find(p => p.id !== posting.id);

            let depositAccountId: string | undefined;
            let depositAccountName: string | undefined;
            let depositAccountNature: 'asset' | 'liability' | undefined;

            if (counterpartPosting) {
              const depositAccount = ledgerStore.getAccount(counterpartPosting.accountId);
              if (depositAccount) {
                depositAccountId = depositAccount.id;
                if (depositAccount.nature === 'asset' || depositAccount.nature === 'liability') {
                  depositAccountNature = depositAccount.nature;
                }
                depositAccountName = depositAccount.name;
              }
            }
              
            derivedIncomes.push({
              id: `${transaction.id}-${posting.id}`,
              source: transaction.description,
              amount,
              currency,
              frequency: 'one-time',
              date: transactionDate.toISOString().split('T')[0],
              created_at: createdAtDate.toISOString(),
              depositAccountId,
              depositAccountName,
              depositAccountNature
            });
          }
        }
      }
    }
    
    return derivedIncomes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addIncome: async (data: NewIncome) => {
    if (USE_API) {
      // API mode: call backend
      set({ loading: true, error: null });
      try {
        await incomeApi.create({
          amount: data.amount,
          currency: data.currency,
          source: data.source,
          received_date: data.date || new Date().toISOString().split('T')[0],
          is_recurring: data.frequency !== 'one-time',
          recurrence_interval: data.frequency !== 'one-time' ? data.frequency : undefined,
          create_transaction: true,
          deposit_account_id: data.depositAccountId,
        });
        // Refresh incomes list
        await get().fetchIncomes();
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
      return;
    }

    // Local mode: use ledger store
    const ledgerStore = useLedgerStore.getState();
    const accountStore = useAccountStore.getState();

    // Ensure default accounts exist
    ledgerStore.initializeDefaultAccounts();

    const candidateDepositAccountId =
      data.depositAccountId ??
      accountStore.accounts.find((account) => isBalanceSheetAccountType(account.type))?.id;

    if (!candidateDepositAccountId) {
      throw new Error('Select or create a deposit account before adding income');
    }

    const userDepositAccount = accountStore.accounts.find(
      (account) => account.id === candidateDepositAccountId
    );

    if (!userDepositAccount || !isBalanceSheetAccountType(userDepositAccount.type)) {
      throw new Error('Deposit account must be an asset or liability account');
    }

    const depositAccount = ledgerStore.syncExternalAccount(userDepositAccount);
    const incomeAccount = ledgerStore.getAccount('salary') || ledgerStore.getAccountsByNature('income')[0];

    if (!depositAccount || !incomeAccount) {
      throw new Error('Required accounts not found');
    }

    const amount = Money.fromMajorUnits(data.amount, data.currency);
    const date = data.date ? new Date(data.date) : new Date();

    // Add transaction to ledger
    ledgerStore.addIncomeTransaction(
      data.source,
      amount,
      depositAccount.id,
      incomeAccount.id,
      date
    );

    // Update local state to reflect changes
    set({ incomes: get()._deriveIncomesFromLedger() });
  },

  deleteIncome: async (id: string) => {
    if (USE_API) {
      // API mode: call backend
      set({ loading: true, error: null });
      try {
        await incomeApi.delete(id);
        // Refresh incomes list
        await get().fetchIncomes();
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
      return;
    }

    // Local mode: use ledger store
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

    // Try to find the transaction
    const transaction = ledgerStore.getTransaction(transactionId);

    if (transaction) {
      ledgerStore.deleteTransaction(transactionId);
      // Update local state
      set({ incomes: get()._deriveIncomesFromLedger() });
    } else {
      // Fallback: delete from legacy storage
      const incomes = get().incomes.filter(i => i.id !== id);
      set({ incomes });
      storage.set(incomes);
    }
  },

  getMonthlyTotal: () => {
    const now = new Date();
    const { baseCurrency } = useCurrencyStore.getState();
    
    // Get income from ledger for current month
    const ledgerStore = useLedgerStore.getState();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const incomeStatement = ledgerStore.getIncomeStatement(startOfMonth, endOfMonth, baseCurrency);
    return incomeStatement.totalIncome.toMajorUnits();
  },

  generateInvestmentYields: () => {
    const { accounts } = useAccountStore.getState();
    const investmentAccounts = accounts.filter(account => account.type === 'investment');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    
    // Check if we already have investment yields for this month
    const existingYields = get().incomes.filter(income => 
      income.source.startsWith('Investment yield:') && 
      income.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
    );
    
    if (existingYields.length > 0) {
      return; // Already generated for this month
    }
    
    const yieldIncomes = investmentAccounts.map(account => {
      // Calculate total value of the investment account (using new single currency/balance format)
      const { convertAmount, baseCurrency } = useCurrencyStore.getState();
      const accountTotal = convertAmount(account.balance, account.currency, baseCurrency);
      
      // Assume 5% annual yield, calculate monthly
      const monthlyYield = (accountTotal * 0.05) / 12;
      
      return {
        id: `investment-yield-${account.id}-${currentYear}-${currentMonth}`,
        source: `Investment yield: ${account.name}`,
        amount: monthlyYield,
        currency: useCurrencyStore.getState().baseCurrency,
        frequency: 'monthly' as IncomeFrequency,
        date: firstDayOfMonth,
        created_at: new Date().toISOString(),
        depositAccountId: account.id,
        depositAccountName: account.name,
        depositAccountNature: 'asset' as const,
      };
    });
    
    if (yieldIncomes.length > 0) {
      const allIncomes = [...yieldIncomes, ...get().incomes];
      set({ incomes: allIncomes });
      storage.set(allIncomes);
    }
  }
}));
