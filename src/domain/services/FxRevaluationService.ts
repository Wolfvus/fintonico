// Service for handling foreign exchange revaluation transactions
import { Money } from '../money';
import { CommonTransactions } from '../ledger';
import type { Transaction } from '../ledger';
import type { ExchangeRate } from '../ports/RatesRepository';

export interface FxPosition {
  accountId: string;
  currency: string;
  originalAmount: Money; // Sum of all original amounts in this currency
  bookedAmount: Money; // Sum of all booked amounts in base currency
  currentValue: Money; // Current value at month-end rate in base currency
  unrealizedGainLoss: Money; // Difference between current value and booked amount
}

export interface RevaluationResult {
  positions: FxPosition[];
  revaluationTransactions: Transaction[];
  totalUnrealizedGainLoss: Money;
  revaluationDate: Date;
}

export class FxRevaluationService {
  
  // Calculate FX positions for all foreign currency accounts
  static calculateFxPositions(
    accountPostings: Array<{
      accountId: string;
      originalDebitAmount: Money | null;
      originalCreditAmount: Money | null;
      bookedDebitAmount: Money | null;
      bookedCreditAmount: Money | null;
    }>,
    monthEndRates: ExchangeRate[],
    baseCurrency: string
  ): FxPosition[] {
    const positionMap = new Map<string, { accountId: string; currency: string; originalSum: Money; bookedSum: Money }>();
    
    // Aggregate positions by account and currency
    for (const posting of accountPostings) {
      const originalAmount = posting.originalDebitAmount || posting.originalCreditAmount;
      const bookedAmount = posting.bookedDebitAmount || posting.bookedCreditAmount;
      
      if (!originalAmount || !bookedAmount || originalAmount.getCurrency() === baseCurrency) {
        continue; // Skip base currency positions
      }
      
      const key = `${posting.accountId}-${originalAmount.getCurrency()}`;
      const existing = positionMap.get(key);
      
      if (existing) {
        existing.originalSum = existing.originalSum.add(originalAmount);
        existing.bookedSum = existing.bookedSum.add(bookedAmount);
      } else {
        positionMap.set(key, {
          accountId: posting.accountId,
          currency: originalAmount.getCurrency(),
          originalSum: originalAmount,
          bookedSum: bookedAmount
        });
      }
    }
    
    // Calculate current values and unrealized gains/losses
    const positions: FxPosition[] = [];
    
    for (const position of positionMap.values()) {
      const rate = monthEndRates.find(r => 
        r.fromCurrency === position.currency && 
        r.toCurrency === baseCurrency && 
        r.rateType === 'month-end'
      );
      
      if (!rate) {
        console.warn(`No month-end rate found for ${position.currency}/${baseCurrency}`);
        continue;
      }
      
      const currentValue = Money.fromMajorUnits(
        position.originalSum.toMajorUnits() * rate.rate,
        baseCurrency
      );
      
      const unrealizedGainLoss = currentValue.subtract(position.bookedSum);
      
      positions.push({
        accountId: position.accountId,
        currency: position.currency,
        originalAmount: position.originalSum,
        bookedAmount: position.bookedSum,
        currentValue,
        unrealizedGainLoss
      });
    }
    
    return positions;
  }
  
  // Generate revaluation transactions for month-end
  static generateRevaluationTransactions(
    positions: FxPosition[],
    fxGainLossAccountId: string,
    baseCurrency: string,
    revaluationDate: Date,
    description: string = 'Monthly FX revaluation'
  ): Transaction[] {
    const transactions: Transaction[] = [];
    
    for (const position of positions) {
      if (position.unrealizedGainLoss.isZero()) {
        continue; // No revaluation needed
      }
      
      const transactionDescription = `${description} - ${position.currency} position`;
      
      const revaluationTx = CommonTransactions.fxRevaluation(
        position.accountId,
        fxGainLossAccountId,
        position.unrealizedGainLoss,
        baseCurrency,
        transactionDescription,
        revaluationDate
      );
      
      transactions.push(revaluationTx);
    }
    
    return transactions;
  }
  
  // Perform complete month-end revaluation
  static performMonthEndRevaluation(
    accountPostings: Array<{
      accountId: string;
      originalDebitAmount: Money | null;
      originalCreditAmount: Money | null;
      bookedDebitAmount: Money | null;
      bookedCreditAmount: Money | null;
    }>,
    monthEndRates: ExchangeRate[],
    fxGainLossAccountId: string,
    baseCurrency: string,
    year: number,
    month: number
  ): RevaluationResult {
    const revaluationDate = new Date(year, month, 0); // Last day of month
    
    const positions = this.calculateFxPositions(
      accountPostings,
      monthEndRates,
      baseCurrency
    );
    
    const revaluationTransactions = this.generateRevaluationTransactions(
      positions,
      fxGainLossAccountId,
      baseCurrency,
      revaluationDate,
      `Month-end FX revaluation ${year}-${String(month).padStart(2, '0')}`
    );
    
    const totalUnrealizedGainLoss = positions.reduce(
      (total, position) => total.add(position.unrealizedGainLoss),
      Money.fromMinorUnits(0, baseCurrency)
    );
    
    return {
      positions,
      revaluationTransactions,
      totalUnrealizedGainLoss,
      revaluationDate
    };
  }
  
  // Helper to determine if revaluation is needed for a period
  static isRevaluationNeeded(
    positions: FxPosition[],
    materialityThreshold: Money
  ): boolean {
    const totalAbsGainLoss = positions.reduce(
      (total, position) => total.add(position.unrealizedGainLoss.abs()),
      Money.fromMinorUnits(0, materialityThreshold.getCurrency())
    );
    
    return totalAbsGainLoss.toMinorUnits() >= materialityThreshold.toMinorUnits();
  }
}