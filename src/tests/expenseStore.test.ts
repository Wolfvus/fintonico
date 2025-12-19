import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { useExpenseStore } from '../stores/expenseStore';
import { useCurrencyStore } from '../stores/currencyStore';

const resetStores = () => {
  localStorage.clear();
  useExpenseStore.setState({ expenses: [], loading: false, error: null });
  useCurrencyStore.setState({
    baseCurrency: 'MXN',
    enabledCurrencies: ['MXN', 'USD', 'EUR'],
    exchangeRates: { MXN: 1, USD: 0.05, EUR: 0.045 },
    lastUpdated: Date.now(),
    loading: false,
    error: null,
  });
};

describe('expenseStore', () => {
  beforeEach(() => {
    resetStores();
  });

  describe('addExpense', () => {
    it('adds a valid expense with all required fields', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Groceries',
        amount: 500,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses).toHaveLength(1);
      expect(expenses[0].what).toBe('Groceries');
      expect(expenses[0].amount).toBe(500);
      expect(expenses[0].currency).toBe('MXN');
      expect(expenses[0].rating).toBe('essential');
      expect(expenses[0].id).toBeDefined();
      expect(expenses[0].created_at).toBeDefined();
    });

    it('uses current date if not provided', async () => {
      const store = useExpenseStore.getState();
      const today = new Date().toISOString().split('T')[0];

      await store.addExpense({
        what: 'Coffee',
        amount: 50,
        currency: 'MXN',
        rating: 'discretionary',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].date).toBe(today);
    });

    it('uses provided date when specified', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Dinner',
        amount: 300,
        currency: 'MXN',
        rating: 'discretionary',
        date: '2025-01-15',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].date).toBe('2025-01-15');
    });

    it('sanitizes description (XSS prevention)', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: '<script>alert("xss")</script>Food',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].what).not.toContain('<');
      expect(expenses[0].what).not.toContain('>');
    });

    it('truncates description to 30 characters', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'This is a very long description that exceeds thirty characters',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].what.length).toBeLessThanOrEqual(30);
    });

    it('throws error for empty description', async () => {
      const store = useExpenseStore.getState();

      await expect(
        store.addExpense({
          what: '',
          amount: 100,
          currency: 'MXN',
          rating: 'essential',
        })
      ).rejects.toThrow('Invalid expense data');
    });

    it('throws error for invalid amount', async () => {
      const store = useExpenseStore.getState();

      await expect(
        store.addExpense({
          what: 'Test',
          amount: 0, // Below minimum
          currency: 'MXN',
          rating: 'essential',
        })
      ).rejects.toThrow('Invalid expense data');
    });

    it('accepts all valid rating types', async () => {
      const store = useExpenseStore.getState();
      const ratings = ['essential', 'discretionary', 'luxury'] as const;

      for (const rating of ratings) {
        await store.addExpense({
          what: `${rating} expense`,
          amount: 100,
          currency: 'MXN',
          rating,
        });
      }

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses).toHaveLength(3);
      expect(expenses.map(e => e.rating)).toEqual(['luxury', 'discretionary', 'essential']);
    });

    it('sets recurring flag correctly', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Netflix',
        amount: 199,
        currency: 'MXN',
        rating: 'discretionary',
        recurring: true,
      });

      await store.addExpense({
        what: 'One-time purchase',
        amount: 500,
        currency: 'MXN',
        rating: 'discretionary',
        recurring: false,
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].recurring).toBe(false);
      expect(expenses[1].recurring).toBe(true);
    });

    it('defaults recurring to false', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Test',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].recurring).toBe(false);
    });

    it('adds new expenses to the beginning of the list', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'First',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      await store.addExpense({
        what: 'Second',
        amount: 200,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].what).toBe('Second');
      expect(expenses[1].what).toBe('First');
    });
  });

  describe('deleteExpense', () => {
    it('removes expense by id', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'To Delete',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses).toHaveLength(1);

      await store.deleteExpense(expenses[0].id);

      expect(useExpenseStore.getState().expenses).toHaveLength(0);
    });

    it('only removes the specified expense', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Keep 1',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      await store.addExpense({
        what: 'Delete',
        amount: 200,
        currency: 'MXN',
        rating: 'essential',
      });

      await store.addExpense({
        what: 'Keep 2',
        amount: 300,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      const deleteId = expenses.find(e => e.what === 'Delete')!.id;

      await store.deleteExpense(deleteId);

      const remaining = useExpenseStore.getState().expenses;
      expect(remaining).toHaveLength(2);
      expect(remaining.map(e => e.what)).toEqual(['Keep 2', 'Keep 1']);
    });

    it('handles non-existent id gracefully', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Test',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
      });

      // Should not throw
      await store.deleteExpense('non-existent-id');

      expect(useExpenseStore.getState().expenses).toHaveLength(1);
    });
  });

  describe('getMonthlyTotal', () => {
    it('returns 0 when no expenses', () => {
      const store = useExpenseStore.getState();
      expect(store.getMonthlyTotal()).toBe(0);
    });

    it('calculates total for current month expenses', async () => {
      const store = useExpenseStore.getState();
      const today = new Date().toISOString().split('T')[0];

      await store.addExpense({
        what: 'Expense 1',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
        date: today,
      });

      await store.addExpense({
        what: 'Expense 2',
        amount: 200,
        currency: 'MXN',
        rating: 'essential',
        date: today,
      });

      expect(store.getMonthlyTotal()).toBe(300);
    });

    it('excludes expenses from other months', async () => {
      const store = useExpenseStore.getState();
      const today = new Date().toISOString().split('T')[0];

      // Last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthDate = lastMonth.toISOString().split('T')[0];

      await store.addExpense({
        what: 'This month',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
        date: today,
      });

      await store.addExpense({
        what: 'Last month',
        amount: 500,
        currency: 'MXN',
        rating: 'essential',
        date: lastMonthDate,
      });

      expect(store.getMonthlyTotal()).toBe(100);
    });

    it('converts multi-currency expenses to base currency', async () => {
      const store = useExpenseStore.getState();
      const today = new Date().toISOString().split('T')[0];

      // Exchange rate: 1 MXN = 0.05 USD, so 1 USD = 20 MXN
      await store.addExpense({
        what: 'MXN expense',
        amount: 100,
        currency: 'MXN',
        rating: 'essential',
        date: today,
      });

      await store.addExpense({
        what: 'USD expense',
        amount: 10, // Should be 200 MXN (10 / 0.05)
        currency: 'USD',
        rating: 'essential',
        date: today,
      });

      // 100 MXN + 200 MXN = 300 MXN
      expect(store.getMonthlyTotal()).toBe(300);
    });
  });

  describe('expense ratings', () => {
    it('categorizes essential expenses correctly', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Rent',
        amount: 10000,
        currency: 'MXN',
        rating: 'essential',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].rating).toBe('essential');
    });

    it('categorizes discretionary expenses correctly', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Dining out',
        amount: 500,
        currency: 'MXN',
        rating: 'discretionary',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].rating).toBe('discretionary');
    });

    it('categorizes luxury expenses correctly', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Designer bag',
        amount: 15000,
        currency: 'MXN',
        rating: 'luxury',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].rating).toBe('luxury');
    });
  });

  describe('multi-currency support', () => {
    it('stores USD expenses correctly', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'Amazon purchase',
        amount: 50,
        currency: 'USD',
        rating: 'discretionary',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].currency).toBe('USD');
      expect(expenses[0].amount).toBe(50);
    });

    it('stores EUR expenses correctly', async () => {
      const store = useExpenseStore.getState();

      await store.addExpense({
        what: 'European subscription',
        amount: 9.99,
        currency: 'EUR',
        rating: 'discretionary',
      });

      const expenses = useExpenseStore.getState().expenses;
      expect(expenses[0].currency).toBe('EUR');
      expect(expenses[0].amount).toBe(9.99);
    });
  });
});
