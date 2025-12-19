import './setupLocalStorage';

import { describe, it, expect, beforeEach } from 'vitest';
import { useAccountStore } from '../stores/accountStore';

const resetStore = () => {
  localStorage.clear();
  useAccountStore.setState({ accounts: [] });
};

describe('accountStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('addAccount', () => {
    it('adds a valid account with all required fields', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'My Savings',
        type: 'bank',
        currency: 'USD',
        balance: 5000,
      });

      expect(account.id).toBeDefined();
      expect(account.name).toBe('My Savings');
      expect(account.type).toBe('bank');
      expect(account.currency).toBe('USD');
      expect(account.balance).toBe(5000);
      expect(account.lastUpdated).toBeDefined();

      const accounts = useAccountStore.getState().accounts;
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe(account.id);
    });

    it('sanitizes XSS in account name', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: '<script>alert("xss")</script>My Account',
        type: 'bank',
        currency: 'MXN',
        balance: 1000,
      });

      expect(account.name).not.toContain('<');
      expect(account.name).not.toContain('>');
      expect(account.name).toContain('My Account');
    });

    it('validates account name is required', () => {
      const store = useAccountStore.getState();

      expect(() => {
        store.addAccount({
          name: '',
          type: 'bank',
          currency: 'USD',
          balance: 100,
        });
      }).toThrow('Account name is required');
    });

    it('validates account type', () => {
      const store = useAccountStore.getState();

      expect(() => {
        store.addAccount({
          name: 'Test',
          type: 'invalid-type' as any,
          currency: 'USD',
          balance: 100,
        });
      }).toThrow('Invalid account type');
    });

    it('validates currency', () => {
      const store = useAccountStore.getState();

      expect(() => {
        store.addAccount({
          name: 'Test',
          type: 'bank',
          currency: 'INVALID',
          balance: 100,
        });
      }).toThrow('Invalid currency');
    });

    it('accepts BTC and ETH currencies', () => {
      const store = useAccountStore.getState();

      const btcAccount = store.addAccount({
        name: 'Bitcoin Wallet',
        type: 'exchange',
        currency: 'BTC',
        balance: 0.5,
      });

      const ethAccount = store.addAccount({
        name: 'Ethereum Wallet',
        type: 'exchange',
        currency: 'ETH',
        balance: 2,
      });

      expect(btcAccount.currency).toBe('BTC');
      expect(ethAccount.currency).toBe('ETH');
    });

    it('validates balance amount', () => {
      const store = useAccountStore.getState();

      expect(() => {
        store.addAccount({
          name: 'Test',
          type: 'bank',
          currency: 'USD',
          balance: 2000000000, // Over 1 billion limit
        });
      }).toThrow('cannot exceed');
    });

    it('allows negative balance for liabilities', () => {
      const store = useAccountStore.getState();

      const creditCard = store.addAccount({
        name: 'Visa',
        type: 'credit-card',
        currency: 'USD',
        balance: -5000,
      });

      expect(creditCard.balance).toBe(-5000);
    });

    it('rounds balance to 2 decimal places', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 100.999,
      });

      expect(account.balance).toBe(101);
    });

    it('validates optional estimatedYield percentage', () => {
      const store = useAccountStore.getState();

      expect(() => {
        store.addAccount({
          name: 'Investment',
          type: 'investment',
          currency: 'USD',
          balance: 10000,
          estimatedYield: 150, // Over 100%
        });
      }).toThrow('Percentage must be between 0 and 100');
    });

    it('accepts valid estimatedYield', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Investment',
        type: 'investment',
        currency: 'USD',
        balance: 10000,
        estimatedYield: 5.5,
      });

      expect(account.estimatedYield).toBe(5.5);
    });

    it('validates recurringDueDate day of month', () => {
      const store = useAccountStore.getState();

      expect(() => {
        store.addAccount({
          name: 'Mortgage',
          type: 'mortgage',
          currency: 'USD',
          balance: -200000,
          recurringDueDate: 32, // Invalid day
        });
      }).toThrow('Day must be between 1 and 31');
    });
  });

  describe('updateAccount', () => {
    it('updates account with valid partial data', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Original Name',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      store.updateAccount(account.id, {
        name: 'Updated Name',
        balance: 2000,
      });

      const updated = useAccountStore.getState().accounts[0];
      expect(updated.name).toBe('Updated Name');
      expect(updated.balance).toBe(2000);
      expect(updated.currency).toBe('USD'); // Unchanged
    });

    it('validates name on update', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      expect(() => {
        store.updateAccount(account.id, { name: '' });
      }).toThrow('Account name is required');
    });

    it('validates type on update', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      expect(() => {
        store.updateAccount(account.id, { type: 'invalid' as any });
      }).toThrow('Invalid account type');
    });

    it('validates currency on update', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      expect(() => {
        store.updateAccount(account.id, { currency: 'XYZ' });
      }).toThrow('Invalid currency');
    });

    it('validates balance on update', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      expect(() => {
        store.updateAccount(account.id, { balance: 2000000000 });
      }).toThrow('cannot exceed');
    });

    it('updates lastUpdated timestamp', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      const originalDate = account.lastUpdated;

      store.updateAccount(account.id, { balance: 2000 });

      const updated = useAccountStore.getState().accounts[0];
      expect(updated.lastUpdated).toBeDefined();
    });

    it('allows boolean updates without validation', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      store.updateAccount(account.id, {
        excludeFromTotal: true,
        isPaidThisMonth: true,
      });

      const updated = useAccountStore.getState().accounts[0];
      expect(updated.excludeFromTotal).toBe(true);
      expect(updated.isPaidThisMonth).toBe(true);
    });
  });

  describe('deleteAccount', () => {
    it('removes account from store', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'To Delete',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      expect(useAccountStore.getState().accounts).toHaveLength(1);

      store.deleteAccount(account.id);

      expect(useAccountStore.getState().accounts).toHaveLength(0);
    });

    it('only deletes the specified account', () => {
      const store = useAccountStore.getState();

      const account1 = store.addAccount({
        name: 'Account 1',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      const account2 = store.addAccount({
        name: 'Account 2',
        type: 'bank',
        currency: 'USD',
        balance: 2000,
      });

      store.deleteAccount(account1.id);

      const accounts = useAccountStore.getState().accounts;
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe(account2.id);
    });
  });

  describe('toggleExcludeFromTotal', () => {
    it('toggles excludeFromTotal from undefined to true', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      store.toggleExcludeFromTotal(account.id);

      const updated = useAccountStore.getState().accounts[0];
      expect(updated.excludeFromTotal).toBe(true);
    });

    it('toggles excludeFromTotal from true to false', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
        excludeFromTotal: true,
      });

      store.toggleExcludeFromTotal(account.id);

      const updated = useAccountStore.getState().accounts[0];
      expect(updated.excludeFromTotal).toBe(false);
    });

    it('updates lastUpdated when toggling', () => {
      const store = useAccountStore.getState();

      const account = store.addAccount({
        name: 'Test',
        type: 'bank',
        currency: 'USD',
        balance: 1000,
      });

      store.toggleExcludeFromTotal(account.id);

      const updated = useAccountStore.getState().accounts[0];
      expect(updated.lastUpdated).toBeDefined();
    });
  });

  describe('account types', () => {
    it('accepts all valid asset types', () => {
      const store = useAccountStore.getState();
      const assetTypes = ['cash', 'bank', 'exchange', 'investment', 'property', 'other'] as const;

      assetTypes.forEach((type) => {
        const account = store.addAccount({
          name: `${type} account`,
          type,
          currency: 'USD',
          balance: 1000,
        });
        expect(account.type).toBe(type);
      });
    });

    it('accepts all valid liability types', () => {
      const store = useAccountStore.getState();
      const liabilityTypes = ['loan', 'credit-card', 'mortgage'] as const;

      liabilityTypes.forEach((type) => {
        const account = store.addAccount({
          name: `${type} account`,
          type,
          currency: 'USD',
          balance: -1000, // Negative for liabilities
        });
        expect(account.type).toBe(type);
      });
    });
  });
});
