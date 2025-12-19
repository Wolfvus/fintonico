import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { useIncomeStore } from '../stores/incomeStore';
import { useCurrencyStore } from '../stores/currencyStore';

const resetStores = () => {
  localStorage.clear();
  useIncomeStore.setState({ incomes: [], loading: false, error: null });
  useCurrencyStore.setState({
    baseCurrency: 'MXN',
    enabledCurrencies: ['MXN', 'USD', 'EUR'],
    exchangeRates: { MXN: 1, USD: 0.05, EUR: 0.045 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  });
};

describe('incomeStore', () => {
  beforeEach(() => {
    resetStores();
  });

  describe('addIncome', () => {
    it('adds a valid income with all required fields', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Salary',
        amount: 50000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes).toHaveLength(1);
      expect(incomes[0].source).toBe('Salary');
      expect(incomes[0].amount).toBe(50000);
      expect(incomes[0].currency).toBe('MXN');
      expect(incomes[0].frequency).toBe('monthly');
      expect(incomes[0].id).toBeDefined();
      expect(incomes[0].created_at).toBeDefined();
    });

    it('uses current date if not provided', async () => {
      const store = useIncomeStore.getState();
      const today = new Date().toISOString().split('T')[0];

      await store.addIncome({
        source: 'Freelance',
        amount: 5000,
        currency: 'MXN',
        frequency: 'one-time',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].date).toBe(today);
    });

    it('uses provided date when specified', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Bonus',
        amount: 10000,
        currency: 'MXN',
        frequency: 'one-time',
        date: '2025-01-15',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].date).toBe('2025-01-15');
    });

    it('sanitizes source (XSS prevention)', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: '<script>alert("xss")</script>Income',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].source).not.toContain('<');
      expect(incomes[0].source).not.toContain('>');
    });

    it('truncates source to 30 characters', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'This is a very long income source description that exceeds thirty characters',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].source.length).toBeLessThanOrEqual(30);
    });

    it('throws error for empty source', async () => {
      const store = useIncomeStore.getState();

      await expect(
        store.addIncome({
          source: '',
          amount: 1000,
          currency: 'MXN',
          frequency: 'monthly',
        })
      ).rejects.toThrow('Invalid income data');
    });

    it('throws error for invalid amount', async () => {
      const store = useIncomeStore.getState();

      await expect(
        store.addIncome({
          source: 'Test',
          amount: 0, // Below minimum
          currency: 'MXN',
          frequency: 'monthly',
        })
      ).rejects.toThrow('Invalid income data');
    });

    it('accepts all valid frequency types', async () => {
      const store = useIncomeStore.getState();
      const frequencies = ['one-time', 'weekly', 'bi-weekly', 'monthly'] as const;

      for (const frequency of frequencies) {
        await store.addIncome({
          source: `${frequency} income`,
          amount: 1000,
          currency: 'MXN',
          frequency,
        });
      }

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes).toHaveLength(4);
      expect(incomes.map(i => i.frequency)).toEqual(['monthly', 'bi-weekly', 'weekly', 'one-time']);
    });

    it('adds new incomes to the beginning of the list', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'First',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      await store.addIncome({
        source: 'Second',
        amount: 2000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].source).toBe('Second');
      expect(incomes[1].source).toBe('First');
    });
  });

  describe('deleteIncome', () => {
    it('removes income by id', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'To Delete',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes).toHaveLength(1);

      await store.deleteIncome(incomes[0].id);

      expect(useIncomeStore.getState().incomes).toHaveLength(0);
    });

    it('only removes the specified income', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Keep 1',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      await store.addIncome({
        source: 'Delete',
        amount: 2000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      await store.addIncome({
        source: 'Keep 2',
        amount: 3000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      const deleteId = incomes.find(i => i.source === 'Delete')!.id;

      await store.deleteIncome(deleteId);

      const remaining = useIncomeStore.getState().incomes;
      expect(remaining).toHaveLength(2);
      expect(remaining.map(i => i.source)).toEqual(['Keep 2', 'Keep 1']);
    });

    it('handles non-existent id gracefully', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Test',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      // Should not throw
      await store.deleteIncome('non-existent-id');

      expect(useIncomeStore.getState().incomes).toHaveLength(1);
    });
  });

  describe('getMonthlyTotal', () => {
    it('returns 0 when no incomes', () => {
      const store = useIncomeStore.getState();
      expect(store.getMonthlyTotal()).toBe(0);
    });

    it('calculates total for current month incomes', async () => {
      const store = useIncomeStore.getState();
      const today = new Date().toISOString().split('T')[0];

      await store.addIncome({
        source: 'Income 1',
        amount: 10000,
        currency: 'MXN',
        frequency: 'monthly',
        date: today,
      });

      await store.addIncome({
        source: 'Income 2',
        amount: 5000,
        currency: 'MXN',
        frequency: 'one-time',
        date: today,
      });

      expect(store.getMonthlyTotal()).toBe(15000);
    });

    it('excludes incomes from other months', async () => {
      const store = useIncomeStore.getState();
      const today = new Date().toISOString().split('T')[0];

      // Last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthDate = lastMonth.toISOString().split('T')[0];

      await store.addIncome({
        source: 'This month',
        amount: 10000,
        currency: 'MXN',
        frequency: 'monthly',
        date: today,
      });

      await store.addIncome({
        source: 'Last month',
        amount: 50000,
        currency: 'MXN',
        frequency: 'monthly',
        date: lastMonthDate,
      });

      expect(store.getMonthlyTotal()).toBe(10000);
    });

    it('converts multi-currency incomes to base currency', async () => {
      const store = useIncomeStore.getState();
      const today = new Date().toISOString().split('T')[0];

      // Exchange rate: 1 MXN = 0.05 USD, so 1 USD = 20 MXN
      await store.addIncome({
        source: 'MXN income',
        amount: 1000,
        currency: 'MXN',
        frequency: 'monthly',
        date: today,
      });

      await store.addIncome({
        source: 'USD income',
        amount: 100, // Should be 2000 MXN (100 / 0.05)
        currency: 'USD',
        frequency: 'monthly',
        date: today,
      });

      // 1000 MXN + 2000 MXN = 3000 MXN
      expect(store.getMonthlyTotal()).toBe(3000);
    });
  });

  describe('income frequencies', () => {
    it('stores one-time income correctly', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Bonus',
        amount: 5000,
        currency: 'MXN',
        frequency: 'one-time',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].frequency).toBe('one-time');
    });

    it('stores weekly income correctly', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Part-time job',
        amount: 2000,
        currency: 'MXN',
        frequency: 'weekly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].frequency).toBe('weekly');
    });

    it('stores bi-weekly income correctly', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Bi-weekly salary',
        amount: 15000,
        currency: 'MXN',
        frequency: 'bi-weekly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].frequency).toBe('bi-weekly');
    });

    it('stores monthly income correctly', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'Monthly salary',
        amount: 30000,
        currency: 'MXN',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].frequency).toBe('monthly');
    });
  });

  describe('multi-currency support', () => {
    it('stores USD income correctly', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'US client',
        amount: 3000,
        currency: 'USD',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].currency).toBe('USD');
      expect(incomes[0].amount).toBe(3000);
    });

    it('stores EUR income correctly', async () => {
      const store = useIncomeStore.getState();

      await store.addIncome({
        source: 'European client',
        amount: 2500,
        currency: 'EUR',
        frequency: 'monthly',
      });

      const incomes = useIncomeStore.getState().incomes;
      expect(incomes[0].currency).toBe('EUR');
      expect(incomes[0].amount).toBe(2500);
    });
  });
});
