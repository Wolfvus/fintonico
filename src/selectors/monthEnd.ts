import { useLedgerStore } from '../stores/ledgerStore';
import { useCurrencyStore } from '../stores/currencyStore';
import { useAccountStore } from '../stores/accountStore';
import { Money } from '../domain/money';
import type { Account as LedgerAccount } from '../domain/ledger';
import { getAccountMetadata } from '../config/accountRegistry';
import { isAssetAccountType, isLiabilityAccountType } from '../utils/accountClassifications';
import type { Account as UserAccount } from '../types';

export interface MonthEndAccountSummary {
  accountId: string;
  accountName: string;
  subtype: string;
  balance: Money;
  recommendedAction?: 'paydown' | 'review';
}

export interface MonthEndSummary {
  asOfDate: Date;
  baseCurrency: string;
  totalCash: Money;
  totalLiabilities: Money;
  netCash: Money;
  cashAccounts: MonthEndAccountSummary[];
  liabilityAccounts: MonthEndAccountSummary[];
}

const toEndOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

export const getMonthEndSummary = (asOf: Date = new Date()): MonthEndSummary => {
  const ledgerStore = useLedgerStore.getState();
  const { baseCurrency, convertAmount } = useCurrencyStore.getState();

  const asOfDate = toEndOfDay(asOf);

  const userAccounts = useAccountStore.getState().accounts;
  const ledgerAccounts = ledgerStore.accounts;
  const userAccountMap = new Map(userAccounts.map((account) => [account.id, account]));
  const ledgerAccountMap = new Map(ledgerAccounts.map((account) => [account.id, account]));

  interface LedgerAccountContext {
    ledgerAccount: LedgerAccount;
    userAccount?: UserAccount;
  }

  const contextFromUser = (account: UserAccount): LedgerAccountContext | null => {
    const ledgerAccount = ledgerAccountMap.get(account.id);
    if (!ledgerAccount || !ledgerAccount.isActive) {
      return null;
    }
    return {
      ledgerAccount,
      userAccount: account,
    };
  };

  const userCashContexts = userAccounts
    .filter((account) => isAssetAccountType(account.type))
    .map(contextFromUser)
    .filter((context): context is LedgerAccountContext => context !== null);

  const userLiabilityContexts = userAccounts
    .filter((account) => isLiabilityAccountType(account.type))
    .map(contextFromUser)
    .filter((context): context is LedgerAccountContext => context !== null);

  const defaultCashContexts: LedgerAccountContext[] = ledgerAccounts
    .filter((account) => {
      if (!account.isActive || userAccountMap.has(account.id)) {
        return false;
      }
      const subtype = getAccountMetadata(account.id).subtype;
      return subtype === 'operating-cash' || subtype === 'savings';
    })
    .map((account) => ({ ledgerAccount: account }));

  const defaultLiabilityContexts: LedgerAccountContext[] = ledgerAccounts
    .filter((account) => {
      if (!account.isActive || userAccountMap.has(account.id)) {
        return false;
      }
      const subtype = getAccountMetadata(account.id).subtype;
      return subtype === 'credit-card' || subtype === 'loan';
    })
    .map((account) => ({ ledgerAccount: account }));

  const toBaseMoney = (money: Money): Money => {
    if (money.getCurrency() === baseCurrency) {
      return money;
    }
    const converted = convertAmount(money.toMajorUnits(), money.getCurrency(), baseCurrency);
    return Money.fromMajorUnits(converted, baseCurrency);
  };

  const summariseAccounts = (candidateAccounts: LedgerAccountContext[]): MonthEndAccountSummary[] => {
    return candidateAccounts.map(({ ledgerAccount, userAccount }) => {
      const balance = toBaseMoney(ledgerStore.getAccountBalance(ledgerAccount.id, asOfDate));
      const metadata = getAccountMetadata(ledgerAccount.id);

      const subtype = userAccount
        ? isLiabilityAccountType(userAccount.type)
          ? 'credit-card'
          : 'operating-cash'
        : metadata.subtype;

      const normalisedBalance =
        subtype === 'credit-card' || subtype === 'loan' ? balance.abs() : balance;

      const recommendedAction = userAccount
        ? isLiabilityAccountType(userAccount.type)
          ? 'paydown'
          : undefined
        : metadata.monthEndAction;

      return {
        accountId: ledgerAccount.id,
        accountName: userAccount?.name ?? ledgerAccount.name,
        subtype,
        balance: normalisedBalance,
        recommendedAction,
      };
    });
  };

  const cashAccounts = summariseAccounts([...userCashContexts, ...defaultCashContexts]);
  const liabilityAccounts = summariseAccounts([...userLiabilityContexts, ...defaultLiabilityContexts]);

  const totalCash = cashAccounts.reduce(
    (sum, item) => sum.add(item.balance),
    Money.fromMinorUnits(0, baseCurrency),
  );

  const totalLiabilities = liabilityAccounts.reduce(
    (sum, item) => sum.add(item.balance),
    Money.fromMinorUnits(0, baseCurrency),
  );

  const netCash = totalCash.subtract(totalLiabilities);

  return {
    asOfDate,
    baseCurrency,
    totalCash,
    totalLiabilities,
    netCash,
    cashAccounts,
    liabilityAccounts,
  };
};
